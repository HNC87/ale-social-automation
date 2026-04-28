/**
 * 小红书评论自动回复 - 手机端 ADB
 *
 * 流程:
 *   1. 打开小红书 → 消息/评论页面
 *   2. 读取未读评论
 *   3. 用阿莱口吻逐条回复（30-80字）
 *   4. 中文输入用 scrcpy+osascript
 *
 * 用法:
 *   node src/xhs/comments.js
 */

import { execSync } from 'child_process';

const PHONE_IP = process.env.PHONE_IP || '192.168.31.21:5555';

function adbShell(cmd) {
  return execSync(`adb -s ${PHONE_IP} shell "${cmd}"`, {
    encoding: 'utf8',
    timeout: 10000
  });
}

function screenshot() {
  const buf = execSync(`adb -s ${PHONE_IP} exec-out screencap -p`, { encoding: 'binary' });
  return Buffer.from(buf, 'binary');
}

function saveScreenshot(path) {
  require('fs').writeFileSync(path, Buffer.from(screenshot(), 'binary'));
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * 通过 scrcpy 输入中文
 */
function typeChineseViaScrcpy(text) {
  const { spawn } = require('child_process');

  // 1. Mac剪贴板
  const pbcopy = spawn('pbcopy', []);
  pbcopy.stdin.write(text);
  pbcopy.stdin.end();

  // 2. 激活scrcpy窗口并粘贴
  const osaScript = `
tell application "System Events"
  set p to first process whose name contains "scrcpy"
  set frontmost of p to true
end tell
delay 0.5
tell application "System Events"
  keystroke "v" using command down
end tell
  `.trim();

  execSync(`osascript -e '${osaScript}'`);
  return true;
}

/**
 * 点输入框并输入回复
 */
async function replyComment(x, y, replyText) {
  // 点评论输入框
  adbShell(`input tap ${x} ${y}`);
  await sleep(800);

  // 输入回复
  typeChineseViaScrcpy(replyText);
  await sleep(1000);

  // 发送（假设发送按钮在坐标）
  adbShell(`input tap 735 1272`);
  await sleep(1000);
}

async function openXHSComments() {
  adbShell('am force-stop com.xingin.xhs');
  await sleep(500);
  adbShell('am start -n com.xingin.xhs/.index.v2.IndexActivityV2');
  await sleep(3000);

  // 点右下角消息图标
  adbShell('input tap 900 2100');
  await sleep(2000);
}

/**
 * 评论回复逻辑
 * 阿莱风格：短句30-80字，真实口吻，不客套
 */
function aleReply(comment) {
  const commentLower = comment.toLowerCase();

  if (commentLower.includes('赚钱') || commentLower.includes('收益')) {
    return '这东西没有稳赚的，看策略看心态～';
  }
  if (commentLower.includes('怎么') || commentLower.includes('如何')) {
    return '可以私信聊，不过不一定能解决哈';
  }
  if (commentLower.includes('你好') || commentLower.includes('hi')) {
    return '嗨～';
  }
  if (commentLower.includes('可爱') || commentLower.includes('喜欢')) {
    return '谢谢，生活还得继续写代码😂';
  }
  if (commentLower.includes('失眠') || commentLower.includes('熬夜')) {
    return '同感，凌晨盯K线的痛谁懂';
  }

  // 默认回复
  return '路过～记得照顾好自己';
}

/**
 * 主流程
 */
async function run() {
  console.log('[XHS Comments] 开始检查评论');

  await openXHSComments();

  // TODO: 读取评论列表
  // 目前需要手动读取屏幕内容
  // 后续可以接入小红书API或AI视觉识别

  console.log('[XHS Comments] 评论页面已打开');
  console.log('[XHS Comments] 请在手机上查看并手动回复');
  console.log('[XHS Comments] 阿莱风格参考：短句30-80字，真实口吻，不客套');

  saveScreenshot('/tmp/xhs_comments.png');
  console.log('[XHS Comments] 截图已保存: /tmp/xhs_comments.png');
}

run().catch(e => {
  console.error('[XHS Comments] 错误:', e.message);
  process.exit(1);
});