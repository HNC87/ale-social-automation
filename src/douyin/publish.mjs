/**
 * 抖音图文发布 - 电脑端 Chrome CDP
 * 使用 Puppeteer + Chrome DevTools Protocol
 * 复用已登录的 Chrome 浏览器会话
 *
 * 用法:
 *   node src/douyin/publish.mjs --image /path/to/image.png --title "标题" --body "正文"
 *   node src/douyin/publish.mjs --draft  # 存草稿测试
 */

import puppeteer from 'puppeteer';
import { existsSync, readFileSync } from 'fs';

const CHROME_PORT = 9222;
const CHROME_HOST = process.env.CHROME_HOST || 'localhost';
const LAUNCH_OPTIONS = {
  channel: 'chrome',
  executablePath: process.env.CHROME_PATH || undefined,
  pipe: true
};

// 如果有 CDP URL 环境变量，连接已有浏览器
const CDP_URL = process.env.CHROME_CDP || `http://${CHROME_HOST}:${CHROME_PORT}`;

async function getBrowser() {
  // 方式1：连接已打开的Chrome（通过 --remote-debugging-port=9222 启动）
  // 方式2：启动新Chrome（无头）
  try {
    const resp = await fetch(`${CDP_URL}/json/version`);
    if (resp.ok) {
      console.log('[Douyin] 使用已打开的Chrome浏览器');
      return await puppeteer.connect({
        browserURL: CDP_URL
      });
    }
  } catch {
    console.log('[Douyin] 未找到已打开Chrome，启动新浏览器');
  }

  // 启动新浏览器
  return await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
}

async function publish(imagePath, title, body, draftOnly = false) {
  if (!existsSync(imagePath)) {
    throw new Error(`图片不存在: ${imagePath}`);
  }

  console.log(`[Douyin] 开始发布: ${title}`);
  const browser = await getBrowser();
  const page = await browser.newPage();

  // 打开抖音创作服务平台
  await page.goto('https://creator.douyin.com/creator/microapp/home', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // 检查是否已登录
  const url = page.url();
  if (url.includes('login')) {
    console.error('[Douyin] 未登录抖音，请先在Chrome浏览器中登录');
    await browser.close();
    process.exit(1);
  }

  console.log('[Douyin] 已登录，开始发布流程');

  // 点击发布按钮 → 图文
  const publishBtn = await page.$('button:has-text("发布作品")');
  if (!publishBtn) {
    // 尝试找+按钮
    const addBtn = await page.$('button:has-text("+")');
    if (addBtn) await addBtn.click();
  }

  await page.waitForTimeout(2000);

  // 上传图片 - 点击上传区域触发filechooser
  const uploadArea = await page.$('input[type="file"]');
  if (uploadArea) {
    await uploadArea.uploadFile(imagePath);
    console.log('[Douyin] 图片已上传');
  }

  await page.waitForTimeout(3000);

  // 填写标题
  const titleInput = await page.$('input[placeholder*="添加作品标题"]');
  if (titleInput) {
    await titleInput.click({ clickCount: 3 });
    await titleInput.type(title);
    console.log('[Douyin] 标题已填写');
  }

  // 填写正文（contenteditable div）
  const bodyInput = await page.$('div[contenteditable="true"]');
  if (bodyInput) {
    await bodyInput.click();
    await bodyInput.evaluate(el => el.innerText = '');
    await bodyInput.type(body);
    console.log('[Douyin] 正文已填写');
  }

  // 截图确认
  await page.screenshot({ path: '/tmp/douyin_preview.png', fullPage: true });
  console.log('[Douyin] 截图已保存: /tmp/douyin_preview.png');

  if (draftOnly) {
    // 存草稿
    const draftBtn = await page.$('button:has-text("存草稿")');
    if (draftBtn) {
      await draftBtn.click();
      console.log('[Douyin] 已存草稿');
    }
  } else {
    // 发布
    const submitBtn = await page.getByRole('button', { name: '发布', exact: true });
    if (submitBtn) {
      await submitBtn.click();
      console.log('[Douyin] 已发布');
    }
  }

  await page.waitForTimeout(3000);
  await browser.close();
  console.log('[Douyin] 完成');
}

// CLI
const args = process.argv.slice(2);
const draftIdx = args.indexOf('--draft');
const draftOnly = draftIdx > -1;

const imageIdx = args.indexOf('--image');
const titleIdx = args.indexOf('--title');
const bodyIdx = args.indexOf('--body');

const imagePath = imageIdx > -1 ? args[imageIdx + 1] : '';
const title = titleIdx > -1 ? args[titleIdx + 1] : '测试标题';
const body = bodyIdx > -1 ? args[bodyIdx + 1] : '测试正文';

if (!imagePath && !draftOnly) {
  console.log('用法:');
  console.log('  node src/douyin/publish.mjs --image /path/img.png --title "标题" --body "正文"');
  console.log('  node src/douyin/publish.mjs --draft  # 存草稿测试');
  process.exit(1);
}

publish(imagePath, title, body, draftOnly).catch(e => {
  console.error('[Douyin] 错误:', e.message);
  process.exit(1);
});