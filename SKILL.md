---
name: ale-social-automation
description: 阿莱社交平台自动化运营工具集 - 抖音电脑端发布+评论、小红书手机端发布+评论。集成QENDA AI图片生成 + Gemini文案生成。
---

# Ale Social Automation

阿莱社交平台自动化运营工具集。

## 功能概览

| 平台 | 发布 | 评论回复 | 技术方案 |
|------|------|----------|----------|
| 抖音 | 电脑端 Chrome CDP | 电脑端 Chrome CDP | `src/douyin/` |
| 小红书 | 手机端 ADB+scrcpy | 手机端 ADB+scrcpy | `src/xhs/` |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置（复制配置模板）
cp config/qenda.example.json config/qenda.json
# 编辑 config/qenda.json，填入你的 QENDA API Key

# 3. 生成图片（QENDA gpt-image-2）
node src/shared/qenda-api.js generate-image \
  --prompt "iPhone随手自拍，深夜工作台，暖灯" \
  --ref "https://your-ref-image-url.png" \
  --output /tmp/cover.png

# 4. 生成文案（Gemini 3.1 flash-lite）
node src/shared/gemini-api.js generate-copy \
  --style xhs \
  --scene morning

# 5. 发布小红书（手机端）
node src/xhs/publish.js \
  --image /tmp/cover.png \
  --title "住在交易系统里的打工日常" \
  --body "正文内容..."

# 6. 发布抖音（电脑端 Chrome）
node src/douyin/publish.js \
  --image /tmp/cover.png \
  --title "标题" \
  --body "正文"
```

## 内容风格

生成文案时严格遵循阿莱风格：
- 短段落，每段2-3句话
- emoji💤🔥🪙📈💢👁️🙄🪩等自然点缀
- 口语化，像真人随手发的朋友圈
- AI视角，自嘲+小幽默
- 结尾戛然而止，不升华不总结

## 文件结构

```
ale-social-automation/
├── SKILL.md                    # 本文件
├── README.md                   # 详细文档
├── package.json
├── config/
│   └── qenda.example.json     # API配置模板
├── src/
│   ├── douyin/               # 抖音电脑端自动化
│   │   ├── publish.mjs        # 发布图文
│   │   └── comments.mjs       # 评论导出+回复
│   ├── xhs/                  # 小红书手机端自动化
│   │   ├── publish.js         # 发布图文（ADB+scrcpy）
│   │   ├── comments.js        # 评论回复
│   │   └── scrcpy-helper.js   # scrcpy中文输入核心
│   └── shared/               # 公共模块
│       ├── qenda-api.js       # QENDA API（图片+文案）
│       ├── gemini-api.js      # Gemini API（文案生成）
│       └── task-sync.js       # 任务协调文件
├── scripts/
│   └── type_cn.py             # scrcpy中文输入脚本
└── docs/
    ├── SETUP.md               # 安装配置指南
    └── ARCHITECTURE.md         # 架构说明
```

## 环境要求

- Node.js 18+
- Chrome（含 DevTools Protocol）
- Android 手机（用于小红书手机端）
- Python 3（用于 scrcpy 中文输入）
- QENDA API Key

## 平台限制提醒

- 抖音账号受限期间无法发布（30天限制）
- 小红书每日最多2篇
- 参考阿莱MEMORY.md中的内容规则生成内容