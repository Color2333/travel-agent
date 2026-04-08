# TravelAgent - 项目开发记忆

## 分支策略

- **dev** 分支：日常开发分支，所有功能开发和迭代都在 dev 上进行
- **main** 分支：仅用于发布确认可用的版本，不直接在 main 上开发
- 工作流：dev 开发 → 测试验证 → 合并到 main 发布

## API 配置

- 天气API：和风天气（QWeather），key 在 .env.local 中
- AI模型：智谱 GLM（通过 OpenAI 兼容接口），baseURL: https://open.bigmodel.cn/api/paas/v4/
  - 默认模型：glm-4.7-flash
- 所有 API Key 仅存在 .env.local（已加入 .gitignore，不提交到仓库）

## 技术栈

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Vercel AI SDK v6（注意：v6 用 `inputSchema` 替代 `parameters`，用 `@ai-sdk/react` 替代 `ai/react`）
- react-leaflet@4（需要 dynamic import 避免 SSR 问题）
- 部署目标：Vercel

## 已知注意事项

- Leaflet 需要动态导入 (ssr: false)，MapInner 通过 dynamic import 包装
- AI SDK v6 API 变更：tool() 用 inputSchema 而非 parameters
- AI SDK v6 消息格式：useChat 发送 UIMessage[]（含 parts），route 中必须用 convertToModelMessages() 转为 ModelMessage[] 再传给 streamText
- AI SDK v6 流式返回：route 中必须用 result.toUIMessageStreamResponse()（不是 toTextStreamResponse）
- 城市数据库 key 使用中文名（如 '上海'），不是英文
