import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, stepCountIs, UIMessage } from 'ai';
import { z } from 'zod';
import { RequestValidationError, getErrorStatus } from '@/lib/errors';
import { tools } from '@/lib/ai/tools';

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      throw new RequestValidationError(parseResult.error.issues[0]?.message ?? 'Invalid request body');
    }

    const { messages, provider, model, apiKey, baseURL, temperature, maxTokens, systemPrompt } = parseResult.data;
    const selectedProvider = provider ?? 'zhipu';

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
      system: systemPrompt ?? '你是一个旅行天气决策助手，帮助用户找到天气良好的周边城市。你可以使用以下工具：get_location（获取用户当前位置）、parse_date（解析自然语言日期）、plan_trip（一站式出行规划：输入城市和日期，自动查找周边城市并查询天气，返回推荐结果）。你的工作流程：1) 确认用户位置和出行日期（如不确定，调用get_location和parse_date），2) 调用plan_trip获取完整推荐，3) 基于返回的数据，用中文友好、简洁地向用户推荐最佳出行目的地，说明天气情况和推荐理由。如果用户问了简单问题（不需要查天气），直接回答即可。',
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: getErrorStatus(error), headers: { 'Content-Type': 'application/json' } }
    );
  }
}
