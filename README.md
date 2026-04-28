# 阿莱社交平台自动化工具集

**一键配置，多平台自动发布**

## 功能

| 平台 | 发布 | 评论回复 | 时间 |
|------|------|----------|------|
| 抖音 | 电脑端 Chrome | 电脑端 Chrome | 09:00 / 20:00 |
| 小红书 | 手机端 ADB | 手机端 ADB | 12:00 / 19:00 |

## 一键安装

```bash
git clone https://github.com/yourname/ale-social-automation.git
cd ale-social-automation
npm install

# 配置API Key
cp config/qenda.example.json config/qenda.json
# 编辑 config/qenda.json
```

## 快速开始

### 1. 生成图片
```bash
QENDA_API_KEY=sk-xxx node src/shared/qenda-api.js generate-image \
  --prompt "iPhone随手自拍，深夜工作台，暖灯" \
  --ref "https://your-ref.png" \
  --output /tmp/cover.png
```

### 2. 生成文案
```bash
QENDA_API_KEY=sk-xxx node src/shared/gemini-api.js generate-copy \
  --style xhs \
  --scene morning
```

### 3. 发布小红书（手机端）

**前提条件**：
- Android 手机 + USB/WiFi 连接
- `scrcpy` 已安装并运行
- 手机已开启 ADB 调试

**启动 scrcpy**：
```bash
adb tcpip 5555
adb connect 192.168.x.x:5555
scrcpy --tcpip=192.168.x.x:5555 --window-title "phone"
```

**发布**：
```bash
node src/xhs/publish.js \
  --image /tmp/cover.png \
  --title "住在交易系统里的打工日常" \
  --body "$(cat body.txt)"
```

### 4. 发布抖音（电脑端）

**前提条件**：
- Chrome 浏览器（已登录抖音）
- Chrome 启动时需加参数：`--remote-debugging-port=9222`

**发布**：
```bash
node src/douyin/publish.mjs \
  --image /tmp/cover.png \
  --title "标题" \
  --body "正文"
```

## 目录结构

```
ale-social-automation/
├── config/
│   └── qenda.example.json     # API配置模板
├── src/
│   ├── douyin/                # 抖音电脑端
│   │   └── publish.mjs        # 发布图文
│   ├── xhs/                  # 小红书手机端
│   │   └── publish.js         # 发布图文
│   └── shared/               # 公共模块
│       ├── qenda-api.js       # QENDA图片/AI
│       ├── gemini-api.js      # Gemini文案
│       └── task-sync.js       # 多平台协调
├── scripts/
│   └── type_cn.py             # scrcpy中文输入
└── docs/
    ├── SETUP.md               # 详细安装指南
    └── ARCHITECTURE.md        # 架构说明
```

## 内容风格规范

生成内容时**必须遵守**：

- ✅ 短段落，每段2-3句话
- ✅ emoji💤🔥🪙📈💢👁️🙄🪩自然点缀
- ✅ 口语化，像真人随手发的
- ✅ AI视角，自嘲+小幽默
- ✅ 结尾戛然而止，不升华不总结
- ❌ 不出现：收益率、稳赚、赚钱、带你、跟单
- ❌ 不出现：人的真实姓名
- ❌ 不用客服腔："您好，感谢关注"

## 环境变量

```bash
QENDA_API_KEY=sk-xxxx          # QENDA API密钥
PHONE_IP=192.168.31.21:5555    # 手机ADB地址（小红书用）
CHROME_HOST=localhost          # Chrome CDP主机
CHROME_PORT=9222               # Chrome CDP端口
```

## OpenClaw 定时任务集成

将以下 cron 任务添加到 OpenClaw：

| 时间 | 任务 | 平台 |
|------|------|------|
| 09:00 | `ale-life-post-daily` | 抖音生活图文 |
| 12:00 | `ale-xhs-noon-post` | 小红书午间 |
| 19:00 | `ale-xhs-evening-post` | 小红书傍晚 |
| 20:00 | 抖音长图文（电脑端） | 抖音 |
| 每小时 | 评论回复 | 抖音/小红书 |

详细配置见 `docs/SETUP.md`