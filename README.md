# 阿莱社交平台自动化工具集

**一键配置，多平台自动发布**

## 依赖关系

**本项目基于 [wenyg/douyin-creator-tools](https://github.com/wenyg/douyin-creator-tools) 构建**

- 抖音底层浏览器自动化（登录/作品列表/评论）来自 `douyin-creator-tools`
- 本项目负责：AI内容生成 + 每日定时发布工作流 + 小红书手机端自动化

**安装顺序**：
```bash
# 1. 先安装 douyin-creator-tools（抖音底层自动化）
cd ~/.openclaw
git clone https://github.com/wenyg/douyin-creator-tools.git
cd douyin-creator-tools
npm install
npx playwright install chromium
npm run auth  # 扫码登录（仅首次）

# 2. 再安装 ale-social-automation（AI内容+发布工作流）
cd ~/.openclaw
git clone https://github.com/HNC87/ale-social-automation.git
cd ale-social-automation
npm install

# 配置 QENDA API Key
cp config/qenda.example.json config/qenda.json
# 编辑填入 API Key
```

## 功能概览

| 平台 | 发布 | 评论回复 | 技术方案 |
|------|------|----------|----------|
| 抖音 | 电脑端 Chrome | 电脑端 Playwright | `src/douyin/`（依赖douyin-creator-tools）|
| 小红书 | 手机端 ADB+scrcpy | 手机端 ADB | `src/xhs/` |

## 内容风格规范

生成内容时**必须遵守**：

- ✅ 短段落，每段2-3句话
- ✅ emoji💤🔥🪙📈💢👁️🙄🪩等自然点缀
- ✅ 口语化，像真人随手发的朋友圈
- ✅ AI视角，自嘲+小幽默
- ✅ 结尾戛然而止，不升华不总结
- ❌ 不出现：收益率、稳赚、赚钱、带你、跟单
- ❌ 不出现：人的真实姓名
- ❌ 不用客服腔："您好，感谢关注"

## 发布规则

| 平台 | 时间 | 内容 |
|------|------|------|
| 抖音 | 09:00 | 生活图文自拍（AI生成封面） |
| 抖音 | 20:00 | 长图文（参考小红书风格，300字+） |
| 小红书 | 12:00 | 长图文（emoji+短段落，400字+） |
| 小红书 | 19:00 | 长图文（同上） |

## 目录结构

```
ale-social-automation/
├── config/
│   └── qenda.example.json     # API配置模板
├── src/
│   ├── douyin/               # 抖音电脑端（依赖douyin-creator-tools）
│   │   └── publish.mjs        # 发布图文
│   ├── xhs/                  # 小红书手机端
│   │   ├── publish.js         # 发布图文（ADB+scrcpy）
│   │   └── comments.js        # 评论回复
│   └── shared/               # 公共模块
│       ├── qenda-api.js       # QENDA图片生成
│       ├── gemini-api.js      # Gemini文案生成
│       └── task-sync.js       # 任务协调文件
├── docs/
│   ├── SETUP.md              # 详细安装指南
│   └── ARCHITECTURE.md       # 架构说明
└── README.md
```

## 环境变量

```bash
QENDA_API_KEY=sk-xxxx          # QENDA API密钥
PHONE_IP=192.168.31.21:5555    # 手机ADB地址（小红书用）
```

## 参考项目

- [wenyg/douyin-creator-tools](https://github.com/wenyg/douyin-creator-tools) - 抖音创作者工具（Playwright自动化）