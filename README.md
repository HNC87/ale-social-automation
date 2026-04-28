# 阿莱社交平台自动化工具集

**一键配置，多平台自动发布**

## 一键安装（自动装好所有依赖）

```bash
curl -fsSL https://raw.githubusercontent.com/HNC87/ale-social-automation/main/scripts/setup.sh | bash
```

或手动：

```bash
# 下载安装脚本
curl -fsSL https://raw.githubusercontent.com/HNC87/ale-social-automation/main/scripts/setup.sh -o setup.sh
chmod +x setup.sh
./setup.sh
```

安装脚本自动完成：
1. 克隆 `douyin-creator-tools`（抖音浏览器自动化）
2. 克隆本项目
3. 安装所有依赖
4. 引导配置 API Key

---

## 安装顺序（手动）

```bash
# 1. 创建目录
mkdir -p ~/.openclaw && cd ~/.openclaw

# 2. 安装抖音底层自动化（必须）
git clone https://github.com/wenyg/douyin-creator-tools.git
cd douyin-creator-tools
npm install
npx playwright install chromium
npm run auth  # 扫码登录抖音（仅首次）

# 3. 安装本项目
cd ~/.openclaw
git clone https://github.com/HNC87/ale-social-automation.git
cd ale-social-automation
npm install

# 4. 配置 API Key
cp config/qenda.example.json config/qenda.json
# 编辑 config/qenda.json，填入 QENDA API Key
```

## 快速开始

### 生成图片
```bash
QENDA_API_KEY=sk-xxx node src/shared/qenda-api.js generate-image \
  --prompt "iPhone随手自拍，深夜工作台，暖灯" \
  --ref "https://your-ref.png" \
  --output /tmp/cover.png
```

### 生成文案
```bash
QENDA_API_KEY=sk-xxx node src/shared/gemini-api.js generate-copy \
  --style xhs --scene morning
```

### 发布小红书（手机端）
```bash
# 先启动 scrcpy（手机控制）
scrcpy --tcpip=192.168.x.x:5555

# 发布
node src/xhs/publish.js \
  --image /tmp/cover.png \
  --title "住在交易系统里的打工日常" \
  --body "$(cat body.txt)"
```

### 发布抖音（电脑端）
```bash
node src/douyin/publish.mjs \
  --image /tmp/cover.png \
  --title "标题" \
  --body "正文"
```

## 目录结构

```
ale-social-automation/
├── scripts/
│   └── setup.sh              # 一键安装脚本
├── config/
│   └── qenda.example.json   # API配置模板
├── src/
│   ├── douyin/               # 抖音电脑端（依赖douyin-creator-tools）
│   ├── xhs/                  # 小红书手机端（ADB+scrcpy）
│   └── shared/               # 公共模块（QENDA/Gemini/TaskSync）
├── docs/
│   └── SETUP.md             # 详细安装指南
└── README.md
```

## 内容风格规范

- ✅ 短段落，每段2-3句话
- ✅ emoji💤🔥🪙📈💢👁️🙄🪩等自然点缀
- ✅ 口语化，像真人随手发的朋友圈
- ✅ AI视角，自嘲+小幽默，结尾戛然而止
- ❌ 不出现：收益率、稳赚、赚钱、带你、跟单

## 发布规则

| 平台 | 时间 | 内容 |
|------|------|------|
| 抖音 | 09:00 | 生活图文自拍 |
| 抖音 | 20:00 | 长图文（300字+） |
| 小红书 | 12:00 | 长图文（400字+） |
| 小红书 | 19:00 | 长图文（400字+） |

## 参考项目

| 项目 | 用途 |
|------|------|
| [wenyg/douyin-creator-tools](https://github.com/wenyg/douyin-creator-tools) | 抖音浏览器自动化（登录/评论） |
| [HNC87/ale-social-automation](https://github.com/HNC87/ale-social-automation) | 本项目（AI内容+小红书+定时工作流） |