# 详细安装指南

## 一、环境要求

- Node.js 18+
- Python 3.8+
- Chrome（含 DevTools Protocol）
- Android 手机（小红书手机端自动化）
- Git

## 二、依赖安装

```bash
# Node.js 依赖
npm install

# Python 依赖（scrcpy中文输入用）
# pip install -r requirements.txt  # 如有requirements.txt
```

## 三、QENDA API 配置

1. 注册 QENDA 账号，获取 API Key
2. 创建配置文件：
   ```bash
   cp config/qenda.example.json config/qenda.json
   ```
3. 编辑 `config/qenda.json`：
   ```json
   {
     "api_key": "sk-你的API密钥",
     "base_url": "https://api.ai6700.com/api/v1"
   }
   ```
4. 设置环境变量（可选）：
   ```bash
   export QENDA_API_KEY=sk-你的API密钥
   ```

## 四、手机端配置（小红书）

### 4.1 手机要求
- Android 7.0+
- 已开启开发者选项 → USB调试
- 与电脑在同一 WiFi 网络

### 4.2 ADB 连接手机

```bash
# USB首次连接
adb devices
# 记录设备号

# 切换到无线模式
adb tcpip 5555

# 拔掉USB，用无线连接
adb connect 192.168.x.x:5555

# 验证连接
adb -s 192.168.x.x:5555 shell echo "connected"
```

### 4.3 安装 scrcpy

**macOS**：
```bash
brew install scrcpy
```

**Linux**：
```bash
sudo apt install scrcpy
```

**Windows**：从 [scrcpy github releases](https://github.com/Genymobile/scrcpy/releases) 下载

### 4.4 启动 scrcpy

```bash
# 连接无线手机
scrcpy --tcpip=192.168.x.x:5555 --window-title="phone"
```

### 4.5 中文输入（核心难点）

**问题**：Android 的 `input text` 命令不支持非ASCII字符

**解决方案**：scrcpy HID 模式 + macOS剪贴板

```bash
# 原理：
# 1. pbcopy 设Mac剪贴板
# 2. osascript 激活scrcpy窗口
# 3. Cmd+V 通过scrcpy HID转发到Android

# 脚本：scripts/type_cn.py
python3 scripts/type_cn.py "要输入的中文"
```

**配置**：
- macOS 系统偏好设置 → 隐私与安全 → 辅助功能 → 勾选 Terminal
- scrcpy 窗口必须在最前面

### 4.6 坐标适配

默认坐标基于 **1080x2400** 分辨率（OPPO PDYM20）。
其他手机需重新测量：
```bash
adb -s 192.168.x.x:5555 exec-out screencap -p > /tmp/screen.png
# 分析截图，找到正确坐标
```

## 五、电脑端配置（抖音）

### 5.1 Chrome 配置

需要 Chrome 以 DevTools Protocol 模式启动：

**macOS**：
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug
```

**Windows**：
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir=C:\chrome-debug
```

### 5.2 登录抖音

1. 用上述Chrome配置打开浏览器
2. 访问 https://creator.douyin.com 登录
3. 确保登录态生效

### 5.3 验证CDP连接

```bash
curl http://localhost:9222/json/version
# 返回JSON说明CDP正常
```

## 六、测试发布流程

### 小红书（手机端）

```bash
# 1. 生成测试图片
echo "iPhone随手自拍风格" | pbcopy
node src/shared/qenda-api.js generate-image \
  --prompt "iPhone随手自拍，深夜工作台，暖灯" \
  --ref "https://your-ref.png" \
  --output /tmp/test_cover.png

# 2. 发布到草稿箱
node src/xhs/publish.js \
  --image /tmp/test_cover.png \
  --title "测试标题" \
  --body "测试正文内容"

# 3. 确认草稿箱内容后手动发布
```

### 抖音（电脑端）

```bash
# 存草稿测试
node src/douyin/publish.mjs \
  --image /tmp/test_cover.png \
  --title "测试标题" \
  --body "测试正文" \
  --draft
```

## 七、OpenClaw 定时任务集成

在 OpenClaw 的 cron 配置中添加任务（参考 `jobs.json` 格式）：

```json
{
  "id": "ale-xhs-noon-post",
  "name": "阿莱小红书午间长图文发布（12:00）",
  "enabled": true,
  "sessionTarget": "isolated",
  "schedule": {"kind": "cron", "expr": "0 12 * * *", "tz": "Asia/Shanghai"},
  "payload": {
    "kind": "agentTurn",
    "message": "执行阿莱小红书午间长图文发布...",
    "timeoutSeconds": 600
  }
}
```

详细 payload 内的完整指令参考 OpenClaw workspace 中的 `MEMORY.md`。

## 八、故障排查

### 手机端问题

**Q**: 中文输入无效
**A**:
1. scrcpy 是否在运行？`ps aux | grep scrcpy`
2. scrcpy 窗口是否在最前面？
3. Terminal 是否在 macOS 辅助功能白名单？

**Q**: 坐标错位
**A**: 截图确认当前页面，用 `adb exec-out screencap -p` 获取当前屏幕截图，重新测量坐标

**Q**: ADB 连接断开
**A**: `adb connect 192.168.x.x:5555` 重新连接

### 电脑端问题

**Q**: "未登录抖音"
**A**: 确保 Chrome 已登录 https://creator.douyin.com，URL不包含login

**Q**: 上传失败
**A**: 检查网络，抖音创作者平台可能有验证码挑战

**Q**: 元素找不到
**A**: 抖音页面结构可能变化，用 Puppeteer 的 `page.$()` 调试定位