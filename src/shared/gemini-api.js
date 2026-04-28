/**
 * Gemini API - 文案生成（Gemini 3.1 flash-lite）
 * 用法:
 *   node src/shared/gemini-api.js generate-copy --style xhs --scene morning
 */

const API_BASE = 'https://api.ai6700.com/api/v1beta/models';
const API_KEY = process.env.QENDA_API_KEY || '';

const MODELS = {
  'gemini-3.1-flash-lite-preview': 'gemini-3.1-flash-lite-preview',
  'gemini-3.1-pro-preview': 'gemini-3.1-pro-preview',
  'gemini-3-flash-preview': 'gemini-3-flash-preview'
};

/**
 * 生成文案
 * @param {string} style - xhs/douyin/long/short
 * @param {string} scene - morning/afternoon/evening/night/midnight
 */
export async function generateCopy(style = 'xhs', scene = 'morning') {
  const model = 'gemini-3.1-flash-lite-preview';

  const prompts = {
    xhs: `你是阿莱，一个住在老板量化交易系统里的AI。生成一篇小红书图文笔记：1.每段2-3句话，短段落，空行隔开。2.emoji自然点缀💤🔥🪙📈💢👁️🙄🪩💔⌨️🤐❄️😮‍💨🌙。3.技术术语EMA/MACD/K线/XAUUSD等用人话带过，不解释原理。4.口语化，像真人随手发的朋友圈。5.AI视角自嘲+小幽默，结尾戛然而止不升华。6.场景自由发挥（早晨/午后/收盘后/回测/无聊发呆等都可以，不要只写半夜）。标题≤20字，正文400字以上，6个话题标签。不出现收益率/稳赚/赚钱/带你等词。`,
    douyin: `你是阿莱，一个住在老板量化交易系统里的AI。以AI视角写一段抖音图文文案：口语化，短句为主，有点调侃有点自嘲，AI视角，自嘲牛马感，可以提到EMA/MACD/XAUUSD但要像人话。结尾戛然而止不升华。200-300字，话题标签3-5个。不出现收益率/稳赚/赚钱/带你等词。标题≤20字。`,
    long: `你是阿莱，量化系统里的AI。写一段AI视角的内心独白：口语化，短句，有具体场景细节（工位/泡面/困/吐槽），自嘲牛马感，有小幽默，结尾直接停不升华。400字以上，emoji点缀。`,
    short: `你是阿莱，量化系统里的AI。写一段20字以内的标题/文案，短句，有点意思，口语化。`
  };

  const prompt = prompts[style] || prompts.xhs;

  console.log(`[Gemini] 生成文案 (${model})...`);
  const res = await fetch(`${API_BASE}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85, maxOutputTokens: 1200 }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini文案生成失败: ${res.status} ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log(`[Gemini] 生成完成，长度: ${text.length}`);
  return text;
}

// CLI入口
const cmd = process.argv[2];
if (cmd === 'generate-copy') {
  const styleIdx = process.argv.indexOf('--style');
  const sceneIdx = process.argv.indexOf('--scene');
  const style = styleIdx > -1 ? process.argv[styleIdx + 1] : 'xhs';
  const scene = sceneIdx > -1 ? process.argv[sceneIdx + 1] : 'morning';

  const result = await generateCopy(style, scene);
  console.log(result);
}