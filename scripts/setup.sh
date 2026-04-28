#!/bin/bash
#
# ale-social-automation 一键安装脚本
# 自动安装：本项目 + douyin-creator-tools（抖音底层自动化）
#

set -e

OPENCLAW_DIR="${HOME}/.openclaw"
ALEAUTO_DIR="${OPENCLAW_DIR}/ale-social-automation"
DOUYIN_DIR="${OPENCLAW_DIR}/douyin-creator-tools"

echo "=========================================="
echo "  阿莱社交平台自动化 - 一键安装"
echo "=========================================="
echo ""

# 1. 创建目录
mkdir -p "$OPENCLAW_DIR"
cd "$OPENCLAW_DIR"

# 2. 安装 douyin-creator-tools（抖音底层自动化）
if [ -d "$DOUYIN_DIR" ]; then
    echo "✅ douyin-creator-tools 已存在，跳过克隆"
else
    echo "📦 克隆 douyin-creator-tools..."
    git clone https://github.com/wenyg/douyin-creator-tools.git "$DOUYIN_DIR"
fi

cd "$DOUYIN_DIR"
echo "📦 安装 douyin-creator-tools 依赖..."
npm install 2>/dev/null || npm install
npx playwright install chromium 2>/dev/null || echo "⚠️  playwright 安装完成（可能已有）"

# 3. 安装 ale-social-automation（本项目）
cd "$OPENCLAW_DIR"
if [ -d "$ALEAUTO_DIR" ]; then
    echo "✅ ale-social-automation 已存在，跳过克隆"
else
    echo "📦 克隆 ale-social-automation..."
    git clone https://github.com/HNC87/ale-social-automation.git "$ALEAUTO_DIR"
fi

cd "$ALEAUTO_DIR"
echo "📦 安装 ale-social-automation 依赖..."
npm install 2>/dev/null || npm install

# 4. 配置 API Key
echo ""
echo "=========================================="
echo "  配置 QENDA API Key"
echo "=========================================="
if [ ! -f "config/qenda.json" ]; then
    echo "📝 创建配置文件模板..."
    cp config/qenda.example.json config/qenda.json 2>/dev/null || true
    echo "⚠️  请编辑 config/qenda.json，填入你的 QENDA API Key"
    echo "   文件位置: $ALEAUTO_DIR/config/qenda.json"
else
    echo "✅ config/qenda.json 已存在"
fi

# 5. 抖音登录（首次）
echo ""
echo "=========================================="
echo "  抖音登录授权（仅首次需要）"
echo "=========================================="
if [ -d "$DOUYIN_DIR/.playwright/douyin-profile" ] && [ -n "$(ls -A "$DOUYIN_DIR/.playwright/douyin-profile" 2>/dev/null)" ]; then
    echo "✅ 抖音已登录（存在登录态）"
else
    echo "⚠️  需要扫码登录抖音（仅首次）"
    echo ""
    echo "请手动执行以下命令，在浏览器中扫码登录："
    echo ""
    echo "  cd $DOUYIN_DIR && npm run auth"
    echo ""
    echo "登录成功后，关闭浏览器即可。"
    echo "（Agent 不得替代用户扫码，此为平台安全要求）"
fi

# 6. 完成
echo ""
echo "=========================================="
echo "  安装完成！"
echo "=========================================="
echo ""
echo "目录结构："
echo "  $DOUYIN_DIR     - 抖音浏览器自动化"
echo "  $ALEAUTO_DIR   - 本项目（AI内容+小红书）"
echo ""
echo "下一步："
echo "  1. 编辑 $ALEAUTO_DIR/config/qenda.json 填入 API Key"
echo "  2. 如未登录抖音：cd $DOUYIN_DIR && npm run auth"
echo "  3. 开始使用：node $ALEAUTO_DIR/src/xhs/publish.js --help"
echo ""
echo "定时任务（OpenClaw cron）："
echo "  09:00 抖音生活图文"
echo "  12:00 小红书午间长图文"
echo "  19:00 小红书傍晚长图文"
echo "  20:00 抖音长图文"
echo ""