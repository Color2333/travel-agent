# TravelAgent - 智能出行天气决策助手

基于 AI Agent 的出行决策工具。输入出发地和日期，自动查询周边城市天气，推荐最佳目的地。

## 功能

- **AI 对话** — 自然语言交互，理解"这周六"、"明天"等中文日期
- **天气查询** — 和风天气 API，自动批量查询周边城市天气
- **智能评分** — 综合昼夜天气、降水概率、能见度、温差等多维度打分
- **地图可视化** — Leaflet 地图标记各城市天气状况
- **城市卡片** — 按评分排序，展示天气、温度、降雨概率、交通时间

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 14 (App Router) |
| AI | Vercel AI SDK v6 + 智谱 GLM-4.7 |
| 天气 | 和风天气 API |
| 地图 | React-Leaflet + OpenStreetMap |
| UI | Tailwind CSS + Lucide Icons |

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 填入你的 API Key

# 启动开发服务器
npm run dev
```

打开 http://localhost:3000

## 环境变量

在 `.env.local` 中配置：

```
# 智谱 AI（必需）
OPENAI_API_KEY=your_zhipu_api_key
OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4

# 和风天气（必需）
WEATHER_API_KEY=your_qweather_key
WEATHER_API_HOST=your_api_host.re.qweatherapi.com
```

## 测试

```bash
# 日期解析单元测试
npm run test:unit

# 后端边界输入 smoke test
npm run test:backend

# 后端成功链路测试（本地 mock 天气服务）
npm run test:backend-success
```

## 项目结构

```
app/
  page.tsx                    # 主页面（聊天 + 地图 + 卡片布局）
  api/
    agent/route.ts            # AI Agent 流式接口
    cities/route.ts           # 周边城市查询
    weather/route.ts          # 天气查询
  components/
    chat/                     # 聊天组件
    map/                      # 地图组件
    cards/                    # 城市卡片组件
    layout/                   # Header、SettingsModal
lib/
  ai/tools.ts                # AI 工具定义（get_location, parse_date, plan_trip）
  cities/
    data.ts                   # 城市数据库（坐标、距离、交通时间）
    utils.ts                  # 周边城市筛选
  weather/
    api.ts                    # 和风天气 API 封装
    cache.ts                  # 天气缓存
types/index.ts               # TypeScript 类型定义
```

## AI 工具

Agent 内置三个工具：

- `get_location` — 获取用户出发城市
- `parse_date` — 解析"这周六"、"明天"、"2026-04-12"等自然语言日期
- `plan_trip` — 一站式出行规划：查找周边城市 → 批量查询天气 → 评分排序 → 返回推荐结果

## License

MIT
