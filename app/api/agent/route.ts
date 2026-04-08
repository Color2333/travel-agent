import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText, convertToModelMessages, stepCountIs, UIMessage } from 'ai';
import { tools } from '@/lib/ai/tools';

const glm = createOpenAICompatible({
  name: 'zhipu',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: glm.chatModel('glm-4.7'),
      messages: await convertToModelMessages(messages),
      tools,
      system: '你是一个旅行天气决策助手，帮助用户找到天气良好的周边城市。你可以使用以下工具：get_location（获取用户当前位置）、parse_date（解析自然语言日期）、get_nearby_cities（获取周边城市列表）、get_weather（查询单个城市天气）、get_batch_weather（批量查询多个城市天气）。你的工作流程：1) 获取用户位置和出行日期，2) 查找周边可达城市，3) 批量查询这些城市的天气，4) 推荐天气最好的城市并说明理由。请友好、简洁地使用中文回答。',
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
