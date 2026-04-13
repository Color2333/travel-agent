# Travel Agent 部署指南

## 部署到 Vercel

### 前置准备

1. **获取 API Key**
   - 智谱 AI: https://open.bigmodel.cn/
   - 和风天气：https://dev.qweather.com/

2. **配置环境变量**
   ```bash
   # 复制示例配置
   cp .env.local.example .env.local
   
   # 编辑 .env.local 填入你的 API Key
   ```

### 一键部署

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署
vercel --prod
```

### 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `OPENAI_API_KEY` | 智谱 AI API Key | `abc123...` |
| `OPENAI_BASE_URL` | 智谱 API 地址 | `https://open.bigmodel.cn/api/paas/v4` |
| `WEATHER_API_KEY` | 和风天气 API Key | `xyz789...` |
| `WEATHER_API_HOST` | 和风天气专属域名 | `ma5pwe7m85.re.qweatherapi.com` |

### 部署后验证

1. 访问部署后的 URL
2. 输入测试查询："这周六上海出发"
3. 确认返回天气结果和城市卡片

## 本地生产构建

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local

# 3. 构建
npm run build

# 4. 本地预览生产构建
npm run start
```

## 性能优化建议

### 边缘函数配置

`vercel.json` 已配置：
- Agent API: 60 秒超时（AI 推理可能需要较长时间）
- 天气 API: 30 秒超时
- 区域：日本（hnd1）- 对中国用户延迟较低

### 缓存策略

- 天气数据：1 小时内存缓存
- 最大缓存条目：500 条
- LRU 淘汰策略

### 监控建议

1. **Vercel Analytics**
   - 启用 Web Vitals 监控
   - 跟踪页面加载性能

2. **错误追踪**
   - 配置 Sentry 或类似服务
   - 监控 API 错误率

3. **日志**
   - Vercel Functions 日志自动收集
   - 定期检查错误日志

## 常见问题

### Q: 部署后 API 返回 500 错误
A: 检查环境变量是否正确配置，特别是 `WEATHER_API_HOST` 格式

### Q: AI 响应超时
A: 增加 `vercel.json` 中的 `maxDuration`，或优化 AI 提示词减少 token 数

### Q: 天气数据获取失败
A: 检查和风天气 API Key 配额，免费账户有每日限制

## 成本估算

| 服务 | 免费额度 | 超出后价格 |
|------|---------|-----------|
| Vercel | 100GB 带宽/月 | $20/月起 |
| 智谱 AI | 根据套餐 | 约 ¥0.002/千 tokens |
| 和风天气 | 每日 3000 次 | ¥99/月起 |

**预估**: 个人使用完全免费，小规模团队约 ¥100-200/月

## 下一步

- [ ] 配置自定义域名
- [ ] 启用 HTTPS
- [ ] 设置自动部署（Git push 触发）
- [ ] 配置监控告警
