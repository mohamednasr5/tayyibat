/** 
 * ══════════════════════════════════════════════════════════════════
 *  🌿 طيبات — محرك الذكاء الاصطناعي المجاني
 *  ai-engine.js  |  v4.1  — CF-WORKER PRIORITY ENGINE
 *
 *  ✅ الأولوية الأولى دائماً: Cloudflare Worker (taybat-ai.studegy8.workers.dev)
 *  ✅ إذا فشل CF-Worker فقط: LLM7 + Pollinations + Kepler + OpenRouter بالتوازي
 *  ✅ Timeout صارم 8 ثوانٍ للـ CF-Worker
 *  ✅ رد محلي ذكي عند فشل الكل (لا "رد غبي")
 * ══════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  /* ══════════════════════════════════
     CONFIG
  ══════════════════════════════════ */
  var CFG = {
    // ① Cloudflare Worker — vision + chat
    cfWorker: 'https://taybat-ai.studegy8.workers.dev',

    // ② OVH Kepler — مجاني، لكن بطيء بعد أول طلب
    keplerEndpoint: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
    keplerModel:    'Llama-3.3-70B-Instruct',

    // ③ LLM7.io — 30 RPM
    llm7Endpoint: 'https://api.llm7.io/v1/chat/completions',
    llm7ChatModel:   'gpt-4o-mini',
    llm7VisionModel: 'gpt-4o',

    // ④ Pollinations — مجاني بدون مفتاح
    pollinationsText: 'https://text.pollinations.ai/openai',
    pollinationsChat:   'openai',
    pollinationsVision: 'openai-large',

    // ⑤ OpenRouter — نماذج مجانية
    orEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    orFreeModel: 'meta-llama/llama-3.1-8b-instruct:free',

    // ⑥ Fallback Kepler models (تجرب واحد واحد بسرعة)
    keplerFallbacks: ['DeepSeek-R1', 'Qwen3-32B', 'Mistral-Nemo-Instruct-2407'],

    // ⑦ LLM7 fallback models
    llm7Fallbacks: ['gpt-4.1', 'claude-3-5-sonnet-20241022', 'gemini-1.5-pro', 'deepseek-chat'],

    // Open Food Facts
    offSearch:  'https://world.openfoodfacts.org/cgi/search.pl',
    offBarcode: 'https://world.openfoodfacts.org/api/v2/product/',

    // الأدوية
    fdaDrugSearch: 'https://api.fda.gov/drug/label.json',

    // Tesseract OCR
    tesseractCDN: 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js',

    // ⏱ Timeouts
    FAST_TIMEOUT:   8000,   // أقصى وقت لكل طلب AI
    RACE_TIMEOUT:   9000,   // أقصى وقت لنتيجة race
    API_TIMEOUT:    7000,   // APIs خارجية (Food, Drug)
  };

  /* ══════════════════════════════════
     HELPERS
  ══════════════════════════════════ */
  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function(_, rej) {
        setTimeout(function() { rej(new Error('TIMEOUT_' + ms)); }, ms);
      })
    ]);
  }

  function extractText(data) {
    if (!data) return null;
    if (data.choices && data.choices[0]) {
      var msg = data.choices[0].message || data.choices[0];
      return (msg.content || msg.text || null);
    }
    if (typeof data === 'string' && data.length > 3) return data;
    if (data.response) return data.response;
    return null;
  }

  function isGoodText(t) {
    return typeof t === 'string' && t.trim().length > 5;
  }

  // POST JSON مع timeout سريع
  async function postJSON(url, body, headers, timeoutMs) {
    timeoutMs = timeoutMs || CFG.FAST_TIMEOUT;
    headers = Object.assign({ 'Content-Type': 'application/json' }, headers || {});
    var resp = await withTimeout(
      fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body) }),
      timeoutMs
    );
    if (!resp.ok) throw new Error('HTTP_' + resp.status);
    return resp.json();
  }

  /* ══════════════════════════════════
     SINGLE-CALL PROVIDERS  (Chat)
     كل واحد يرجع Promise<{text,source}|null>
  ══════════════════════════════════ */

  // ① Cloudflare Worker chat
function _cfChat(messages) {

  console.log('USING CLOUDFLARE AI');

  var prompt = messages
    .map(function(m) {
      return m.role + ': ' + m.content;
    })
    .join('\n');

  return fetch(CFG.cfWorker, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: prompt
    })
  })
  .then(function(resp) {

    if (!resp.ok) {
      throw new Error('HTTP_' + resp.status);
    }

    return resp.json();

  })
 .then(function(data) {

  console.log('CF RESPONSE:', data);

  var responseText = '';

  if (
    data &&
    data.result &&
    data.result.response
  ) {

    console.log('CF SUCCESS');

    if (typeof data.result.response === 'string') {

      responseText = data.result.response;

    } else if (Array.isArray(data.result.response)) {

      responseText = data.result.response
        .map(function(item) {
          return item.text || item.content || '';
        })
        .join(' ');

    } else {

      responseText = JSON.stringify(data.result.response);

    }

    return {
      text: String(responseText).trim(),
      source: data.provider || 'CF-Worker'
    };
  }

  var t = extractText(data);

  if (isGoodText(t)) {
    return {
      text: String(t).trim(),
      source: data.provider || 'CF-Worker'
    };
  }

  console.log('CF EMPTY RESPONSE');

  return null;

})
.catch(function(err) {

  console.error('Cloudflare Error:', err);

  return null;

});
}
  // ② OVH Kepler — model واحد بدون انتظار
  function _keplerChat(messages, modelOverride) {
    var model = modelOverride || CFG.keplerModel;
    return postJSON(CFG.keplerEndpoint, { model: model, messages: messages, max_tokens: 1200, temperature: 0.7 })
      .then(function(d) {
        var t = extractText(d);
        return isGoodText(t) ? { text: t.trim(), source: 'Kepler/' + model } : null;
      }).catch(function() { return null; });
  }

  // ③ LLM7 — model واحد بدون انتظار
  function _llm7Chat(messages, modelOverride) {
    var model = modelOverride || CFG.llm7ChatModel;
    return postJSON(CFG.llm7Endpoint, { model: model, messages: messages, max_tokens: 1200, temperature: 0.7 })
      .then(function(d) {
        var t = extractText(d);
        return isGoodText(t) ? { text: t.trim(), source: 'LLM7/' + model } : null;
      }).catch(function() { return null; });
  }

  // ④ Pollinations
  function _pollinationsChat(messages, modelOverride) {
    var model = modelOverride || CFG.pollinationsChat;
    return postJSON(CFG.pollinationsText, { model: model, messages: messages, max_tokens: 1200, temperature: 0.7 })
      .then(function(d) {
        var t = extractText(d);
        return isGoodText(t) ? { text: t.trim(), source: 'Pollinations/' + model } : null;
      }).catch(function() { return null; });
  }

  // ⑤ OpenRouter Free
  function _orChat(messages, modelOverride) {
    var model = modelOverride || CFG.orFreeModel;
    var headers = {
      'Content-Type':  'application/json',
      'HTTP-Referer':  'https://tayyibat.online',
      'X-Title':       'Tayyibat'
    };
    var key = window.__OR_KEY_FB || window.__OR_KEY || null;
    if (key) headers['Authorization'] = 'Bearer ' + key;
    return postJSON(CFG.orEndpoint, { model: model, messages: messages, max_tokens: 1200, temperature: 0.7 }, headers)
      .then(function(d) {
        var t = extractText(d);
        return isGoodText(t) ? { text: t.trim(), source: 'OpenRouter/' + model.split('/').pop().replace(':free','') } : null;
      }).catch(function() { return null; });
  }

  /* ══════════════════════════════════
     RACE ENGINE — Chat
     كل المزودين بالتوازي — أول رد يفوز
  ══════════════════════════════════ */
  function _raceFirst(promises) {
    // Promise.any — أول نتيجة غير null تفوز
    return new Promise(function(resolve) {
      var settled = 0;
      var total = promises.length;
      if (!total) { resolve(null); return; }
      promises.forEach(function(p) {
        Promise.resolve(p).then(function(result) {
          settled++;
          if (result) { resolve(result); }
          else if (settled >= total) { resolve(null); }
        }).catch(function() {
          settled++;
          if (settled >= total) { resolve(null); }
        });
      });
    });
  }

  async function _universalChat(messages) {
    // ═══ الأولوية ١: Cloudflare Worker وحده أولاً ═══
    var cfResult = await withTimeout(_cfChat(messages), CFG.FAST_TIMEOUT).catch(function() { return null; });
    if (cfResult) return cfResult;

    // ═══ الأولوية ٢: باقي المزودين بالتوازي ═══
    var round1 = await withTimeout(
      _raceFirst([
        _llm7Chat(messages),
        _pollinationsChat(messages),
        _orChat(messages),
        _keplerChat(messages)
      ]),
      CFG.RACE_TIMEOUT
    ).catch(function() { return null; });

    if (round1) return round1;

    // ═══ الأولوية ٣: fallback بنماذج بديلة ═══
    var round2 = await withTimeout(
      _raceFirst([
        _llm7Chat(messages, 'gpt-4.1'),
        _llm7Chat(messages, 'deepseek-chat'),
        _pollinationsChat(messages, 'mistral'),
        _keplerChat(messages, 'Qwen3-32B')
      ]),
      CFG.RACE_TIMEOUT
    ).catch(function() { return null; });

    return round2 || null;
  }

  /* ══════════════════════════════════
     SINGLE-CALL PROVIDERS  (Vision)
  ══════════════════════════════════ */

  // ① Cloudflare Worker Vision
  function _cfVision(imgUrl, prompt) {
    return postJSON(CFG.cfWorker, {
      messages: [{ role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imgUrl } }
      ]}],
      max_tokens: 1200, temperature: 0.3
    }).then(function(d) {
      var t = extractText(d);
      return isGoodText(t) ? { text: t.trim(), source: 'CF-Worker-Vision' } : null;
    }).catch(function() { return null; });
  }

  // ② LLM7 Vision
  function _llm7Vision(imgUrl, prompt, modelOverride) {
    var model = modelOverride || CFG.llm7VisionModel;
    return postJSON(CFG.llm7Endpoint, {
      model: model,
      messages: [{ role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imgUrl } }
      ]}],
      max_tokens: 1200, temperature: 0.3
    }).then(function(d) {
      var t = extractText(d);
      return isGoodText(t) ? { text: t.trim(), source: 'LLM7-Vision/' + model } : null;
    }).catch(function() { return null; });
  }

  // ③ Pollinations Vision
  function _pollinationsVision(imgUrl, prompt) {
    return postJSON(CFG.pollinationsText, {
      model: CFG.pollinationsVision,
      messages: [{ role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imgUrl } }
      ]}],
      max_tokens: 1200, temperature: 0.3
    }).then(function(d) {
      var t = extractText(d);
      return isGoodText(t) ? { text: t.trim(), source: 'Pollinations-Vision' } : null;
    }).catch(function() { return null; });
  }

  /* تقليص الصورة لتسريع الإرسال */
  function _resizeImage(imgDataUrl, maxSize) {
    maxSize = maxSize || 640;
    return new Promise(function(resolve) {
      try {
        var img = new Image();
        img.onload = function() {
          if (img.width <= maxSize && img.height <= maxSize) { resolve(imgDataUrl); return; }
          var ratio = Math.min(maxSize / img.width, maxSize / img.height);
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

  /* ══════════════════════════════════
     RACE ENGINE — Vision
  ══════════════════════════════════ */
  async function _universalVision(imgDataUrl, prompt) {
    var smallImg = imgDataUrl;
    try { smallImg = await _resizeImage(imgDataUrl, 640); } catch(e) {}

    // ═══ الأولوية ١: Cloudflare Worker وحده أولاً ═══
    var cfResult = await withTimeout(_cfVision(smallImg, prompt), CFG.FAST_TIMEOUT).catch(function() { return null; });
    if (cfResult) return cfResult;

    // ═══ الأولوية ٢: باقي vision providers بالتوازي ═══
    var result = await withTimeout(
      _raceFirst([
        _llm7Vision(smallImg, prompt),
        _pollinationsVision(smallImg, prompt)
      ]),
      CFG.RACE_TIMEOUT
    ).catch(function() { return null; });

    if (result) return result;

    // ═══ الأولوية ٣: LLM7 بنماذج بديلة ═══
    var r2 = await withTimeout(
      _raceFirst([
        _llm7Vision(smallImg, prompt, 'gpt-4.1'),
        _llm7Vision(smallImg, prompt, 'claude-3-5-sonnet-20241022')
      ]),
      CFG.RACE_TIMEOUT
    ).catch(function() { return null; });

    return r2 || null;
  }

  /* ══════════════════════════════════
     smartChat — الدالة العامة للمحادثة
  ══════════════════════════════════ */
  async function smartChat(sysPrompt, userMsg) {
    var messages = [
      { role: 'system', content: sysPrompt || 'أنت مساعد صحي مفيد باللغة العربية.' },
      { role: 'user',   content: userMsg }
    ];
    var result = await _universalChat(messages);
    if (result) return result;
    return { text: _smartLocalFallback(userMsg), source: 'local' };
  }

  /* ══════════════════════════════════
     رد محلي ذكي (لا ردود "عبيطة")
  ══════════════════════════════════ */
  var _LOCAL_TIPS = [
    'تناول الطعام الحقيقي غير المصنّع قدر الإمكان وتجنب المواد الحافظة.',
    'شرب 8 أكواب ماء يومياً يحسن الهضم ويقلل الشهية الكاذبة.',
    'الصيام المتقطع 16:8 يُحسّن حساسية الأنسولين ويساعد على حرق الدهون.',
    'مرق العظام غني بالكولاجين والجلوتامين — مفيد للأمعاء والمفاصل.',
    'النوم قبل منتصف الليل يُنظّم هرموني الجريلين واللبتين (الجوع والشبع).',
    'زيت الزيتون البكر والسمن البلدي من أجود الدهون الصحية للطهي.',
    'تناول البروتين في وجبة الإفطار يقلل الشهية طوال اليوم.'
  ];
  var _localIdx = 0;

  function _smartLocalFallback(question) {
    var q = (question || '').toLowerCase();
    if (q.includes('صيام') || q.includes('fasting'))
      return '🕐 الصيام المتقطع (16:8): امتنع عن الأكل 16 ساعة وكل في نافذة 8 ساعات. ابدأ بـ 12 ساعة وزد تدريجياً. الشاي والقهوة بدون سكر مسموح أثناء الصيام.';
    if (q.includes('سكري') || q.includes('سكر') || q.includes('انسولين'))
      return '🩸 لمرضى السكري: قلّل النشويات البيضاء والسكريات، وركّز على البروتين والخضروات والدهون الصحية. المشي 15 دقيقة بعد الوجبات يُخفض السكر بفاعلية.';
    if (q.includes('وزن') || q.includes('رجيم') || q.includes('تخسيس') || q.includes('سمنة'))
      return '⚖️ لإنقاص الوزن بصحة: تناول الطعام الحقيقي، تجنب السكر والمصنّع، مارس الصيام المتقطع، وانم مبكراً. لا حاجة لحسابات سعرات معقدة — ركّز على نوعية الطعام.';
    if (q.includes('ضغط') || q.includes('قلب'))
      return '❤️ لصحة القلب والضغط: قلّل الملح والأطعمة المصنّعة، تناول المغنيسيوم (خضروات ورقية، مكسرات)، ومارس المشي يومياً.';
    if (q.includes('كوليسترول') || q.includes('دهون'))
      return '🫀 الكوليسترول الضار ترتفع مستوياته بسبب السكر والنشويات أكثر من الدهون الطبيعية. ركّز على تقليل السكر وزيادة الأوميغا 3 (سمك، بذر كتان).';
    if (q.includes('دواء') || q.includes('medication') || q.includes('علاج'))
      return '💊 للحصول على معلومات دقيقة عن الدواء، تأكد من الاتصال بالإنترنت. دائماً استشر طبيبك أو صيدلانيك قبل تغيير جرعة أو إيقاف دواء.';
    if (q.includes('تقرير') || q.includes('تحاليل') || q.includes('فحص'))
      return '🔬 لتفسير نتائج التحاليل تحتاج اتصال بالإنترنت لتحليل دقيق. القيم الطبيعية تختلف بحسب المختبر والعمر والجنس. استشر طبيبك للتفسير الكامل.';
    if (q.includes('باركود') || q.includes('منتج') || q.includes('مكونات'))
      return '🏷️ لتحليل المنتج والمكونات تأكد من الاتصال بالإنترنت. يمكنك قراءة مكونات المنتج على العبوة وابحث عن: E250 (نيتريت)، E621 (MSG)، E951 (أسبارتام).';
    var tip = _LOCAL_TIPS[_localIdx % _LOCAL_TIPS.length];
    _localIdx++;
    return '💡 ' + tip + '\n\n⚠️ تعذّر الوصول للذكاء الاصطناعي الآن — تأكد من الاتصال بالإنترنت للحصول على تحليل مخصص.';
  }

  /* ══════════════════════════════════
     OCR — Tesseract.js
  ══════════════════════════════════ */
  var _tesseractLoaded = false;

  function _loadTesseract() {
    return new Promise(function(resolve, reject) {
      if (_tesseractLoaded && window.Tesseract) { resolve(); return; }
      var s = document.createElement('script');
      s.src = CFG.tesseractCDN;
      s.onload = function() { _tesseractLoaded = true; resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function ocrImage(imageDataUrl, lang) {
    lang = lang || 'ara+eng';
    try {
      await _loadTesseract();
      var result = await window.Tesseract.recognize(imageDataUrl, lang, {
        logger: function(m) {
          if (m.status === 'recognizing text' && global.onOCRProgress)
            global.onOCRProgress(Math.round(m.progress * 100));
        }
      });
      return (result.data && result.data.text) ? result.data.text.trim() : '';
    } catch(e) {
      // fallback: اطلب من AI استخراج النص
      var r = await _universalVision(imageDataUrl, 'استخرج كل النص الموجود في هذه الصورة بدقة كما هو دون تعديل.');
      return r ? r.text : '';
    }
  }

  /* ══════════════════════════════════
     Open Food Facts
  ══════════════════════════════════ */
  async function foodSearch(query, maxResults) {
    maxResults = maxResults || 5;
    var url = CFG.offSearch + '?' + new URLSearchParams({
      search_terms: query, search_simple: 1, action: 'process',
      json: 1, page_size: maxResults,
      fields: 'product_name,brands,ingredients_text,nutriments,nutriscore_grade,ecoscore_grade,additives_tags,allergens,image_url,code'
    });
    var res = await withTimeout(fetch(url), CFG.API_TIMEOUT);
    if (!res.ok) return [];
    var data = await res.json();
    return _formatOFF(data.products || []);
  }

  async function foodBarcode(barcode) {
    var res = await withTimeout(fetch(CFG.offBarcode + encodeURIComponent(barcode) + '.json'), CFG.API_TIMEOUT);
    if (!res.ok) return null;
    var data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    return _formatOFF([data.product])[0] || null;
  }

  function _formatOFF(products) {
    return products.filter(Boolean).map(function(p) {
      var n = p.nutriments || {};
      return {
        name: p.product_name || 'غير محدد',
        brand: p.brands || '',
        code: p.code || '',
        ingredients: p.ingredients_text || '',
        image: p.image_url || '',
        nutriscore: (p.nutriscore_grade || '').toUpperCase(),
        ecoscore:   (p.ecoscore_grade   || '').toUpperCase(),
        additives:  p.additives_tags || [],
        allergens:  p.allergens || '',
        calories:   Math.round(n['energy-kcal_100g'] || 0),
        fat:        (n.fat_100g              || 0).toFixed(1),
        carbs:      (n.carbohydrates_100g    || 0).toFixed(1),
        protein:    (n.proteins_100g         || 0).toFixed(1),
        sugar:      (n.sugars_100g           || 0).toFixed(1),
        salt:       (n.salt_100g             || 0).toFixed(2),
        fiber:      (n.fiber_100g            || 0).toFixed(1)
      };
    });
  }

  /* ══════════════════════════════════
     Drug Search — OpenFDA
  ══════════════════════════════════ */
  async function drugSearch(name) {
    var results = [];
    try {
      var fdaUrl = CFG.fdaDrugSearch + '?search=openfda.generic_name:"' + encodeURIComponent(name) + '"&limit=3';
      var fdaRes = await withTimeout(fetch(fdaUrl), CFG.API_TIMEOUT);
      if (fdaRes.ok) {
        var fdaData = await fdaRes.json();
        if (fdaData.results) fdaData.results.forEach(function(item) {
          var ofd = item.openfda || {};
          results.push({
            source: 'openfda',
            name:        (ofd.brand_name   && ofd.brand_name[0])   || name,
            generic:     (ofd.generic_name && ofd.generic_name[0]) || '',
            brand:       (ofd.brand_name   && ofd.brand_name[0])   || '',
            indications: (item.indications_and_usage || [''])[0].substring(0, 400),
            warnings:    (item.warnings               || [''])[0].substring(0, 400),
            dosage:      (item.dosage_and_administration || [''])[0].substring(0, 300)
          });
        });
      }
    } catch(e) {}
    return results;
  }

  /* ══════════════════════════════════
     المواد المضافة
  ══════════════════════════════════ */
  var ADDITIVES_DB = {
    'E250': { name: 'نيتريت الصوديوم',           risk: 'high',   iarc: 1,    note: 'مسرطن مؤكد — مرتبط بسرطان القولون' },
    'E249': { name: 'نيتريت البوتاسيوم',          risk: 'high',   iarc: 1,    note: 'مسرطن مؤكد' },
    'E251': { name: 'نيترات الصوديوم',            risk: 'medium', iarc: '2A', note: 'مسرطن محتمل' },
    'E621': { name: 'غلوتامات أحادي الصوديوم (MSG)', risk: 'medium', note: 'حساسية لدى بعض الأشخاص' },
    'E211': { name: 'بنزوات الصوديوم',            risk: 'medium', note: 'قد يتحول لمادة مسرطنة مع فيتامين C' },
    'E102': { name: 'تارترازين',                  risk: 'medium', note: 'صبغة اصطناعية — فرط نشاط لدى الأطفال' },
    'E320': { name: 'BHA',                        risk: 'medium', iarc: '2B', note: 'مسرطن محتمل' },
    'E321': { name: 'BHT',                        risk: 'medium', note: 'مضاد أكسدة — مثير للجدل' },
    'E951': { name: 'أسبارتام',                   risk: 'medium', iarc: '2B', note: 'مسرطن محتمل — 2023' },
    'E407': { name: 'الكاراجينان',                risk: 'medium', note: 'مثير للجدل صحياً للأمعاء' },
    'E120': { name: 'كارمين',                     risk: 'medium', note: 'مستخرج من حشرات — راجع علماءك' },
    'E441': { name: 'الجيلاتين',                  risk: 'medium', note: 'من عظام الحيوانات — راجع علماءك' },
    'E330': { name: 'حمض الستريك',               risk: 'low',    note: 'آمن عموماً' },
    'E300': { name: 'حمض الأسكوربيك (فيتامين C)', risk: 'safe',   note: 'آمن تماماً' }
  };

  function checkAdditives(ingredientsText) {
    var found = [];
    var text = ingredientsText.toUpperCase();
    Object.keys(ADDITIVES_DB).forEach(function(code) {
      if (text.includes(code.toUpperCase())) found.push(Object.assign({ code: code }, ADDITIVES_DB[code]));
    });
    var nameMap = {
      'aspartame': 'E951', 'أسبارتام': 'E951',
      'sodium nitrite': 'E250', 'نيتريت الصوديوم': 'E250',
      'msg': 'E621', 'bha': 'E320', 'bht': 'E321',
      'sodium benzoate': 'E211', 'tartrazine': 'E102',
      'carrageenan': 'E407', 'carmine': 'E120', 'gelatin': 'E441'
    };
    var lower = ingredientsText.toLowerCase();
    Object.keys(nameMap).forEach(function(kw) {
      if (lower.includes(kw)) {
        var code = nameMap[kw];
        if (ADDITIVES_DB[code] && !found.some(function(f) { return f.code === code; }))
          found.push(Object.assign({ code: code }, ADDITIVES_DB[code]));
      }
    });
    return found;
  }

  /* ══════════════════════════════════
     تحليل صورة منتج
  ══════════════════════════════════ */
  async function analyzeProductImage(imageDataUrl) {
    var result = { barcode: null, productName: null, ingredients: null, food: null, additives: [] };

    // ① Barcode detection (instantaneous إذا متوفر)
    if ('BarcodeDetector' in window) {
      try {
        var detector = new BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e','qr_code'] });
        var img = new Image(); img.src = imageDataUrl;
        await new Promise(function(res) { img.onload = res; img.onerror = res; });
        var codes = await detector.detect(img);
        if (codes && codes.length) {
          result.barcode = codes[0].rawValue;
          result.food = await foodBarcode(result.barcode).catch(function() { return null; });
        }
      } catch(e) {}
    }

    // ② Vision + OCR بالتوازي (لا تنتظر واحدة الثانية)
    var [vRes, ocrText] = await Promise.allSettled([
      _universalVision(imageDataUrl, 'انظر لهذه الصورة. إذا وجدت منتجاً أو طعاماً أو دواءً، اذكر اسمه التجاري فقط في سطر واحد.'),
      ocrImage(imageDataUrl, 'ara+eng')
    ]);

    if (vRes.status === 'fulfilled' && vRes.value)
      result.productName = vRes.value.text.trim().split('\n')[0];

    if (ocrText.status === 'fulfilled' && ocrText.value && ocrText.value.length > 20) {
      result.ingredients = ocrText.value;
      result.additives   = checkAdditives(ocrText.value);
    }

    // ③ Food lookup من الاسم إذا لم يوجد barcode
    if (!result.food && result.productName) {
      var foods = await foodSearch(result.productName, 3).catch(function() { return []; });
      if (foods.length) result.food = foods[0];
    }

    return result;
  }

  /* ══════════════════════════════════
     تحليل الروشتة
  ══════════════════════════════════ */
  async function analyzePrescription(imageDataUrl, textFallback) {
    var extractedText = textFallback || '';

    if (imageDataUrl && !textFallback) {
      // OCR + Vision بالتوازي
      var [ocrR, vR] = await Promise.allSettled([
        ocrImage(imageDataUrl, 'ara+eng'),
        _universalVision(imageDataUrl, 'هذه صورة روشتة طبية. اقرأ جميع أسماء الأدوية والجرعات والتعليمات بدقة. أعد النص كما هو.')
      ]);
      var ocrTxt = (ocrR.status === 'fulfilled') ? ocrR.value : '';
      var vTxt   = (vR.status   === 'fulfilled' && vR.value) ? vR.value.text : '';
      extractedText = ocrTxt.length >= 30 ? ocrTxt : (vTxt || ocrTxt);
    }

    if (!extractedText) return null;
    var sys = 'أنت صيدلاني ومساعد طبي محترف. تحلل وصفات طبية وتشرحها للمريض بوضوح.';
    var usr = 'هذا نص الروشتة الطبية:\n\n' + extractedText + '\n\nقدم لكل دواء: الاسم، النوع، الجرعة، طريقة الأخذ. أجب بالعربية فقط.';
    return await smartChat(sys, usr);
  }

  /* ══════════════════════════════════
     تحليل التقرير الطبي
  ══════════════════════════════════ */
  async function analyzeMedicalReport(imageDataUrl, textFallback) {
    var extractedText = textFallback || '';

    if (imageDataUrl && !textFallback) {
      var [ocrR, vR] = await Promise.allSettled([
        ocrImage(imageDataUrl, 'ara+eng'),
        _universalVision(imageDataUrl, 'هذه صورة تقرير طبي أو تحاليل. اقرأ جميع الأرقام والقيم والنتائج بدقة.')
      ]);
      var ocrTxt = (ocrR.status === 'fulfilled') ? ocrR.value : '';
      var vTxt   = (vR.status   === 'fulfilled' && vR.value) ? vR.value.text : '';
      extractedText = ocrTxt.length >= 30 ? ocrTxt : (vTxt || ocrTxt);
    }

    if (!extractedText) return null;
    var sys = 'أنت طبيب ومساعد صحي. تشرح نتائج التحاليل الطبية للمريض بلغة بسيطة.';
    var usr = 'هذا نص التقرير:\n\n' + extractedText + '\n\n1. اشرح كل قيمة\n2. هل هي ضمن الطبيعي؟\n3. ما يجب الانتباه إليه؟\n\nأجب بالعربية. اختم بـ: "هذا شرح توعوي فقط، استشر طبيبك."';
    return await smartChat(sys, usr);
  }

  /* ══════════════════════════════════
     الواجهة العامة
  ══════════════════════════════════ */
  var TayyibatAI = {
    version: '4.1.0',

    chat: function(prompt, systemContext) {
      var sys = systemContext || (typeof buildUserContext === 'function' ? buildUserContext() : 'أنت مساعد صحي تابع لنظام طيبات. تتحدث بالعربية وتقدم نصائح صحية مفيدة.');
      return smartChat(sys, prompt);
    },

    vision: function(imageDataUrl, question) {
      return _universalVision(imageDataUrl, question)
        .then(function(r) {
          return r || { text: 'تعذر تحليل الصورة. الرجاء إدخال البيانات يدوياً.', source: 'fallback' };
        })
        .catch(function() {
          return ocrImage(imageDataUrl)
            .then(function(t) { return { text: t || 'تعذر استخراج النص.', source: 'ocr-fallback' }; });
        });
    },

    ocr:              function(imageDataUrl, lang)  { return ocrImage(imageDataUrl, lang); },
    foodLookup:       function(query)               { return foodSearch(query); },
    barcode:          function(barcode)             { return foodBarcode(barcode); },
    drugLookup:       function(name)                { return drugSearch(name); },
    carcinogenCheck:  function(ingredientsText)     { return checkAdditives(ingredientsText); },
    analyzeProduct:   function(imageDataUrl)        { return analyzeProductImage(imageDataUrl); },
    analyzePrescription:  function(img, txt)        { return analyzePrescription(img, txt); },
    analyzeMedicalReport: function(img, txt)        { return analyzeMedicalReport(img, txt); },
    localFallback:    function(question)            { return { text: _smartLocalFallback(question), source: 'local' }; },

    additivesDB: ADDITIVES_DB
  };

  global.TayyibatAI = TayyibatAI;

  /* ── توافق مع الكود القديم ── */
  global._callClaudeAPI = function(prompt, imageDataUrl) {
    if (imageDataUrl)
      return _universalVision(imageDataUrl, prompt).then(function(r) { return r ? r.text : ''; });
    return smartChat(typeof buildUserContext === 'function' ? buildUserContext() : 'أنت مساعد صحي.', prompt)
      .then(function(r) { return r.text; });
  };
  global._callClaudeAPIWithImage = function(prompt, imageDataUrl) {
    return _universalVision(imageDataUrl, prompt).then(function(r) { return r ? r.text : ''; });
  };
  global._smartVisionAnalysis = function(imageDataUrl, prompt) {
    return _universalVision(imageDataUrl, prompt)
      .then(function(r) { return r || { text: 'تعذر التحليل.', source: 'fallback' }; });
  };
  global._universalAICall = function(messages, opts) {
    opts = opts || {};
    if (opts.imageDataUrl)
      return _universalVision(opts.imageDataUrl, opts.promptText || '').then(function(r) { return r || null; });
    return _universalChat(messages);
  };

  console.log('[TayyibatAI] ✅ v' + TayyibatAI.version + ' — CF-WORKER PRIORITY | Fallback: LLM7 + Pollinations + Kepler + OpenRouter');

})(window);
