/**
 * 任务协调文件 - 防止多平台/多channel冲突发布
 * 协调文件: ~/.openclaw/workspace/task_sync.json
 *
 * 发布前检查：if (已发布 today) skip
 * 发布后更新：write sync file
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

const SYNC_FILE = process.env.TASK_SYNC_FILE ||
  `${process.env.HOME}/.openclaw/workspace/task_sync.json`;

export function readSync() {
  try {
    if (existsSync(SYNC_FILE)) {
      return JSON.parse(readFileSync(SYNC_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('[TaskSync] 读取协调文件失败:', e.message);
  }
  return {
    douyin_last_post: { date: null, title: null, channel: null },
    xhs_last_post: { date: null, title: null, channel: null },
    comment_reply_last_run: { time: null, channel: null, count: 0 }
  };
}

export function writeSync(data) {
  try {
    writeFileSync(SYNC_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn('[TaskSync] 写入协调文件失败:', e.message);
  }
}

export function canPost(platform) {
  const sync = readSync();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const key = platform === 'douyin' ? 'douyin_last_post' : 'xhs_last_post';
  const last = sync[key];

  if (last?.date === today) {
    console.log(`[TaskSync] ${platform} 今日已发布 "${last.title}"，跳过`);
    return false;
  }
  return true;
}

export function markPosted(platform, title) {
  const sync = readSync();
  const today = new Date().toISOString().slice(0, 10);
  const key = platform === 'douyin' ? 'douyin_last_post' : 'xhs_last_post';
  sync[key] = { date: today, title, channel: 'auto', time: new Date().toISOString() };
  writeSync(sync);
  console.log(`[TaskSync] ${platform} 已标记今日发布: ${title}`);
}

export function canReply(platform) {
  const sync = readSync();
  const now = new Date();
  const hour = now.getHours();
  const key = 'comment_reply_last_run';
  const last = sync[key];

  if (last?.time) {
    const lastHour = new Date(last.time).getHours();
    if (lastHour === hour && last.channel === platform) {
      console.log(`[TaskSync] ${platform} 本小时(${hour})已处理过回复，跳过`);
      return false;
    }
  }
  return true;
}

export function markReplied(platform, count) {
  const sync = readSync();
  sync.comment_reply_last_run = {
    time: new Date().toISOString(),
    channel: platform,
    count
  };
  writeSync(sync);
}

// CLI测试
const cmd = process.argv[2];
if (cmd === 'check') {
  const s = readSync();
  console.log(JSON.stringify(s, null, 2));
} else if (cmd === 'mark-douyin') {
  markPosted('douyin', process.argv[3] || 'test');
} else if (cmd === 'mark-xhs') {
  markPosted('xhs', process.argv[3] || 'test');
}