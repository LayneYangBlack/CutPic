/**
 * Ollama 本地模型适配器
 * 生成结构化图像提示词：3 批量场景 + 2 单品场景，含人物互动
 */

const OLLAMA_BASE = 'http://localhost:11434';

export async function checkOllamaAvailable() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getOllamaModels() {
  const res = await fetch(`${OLLAMA_BASE}/api/tags`);
  const data = await res.json();
  return (data.models || []).map(m => m.name);
}

/**
 * 根据图片提示词生成电商标题
 * @param {string[]} prompts - 5 条图片提示词
 * @param {string} productDesc - 产品描述
 * @param {string} model - Ollama 模型名
 * @returns {Promise<string>} 英文标题（150-250字符）
 */
export async function generateProductTitle({ prompts, productDesc, model = 'qwen2.5:14b' }) {
  const systemPrompt = `You are an expert e-commerce copywriter specializing in product listing titles for platforms like Amazon, Temu, AliExpress.
Output ONLY the title text, nothing else. No quotes, no explanation, no prefix.

Rules:
- English only, 150-250 characters (STRICT, count carefully)
- Must be a fluent, natural sentence — NOT keyword stuffing
- Include: product type, key features, use cases/scenes, trending/hot-selling words
- NO brand names, NO copyrighted terms, NO trademarked words
- NO words like "official", "authentic", "licensed", "Disney", "Marvel", etc.
- NO vague quantity words like "60+", "50+", "100+", "multiple", "dozens" — do NOT mention quantity at all
- NO color descriptions for the badge face (it's customizable, not a fixed color)
- Use commercial appeal words: custom, personalized, bulk, set, pack, gift, party, DIY, collectible, decorative
- Naturally incorporate scene keywords from the image prompts provided
- The title must read as one smooth sentence, not a list of keywords`;

  const userPrompt = `Product: ${productDesc}

Image scene prompts (extract scene/use-case keywords from these):
${prompts.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Write ONE e-commerce product listing title. Must be 150-250 characters, fluent English, include scene words and hot-selling keywords. Count the characters carefully.`;

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options: { temperature: 0.6 },
    }),
  });

  if (!res.ok) throw new Error(`Ollama 标题生成失败: ${res.status}`);

  const data = await res.json();
  let title = (data.message?.content || '').trim();

  // 去掉可能的引号包裹
  title = title.replace(/^["']|["']$/g, '').trim();

  // 如果超长截断到最后一个完整单词
  if (title.length > 250) {
    title = title.substring(0, 250);
    const lastSpace = title.lastIndexOf(' ');
    if (lastSpace > 150) title = title.substring(0, lastSpace);
  }

  // 如果太短，重试一次（追加要求）
  if (title.length < 150) {
    const retryRes = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: title },
          { role: 'user', content: `This title is only ${title.length} characters. It MUST be at least 150 characters. Add more scene keywords and product features to make it longer. Output only the revised title.` },
        ],
        options: { temperature: 0.7 },
      }),
    });
    if (retryRes.ok) {
      const retryData = await retryRes.json();
      const retryTitle = (retryData.message?.content || '').trim().replace(/^["']|["']$/g, '').trim();
      if (retryTitle.length >= 150 && retryTitle.length <= 250) {
        title = retryTitle;
      } else if (retryTitle.length > 250) {
        title = retryTitle.substring(0, 250);
        const ls = title.lastIndexOf(' ');
        if (ls > 150) title = title.substring(0, ls);
      } else if (retryTitle.length > title.length) {
        title = retryTitle;
      }
    }
  }

  return title;
}
export async function generatePrompts({ productDesc, corePrompt = '', model = 'qwen2.5:14b', onChunk }) {
  const systemPrompt = `You are an expert AI image prompt engineer specializing in e-commerce product photography.
Output ONLY valid JSON. No markdown, no explanation, no extra text.

Core rules:
- All prompts in English only
- NO brand names, NO known IP characters, NO copyrighted logos
- NO blank/empty product surface — badges must have colorful custom printed designs/illustrations on their face
- Every prompt must mention: the badge's glossy smooth front surface, circular shape, custom printed design on face
- NO keychains, NO pins as separate accessories, NO visible back pins or clasps — badges must appear already pinned/attached to surface or clothing
- NO text/writing visible anywhere in the image
- Human figures: use only generic descriptions (e.g. "young woman's hands", "casual-dressed person") — no specific ethnicity
- Describe specific lighting, angle, surface material, atmosphere — make it vivid and photorealistic
- Each prompt max 90 words`;

  const coreHint = corePrompt
    ? `Product core features (MUST be reflected in all prompts): "${corePrompt}"`
    : '';

  // 完整场景池
  const allBatchScenes = [
    'Retail display tray with dozens of badges arranged in rows at a market stall',
    'Trade show vendor table covered with badges in organized sections',
    'Corkboard completely covered with colorful badges pinned in creative pattern',
    'Craft fair table display with badges spread across velvet cloth',
    'Cardboard retail box packaging with badges visible inside, box half open',
    'Flat lay of badges sorted by color/theme on white background',
    'Wholesale bulk bag or zip-lock bag filled with dozens of badges',
    'Clear acrylic display stand holding rows of badges at a shop counter',
    'Storage tray compartments each holding groups of different badge designs',
    'Badges scattered across a wooden festival/market table with price tags',
    'Paper gift box with badges arranged inside as party favors',
    'Canvas backpack with badges covering the entire front',
    'Denim jacket hanging on wall completely covered with varied badges',
    'School locker door decorated with dozens of colorful badges',
    'Festival wristband table also featuring badge collection for attendees',
    'Party goodie bags with badges visible alongside other items',
    'Craft workshop table with badges, ribbon and packaging materials',
    'Online seller photography setup: badges arranged on light box',
    'Shipping fulfillment: badges in small individual OPP bags ready to mail',
    'Collector binder pages or album displaying badge collection',
    'Pop culture convention merchandise table with mass badge display',
    'Music festival souvenir booth with themed badges on display rack',
    'Charity fundraiser table with cause-themed badges for sale',
    'Birthday party decoration table with badges as personalized gifts',
    'Wedding favor table: badges in small gift boxes for guests',
    'School club or team spirit badges in bulk on announcement board',
    'Anime/comic convention artist alley table with character badge sets',
    'Badges displayed on rotating carousel stand in gift shop',
    'Bulk badges poured from packaging onto sorting table',
    'E-commerce product flat lay: badges with kraft paper and twine props',
    'Themed badge set in custom printed cardboard gift packaging box',
    'Badges pinned to foam display board at outdoor flea market',
    'New Year/holiday celebration party favor station with badge selection',
    'Graduation ceremony memory badges arranged on commemorative display',
    'Office team-building event badges laid out on conference table',
  ];

  const allSingleScenes = [
    'Young person hands pinning badge onto denim jacket lapel, casual setting',
    'Badge already attached to canvas tote bag strap, held by person walking',
    'Close-up of badge pinned on school uniform chest pocket',
    'Person at party wearing badge as name tag/fun accessory',
    'Hands holding badge up to sunlight showing glossy reflective surface',
    'Badge pinned on lanyard at conference or event',
    'Person choosing a badge from display, holding it up to inspect',
    'Badge worn on beanie hat at outdoor winter festival',
    'Hands gifting a badge in small box to another person',
    'Badge pinned on apron at craft market vendor',
    'Person pinning badge onto child backpack as a reward',
    'Badge collection on person jacket, one being added by hand',
    'Badge as graduation/ceremony memento being held proudly',
  ];

  // 每次随机抽 8 个批量场景 + 5 个单品场景给模型（强制多样性）
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
  const pickedBatch = shuffle(allBatchScenes).slice(0, 8);
  const pickedSingle = shuffle(allSingleScenes).slice(0, 5);

  const userPrompt = `Product: ${productDesc}
${coreHint}

You MUST use ONLY the following scene options (randomly selected for this run):

BATCH SCENES (pick exactly 3, must show 50+ badges, no people):
${pickedBatch.map((s, i) => `${i + 1}. ${s}`).join('\n')}

SINGLE SCENES (pick exactly 2, badge already pinned, show hands/partial figure):
${pickedSingle.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Generate 5 prompts as JSON. You MUST pick from the options above — do NOT reuse scenes from previous generations:

{
  "batch": [
    "Vivid detailed prompt based on batch option X: 50+ badges, specific lighting, angle, atmosphere",
    "Vivid detailed prompt based on batch option Y: different mood and composition",
    "Vivid detailed prompt based on batch option Z: unique angle and setting"
  ],
  "single": [
    "Vivid detailed prompt based on single option A: one badge with colorful design, natural human interaction",
    "Vivid detailed prompt based on single option B: different context and mood"
  ]
}

Rules:
- batch scenes MUST show 50+ badges with varied colorful custom printed designs
- single scenes: badge already attached, NO visible pin/clasp mechanism
- No keychains, no separate accessories
- Each prompt MUST be unique — different setting, angle, lighting, mood
- Each prompt max 90 words`;

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options: { temperature: 0.9 },
    }),
  });

  if (!res.ok) throw new Error(`Ollama 请求失败: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        const chunk = json.message?.content || '';
        fullText += chunk;
        onChunk?.(chunk, fullText);
      } catch { /* 忽略非 JSON 行 */ }
    }
  }

  // 提取 JSON
  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('模型输出格式异常，无法解析 JSON');

  const parsed = JSON.parse(jsonMatch[0]);
  const batch = (parsed.batch || []).map(p => p.trim()).filter(p => p.length > 10);
  const single = (parsed.single || []).map(p => p.trim()).filter(p => p.length > 10);

  if (batch.length === 0 && single.length === 0) {
    throw new Error('模型未生成有效提示词，请重试');
  }

  return { batch, single };
}

