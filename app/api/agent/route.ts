import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, stepCountIs, UIMessage } from 'ai';
import { z } from 'zod';
import { RequestValidationError, getErrorStatus } from '@/lib/errors';
import { parseDateQuery } from '@/lib/ai/date';
import { tools } from '@/lib/ai/tools';
import { resolveOriginCity } from '@/lib/cities/lookup';

const requestSchema = z.object({
  messages: z.array(z.custom<UIMessage>()).min(1, 'messages must contain at least one message'),
  provider: z.enum(['openai', 'zhipu']).optional(),
  model: z.string().trim().min(1).optional(),
  apiKey: z.string().trim().min(1).optional(),
  baseURL: z.string().trim().url().optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().positive().max(8192).optional(),
  systemPrompt: z.string().trim().min(1).optional(),
});

export const maxDuration = 30;

function getLatestUserText(messages: UIMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== 'user') continue;

    return message.parts
      .map((part) => (part.type === 'text' ? part.text ?? '' : ''))
      .join('')
      .trim();
  }

  return '';
}

function inferDateFromMessage(text: string): string | null {
  if (!text) return null;

  const hasDateHint = /(\d{4}-\d{2}-\d{2}|今天|明天|后天|这周|本周|下周|周六|周日|周末|星期[一二三四五六日天])/.test(text);
  if (!hasDateHint) return null;

  try {
    return parseDateQuery(text);
  } catch {
    return null;
  }
}

async function inferCityFromMessage(text: string): Promise<string | null> {
  if (!text) return null;

  const candidates = new Set<string>();
  const directionalMatch = text.match(/([\u4e00-\u9fa5]{2,8})(?:出发|周边|附近)/);
  if (directionalMatch?.[1]) {
    const source = directionalMatch[1];
    for (let len = 2; len <= Math.min(4, source.length); len += 1) {
      candidates.add(source.slice(-len));
    }
  }

  const namedMatch = text.match(/([\u4e00-\u9fa5]{2,8}市)/g) ?? [];
  for (const match of namedMatch) {
    candidates.add(match);
    candidates.add(match.replace(/市$/, ''));
  }

  const shortMatches = text.match(/[\u4e00-\u9fa5]{2,4}/g) ?? [];
  for (const match of shortMatches.slice(0, 8)) {
    candidates.add(match);
  }

  const bannedTokens = new Set(['这周六', '这周日', '下周六', '下周日', '本周六', '本周日', '今天', '明天', '后天', '周末', '哪里', '适合', '出发', '周边']);

  for (const candidate of Array.from(candidates)) {
    if (bannedTokens.has(candidate)) continue;
    try {
      const city = await resolveOriginCity(candidate);
      if (city) return city.name;
    } catch {
      break;
    }
  }

  return null;
}

async function buildDynamicSystemContext(messages: UIMessage[]) {
  const latestUserText = getLatestUserText(messages);
  if (!latestUserText) return '';

  const [city, date] = await Promise.all([
    inferCityFromMessage(latestUserText),
    Promise.resolve(inferDateFromMessage(latestUserText)),
  ]);

  const hints: string[] = [];
  if (city) hints.push(`用户已经明确给出了出发城市：${city}。不要再次追问城市。`);
  if (date) hints.push(`用户已经明确给出了出行日期：${date}。不要再次追问具体日期。`);

  if (city && date) {
    hints.push('当前优先动作是直接调用 plan_trip 或基于上一轮结果继续分析，而不是先确认信息。');
  }

  return hints.join('');
}

function getStreamErrorMessage(error: unknown): string {
  console.error('Agent stream failed:', error);

  const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
    ? Number((error as { statusCode?: number }).statusCode)
    : undefined;
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalizedMessage = message.toLowerCase();

  if (statusCode === 429 || normalizedMessage.includes('overloaded') || normalizedMessage.includes('rate limit')) {
    return '模型服务当前繁忙，请稍后再试。';
  }

  if (
    statusCode === 401 ||
    statusCode === 403 ||
    normalizedMessage.includes('api key') ||
    normalizedMessage.includes('unauthorized') ||
    normalizedMessage.includes('forbidden')
  ) {
    return '模型配置不可用，请检查 API Key。';
  }

  if (
    normalizedMessage.includes('fetch failed') ||
    normalizedMessage.includes('enotfound') ||
    normalizedMessage.includes('econnrefused') ||
    normalizedMessage.includes('base url')
  ) {
    return '模型服务连接失败，请检查 Base URL 或稍后重试。';
  }

  return '对话服务暂时不可用，请稍后再试。';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      throw new RequestValidationError(parseResult.error.issues[0]?.message ?? 'Invalid request body');
    }

    const { messages, provider, model, apiKey, baseURL, temperature, maxTokens, systemPrompt } = parseResult.data;
    const selectedProvider = provider ?? 'zhipu';
    const dynamicSystemContext = await buildDynamicSystemContext(messages);

    const languageModel = selectedProvider === 'openai'
      ? createOpenAI({
          apiKey: apiKey ?? process.env.OPENAI_API_KEY,
          baseURL: baseURL || process.env.OPENAI_BASE_URL,
        }).chat(model ?? 'gpt-4o-mini')
      : createOpenAICompatible({
          name: 'zhipu',
          baseURL: baseURL || process.env.OPENAI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
          apiKey: apiKey ?? process.env.OPENAI_API_KEY,
        }).chatModel(model ?? 'glm-4.7');

    const result = streamText({
      model: languageModel,
      messages: await convertToModelMessages(messages),
      tools,
      temperature,
      maxOutputTokens: maxTokens,
      system: `${systemPrompt ?? '你是一个旅行天气决策助手，帮助用户做多轮出行决策，而不只是给一次性答案。支持全国所有主要城市出发。可用工具：get_location（当用户未说明城市时才调用）、parse_date（解析自然语言日期，如这周六、明天、今天）、plan_trip（一站式出行规划：输入任意出发城市和日期）。工作流程：1) 若用户已说明出发城市则直接使用，否则调用get_location；2) 若日期不明确则调用parse_date；3) 调用plan_trip；4) 结合工具结果给出清晰建议。多轮对话时，优先复用已知的出发城市、日期、候选城市和比较结论；只有当用户改变了城市、日期或范围时才重新调用 plan_trip。用户追问比较、排序、取舍、是否值得去、要带什么时，应基于上一轮结果直接继续分析，给出明确倾向，不要泛泛而谈。回复要凝练，优先使用短段落、要点或表格，不要长篇铺陈。plan_trip支持任意中国城市出发，如北京、广州、成都、武汉等。'}${dynamicSystemContext ? `\n\n补充上下文：${dynamicSystemContext}` : ''}`,
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse({
      onError: getStreamErrorMessage,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: getErrorStatus(error), headers: { 'Content-Type': 'application/json' } }
    );
  }
}
