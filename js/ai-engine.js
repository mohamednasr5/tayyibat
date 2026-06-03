/**
 * ══════════════════════════════════════════════════════════════════
 *  🌿 طيبات — محرك الذكاء الاصطناعي المجاني
 *  ai-engine.js  |  v3.0
 *
 *  المزودون (بدون مفاتيح):
 *  - OVH Kepler    → https://oai.endpoints.kepler.ai.cloud.ovh.net/v1
 *  - LLM7.io       → https://api.llm7.io/v1  (30 RPM بدون تسجيل)
 *  - Pollinations  → https://text.pollinations.ai/openai
 *  - OpenRouter    → نماذج مجانية
 *  - Tesseract.js  → OCR عربي/إنجليزي
 *  - Open Food Facts, OpenFDA, DailyMed
 * ══════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  var CFG = {
    // Cloudflare Worker — أولوية قصوى لتحليل الصور
    cloudflareEndpoint: 'https://taybat-ai.studegy8.workers.dev',

    // OVH Kepler — مجاني 2 req/دقيقة لكل IP
    keplerEndpoint: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
    keplerModels: [
      'Llama-3.3-70B-Instruct',
      'DeepSeek-R1',
      'Qwen3-32B',
      'Mistral-Nemo-Instruct-2407'
    ],

    // LLM7.io — مجاني 30 RPM بدون تسجيل
    llm7Endpoint: 'https://api.llm7.io/v1/chat/completions',
    llm7Models: [
      'gpt-4.1',
      'gpt-4o',
      'gpt-4o-mini',
      'claude-3-5-sonnet-20241022',
      'gemini-1.5-pro',
      'llama-3.3-70b-instruct',
      'deepseek-chat',
      'mistral-large-latest'
    ],

    // Pollinations — مجاني بدون مفتاح
    pollinationsText:  'https://text.pollinations.ai/openai',
    pollinationsModels: ['openai-large', 'openai', 'mistral', 'llama', 'deepseek'],

    // OpenRouter — نماذج مجانية
    openrouterEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    openrouterFreeModels: [
      'meta-llama/llama-3.1-8b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'google/gemma-2-9b-it:free',
      'qwen/qwen-2-7b-instruct:free'
    ],

    // Open Food Facts
    offSearch:  'https://world.openfoodfacts.org/cgi/search.pl',
    offBarcode: 'https://world.openfoodfacts.org/api/v2/product/',

    // الأدوية
    dailymedSearch: 'https://dailymed.nlm.nih.gov/dailymed/services/v2/drugnames.json',
    fdaDrugSearch:  'https://api.fda.gov/drug/label.json',

    // Tesseract OCR
    tesseractCDN: 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js',

    timeoutMs: 15000
  };

  /* ─── مساعدات ─── */
  function timeout(ms) {
    return new Promise(function (_, rej) {
      setTimeout(function () { rej(new Error('TIMEOUT')); }, ms);
    });
  }
  function race(p, ms) {
    return Promise.race([p, timeout(ms || CFG.timeoutMs)]);
  }
  function extractText(data) {
    if (!data) return null;
    if (data.choices && data.choices[0] && data.choices[0].message)
      return data.choices[0].message.content || null;
    if (typeof data === 'string') return data;
    return null;
  }

  /* ─────────────────────────────────────────
     1. OVH Kepler (2 req/min مجاني)
  ───────────────────────────────────────── */
  var _keplerLastCall = 0;
  var _keplerIdx = 0;

  async function _tryKepler(messages, modelIdx) {
    modelIdx = modelIdx || 0;
    if (modelIdx >= CFG.keplerModels.length) return null;
    // احترام الحد: 2 req/دقيقة = 30 ثانية بين كل طلب
    var now = Date.now();
    var wait = 31000 - (now - _keplerLastCall);
    if (wait > 0) await new Promise(function(r){ setTimeout(r, wait); });
    _keplerLastCall = Date.now();

    var model = CFG.keplerModels[modelIdx];
    try {
      var resp = await race(fetch(CFG.keplerEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model, messages: messages, max_tokens: 1200, temperature: 0.7 })
      }));
      if (!resp.ok) return await _tryKepler(messages, modelIdx + 1);
      var data = await resp.json();
      var text = extractText(data);
      if (text && text.trim().length > 5) return { text: text.trim(), source: 'Kepler/' + model };
      return await _tryKepler(messages, modelIdx + 1);
    } catch(e) { return await _tryKepler(messages, modelIdx + 1); }
  }

  /* ─────────────────────────────────────────
     2. LLM7.io (30 RPM مجاني)
  ───────────────────────────────────────── */
  var _llm7LastCall = 0;
  var _llm7Idx = 0;

  async function _tryLLM7(messages, modelIdx) {
    modelIdx = modelIdx || 0;
    if (modelIdx >= CFG.llm7Models.length) return null;
    // احترام 30 RPM = 2 ثانية بين الطلبات
    var now = Date.now();
    var wait = 2100 - (now - _llm7LastCall);
    if (wait > 0) await new Promise(function(r){ setTimeout(r, wait); });
    _llm7LastCall = Date.now();

    var model = CFG.llm7Models[modelIdx];
    try {
      var resp = await race(fetch(CFG.llm7Endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model, messages: messages, max_tokens: 1200, temperature: 0.7 })
      }));
      if (resp.status === 429) {
        await new Promise(function(r){ setTimeout(r, 3000); });
        return await _tryLLM7(messages, modelIdx + 1);
      }
      if (!resp.ok) return await _tryLLM7(messages, modelIdx + 1);
      var data = await resp.json();
      var text = extractText(data);
      if (text && text.trim().length > 5) return { text: text.trim(), source: 'LLM7/' + model };
      return await _tryLLM7(messages, modelIdx + 1);
    } catch(e) { return await _tryLLM7(messages, modelIdx + 1); }
  }

  /* تقليص الصورة إذا كانت كبيرة (تجنب 400 Bad Request في LLM7) */
  async function _resizeImage(imgDataUrl, maxSize) {
    maxSize = maxSize || 640;
    return new Promise(function(resolve) {
      try {
        var img = new Image();
        img.onload = function() {
          if (img.width <= maxSize && img.height <= maxSize) { resolve(imgDataUrl); return; }
          var ratio = Math.min(maxSize/img.width, maxSize/img.height);
          var c = document.createElement('canvas');
          c.width  = Math.round(img.width  * ratio);
          c.height = Math.round(img.height * ratio);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.78));
        };
        img.onerror = function() { resolve(imgDataUrl); };
        img.src = imgDataUrl;
      } catch(e) { resolve(imgDataUrl); }
    });
  }

  /* Vision عبر LLM7 */
  async function _tryLLM7Vision(imgDataUrl, prompt, modelIdx) {
    modelIdx = modelIdx || 0;
    var visionModels = ['gpt-4o', 'gpt-4.1', 'claude-3-5-sonnet-20241022', 'gemini-1.5-pro'];
    if (modelIdx >= visionModels.length) return null;
    var now = Date.now();
    var wait = 2100 - (now - _llm7LastCall);
    if (wait > 0) await new Promise(function(r){ setTimeout(r, wait); });
    _llm7LastCall = Date.now();
    try {
      var resp = await race(fetch(CFG.llm7Endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: visionModels[modelIdx],
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imgDataUrl } }
            ]
          }],
          max_tokens: 1200, temperature: 0.3
        })
      }));
      if (!resp.ok) return await _tryLLM7Vision(imgDataUrl, prompt, modelIdx + 1);
      var data = await resp.json();
      var text = extractText(data);
      if (text && text.trim().length > 5) return { text: text.trim(), source: 'LLM7-Vision/' + visionModels[modelIdx] };
      return await _tryLLM7Vision(imgDataUrl, prompt, modelIdx + 1);
    } catch(e) { return await _tryLLM7Vision(imgDataUrl, prompt, modelIdx + 1); }
  }

  /* ─────────────────────────────────────────
     3. Pollinations
  ───────────────────────────────────────── */
  var _polLastCall = 0;

  async function _tryPollinations(messages, modelIdx) {
    modelIdx = modelIdx || 0;
    if (modelIdx >= CFG.pollinationsModels.length) return null;
    var now = Date.now();
    var wait = 900 + Math.floor(Math.random()*400) - (now - _polLastCall);
    if (wait > 0) await new Promise(function(r){ setTimeout(r, wait); });
    _polLastCall = Date.now();
    var model = CFG.pollinationsModels[modelIdx];
    try {
      var resp = await race(fetch(CFG.pollinationsText, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model, messages: messages, max_tokens: 1200, temperature: 0.7 })
      }));
      if (resp.status === 429) { await new Promise(function(r){ setTimeout(r, 2500); }); return await _tryPollinations(messages, modelIdx + 1); }
      if (!resp.ok) return await _tryPollinations(messages, modelIdx + 1);
      var data = await resp.json();
      var text = extractText(data);
      if (text && text.trim().length > 5) return { text: text.trim(), source: 'Pollinations/' + model };
      return await _tryPollinations(messages, modelIdx + 1);
    } catch(e) { return await _tryPollinations(messages, modelIdx + 1); }
  }

  async function _tryPollinationsVision(imgDataUrl, prompt, modelIdx) {
    modelIdx = modelIdx || 0;
    var vModels = ['openai-large', 'openai'];
    if (modelIdx >= vModels.length) return null;
    var now = Date.now();
    var wait = 900 - (now - _polLastCall);
    if (wait > 0) await new Promise(function(r){ setTimeout(r, wait); });
    _polLastCall = Date.now();
    try {
      var resp = await race(fetch(CFG.pollinationsText, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: vModels[modelIdx],
          messages: [{ role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imgDataUrl } }
          ]}],
          max_tokens: 1200, temperature: 0.3
        })
      }));
      if (!resp.ok) return await _tryPollinationsVision(imgDataUrl, prompt, modelIdx + 1);
      var data = await resp.json();
      var text = extractText(data);
      if (text && text.trim().length > 5) return { text: text.trim(), source: 'Pollinations-Vision/' + vModels[modelIdx] };
      return await _tryPollinationsVision(imgDataUrl, prompt, modelIdx + 1);
    } catch(e) { return await _tryPollinationsVision(imgDataUrl, prompt, modelIdx + 1); }
  }

  /* ─────────────────────────────────────────
     4. OpenRouter Free
  ───────────────────────────────────────── */
  var _orLastCall = 0;

  async function _tryOpenRouterFree(messages, modelIdx) {
    modelIdx = modelIdx || 0;
    if (modelIdx >= CFG.openrouterFreeModels.length) return null;
    var now = Date.now();
    var wait = 600 - (now - _orLastCall);
    if (wait > 0) await new Promise(function(r){ setTimeout(r, wait); });
    _orLastCall = Date.now();
    var model = CFG.openrouterFreeModels[modelIdx];
    var headers = { 'Content-Type': 'application/json', 'HTTP-Referer': 'https://tayyibat.online', 'X-Title': 'Tayyibat' };
    var key = window.__OR_KEY_FB || window.__OR_KEY || null;
    if (key) headers['Authorization'] = 'Bearer ' + key;
    try {
      var resp = await race(fetch(CFG.openrouterEndpoint, {
        method: 'POST', headers: headers,
        body: JSON.stringify({ model: model, messages: messages, max_tokens: 1200, temperature: 0.7 })
      }));
      if (resp.status === 429 || resp.status === 402) { await new Promise(function(r){ setTimeout(r, 2000); }); return await _tryOpenRouterFree(messages, modelIdx + 1); }
      if (!resp.ok) return await _tryOpenRouterFree(messages, modelIdx + 1);
      var data = await resp.json();
      var text = extractText(data);
      if (text && text.trim().length > 5) return { text: text.trim(), source: 'OpenRouter/' + model.split('/').pop().replace(':free','') };
      return await _tryOpenRouterFree(messages, modelIdx + 1);
    } catch(e) { return await _tryOpenRouterFree(messages, modelIdx + 1); }
  }

  /* ─────────────────────────────────────────
     5. Cloudflare Worker Vision (أولوية أولى)
  ───────────────────────────────────────── */
  async function _tryCloudflareVision(imgDataUrl, prompt) {
    try {
      var resp = await race(fetch(CFG.cloudflareEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imgDataUrl } }
            ]
          }],
          max_tokens: 1200,
          temperature: 0.3
        })
      }));
      if (!resp.ok) return null;
      var data = await resp.json();
      var text = extractText(data);
      if (text && text.trim().length > 5) return { text: text.trim(), source: 'Cloudflare-Worker' };
      return null;
    } catch(e) { return null; }
  }

  /* ─────────────────────────────────────────
     6. المحرك الرئيسي
  ───────────────────────────────────────── */
  async function _universalChat(messages) {
    // LLM7 أولاً (30 RPM مجاني، نماذج قوية)
    try { var r = await _tryLLM7(messages, 0); if (r) return r; } catch(e) {}
    // Pollinations ثانياً
    try { var r = await _tryPollinations(messages, 0); if (r) return r; } catch(e) {}
    // OpenRouter ثالثاً
    try { var r = await _tryOpenRouterFree(messages, 0); if (r) return r; } catch(e) {}
    // Kepler آخراً (بطيء بسبب rate limit 2/min)
    try { var r = await _tryKepler(messages, 0); if (r) return r; } catch(e) {}
    return null;
  }

  async function _universalVision(imgDataUrl, prompt) {
    // تقليص الصورة مرة واحدة لكل الموفرين
    var smallImg = imgDataUrl;
    try { smallImg = await _resizeImage(imgDataUrl, 640); } catch(e) {}
    // Cloudflare Worker أولاً (الأكثر موثوقية)
    try { var r = await _tryCloudflareVision(smallImg, prompt); if (r) return r; } catch(e) {}
    // LLM7 Vision ثانياً (يدعم GPT-4o وClaude وGemini)
    try { var r = await _tryLLM7Vision(smallImg, prompt, 0); if (r) return r; } catch(e) {}
    // Pollinations Vision ثالثاً
    try { var r = await _tryPollinationsVision(smallImg, prompt, 0); if (r) return r; } catch(e) {}
    return null;
  }

  async function smartChat(sysPrompt, userMsg) {
    var messages = [
      { role: 'system', content: sysPrompt || 'أنت مساعد صحي مفيد باللغة العربية.' },
      { role: 'user', content: userMsg }
    ];
    var result = await _universalChat(messages);
    if (result) return result;
    return { text: _localFallback(userMsg), source: 'local' };
  }

  /* ─────────────────────────────────────────
     6. رد محلي احتياطي
  ───────────────────────────────────────── */
  var LOCAL_TIPS = [
    'تناول الطعام الحقيقي غير المصنّع قدر الإمكان.',
    'شرب الماء الكافي يحسن الهضم ويقلل الشهية.',
    'الصيام المتقطع يساعد على تحسين حساسية الأنسولين.',
    'مرق العظام غني بالكولاجين ومفيد للأمعاء والمفاصل.',
    'قلّل السكر المكرر والنشويات البيضاء للحفاظ على وزن صحي.',
    'النوم المبكر ينظّم هرمونات الجوع والشبع.',
    'زيت الزيتون والسمن البلدي من أفضل مصادر الدهون الصحية.'
  ];
  var _localIdx = 0;

  function _localFallback(question) {
    var q = (question || '').toLowerCase();
    if (q.includes('صيام') || q.includes('fasting'))
      return 'الصيام المتقطع (16:8) من أفضل الطرق لتحسين الأيض. ابدأ بـ 12 ساعة ثم زد تدريجياً.';
    if (q.includes('سكري') || q.includes('سكر'))
      return 'لمرضى السكري: قلّل النشويات البيضاء، وركّز على البروتين والدهون الصحية. المشي بعد الوجبات يساعد كثيراً.';
    if (q.includes('وزن') || q.includes('رجيم'))
      return 'لإنقاص الوزن: تناول الطعام الحقيقي، قلّل السكر والمصنّع، مارس الصيام المتقطع، وانم مبكراً.';
    var tip = LOCAL_TIPS[_localIdx % LOCAL_TIPS.length]; _localIdx++;
    return '💡 ' + tip + '\n\n(رد محلي — تأكد من الاتصال بالإنترنت للحصول على تحليل كامل.)';
  }

  /* ─────────────────────────────────────────
     7. OCR
  ───────────────────────────────────────── */
  var _tesseractLoaded = false;

  function _loadTesseract() {
    return new Promise(function (resolve, reject) {
      if (_tesseractLoaded && window.Tesseract) { resolve(); return; }
      var s = document.createElement('script');
      s.src = CFG.tesseractCDN;
      s.onload = function () { _tesseractLoaded = true; resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function ocrImage(imageDataUrl, lang) {
    lang = lang || 'ara+eng';
    try {
      await _loadTesseract();
      var result = await window.Tesseract.recognize(imageDataUrl, lang, {
        logger: function (m) {
          if (m.status === 'recognizing text' && global.onOCRProgress)
            global.onOCRProgress(Math.round(m.progress * 100));
        }
      });
      return (result.data && result.data.text) ? result.data.text.trim() : '';
    } catch (e) {
      var r = await _universalVision(imageDataUrl, 'استخرج كل النص الموجود في هذه الصورة بدقة كما هو دون تعديل.');
      return r ? r.text : '';
    }
  }

  /* ─────────────────────────────────────────
     8. Open Food Facts
  ───────────────────────────────────────── */
  async function foodSearch(query, maxResults) {
    maxResults = maxResults || 5;
    var url = CFG.offSearch + '?' + new URLSearchParams({ search_terms: query, search_simple: 1, action: 'process', json: 1, page_size: maxResults, fields: 'product_name,brands,ingredients_text,nutriments,nutriscore_grade,ecoscore_grade,additives_tags,allergens,image_url,code' });
    var res = await race(fetch(url), 8000);
    if (!res.ok) return [];
    var data = await res.json();
    return _formatOFF(data.products || []);
  }

  async function foodBarcode(barcode) {
    var res = await race(fetch(CFG.offBarcode + encodeURIComponent(barcode) + '.json'), 8000);
    if (!res.ok) return null;
    var data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    return _formatOFF([data.product])[0] || null;
  }

  function _formatOFF(products) {
    return products.filter(Boolean).map(function (p) {
      var n = p.nutriments || {};
      return { name: p.product_name || 'غير محدد', brand: p.brands || '', code: p.code || '', ingredients: p.ingredients_text || '', image: p.image_url || '', nutriscore: (p.nutriscore_grade || '').toUpperCase(), ecoscore: (p.ecoscore_grade || '').toUpperCase(), additives: p.additives_tags || [], allergens: p.allergens || '', calories: Math.round(n['energy-kcal_100g'] || 0), fat: (n.fat_100g || 0).toFixed(1), carbs: (n.carbohydrates_100g || 0).toFixed(1), protein: (n.proteins_100g || 0).toFixed(1), sugar: (n.sugars_100g || 0).toFixed(1), salt: (n.salt_100g || 0).toFixed(2), fiber: (n.fiber_100g || 0).toFixed(1) };
    });
  }

  /* ─────────────────────────────────────────
     9. الأدوية
  ───────────────────────────────────────── */
  async function drugSearch(name) {
    var results = [];
    try {
      var fdaUrl = CFG.fdaDrugSearch + '?search=openfda.generic_name:"' + encodeURIComponent(name) + '"&limit=3';
      var fdaRes = await race(fetch(fdaUrl), 8000);
      if (fdaRes.ok) {
        var fdaData = await fdaRes.json();
        if (fdaData.results) fdaData.results.forEach(function (item) {
          var ofd = item.openfda || {};
          results.push({ source: 'openfda', name: (ofd.brand_name && ofd.brand_name[0]) || name, generic: ofd.generic_name ? ofd.generic_name[0] : '', brand: ofd.brand_name ? ofd.brand_name[0] : '', indications: (item.indications_and_usage || [''])[0].substring(0, 400), warnings: (item.warnings || [''])[0].substring(0, 400), dosage: (item.dosage_and_administration || [''])[0].substring(0, 300) });
        });
      }
    } catch (e) {}
    return results;
  }

  /* ─────────────────────────────────────────
     10. المواد المضافة
  ───────────────────────────────────────── */
  var ADDITIVES_DB = {
    'E250': { name: 'نيتريت الصوديوم', risk: 'high', iarc: 1, note: 'مسرطن مؤكد — مرتبط بسرطان القولون' },
    'E249': { name: 'نيتريت البوتاسيوم', risk: 'high', iarc: 1, note: 'مسرطن مؤكد' },
    'E251': { name: 'نيترات الصوديوم', risk: 'medium', iarc: '2A', note: 'مسرطن محتمل' },
    'E621': { name: 'غلوتامات أحادي الصوديوم (MSG)', risk: 'medium', note: 'حساسية لدى بعض الأشخاص' },
    'E211': { name: 'بنزوات الصوديوم', risk: 'medium', note: 'قد يتحول لمادة مسرطنة مع فيتامين C' },
    'E102': { name: 'تارترازين', risk: 'medium', note: 'صبغة اصطناعية — فرط نشاط لدى الأطفال' },
    'E320': { name: 'BHA', risk: 'medium', iarc: '2B', note: 'مسرطن محتمل' },
    'E321': { name: 'BHT', risk: 'medium', note: 'مضاد أكسدة — مثير للجدل' },
    'E951': { name: 'أسبارتام', risk: 'medium', iarc: '2B', note: 'مسرطن محتمل — 2023' },
    'E407': { name: 'الكاراجينان', risk: 'medium', note: 'مثير للجدل صحياً للأمعاء' },
    'E120': { name: 'كارمين', risk: 'medium', note: 'مستخرج من حشرات — راجع علماءك' },
    'E441': { name: 'الجيلاتين', risk: 'medium', note: 'من عظام الحيوانات — راجع علماءك' },
    'E330': { name: 'حمض الستريك', risk: 'low', note: 'آمن عموماً' },
    'E300': { name: 'حمض الأسكوربيك (فيتامين C)', risk: 'safe', note: 'آمن تماماً' }
  };

  function checkAdditives(ingredientsText) {
    var found = [];
    var text = ingredientsText.toUpperCase();
    Object.keys(ADDITIVES_DB).forEach(function (code) {
      if (text.includes(code.toUpperCase())) found.push(Object.assign({ code: code }, ADDITIVES_DB[code]));
    });
    var nameMap = { 'aspartame': 'E951', 'أسبارتام': 'E951', 'sodium nitrite': 'E250', 'نيتريت الصوديوم': 'E250', 'msg': 'E621', 'bha': 'E320', 'bht': 'E321', 'sodium benzoate': 'E211', 'tartrazine': 'E102', 'carrageenan': 'E407', 'saccharin': 'E954', 'sucralose': 'E955', 'carmine': 'E120', 'gelatin': 'E441' };
    var lowerText = ingredientsText.toLowerCase();
    Object.keys(nameMap).forEach(function (keyword) {
      if (lowerText.includes(keyword)) { var code = nameMap[keyword]; if (ADDITIVES_DB[code] && !found.some(function (f) { return f.code === code; })) found.push(Object.assign({ code: code }, ADDITIVES_DB[code])); }
    });
    return found;
  }

  /* ─────────────────────────────────────────
     11. تحليل صورة منتج
  ───────────────────────────────────────── */
  async function analyzeProductImage(imageDataUrl) {
    var result = { barcode: null, productName: null, ingredients: null, food: null, additives: [] };
    if ('BarcodeDetector' in window) {
      try {
        var detector = new BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e','qr_code'] });
        var img = new Image(); img.src = imageDataUrl;
        await new Promise(function (res) { img.onload = res; });
        var codes = await detector.detect(img);
        if (codes && codes.length) { result.barcode = codes[0].rawValue; result.food = await foodBarcode(result.barcode).catch(function () { return null; }); }
      } catch (e) {}
    }
    if (!result.productName) {
      try {
        var vRes = await _universalVision(imageDataUrl, 'انظر لهذه الصورة. إذا وجدت منتجاً أو طعاماً أو دواءً، اذكر اسمه التجاري فقط في سطر واحد.');
        if (vRes) result.productName = vRes.text.trim().split('\n')[0];
      } catch (e) {}
    }
    try {
      var ocrText = await ocrImage(imageDataUrl, 'ara+eng');
      if (ocrText && ocrText.length > 20) { result.ingredients = ocrText; result.additives = checkAdditives(ocrText); }
    } catch (e) {}
    if (!result.food && result.productName) {
      var foods = await foodSearch(result.productName, 3).catch(function () { return []; });
      if (foods.length) result.food = foods[0];
    }
    return result;
  }

  /* ─────────────────────────────────────────
     12. تحليل الروشتة
  ───────────────────────────────────────── */
  async function analyzePrescription(imageDataUrl, textFallback) {
    var extractedText = textFallback || '';
    if (imageDataUrl && !textFallback) {
      extractedText = await ocrImage(imageDataUrl, 'ara+eng').catch(function () { return ''; });
      if (extractedText.length < 30) {
        var vRes = await _universalVision(imageDataUrl, 'هذه صورة روشتة طبية. اقرأ جميع أسماء الأدوية والجرعات والتعليمات بدقة. أعد النص كما هو.').catch(function () { return null; });
        if (vRes) extractedText = vRes.text;
      }
    }
    if (!extractedText) return null;
    var sys = 'أنت صيدلاني ومساعد طبي محترف. تحلل وصفات طبية وتشرحها للمريض بوضوح.';
    var usr = 'هذا نص الروشتة الطبية:\n\n' + extractedText + '\n\nقدم لكل دواء: الاسم، النوع، الجرعة، طريقة الأخذ. أجب بالعربية فقط.';
    return await smartChat(sys, usr);
  }

  /* ─────────────────────────────────────────
     13. تحليل التقرير الطبي
  ───────────────────────────────────────── */
  async function analyzeMedicalReport(imageDataUrl, textFallback) {
    var extractedText = textFallback || '';
    if (imageDataUrl && !textFallback) {
      extractedText = await ocrImage(imageDataUrl, 'ara+eng').catch(function () { return ''; });
      if (extractedText.length < 30) {
        var vRes = await _universalVision(imageDataUrl, 'هذه صورة تقرير طبي أو تحاليل. اقرأ جميع الأرقام والقيم والنتائج بدقة.').catch(function () { return null; });
        if (vRes) extractedText = vRes.text;
      }
    }
    if (!extractedText) return null;
    var sys = 'أنت طبيب ومساعد صحي. تشرح نتائج التحاليل الطبية للمريض بلغة بسيطة.';
    var usr = 'هذا نص التقرير:\n\n' + extractedText + '\n\n1. اشرح كل قيمة\n2. هل هي ضمن الطبيعي؟\n3. ما يجب الانتباه إليه؟\n\nأجب بالعربية. اختم بـ: "هذا شرح توعوي فقط، استشر طبيبك."';
    return await smartChat(sys, usr);
  }

  /* ─────────────────────────────────────────
     14. الواجهة العامة
  ───────────────────────────────────────── */
  var TayyibatAI = {
    chat: function (prompt, systemContext) {
      var sys = systemContext || (typeof buildUserContext === 'function' ? buildUserContext() : 'أنت مساعد صحي تابع لنظام طيبات. تتحدث بالعربية وتقدم نصائح صحية مفيدة.');
      return smartChat(sys, prompt);
    },
    vision: function (imageDataUrl, question) {
      return _universalVision(imageDataUrl, question)
        .then(function (r) { return r || { text: 'تعذر تحليل الصورة. الرجاء إدخال البيانات يدوياً.', source: 'fallback' }; })
        .catch(function () { return ocrImage(imageDataUrl).then(function (t) { return { text: t, source: 'ocr-fallback' }; }); });
    },
    ocr: function (imageDataUrl, lang) { return ocrImage(imageDataUrl, lang); },
    foodLookup: function (query) { return foodSearch(query); },
    barcode: function (barcode) { return foodBarcode(barcode); },
    drugLookup: function (name) { return drugSearch(name); },
    carcinogenCheck: function (ingredientsText) { return checkAdditives(ingredientsText); },
    analyzeProduct: function (imageDataUrl) { return analyzeProductImage(imageDataUrl); },
    analyzePrescription: function (imageDataUrl, text) { return analyzePrescription(imageDataUrl, text); },
    analyzeMedicalReport: function (imageDataUrl, text) { return analyzeMedicalReport(imageDataUrl, text); },
    localFallback: function (question) { return { text: _localFallback(question), source: 'local' }; },
    additivesDB: ADDITIVES_DB,
    version: '3.0.0'
  };

  global.TayyibatAI = TayyibatAI;

  // توافق مع الكود القديم
  global._callClaudeAPI = function (prompt, imageDataUrl) {
    if (imageDataUrl) return _universalVision(imageDataUrl, prompt).then(function(r){ return r ? r.text : ''; });
    return smartChat(typeof buildUserContext === 'function' ? buildUserContext() : 'أنت مساعد صحي.', prompt).then(function (r) { return r.text; });
  };
  global._callClaudeAPIWithImage = function (prompt, imageDataUrl) {
    return _universalVision(imageDataUrl, prompt).then(function(r){ return r ? r.text : ''; });
  };
  global._smartVisionAnalysis = function (imageDataUrl, prompt) {
    return _universalVision(imageDataUrl, prompt).then(function (r) { return r || { text: 'تعذر التحليل.', source: 'fallback' }; });
  };
  global._universalAICall = function(messages, opts) {
    opts = opts || {};
    if (opts.imageDataUrl) {
      return _universalVision(opts.imageDataUrl, opts.promptText || '').then(function(r){ return r || null; });
    }
    return _universalChat(messages);
  };

  console.log('[TayyibatAI] ✅ v' + TayyibatAI.version + ' — LLM7 + OVH Kepler + Pollinations + OpenRouter');

})(window);
