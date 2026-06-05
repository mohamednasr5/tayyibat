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
     ✅ كل provider يدعم Base64 data URLs من الكاميرا
  ══════════════════════════════════ */

  /* استخراج بيانات Base64 من data URL */
  function _parseDataUrl(dataUrl) {
    // يرجع { mediaType, base64 } أو null إذا لم يكن data URL
    if (!dataUrl || !dataUrl.startsWith('data:')) return null;
    var parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    var header = parts[0]; // "data:image/jpeg;base64"
    var base64  = parts[1];
    var mediaType = (header.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
    return { mediaType: mediaType, base64: base64 };
  }

  /* بناء content block للصورة — يدعم data URL وURL عادي */
  function _buildImageContent(imgUrl, prompt) {
    var parsed = _parseDataUrl(imgUrl);
    if (parsed) {
      // Base64 inline — OpenAI format مع data URL كما هو (مدعوم في gpt-4o)
      return [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imgUrl } }
      ];
    }
    return [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: imgUrl } }
    ];
  }

  /* بناء content block بصيغة Anthropic الأصلية (base64 source) */
  function _buildAnthropicContent(imgUrl, prompt) {
    var parsed = _parseDataUrl(imgUrl);
    if (parsed) {
      return [
        { type: 'image', source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64 } },
        { type: 'text', text: prompt }
      ];
    }
    return [
      { type: 'image', source: { type: 'url', url: imgUrl } },
      { type: 'text', text: prompt }
    ];
  }

  // ① Cloudflare Worker Vision — يرسل الصورة Base64 مع البرومبت عبر CF Worker
  function _cfVision(imgUrl, prompt) {
    var parsed = _parseDataUrl(imgUrl);
    if (!parsed) return Promise.resolve(null);
    // نرسل الصورة كـ base64 مع البرومبت للـ CF Worker
    var fullPrompt = '[IMAGE_BASE64:' + parsed.mediaType + ']\n' + prompt;
    return fetch(CFG.cfWorker, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: fullPrompt,
        image: parsed.base64,
        mediaType: parsed.mediaType
      })
    })
    .then(function(resp) {
      if (!resp.ok) throw new Error('HTTP_' + resp.status);
      return resp.json();
    })
    .then(function(data) {
      // استخراج النص من أي صيغة رد
      var t = null;
      if (data && data.result && data.result.response) {
        t = typeof data.result.response === 'string' ? data.result.response : JSON.stringify(data.result.response);
      } else {
        t = extractText(data);
      }
      return isGoodText(t) ? { text: t.trim(), source: data.provider || 'CF-Worker-Vision' } : null;
    })
    .catch(function() { return null; });
  }

  // ② LLM7 Vision — gpt-4o يدعم Base64 data URLs
  function _llm7Vision(imgUrl, prompt, modelOverride) {
    var model = modelOverride || CFG.llm7VisionModel;
    return postJSON(CFG.llm7Endpoint, {
      model: model,
      messages: [{ role: 'user', content: _buildImageContent(imgUrl, prompt) }],
      max_tokens: 1200, temperature: 0.3
    }).then(function(d) {
      var t = extractText(d);
      return isGoodText(t) ? { text: t.trim(), source: 'LLM7-Vision/' + model } : null;
    }).catch(function() { return null; });
  }

  // ③ Pollinations Vision — يدعم Base64 data URLs مع openai-large
  function _pollinationsVision(imgUrl, prompt) {
    return postJSON(CFG.pollinationsText, {
      model: CFG.pollinationsVision,
      messages: [{ role: 'user', content: _buildImageContent(imgUrl, prompt) }],
      max_tokens: 1200, temperature: 0.3
    }).then(function(d) {
      var t = extractText(d);
      return isGoodText(t) ? { text: t.trim(), source: 'Pollinations-Vision' } : null;
    }).catch(function() { return null; });
  }

  // ④ Anthropic API Vision — يدعم Base64 بشكل أصلي ومضمون (أفضل provider للكاميرا)
  function _anthropicVision(imgUrl, prompt) {
    var content = _buildAnthropicContent(imgUrl, prompt);
    return withTimeout(
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1200,
          messages: [{ role: 'user', content: content }]
        })
      })
      .then(function(r) { if (!r.ok) throw new Error('HTTP_' + r.status); return r.json(); })
      .then(function(d) {
        var t = (d.content && d.content[0] && d.content[0].text) || null;
        return isGoodText(t) ? { text: t.trim(), source: 'Anthropic-Vision' } : null;
      })
      .catch(function() { return null; }),
      CFG.FAST_TIMEOUT
    ).catch(function() { return null; });
  }

  /* تقليص الصورة لتسريع الإرسال */
  function _resizeImage(imgDataUrl, maxSize) {
    maxSize = maxSize || 800;
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
          resolve(c.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = function() { resolve(imgDataUrl); };
        img.src = imgDataUrl;
      } catch(e) { resolve(imgDataUrl); }
    });
  }

  /* ══════════════════════════════════
     RACE ENGINE — Vision
     ✅ محسّن لدعم الكاميرا (Base64)
  ══════════════════════════════════ */
  async function _universalVision(imgDataUrl, prompt) {
    var isBase64 = imgDataUrl && imgDataUrl.startsWith('data:');
    var smallImg = imgDataUrl;
    try { smallImg = await _resizeImage(imgDataUrl, 800); } catch(e) {}

    // ═══ الأولوية ١: Cloudflare Worker Vision (يدعم الصور الآن) ═══
    if (isBase64) {
      var cfVisionResult = await withTimeout(_cfVision(smallImg, prompt), CFG.FAST_TIMEOUT).catch(function() { return null; });
      if (cfVisionResult) return cfVisionResult;
    }

    // ═══ الأولوية ٢: إذا كانت الصورة Base64 → Anthropic مضمون للـ Base64 ═══
    if (isBase64) {
      var anthropicResult = await withTimeout(_anthropicVision(smallImg, prompt), CFG.FAST_TIMEOUT).catch(function() { return null; });
      if (anthropicResult) return anthropicResult;
    }

    // ═══ الأولوية ٣: LLM7 + Pollinations بالتوازي ═══
    var result = await withTimeout(
      _raceFirst([
        _llm7Vision(smallImg, prompt),
        _pollinationsVision(smallImg, prompt),
        isBase64 ? _anthropicVision(smallImg, prompt) : Promise.resolve(null)
      ]),
      CFG.RACE_TIMEOUT
    ).catch(function() { return null; });

    if (result) return result;

    // ═══ الأولوية ٤: نماذج بديلة ═══
    var r2 = await withTimeout(
      _raceFirst([
        _llm7Vision(smallImg, prompt, 'gpt-4.1'),
        _llm7Vision(smallImg, prompt, 'claude-3-5-sonnet-20241022'),
        _pollinationsVision(smallImg, prompt)
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
    // إذا كان imageDataUrl يبدو كـ data URL حقيقي (صورة) → Vision
    if (imageDataUrl && typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image'))
      return _universalVision(imageDataUrl, prompt).then(function(r) { return r ? r.text : ''; });
    // أي قيمة أخرى (sysPrompt نصي مثلاً) → تجاهلها والمتابعة كـ Chat
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

  /* ═══════════════════════════════════════════════════════════════
     نظام التحليل الحي المباشر
  ═══════════════════════════════════════════════════════════════ */
  var liveAnalysisEngine = {
    isRunning: false,
    currentStream: null,
    currentMode: null,
    frameCount: 0,
    skipFrames: 15,
    isAnalyzing: false,

    start: function(videoId, canvasId, mode) {
      var self = this;
      if (this.isRunning) return;
      
      var videoEl = document.getElementById(videoId);
      var canvasEl = document.getElementById(canvasId);
      
      if (!videoEl || !canvasEl) {
        console.error('عناصر الفيديو أو Canvas غير موجودة');
        return;
      }

      this.isRunning = true;
      this.currentMode = mode;
      this.frameCount = 0;

      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false 
      })
      .then(function(stream) {
        self.currentStream = stream;
        videoEl.srcObject = stream;
        videoEl.style.display = 'block';
        document.getElementById('pa-camera-fallback-msg').style.display = 'none';
        document.getElementById('live-analysis-status').style.display = 'block';
        
        self._analyzeContinuously(videoEl, canvasEl, mode);
      })
      .catch(function(err) {
        console.error('خطأ الكاميرا:', err);
        alert('خطأ: لا يمكن فتح الكاميرا');
      });
    },

    _analyzeContinuously: function(videoEl, canvasEl, mode) {
      var self = this;
      var ctx = canvasEl.getContext('2d');

      var analyze = function() {
        if (!self.isRunning) return;

        self.frameCount++;

        if (videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
          canvasEl.width = videoEl.videoWidth;
          canvasEl.height = videoEl.videoHeight;
          ctx.drawImage(videoEl, 0, 0);

          // لا ترسل طلباً جديداً إذا يوجد طلب قيد المعالجة
          if (self.frameCount % self.skipFrames === 0 && !self.isAnalyzing) {
            self.isAnalyzing = true;

            // أخذ صورة بجودة أفضل للتحليل
            var base64 = canvasEl.toDataURL('image/jpeg', 0.75).split(',')[1];
            var prompt = self._getPromptByMode(mode);

            // عرض مؤشر المعالجة
            var statusEl = document.getElementById('live-analysis-status');
            if (statusEl) {
              statusEl.innerHTML = '<div style="display:flex;align-items:center;gap:8px;color:#c8960c;font-size:0.85rem;">' +
                '<div style="width:16px;height:16px;border:2px solid #c8960c;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></div>' +
                'جارٍ تحليل الصورة...</div>';
            }

            /* ── إرسال مباشر للـ CF Worker بدون شروط ── */
            var imgDataUrl = 'data:image/jpeg;base64,' + base64;
            var _sendToWorker = function (imgUrl, workerPrompt) {
              var b64 = imgUrl, mt = 'image/jpeg';
              if (imgUrl && imgUrl.startsWith('data:')) {
                var parts = imgUrl.split(',');
                b64 = parts[1] || imgUrl;
                var mm = parts[0].match(/data:([^;]+)/);
                if (mm) mt = mm[1];
              }
              return fetch(CFG.cfWorker, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: workerPrompt, image: b64, mediaType: mt })
              })
              .then(function (r) { if (!r.ok) throw new Error('HTTP_' + r.status); return r.json(); })
              .then(function (data) {
                if (data.choices && data.choices[0]) {
                  var msg = data.choices[0].message || data.choices[0];
                  var t = msg.content || msg.text || null;
                  if (t && t.trim().length > 5) return { text: t.trim(), source: data.provider || 'CF-Worker' };
                }
                if (data.result && data.result.response) {
                  var resp = data.result.response;
                  var t2 = typeof resp === 'string' ? resp : JSON.stringify(resp);
                  if (t2.trim().length > 5) return { text: t2.trim(), source: 'CF-Worker' };
                }
                return null;
              })
              .catch(function () { return null; });
            };

            _sendToWorker(imgDataUrl, prompt)
              .then(function (cfResult) {
                if (cfResult && cfResult.text) return cfResult;
                return _universalVision(imgDataUrl, prompt);
              })
              .then(function(result) {
                self.isAnalyzing = false;
                if (result && result.text) {
                  self.stop();
                  self._showResults(result.text, mode);
                }
              })
              .catch(function(e) {
                self.isAnalyzing = false;
                console.warn('خطأ في التحليل:', e);
              });
          }
        }

        requestAnimationFrame(analyze);
      };

      analyze();
    },

    _getPromptByMode: function(mode) {
      var base = 'أجب بالعربية فقط. مهما كانت جودة الصورة أو الإضاءة، حاول استخراج أقصى قدر من المعلومات المرئية. ';
      var prompts = {

        'product': base + 'انظر لهذا المنتج أو العبوة. أعطني تحليلاً صحياً شاملاً بهذه الأقسام بالترتيب:\n' +
          '## اسم المنتج\n[اكتب اسم المنتج أو العلامة التجارية]\n' +
          '## المكونات الرئيسية\n[اذكر أهم المكونات]\n' +
          '## القيم الغذائية\n[السعرات والبروتين والكربوهيدرات والدهون والسكر إذا ظهرت]\n' +
          '## التحذيرات الصحية\n[أي مواد حافظة أو إضافات مشبوهة]\n' +
          '## التقييم الصحي\n[هل هو منتج صحي أم لا وسبب ذلك]\n' +
          '## التوصية\n[نصيحة سريعة للمستخدم]',

        'food': base + 'انظر لهذا الطعام أو الوجبة. أعطني تحليلاً غذائياً بهذه الأقسام:\n' +
          '## اسم الطعام\n[اكتب اسم الطعام أو الوجبة]\n' +
          '## السعرات الحرارية\n[تقدير السعرات للوجبة كاملة]\n' +
          '## القيم الغذائية\n[البروتين والكربوهيدرات والدهون والألياف]\n' +
          '## الفوائد الصحية\n[ما الفائدة من هذا الطعام]\n' +
          '## تحذيرات أو سلبيات\n[هل يجب تجنبه أو تقليله]\n' +
          '## التوصية\n[هل يناسب نظام طيبات الصحي]',

        'medicine': base + 'انظر لهذا الدواء أو العبوة الطبية. أعطني معلومات شاملة:\n' +
          '## اسم الدواء\n[الاسم التجاري والمادة الفعالة]\n' +
          '## الاستخدام\n[يُستخدم لعلاج ماذا]\n' +
          '## الجرعة المعتادة\n[كيفية الاستخدام]\n' +
          '## الآثار الجانبية\n[أهم الآثار الجانبية المعروفة]\n' +
          '## التحذيرات\n[من لا يجب أن يأخذه]\n' +
          '## ملاحظة\n[استشر طبيبك أو صيدلانيك دائماً]',

        'report': base + 'انظر لهذا التقرير الطبي أو نتائج التحاليل. اقرأ كل الأرقام والقيم وأعطني:\n' +
          '## ملخص التقرير\n[موضوع التقرير]\n' +
          '## النتائج المهمة\n[أبرز القيم والنتائج]\n' +
          '## القيم ضمن الطبيعي\n[ما هو طبيعي]\n' +
          '## القيم خارج الطبيعي\n[ما يستحق الانتباه]\n' +
          '## التوصيات\n[ماذا ينصح المريض بفعله]\n' +
          '## تنبيه\n[هذا شرح توعوي فقط - استشر طبيبك]',

        'prescription': base + 'انظر لهذه الروشتة الطبية. اقرأ كل الأدوية المكتوبة وأعطني:\n' +
          '## الطبيب والتاريخ\n[اسم الطبيب والتاريخ إن ظهرا]\n' +
          '## قائمة الأدوية\n[لكل دواء: الاسم + الجرعة + التكرار]\n' +
          '## تعليمات مهمة\n[أي تعليمات خاصة]\n' +
          '## تحذيرات التداخل\n[هل هناك أدوية قد تتعارض]\n' +
          '## ملاحظة\n[التزم بالجرعات ولا تتوقف بدون استشارة طبيبك]'
      };
      return prompts[mode] || (base + 'احلل الصورة بالتفصيل واكتب النتائج على شكل أقسام واضحة.');
    },

    /* ═══════════════════════════════════════════════════
       محوّل النتائج → بطاقات ملونة جميلة
       يعمل مع أي صيغة رد من الذكاء الاصطناعي
    ═══════════════════════════════════════════════════ */
    _parseToSections: function(text) {
      // تنظيف النص أولاً
      var clean = text.replace(/\*\*/g, '').replace(/\*/g, '').trim();

      var sections = [];

      // محاولة ١: استخراج أقسام ## أو # أو : أو —
      var sectionRegex = /(?:^|\n)#{1,3}\s*([^\n]+)\n([\s\S]*?)(?=\n#{1,3}\s|$)/g;
      var match;
      while ((match = sectionRegex.exec(clean)) !== null) {
        var title = match[1].trim();
        var content = match[2].trim();
        if (title && content) {
          sections.push({ title: title, content: content });
        }
      }

      // محاولة ٢: إذا لم تُجدِ → اقسم على الفقرات
      if (sections.length < 2) {
        sections = [];
        // ابحث عن نمط "عنوان: محتوى" أو نقاط
        var lines = clean.split('\n').filter(function(l) { return l.trim(); });
        var current = null;
        lines.forEach(function(line) {
          var colonIdx = line.indexOf(':');
          var isHeader = (colonIdx > 0 && colonIdx < 30 && line.length < 50) ||
                         /^[\u0600-\u06FF\w\s]{2,25}[:\-–—]/.test(line);
          if (isHeader && colonIdx > 0) {
            if (current) sections.push(current);
            current = { title: line.substring(0, colonIdx).trim(), content: line.substring(colonIdx + 1).trim() };
          } else if (current) {
            current.content += '\n' + line;
          } else {
            current = { title: 'النتيجة', content: line };
          }
        });
        if (current) sections.push(current);
      }

      // محاولة ٣: إذا فشل كل شيء → فقرة واحدة
      if (sections.length < 1) {
        sections = [{ title: 'التحليل', content: clean }];
      }

      return sections;
    },

    _getCardTheme: function(title, index) {
      // ألوان مناسبة لكل نوع من الأقسام
      var t = title.toLowerCase();
      if (t.includes('اسم') || t.includes('المنتج') || t.includes('الدواء') || t.includes('الطعام'))
        return { bg: 'rgba(200,150,12,0.12)', border: '#c8960c', icon: '🏷️', badge: '#c8960c' };
      if (t.includes('سعر') || t.includes('غذائ') || t.includes('قيم'))
        return { bg: 'rgba(46,201,81,0.1)', border: '#2ec951', icon: '📊', badge: '#2ec951' };
      if (t.includes('فائد') || t.includes('إيجاب'))
        return { bg: 'rgba(0,201,167,0.1)', border: '#00c9a7', icon: '✅', badge: '#00c9a7' };
      if (t.includes('تحذير') || t.includes('سلبي') || t.includes('خارج') || t.includes('خطر'))
        return { bg: 'rgba(255,87,87,0.1)', border: '#ff5757', icon: '⚠️', badge: '#ff5757' };
      if (t.includes('توصي') || t.includes('نصيح') || t.includes('ملاحظة') || t.includes('تنبيه'))
        return { bg: 'rgba(100,149,237,0.1)', border: '#6495ed', icon: '💡', badge: '#6495ed' };
      if (t.includes('جرعة') || t.includes('استخدام') || t.includes('تعليم'))
        return { bg: 'rgba(255,165,0,0.1)', border: '#ffa500', icon: '💊', badge: '#ffa500' };
      if (t.includes('مكون') || t.includes('مواد'))
        return { bg: 'rgba(147,112,219,0.1)', border: '#9370db', icon: '🧪', badge: '#9370db' };
      if (t.includes('طبيع') || t.includes('طبيعي'))
        return { bg: 'rgba(46,201,81,0.08)', border: '#2ec951', icon: '✓', badge: '#2ec951' };
      if (t.includes('تقييم') || t.includes('ملخص'))
        return { bg: 'rgba(200,150,12,0.1)', border: '#c8960c', icon: '⭐', badge: '#c8960c' };
      // ألوان افتراضية دورية
      var defaults = [
        { bg: 'rgba(200,150,12,0.08)',   border: '#c8960c', icon: '📋', badge: '#c8960c' },
        { bg: 'rgba(46,201,81,0.08)',    border: '#2ec951', icon: '📌', badge: '#2ec951' },
        { bg: 'rgba(0,201,167,0.08)',    border: '#00c9a7', icon: '📎', badge: '#00c9a7' },
        { bg: 'rgba(100,149,237,0.08)', border: '#6495ed', icon: '📝', badge: '#6495ed' },
        { bg: 'rgba(255,165,0,0.08)',   border: '#ffa500', icon: '📍', badge: '#ffa500' }
      ];
      return defaults[index % defaults.length];
    },

    _showResults: function(text, mode) {
      var resultEl = document.getElementById('pa-scan-result');
      if (!resultEl) return;

      var modeLabels = {
        'product': 'تحليل المنتج', 'food': 'تحليل الطعام',
        'medicine': 'معلومات الدواء', 'report': 'تحليل التقرير', 'prescription': 'تحليل الروشتة'
      };
      var modeIcons = {
        'product': '🛒', 'food': '🍽️', 'medicine': '💊', 'report': '🔬', 'prescription': '📋'
      };

      var sections = this._parseToSections(text);
      var self = this;

      var cardsHtml = sections.map(function(sec, i) {
        var theme = self._getCardTheme(sec.title, i);
        // تحويل المحتوى — دعم القوائم والنقاط
        var contentHtml = sec.content
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\n[-•–*]\s+/g, '\n<span style="color:' + theme.badge + ';margin-left:4px;">◆</span> ')
          .replace(/\n(\d+)\.\s+/g, '\n<span style="color:' + theme.badge + ';font-weight:700;margin-left:4px;">$1.</span> ')
          .replace(/\n/g, '<br>');

        return '<div style="' +
          'background:' + theme.bg + ';' +
          'border:1.5px solid ' + theme.border + ';' +
          'border-radius:14px;' +
          'padding:14px 16px;' +
          'margin-bottom:10px;' +
          'animation: slideInCard 0.4s ease forwards;' +
          'animation-delay:' + (i * 0.08) + 's;' +
          'opacity:0;' +
          '">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;border-bottom:1px solid ' + theme.border + '33;padding-bottom:8px;">' +
          '<span style="font-size:1.1rem;">' + theme.icon + '</span>' +
          '<span style="color:' + theme.badge + ';font-weight:700;font-size:0.88rem;letter-spacing:0.3px;">' +
          sec.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
          '</span>' +
          '</div>' +
          '<div style="color:#d4d4d4;font-size:0.87rem;line-height:1.7;white-space:pre-wrap;">' + contentHtml + '</div>' +
          '</div>';
      }).join('');

      var html = '<style>' +
        '@keyframes slideInCard { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }' +
        '@keyframes headerPop { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }' +
        '</style>' +
        '<div style="animation:headerPop 0.3s ease;">' +
        '<div style="display:flex;align-items:center;gap:10px;' +
          'background:linear-gradient(135deg,rgba(200,150,12,0.15),rgba(0,201,167,0.08));' +
          'border:1.5px solid #c8960c55;border-radius:14px;padding:12px 16px;margin-bottom:14px;">' +
        '<span style="font-size:1.4rem;">' + (modeIcons[mode] || '🔍') + '</span>' +
        '<div>' +
        '<div style="color:#c8960c;font-weight:800;font-size:0.95rem;">' + (modeLabels[mode] || 'نتائج التحليل') + '</div>' +
        '<div style="color:#888;font-size:0.75rem;margin-top:2px;">تم التحليل بالذكاء الاصطناعي</div>' +
        '</div>' +
        '<div style="margin-right:auto;background:#2ec95122;border:1px solid #2ec95166;border-radius:20px;padding:3px 10px;font-size:0.72rem;color:#2ec951;">✓ مكتمل</div>' +
        '</div>' +
        cardsHtml +
        '<button onclick="liveAnalysisEngine.restart()" style="' +
        'width:100%;margin-top:4px;padding:13px;' +
        'background:linear-gradient(135deg,#c8960c,#e6a800);' +
        'color:#050e1f;border:none;border-radius:12px;' +
        'font-family:Tajawal,sans-serif;font-weight:800;font-size:0.92rem;cursor:pointer;' +
        'display:flex;align-items:center;justify-content:center;gap:8px;' +
        'box-shadow:0 4px 15px rgba(200,150,12,0.3);' +
        '">' +
        '<i class="fas fa-camera" style="font-size:1rem;"></i>' +
        'تحليل جديد بالكاميرا' +
        '</button>' +
        '</div>';

      resultEl.innerHTML = html;
      document.getElementById('live-analysis-status') && (document.getElementById('live-analysis-status').style.display = 'none');
    },

    stop: function() {
      this.isRunning = false;
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(function(t) { t.stop(); });
        this.currentStream = null;
      }
      var videoEl = document.getElementById('pa-video-stream');
      if (videoEl) {
        videoEl.style.display = 'none';
        videoEl.pause();
      }
    },

    restart: function() {
      var resultEl = document.getElementById('pa-scan-result');
      if (resultEl) resultEl.innerHTML = '';
      var statusEl = document.getElementById('live-analysis-status');
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.innerHTML = '<div style="display:flex;align-items:center;gap:8px;color:#c8960c;font-size:0.85rem;">' +
          '<div style="width:14px;height:14px;border:2px solid #c8960c;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></div>' +
          'الكاميرا تعمل... وجّه نحو الشيء المراد تحليله</div>';
      }
      this.frameCount = 0;
      this.isRunning = true;
      this.isAnalyzing = false;
      
      var videoEl = document.getElementById('pa-video-stream');
      if (videoEl) videoEl.style.display = 'block';
      var canvasEl = document.getElementById('pa-live-canvas');
      this._analyzeContinuously(videoEl, canvasEl, this.currentMode);
    }
  };

  global.liveAnalysisEngine = liveAnalysisEngine;

})(window);
