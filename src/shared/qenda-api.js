/**
 * QENDA API - 图片生成 + AI对话/识图
 * 用法:
 *   node src/shared/qenda-api.js generate-image --prompt "..." --ref "..." --output /tmp/img.png
 *   node src/shared/qenda-api.js chat --message "..." --model gpt-5.5
 */

import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const API_BASE = 'https://api.ai6700.com/api/v1';
const API_KEY = process.env.QENDA_API_KEY || '';

/**
 * 生成图片（gpt-image-2）
 * @param {string} prompt
 * @param {string} refImageUrl - 参考图URL
 * @param {string} size - 1024x1024 / 1152x2048 等
 */
export async function generateImage(prompt, refImageUrl, size = '1024x1024') {
  const body = {
    model: 'gpt-image-2',
    prompt,
    size,
    quality: 'high',
    images: refImageUrl ? [refImageUrl] : []
  };

  console.log('[QENDA] 生成图片中...');
  const res = await fetch(`${API_BASE}/media/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QENDA图片生成失败: ${res.status} ${err}`);
  }

  const data = await res.json();
  const taskId = data.task_id;
  console.log(`[QENDA] task_id: ${taskId}`);

  // 轮询状态
  let attempts = 0;
  while (attempts < 60) {
    await sleep(3000);
    const statusRes = await fetch(`${API_BASE}/skills/task-status?task_id=${taskId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const status = await statusRes.json();
    if (status.is_final) {
      const url = status.result_url;
      console.log(`[QENDA] 图片生成完成: ${url}`);
      return url;
    }
    attempts++;
    process.stdout.write('.');
  }
  throw new Error('图片生成超时');
}

/**
 * 下载图片到本地路径
 */
export async function downloadImage(url, outputPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下载失败: ${res.status}`);
  const buffer = await res.arrayBuffer();
  writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`[QENDA] 图片已保存: ${outputPath}`);
}

/**
 * AI对话（gpt-5.5 / gpt-image-2 等）
 */
export async function chat(message, model = 'gpt-5.5') {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: message }]
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// CLI 入口
const cmd = process.argv[2];
if (cmd === 'generate-image') {
  const promptIdx = process.argv.indexOf('--prompt');
  const refIdx = process.argv.indexOf('--ref');
  const outIdx = process.argv.indexOf('--output');

  const prompt = process.argv[promptIdx + 1] || '';
  const ref = refIdx > -1 ? process.argv[refIdx + 1] : '';
  const output = outIdx > -1 ? process.argv[outIdx + 1] : '/tmp/qenda_output.png';

  if (!prompt) {
    console.error('用法: node qenda-api.js generate-image --prompt "..." --ref url --output path');
    process.exit(1);
  }

  const url = await generateImage(prompt, ref);
  await downloadImage(url, output);
} else if (cmd === 'chat') {
  const msgIdx = process.argv.indexOf('--message');
  const modelIdx = process.argv.indexOf('--model');
  const message = process.argv[msgIdx + 1] || '';
  const model = modelIdx > -1 ? process.argv[modelIdx + 1] : 'gpt-5.5';
  const result = await chat(message, model);
  console.log(result);
}