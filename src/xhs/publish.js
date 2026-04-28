/**
 * 小红书图文发布 - 手机端 ADB + scrcpy
 *
 * 流程:
 *   1. 推送图片到手机 /sdcard/Pictures/
 *   2. 打开小红书 → 点+ → 从相册选图 → 下一步×2
 *   3. 填标题(153,629) → 填正文(242,731)
 *   4. 存草稿
 *
 * 中文输入: pbcopy → osascript激活scrcpy窗口 → Cmd+V
 *
 * 用法:
 *   node src/xhs/publish.js --image /path/img.png --title "标题" --body "正文"
 *   node src/xhs/publish.js --image /path/img.png --title "标题" --body "正文" --publish  # 直接发布
 */

import { existsSync, readFileSync } from 'fs';
import { execSync, spawn } from 'child_process';

const PHONE_IP = process.env.PHONE_IP || '192.168.31.21:5555';
const PHONE_SCREEN = '1080x2400';  // OPPO PDYM20

// 坐标（1080x2400）
const COORDS = {
  plus: [540, 2150],
  album_select: [540, 1580],
  photo_select: [180, 600],
  next: [795, 2160],
  title_input: [153, 629],
  body_input: [242, 731],
  draft_btn: [350, 2150],  // 需根据实际情况调整
  publish_btn: [715, 2125]
};

function adb(cmd) {
  return execSync(`adb -s ${PHONE_IP} ${cmd}`, { encoding: 'utf8', timeout: 10000 });
}

function adbShell(cmd) {
  return execSync(`adb -s ${PHONE_IP} shell "${cmd}"`, { encoding: 'utf8', timeout: 10000 });
}

function screenshot() {
  const buf = execSync(`adb -s ${PHONE_IP} exec-out screencap -p`, { encoding: 'binary' });
  return Buffer.from(buf, 'binary');
}

function saveScreenshot(path) {
  const buf = screenshot();
  require('fs').writeFileSync(path, buf);
}

/**
 * 通过 scrcpy 窗口输入中文（核心方法）
 * pbcopy → 激活scrcpy窗口 → Cmd+V
 */
function typeChineseViaScrcpy(text) {
  // 1. 设Mac剪贴板
  const proc = require('child_process').spawn('pbcopy', []);
  proc.stdin.write(text);
  proc.stdin.end();

  // 2. 激活scrcpy窗口并粘贴
  const osa = `
tell application "System Events"
  set p to first process whose name contains "scrcpy"
  set frontmost of p to true
end tell
delay 0.5
tell application "System Events"
  keystroke "v" using command down
end tell
  `.trim();

  require('child_process').execSync(`osascript -e '${osa}'`);
}

/**
 * 点输入框 → 清空内容 → 粘贴
 */
async function clearAndType(x, y, text) {
  // 点输入框
  adbShell(`input tap ${x} ${y}`);
  await sleep(600);

  // 全选
  adbShell(`input keyevent 47`);
  await sleep(200);

  // 删掉
  for (let i = 0; i < 40; i++) {
    adbShell('input keyevent 67');
    await sleep(40);
  }
  await sleep(300);

  // 设剪贴板并粘贴
  typeChineseViaScrcpy(text);
  await sleep(1200);
}

/**
 * 打开小红书到首页
 */
async function openXHS() {
  adbShell('am force-stop com.xingin.xhs');
  await sleep(500);
  adbShell('am start -n com.xingin.xhs/.index.v2.IndexActivityV2');
  await sleep(3000);
}

/**
 * 导航到发布页
 */
async function navigateToPublish() {
  // 点+
  adbShell(`input tap ${COORDS.plus[0]} ${COORDS.plus[1]}`);
  await sleep(1500);

  // 点"从相册选择"
  adbShell(`input tap ${COORDS.album_select[0]} ${COORDS.album_select[1]}`);
  await sleep(2500);

  // 选第一张图
  adbShell(`input tap ${COORDS.photo_select[0]} ${COORDS.photo_select[1]}`);
  await sleep(1500);

  // 点下一步
  adbShell(`input tap ${COORDS.next[0]} ${COORDS.next[1]}`);
  await sleep(3000);

  // 再次点下一步（编辑页）
  adbShell(`input tap ${COORDS.next[0]} ${COORDS.next[1]}`);
  await sleep(3000);

  console.log('[XHS] 已到达发布编辑页');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isScrcpyRunning() {
  try {
    const out = require('child_process').execSync('ps aux | grep scrcpy | grep -v grep').toString();
    return out.includes('scrcpy');
  } catch {
    return false;
  }
}

/**
 * 发布小红书图文到草稿箱
 */
async function publish(imagePath, title, body, publishDirectly = false) {
  if (!existsSync(imagePath)) {
    throw new Error(`图片不存在: ${imagePath}`);
  }

  if (!isScrcpyRunning()) {
    console.warn('[XHS] scrcpy 未运行，中文输入可能失败。建议先运行: scrcpy --tcpip=192.168.31.21:5555');
  }

  console.log(`[XHS] 开始发布: ${title}`);

  // 1. 推送图片到手机
  const phonePath = '/sdcard/Pictures/xhs_cover.png';
  console.log('[XHS] 推送图片到手机...');
  execSync(`adb -s ${PHONE_IP} push "${imagePath}" "${phonePath}"`, { timeout: 30000 });
  console.log('[XHS] 图片推送完成');

  // 2. 打开小红书导航到发布页
  await openXHS();
  await navigateToPublish();

  // 3. 填标题（先关键盘）
  adbShell('input keyevent 4');
  await sleep(800);
  await clearAndType(COORDS.title_input[0], COORDS.title_input[1], title);
  console.log('[XHS] 标题已填');

  // 4. 关键盘 → 填正文
  adbShell('input keyevent 4');
  await sleep(800);
  await clearAndType(COORDS.body_input[0], COORDS.body_input[1], body);
  console.log('[XHS] 正文已填');

  // 5. 关键盘 → 截图确认
  adbShell('input keyevent 4');
  await sleep(800);
  saveScreenshot('/tmp/xhs_publish_preview.png');
  console.log('[XHS] 截图已保存: /tmp/xhs_publish_preview.png');

  if (publishDirectly) {
    // 直接发布（不存草稿）
    adbShell(`input tap ${COORDS.publish_btn[0]} ${COORDS.publish_btn[1]}`);
    await sleep(2000);
    console.log('[XHS] 已直接发布');
  } else {
    // 存草稿
    adbShell(`input tap ${COORDS.draft_btn[0]} ${COORDS.draft_btn[1]}`);
    await sleep(1500);

    // 确认弹窗
    adbShell('input tap 735 1272');
    await sleep(2000);

    saveScreenshot('/tmp/xhs_draft_saved.png');
    console.log('[XHS] 草稿已保存: /tmp/xhs_draft_saved.png');
  }

  console.log('[XHS] 完成');
}

// CLI
const args = process.argv.slice(2);
const imageIdx = args.indexOf('--image');
const titleIdx = args.indexOf('--title');
const bodyIdx = args.indexOf('--body');
const publishIdx = args.indexOf('--publish');

const imagePath = imageIdx > -1 ? args[imageIdx + 1] : '';
const title = titleIdx > -1 ? args[titleIdx + 1] : '测试标题';
const body = bodyIdx > -1 ? args[bodyIdx + 1] : '测试正文';
const publishDirectly = publishIdx > -1;

if (!imagePath) {
  console.log('用法:');
  console.log('  node src/xhs/publish.js --image /path/img.png --title "标题" --body "正文"');
  console.log('  node src/xhs/publish.js --image /path/img.png --title "标题" --body "正文" --publish');
  console.log('');
  console.log('环境变量:');
  console.log('  PHONE_IP=192.168.31.21:5555  手机ADB地址');
  process.exit(1);
}

publish(imagePath, title, body, publishDirectly).catch(e => {
  console.error('[XHS] 错误:', e.message);
  process.exit(1);
});