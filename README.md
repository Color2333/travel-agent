# TravelAgent - 智能出行天气决策助手

基于 AI Agent 的出行决策工具。输入出发地和日期，自动查询周边城市天气，推荐最佳目的地。

## 功能

- **AI 对话** — 自然语言交互，理解"这周六"、"明天"、"下周三"等中文日期表达
- **天气查询** — 和风天气 API，自动批量查询周边城市 7 天天气预报
- **智能评分** — 8 维度综合评分系统（天气状况、湿度、降水、能见度、温差、紫外线、风速、气压）
- **地图可视化** — Leaflet 地图标记各城市天气状况，支持点击交互
- **城市卡片** — 按评分排序，展示详细天气指标、交通时间和价格
- **7 天预报** — 决策面板展示完整的 7 天天气趋势
- **191+ 城市** — 覆盖中国主要城市和热门旅游目的地

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 14 (App Router) |
| AI | Vercel AI SDK v6 + 智谱 GLM-4.7 |
| 天气 | 和风天气 API (QWeather) |
| 地图 | React-Leaflet + OpenStreetMap |
| UI | Tailwind CSS + Lucide Icons |
| 语言 | TypeScript (strict) |

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

```bash
# 智谱 AI（必需）
OPENAI_API_KEY=your_zhipu_api_key
OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4

# 和风天气（必需）
WEATHER_API_KEY=your_qweather_key
WEATHER_API_HOST=your_host.re.qweatherapi.com
```

## 测试

```bash
# 单元测试（日期解析、行程规划、天气缓存）
npm run test:unit

# 后端边界输入 smoke test
npm run test:backend

# 后端成功链路测试（本地 mock 天气服务）
npm run test:backend-success

# AI Provider 连接测试
npm run test:agent-provider

# E2E 聊天 UX 测试（Playwright）
npm run test:e2e-chat
```

## 项目结构

```
travel-agent/
├── app/
│   ├── page.tsx                    # 主页面（聊天 + 地图 + 卡片布局）
│   ├── api/
│   │   ├── agent/route.ts          # AI Agent 流式接口
│   │   ├── cities/route.ts         # 周边城市查询
│   │   └── weather/route.ts        # 天气查询
│   └── components/
│       ├── chat/                   # 聊天组件
│       ├── map/                    # 地图组件
│       ├── cards/                  # 城市卡片组件
│       ├── decision/               # 决策面板
│       └── layout/                 # 布局组件
├── lib/
│   ├── ai/
│   │   ├── tools.ts                # AI 工具定义
│   │   ├── plan-trip.ts            # 行程规划核心逻辑
│   │   └── date.ts                 # 日期解析
│   ├── cities/
│   │   ├── data.ts                 # 城市数据库（191+ 城市）
│   │   ├── lookup.ts               # 城市查找
│   │   ├── nearby.ts               # 周边城市计算
│   │   └── utils.ts                # 工具函数
│   ├── weather/
│   │   ├── api.ts                  # 和风天气 API 封装
│   │   └── cache.ts                # 1 小时天气缓存
│   └── ui/                         # UI 工具函数
├── tests/                          # 单元测试
├── scripts/                        # 测试脚本
└── types/index.ts                  # TypeScript 类型定义
```

## AI 工具

Agent 内置三个工具：

| 工具 | 描述 |
|------|------|
| `get_location` | 获取用户出发城市（默认上海） |
| `parse_date` | 解析自然语言日期 |
| `plan_trip` | 一站式出行规划 |

### 日期解析支持

- 相对日期：`今天`、`明天`、`后天`、`大后天`
- 星期表达：`这周一`~`这周日`、`本周六/日`、`下周一`~`下周日`、`周六`、`周日`
- 绝对日期：`2026-04-12` 格式

### 天气评分系统 (0-100 分)

| 维度 | 权重 | 说明 |
|------|------|------|
| 天气状况 | -50~0 | 雨天 -50、雪天 -40、阴天 -20、多云 -10 |
| 湿度 | -15~0 | >80% 扣 15 分，>70% 扣 10 分，>60% 扣 5 分 |
| 降水概率 | -15~0 | 根据降水量分级扣分 |
| 能见度 | -10~0 | <3km 严重雾霾扣 10 分 |
| 温差 | -5~0 | >15°C 扣 5 分 |
| 紫外线 | -5~0 | 过高 (≥11) 或过低 (≤1) 扣分 |
| 风速 | -5~0 | >50km/h 大风扣 5 分 |
| 气压 | -3~0 | <980hPa 低气压扣 3 分 |

## 城市覆盖

已支持 **191+ 城市**，包括：

- **直辖市**: 北京、上海、天津、重庆
- **江苏省**: 南京、苏州、无锡、常州、南通、扬州、镇江、泰州、盐城、徐州、昆山、太仓等
- **浙江省**: 杭州、宁波、温州、嘉兴、绍兴、舟山、金华、台州、湖州、义乌等
- **广东省**: 广州、深圳、珠海、佛山、东莞、中山、江门、肇庆、汕头等
- **四川省**: 成都、绵阳、德阳、乐山、宜宾、泸州、南充等
- **湖北省**: 武汉、宜昌、襄阳、荆州、十堰、恩施等
- **山东省**: 济南、青岛、烟台、潍坊、威海、日照、临沂等
- **河南省**: 郑州、开封、安阳、新乡、许昌、南阳等
- **旅游城市**: 大理、丽江、香格里拉、黄山、峨眉山、武夷山、九寨沟等

## 部署

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

在 Vercel 平台配置环境变量：
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `WEATHER_API_KEY`
- `WEATHER_API_HOST`

## License

MIT
