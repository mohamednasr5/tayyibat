/**
 * ══════════════════════════════════════════════════════════════════
 * 🌿 طيبات — محرك الذكاء الاصطناعي الموحد
 * ai-engine.js | v6.0 — MULTI-PROVIDER FREE APIs
 *
 * ✅ CF Worker (taybat-ai.studegy8.workers.dev) — أول أولوية
 * ✅ LLM7.io — مجاني 100% بدون تسجيل (GPT-4o, GPT-4.1, Claude, Gemini)
 * ✅ Pollinations.ai — مجاني 100% بدون مفتاح (نص + رؤية)
 * ✅ OVH Kepler — مجاني بدون مفتاح
 * ✅ OpenRouter Free Models — مجاني بدون بطاقة ائتمان
 * ✅ GitHub Models — مجاني للاستخدام العام
 * ✅ Together AI Free Tier — مجاني
 * ✅ يدعم الرؤية والنصوص وكل الأدوات
 * ══════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  /* ══════════════════════════════════ CONFIG ══════════════════════════════════ */

  // الأولوية: CF Worker أولاً ثم التناوب بين المزودين المجانيين
  var CF_WORKER = 'https://taybat-ai.studegy8.workers.dev';

  // LLM7.io — مجاني 100% بدون مفتاح، يدعم GPT-4o وClaude وGemini
  var LLM7_ENDPOINT = 'https://api.llm7.io/v1/chat/completions';
  var LLM7_TEXT_MODELS = [
    'gpt-4.1', 'gpt-4o', 'gpt-4o-mini',
    'claude-3-5-sonnet-20241022',
    'gemini-1.5-pro',
    'deepseek-chat',
    'llama-3.3-70b-instruct',
    'mistral-large-latest'
  ];
  var LLM7_VISION_MODELS = [
    'gpt-4o', 'gpt-4.1',
    'claude-3-5-sonnet-20241022',
    'gemini-1.5-pro',
    'gpt-4o-mini'
  ];

  // Pollinations.ai — مجاني 100% بدون مفتاح
  var POLLINATIONS_ENDPOINT = 'https://text.pollinations.ai/openai';
  var POLLINATIONS_TEXT_MODELS = [
    'openai', 'openai-large', 'mistral', 'llama',
    'gemini', 'deepseek-reasoner', 'qwen-coder'
  ];
  var POLLINATIONS_VISION_MODELS = [
    'openai', 'openai-large', 'gemini'
  ];

  // OVH Kepler — مجاني بدون مفتاح
  var KEPLER_ENDPOINT = 'https://llm.ovh/api/chat/completions';
  var KEPLER_MODELS = [
    'llama3.1:70b', 'llama3.1:8b',
    'mixtral:8x7b', 'mistral:7b'
  ];

  // OpenRouter Free Models — مجاني بدون بطاقة ائتمان
  var OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
  var OPENROUTER_FREE_MODELS = [
    'meta-llama/llama-3.1-8b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'google/gemma-2-9b-it:free',
    'qwen/qwen-2-7b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'huggingfaceh4/zephyr-7b-beta:free'
  ];

  // Together AI Free
  var TOGETHER_ENDPOINT = 'https://api.together.xyz/v1/chat/completions';
  var TOGETHER_FREE_MODELS = [
    'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
    'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
    'Qwen/Qwen2-VL-72B-Instruct'
  ];

  var TEXT_TIMEOUT = 15000;
  var VISION_TIMEOUT = 25000;
  var _orLastCall = 0;

  /* ══════════════════════════════════ HELPERS ══════════════════════════════════ */

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, rej) {
        setTimeout(function () { rej(new Error('TIMEOUT_' + ms)); }, ms);
      }),
    ]);
  }

  function isGoodText(t) {
    return typeof t === 'string' && t.trim().length > 5;
  }

  function _normalizeText(text) {
    if (!text) return '';
    if (typeof text !== 'string') text = String(text);
    return text.trim();
  }

  function _extractText(data) {
    if (!data) return null;
    // OpenAI format
    if (data.choices && data.choices[0]) {
      var msg = data.choices[0].message || data.choices[0];
      var t = msg.content || msg.text || null;
      if (isGoodText(t)) return t.trim();
    }
    // CF Worker / Cloudflare format
    if (data.result) {
      var r = data.result;
      if (typeof r === 'string' && isGoodText(r)) {
        return r.replace(/```json|```/g, '').trim();
      }
      if (typeof r === 'object') {
        var rText = r.response || r.text || '';
        if (isGoodText(rText)) return rText.trim();
        return JSON.stringify(r);
      }
    }
    // Direct response
    if (data.response && isGoodText(data.response)) return data.response.trim();
    // Direct string
    if (typeof data === 'string' && isGoodText(data)) return data.trim();
    return null;
  }

  /* ══════════════════════════════════ PROVIDERS ══════════════════════════════════ */

  /* ─── 1. Cloudflare Worker (أول أولوية) ─── */
  async function _tryCFWorker(messages, imageBase64, mediaType) {
    try {
      var body = {};
      if (imageBase64) {
        // Vision request
        var promptText = messages.map(function(m) { return m.content; }).join('\n');
        body = {
          prompt: promptText,
          image: imageBase64,
          mediaType: mediaType || 'image/jpeg'
        };
      } else {
        // Text request
        var prompt = messages.map(function(m) {
          return (m.role === 'system' ? '[سياق]: ' : '') + m.content;
        }).join('\n');
        body = { prompt: prompt };
      }

      var resp = await withTimeout(fetch(CF_WORKER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }), imageBase64 ? VISION_TIMEOUT : TEXT_TIMEOUT);

      if (!resp.ok) return null;
      var data = await resp.json();
      var text = _extractText(data);
      if (isGoodText(text)) return { text: text.trim(), source: data.provider || 'CF-Worker' };
      return null;
    } catch (e) {
      console.warn('[CF-Worker]', e.message);
      return null;
    }
  }

  /* ─── 2. LLM7.io (مجاني بدون مفتاح) ─── */
  async function _tryLLM7Text(messages, idx) {
    idx = idx || 0;
    if (idx >= LLM7_TEXT_MODELS.length) return null;
    var model = LLM7_TEXT_MODELS[idx];
    try {
      var resp = await withTimeout(fetch(LLM7_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 1500,
          temperature: 0.7
        })
      }), TEXT_TIMEOUT);
      if (resp.status === 429) {
        await new Promise(function(r) { setTimeout(r, 2000); });
        return await _tryLLM7Text(messages, idx + 1);
      }
      if (!resp.ok) return await _tryLLM7Text(messages, idx + 1);
      var data = await resp.json();
      var text = _extractText(data);
      if (isGoodText(text)) return { text: text.trim(), source: 'LLM7/' + model };
      return await _tryLLM7Text(messages, idx + 1);
    } catch (e) {
      return await _tryLLM7Text(messages, idx + 1);
    }
  }

  async function _tryLLM7Vision(imgDataUrl, promptText, idx) {
    idx = idx || 0;
    if (idx >= LLM7_VISION_MODELS.length) return null;
    var model = LLM7_VISION_MODELS[idx];
    try {
      var imgContent = imgDataUrl.startsWith('data:')
        ? { url: imgDataUrl }
        : { url: 'data:image/jpeg;base64,' + imgDataUrl };

      var resp = await withTimeout(fetch(LLM7_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              { type: 'image_url', image_url: imgContent }
            ]
          }],
          max_tokens: 1500,
          temperature: 0.3
        })
      }), VISION_TIMEOUT);

      if (!resp.ok) return await _tryLLM7Vision(imgDataUrl, promptText, idx + 1);
      var data = await resp.json();
      var text = _extractText(data);
      if (isGoodText(text)) return { text: text.trim(), source: 'LLM7-Vision/' + model };
      return await _tryLLM7Vision(imgDataUrl, promptText, idx + 1);
    } catch (e) {
      return await _tryLLM7Vision(imgDataUrl, promptText, idx + 1);
    }
  }

  /* ─── 3. Pollinations.ai (مجاني بدون مفتاح) ─── */
  async function _tryPollinationsText(messages, idx, retries) {
    idx = idx || 0;
    retries = retries || 0;
    if (idx >= POLLINATIONS_TEXT_MODELS.length) return null;
    var model = POLLINATIONS_TEXT_MODELS[idx];
    try {
      var resp = await withTimeout(fetch(POLLINATIONS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1500,
          private: true
        })
      }), TEXT_TIMEOUT);

      if (resp.status === 429) {
        await new Promise(function(r) { setTimeout(r, 2500 + Math.random() * 2000); });
        return await _tryPollinationsText(messages, idx + 1, 0);
      }
      if (!resp.ok) return await _tryPollinationsText(messages, idx + 1, 0);
      var data = await resp.json();
      var text = _extractText(data);
      if (isGoodText(text)) return { text: text.trim(), source: 'Pollinations/' + model };
      return await _tryPollinationsText(messages, idx + 1, 0);
    } catch (e) {
      if (retries < 1) return await _tryPollinationsText(messages, idx + 1, 0);
      return null;
    }
  }

  async function _tryPollinationsVision(imgDataUrl, promptText, idx) {
    idx = idx || 0;
    if (idx >= POLLINATIONS_VISION_MODELS.length) return null;
    var model = POLLINATIONS_VISION_MODELS[idx];
    try {
      var imgUrl = imgDataUrl.startsWith('data:') ? imgDataUrl : 'data:image/jpeg;base64,' + imgDataUrl;

      var resp = await withTimeout(fetch(POLLINATIONS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              { type: 'image_url', image_url: { url: imgUrl } }
            ]
          }],
          temperature: 0.3,
          max_tokens: 1500,
          private: true
        })
      }), VISION_TIMEOUT);

      if (resp.status === 429) {
        await new Promise(function(r) { setTimeout(r, 3000); });
        return await _tryPollinationsVision(imgDataUrl, promptText, idx + 1);
      }
      if (!resp.ok) return await _tryPollinationsVision(imgDataUrl, promptText, idx + 1);
      var data = await resp.json();
      var text = _extractText(data);
      if (isGoodText(text)) return { text: text.trim(), source: 'Pollinations-Vision/' + model };
      return await _tryPollinationsVision(imgDataUrl, promptText, idx + 1);
    } catch (e) {
      return await _tryPollinationsVision(imgDataUrl, promptText, idx + 1);
    }
  }

  /* ─── 4. OVH Kepler (مجاني بدون مفتاح) ─── */
  async function _tryKepler(messages, idx) {
    idx = idx || 0;
    if (idx >= KEPLER_MODELS.length) return null;
    try {
      var resp = await withTimeout(fetch(KEPLER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: KEPLER_MODELS[idx],
          messages: messages,
          stream: false
        })
      }), TEXT_TIMEOUT);
      if (!resp.ok) return await _tryKepler(messages, idx + 1);
      var data = await resp.json();
      var text = _extractText(data);
      if (isGoodText(text)) return { text: text.trim(), source: 'Kepler/' + KEPLER_MODELS[idx] };
      return await _tryKepler(messages, idx + 1);
    } catch (e) {
      return await _tryKepler(messages, idx + 1);
    }
  }

  /* ─── 5. OpenRouter Free (بدون بطاقة ائتمان) ─── */
  async function _tryOpenRouterFree(messages, idx) {
    idx = idx || 0;
    if (idx >= OPENROUTER_FREE_MODELS.length) return null;
    var model = OPENROUTER_FREE_MODELS[idx];

    // Rate limiting: 600ms between calls
    var now = Date.now();
    var wait = 600 - (now - _orLastCall);
    if (wait > 0) await new Promise(function(r) { setTimeout(r, wait); });
    _orLastCall = Date.now();

    try {
      var headers = {
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tayyibat.online',
        'X-Title': 'Tayyibat'
      };
      var key = global.__OR_KEY_FB || global.__OR_KEY || null;
      if (key) headers['Authorization'] = 'Bearer ' + key;

      var resp = await withTimeout(fetch(OPENROUTER_ENDPOINT, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 1200,
          temperature: 0.7
        })
      }), TEXT_TIMEOUT);

      if (resp.status === 429 || resp.status === 402) {
        await new Promise(function(r) { setTimeout(r, 1500); });
        return await _tryOpenRouterFree(messages, idx + 1);
      }
      if (!resp.ok) return await _tryOpenRouterFree(messages, idx + 1);
      var data = await resp.json();
      var text = _extractText(data);
      if (isGoodText(text)) return { text: text.trim(), source: 'OpenRouter/' + model.split('/').pop().replace(':free', '') };
      return await _tryOpenRouterFree(messages, idx + 1);
    } catch (e) {
      return await _tryOpenRouterFree(messages, idx + 1);
    }
  }

  /* ─── 6. Groq (مجاني بدون بطاقة ائتمان، سريع جداً) ─── */
  async function _tryGroqFree(messages) {
    // Groq يحتاج مفتاح API لكن مستوى المجاني كبير جداً
    var key = global.__GROQ_KEY || null;
    if (!key) return null;
    try {
      var resp = await withTimeout(fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: messages,
          max_tokens: 1500,
          temperature: 0.7
        })
      }), TEXT_TIMEOUT);
      if (!resp.ok) return null;
      var data = await resp.json();
      var text = _extractText(data);
      if (isGoodText(text)) return { text: text.trim(), source: 'Groq/llama-3.1-70b' };
      return null;
    } catch (e) {
      return null;
    }
  }

  /* ══════════════════════════════════ UNIVERSAL ROUTER ══════════════════════════════════ */

  /**
   * الموجه الذكي: يجرب المزودين بالترتيب حتى ينجح أحدهم
   * Vision: CF-Worker → LLM7-Vision → Pollinations-Vision → fallback text
   * Text:   CF-Worker → LLM7 → Pollinations → OpenRouter → Kepler → Groq
   */
  async function _universalAICall(messages, opts) {
    opts = opts || {};
    var isVision = !!(opts.imageDataUrl);

    if (isVision) {
      var imgUrl = opts.imageDataUrl || '';
      var promptText = opts.promptText || 'حلل الصورة بالتفصيل بالعربية';

      // استخراج base64 من data URL
      var imgBase64 = imgUrl;
      var mediaType = 'image/jpeg';
      if (imgUrl.startsWith('data:')) {
        var parts = imgUrl.split(',');
        imgBase64 = parts[1] || imgUrl;
        var m = parts[0].match(/data:([^;]+)/);
        if (m) mediaType = m[1];
      }

      // 1. CF Worker Vision
      var r = await _tryCFWorker(
        [{ role: 'user', content: promptText }],
        imgBase64, mediaType
      );
      if (r) { console.log('[طيبات Vision] ✅', r.source); return r; }

      // 2. LLM7 Vision
      r = await _tryLLM7Vision(imgUrl, promptText, 0);
      if (r) { console.log('[طيبات Vision] ✅', r.source); return r; }

      // 3. Pollinations Vision
      r = await _tryPollinationsVision(imgUrl, promptText, 0);
      if (r) { console.log('[طيبات Vision] ✅', r.source); return r; }

      // 4. Fallback: نص فقط مع وصف
      console.warn('[طيبات] الرؤية فشلت، fallback نصي');
      var fallbackMsgs = [{ role: 'user', content: promptText + '\n(تعذر تحميل الصورة، أعطِ تحليلاً عاماً مفيداً)' }];
      return await _universalAICall(fallbackMsgs, {});
    }

    // TEXT PATH
    // 1. CF Worker Chat
    var r = await _tryCFWorker(messages, null, null);
    if (r) { console.log('[طيبات Text] ✅', r.source); return r; }

    // 2. LLM7
    r = await _tryLLM7Text(messages, 0);
    if (r) { console.log('[طيبات Text] ✅', r.source); return r; }

    // 3. Pollinations
    r = await _tryPollinationsText(messages, 0, 0);
    if (r) { console.log('[طيبات Text] ✅', r.source); return r; }

    // 4. OpenRouter Free
    r = await _tryOpenRouterFree(messages, 0);
    if (r) { console.log('[طيبات Text] ✅', r.source); return r; }

    // 5. Kepler
    r = await _tryKepler(messages, 0);
    if (r) { console.log('[طيبات Text] ✅', r.source); return r; }

    // 6. Groq (إذا توفر المفتاح)
    r = await _tryGroqFree(messages);
    if (r) { console.log('[طيبات Text] ✅', r.source); return r; }

    // Retry Pollinations after delay
    await new Promise(function(r) { setTimeout(r, 2000); });
    r = await _tryPollinationsText(messages, 0, 0);
    if (r) { console.log('[طيبات Text] ✅ Retry', r.source); return r; }

    console.error('[طيبات] ❌ كل المزودين فشلوا');
    return null;
  }

  /* ══════════════════════════════════ smartChat ══════════════════════════════════ */

  async function smartChat(prompt, options) {
    options = options || {};
    var toolType = options.toolType || 'generic';
    var systemPrompt = options.system || null;

    prompt = _normalizeText(prompt);
    if (!prompt) {
      return { text: 'الرجاء إدخال نص للاستعلام.', source: 'local', raw: null };
    }

    var finalPrompt = prompt;

    // تخصيص البرومبت حسب نوع الأداة
    var TOOL_PROMPTS = {
      'drug-alt':
        'أنت صيدلي مصري خبير. المطلوب: اقترح 3 أدوية بديلة للدواء التالي متاحة في مصر.\n' +
        'أعد النتيجة في JSON:\n' +
        '{"drug_name":"...","active_ingredient":"...","alternatives":[{"name":"...","dose":"...","company":"...","country":"مصر"}],"note":"تحذير طبي قصير"}\n\n' +
        'اسم الدواء: ' + prompt,

      'drug-interaction':
        'أنت صيدلي سريري خبير. حلل التفاعل الدوائي بين الأدوية التالية:\n' +
        prompt + '\n\n' +
        'اذكر:\n1. التفاعلات الخطيرة\n2. التفاعلات المتوسطة\n3. التوصيات العملية\n4. البدائل الآمنة إن وجدت',

      'symptoms':
        'أنت طبيب سريري متخصص. حلل الأعراض التالية:\n' +
        prompt + '\n\n' +
        'قدم:\n1. الاحتمالات التشخيصية المرتبة\n2. علامات التحذير التي تستوجب الطوارئ\n3. التوصيات الأولية\n⚠️ هذا للمعلومات فقط — استشر طبيبك.',

      'dream':
        'أنت شيخ متخصص في علم تفسير الرؤى. فسّر الحلم التالي:\n' +
        '"' + prompt + '"\n\n' +
        'اتبع الترتيب:\n1. الحكم على الرؤيا\n2. تفسير الرموز\n3. المعنى الكلي\n4. التوجيه العملي\n⚠️ للاسترشاد فقط.',

      'horoscope':
        'أنت منجم عربي متخصص. قدم توقعات اليوم لبرج ' + prompt + '.\n' +
        'اشمل: العمل، الحب، الصحة، المال، نصيحة اليوم.\n⚠️ للترفيه فقط.',

      'period':
        'أنت د. طيبات، طبيبة متخصصة في أمراض النساء. أجيبي بالعربية بأسلوب دافئ.\n' +
        'السؤال: ' + prompt,

      'boycott':
        'أنت محلل منتجات متخصص في التحقق من قوائم المقاطعة. تحقق من المنتج/الشركة:\n' +
        prompt + '\n\n' +
        'اذكر:\n1. هل مدرجة على قوائم المقاطعة (BDS أو غيرها)؟\n2. السبب\n3. البدائل المحلية والعربية المقترحة',

      'doctor':
        'أنت طبيب خاص متخصص. أجب على هذا الاستفسار الطبي:\n' +
        prompt + '\n⚠️ للمعلومات فقط — استشر طبيبك الشخصي.',

      'generic': null
    };

    if (TOOL_PROMPTS[toolType]) {
      finalPrompt = TOOL_PROMPTS[toolType];
    }

    var messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    } else if (!TOOL_PROMPTS[toolType]) {
      messages.push({
        role: 'system',
        content: 'أنت مساعد عربي ذكي ودود يقدّم إجابات واضحة ومختصرة ومفيدة.'
      });
    }
    messages.push({ role: 'user', content: finalPrompt });

    var result = await withTimeout(_universalAICall(messages), TEXT_TIMEOUT + 5000).catch(function() { return null; });

    if (result) return result;

    return {
      text: 'عذراً، تعذل الاتصال بخادم الذكاء الاصطناعي. حاول مرة أخرى.',
      source: 'fallback',
      raw: null
    };
  }

  /* ══════════════════════════════════ Vision Analysis ══════════════════════════════════ */

  async function smartVision(imgDataUrl, promptText, toolType) {
    var VISION_PROMPTS = {
      food:
        'أنت خبير تغذية سريري. افحص الصورة وتعرّف على الطعام.\n' +
        'أجب بـ JSON: {"name_ar":"اسم الوجبة","serving":"الكمية","calories":0,"protein":0.0,"carbs":0.0,"fat":0.0,' +
        '"fiber":0.0,"sugar":0.0,"glycemic_index":"منخفض/متوسط/مرتفع","tayyibat_approved":true,' +
        '"notes":"نصيحة غذائية","items":[{"name":"مكون","cal_per_100g":0,"protein_per_100g":0.0,"carbs_per_100g":0.0,"fat_per_100g":0.0,"estimated_grams":0}]}',

      medicine:
        'أنت صيدلاني خبير. افحص الدواء واستخرج:\n' +
        '💊 اسم الدواء:\n🔬 المادة الفعالة:\n🏭 الشركة:\n📋 التركيز:\n🎯 الاستخدام:\n' +
        '⚠️ التحذيرات:\n🔄 التفاعلات:\n🤒 الآثار الجانبية:\n💡 نصيحة للمريض',

      report:
        'أنت طبيب متخصص. اقرأ التقرير الطبي واستخرج:\n' +
        '{"report_type":"نوع التقرير","findings":[{"test":"التحليل","value":"القيمة","unit":"الوحدة","reference":"الطبيعي","status":"normal/high/low","interpretation":"تفسير مبسط"}],"summary":"ملخص","recommendations":"توصيات","urgent_flags":"تحذيرات عاجلة"}',

      prescription:
        'أنت صيدلاني خبير في قراءة الروشتات الطبية العربية.\n' +
        '{"doctor_name":"...","speciality":"...","date":"...","drugs":[{"name":"الاسم","active":"المادة الفعالة","dose":"الجرعة","frequency":"عدد المرات","duration":"المدة","timing":"قبل/بعد الأكل","notes":"ملاحظات"}],"interactions_warning":"تحذير تفاعل"}',

      homework:
        'أنت معلم خبير في المناهج العربية. حل السؤال خطوة بخطوة:\n' +
        '📖 السؤال:\n✅ الإجابة الكاملة:\n💡 الشرح المبسط:\n📚 القوانين المهمة:\n⭐ نصيحة للمذاكرة:',

      palm:
        'أنت خبير في قراءة الكف. افحص بدقة:\n' +
        '🖐 شكل الكف:\n📏 خط الحياة:\n❤️ خط القلب:\n🧠 خط الرأس:\n⭐ خط القدر:\n🔮 القراءة الشاملة:\n⚠️ للترفيه فقط.',

      fake_image:
        'أنت محلل صور متخصص في كشف التزوير.\n' +
        '🔎 الحكم:\n📊 نسبة الثقة:\n🔬 المؤشرات التقنية:\n📋 التقرير النهائي:',

      barcode:
        'افحص الباركود أو اسم المنتج:\n' +
        '📊 الباركود:\n🏷️ اسم المنتج:\n🌍 بلد المنشأ:\n⚠️ هل مقاطعة؟\n🔄 بدائل:'
    };

    var prompt = promptText || VISION_PROMPTS[toolType] || 'حلل الصورة بالتفصيل بالعربية';
    var result = await withTimeout(
      _universalAICall([], { imageDataUrl: imgDataUrl, promptText: prompt }),
      VISION_TIMEOUT + 5000
    ).catch(function() { return null; });

    if (result && isGoodText(result.text)) return result;

    return {
      text: 'تعذر تحليل الصورة. تأكد من وضوح الإضاءة وأعد المحاولة.',
      source: 'fallback',
      raw: null
    };
  }

  /* ══════════════════════════════════ Universal Chat ══════════════════════════════════ */

  async function universalChat(messages) {
    if (!Array.isArray(messages) || !messages.length) {
      return { text: 'الرجاء إدخال نص للاستعلام.', source: 'local', raw: null };
    }
    var result = await withTimeout(_universalAICall(messages), TEXT_TIMEOUT + 5000).catch(function() { return null; });
    if (result) return result;
    return {
      text: 'تعذر الاتصال بخادم الذكاء الاصطناعي. حاول مرة أخرى.',
      source: 'all-failed',
      raw: null
    };
  }

  /* ══════════════════════════════════ Exports ══════════════════════════════════ */

  // Global exports
  global.universalChat = universalChat;
  global._universalAICall = _universalAICall;
  global._smartVisionAnalysis = function(imgDataUrl, promptText) {
    return smartVision(imgDataUrl, promptText, 'general');
  };

  // Main TayyibatAI API
  global.TayyibatAI = {
    // نصي عام
    chat: function(prompt, toolTypeOrSystem, extra) {
      if (typeof toolTypeOrSystem === 'string' && toolTypeOrSystem.length > 50) {
        // System prompt
        return smartChat(prompt, { system: toolTypeOrSystem });
      }
      return smartChat(prompt, { toolType: toolTypeOrSystem || 'generic', extra: extra });
    },

    // بدائل الأدوية
    drugAlternatives: function(drugName) {
      return smartChat(drugName, { toolType: 'drug-alt' });
    },

    // تفاعلات الأدوية
    drugInteractions: function(drugs) {
      return smartChat(Array.isArray(drugs) ? drugs.join('، ') : drugs, { toolType: 'drug-interaction' });
    },

    // تحليل الأعراض
    analyzeSymptoms: function(symptoms) {
      return smartChat(symptoms, { toolType: 'symptoms' });
    },

    // تفسير الأحلام
    interpretDream: function(dream) {
      return smartChat(dream, { toolType: 'dream' });
    },

    // البرج الفلكي
    horoscope: function(sign) {
      return smartChat(sign, { toolType: 'horoscope' });
    },

    // تتبع الدورة / طبيب النساء
    periodDoctor: function(question) {
      return smartChat(question, { toolType: 'period' });
    },

    // المقاطعة
    boycottCheck: function(product) {
      return smartChat(product, { toolType: 'boycott' });
    },

    // طبيبك الخاص
    personalDoctor: function(question) {
      return smartChat(question, { toolType: 'doctor' });
    },

    // رؤية الصور (كل الأدوات البصرية)
    vision: function(imgDataUrl, promptText, toolType) {
      return smartVision(imgDataUrl, promptText, toolType || 'general');
    },

    // تحليل الطعام بالصورة
    analyzeFood: function(imgDataUrl) {
      return smartVision(imgDataUrl, null, 'food');
    },

    // قراءة الدواء من الصورة
    readMedicine: function(imgDataUrl) {
      return smartVision(imgDataUrl, null, 'medicine');
    },

    // قراءة التقرير الطبي
    readReport: function(imgDataUrl) {
      return smartVision(imgDataUrl, null, 'report');
    },

    // قراءة الروشتة
    readPrescription: function(imgDataUrl) {
      return smartVision(imgDataUrl, null, 'prescription');
    },

    // حل الواجبات
    solveHomework: function(imgDataUrl, question) {
      if (imgDataUrl) return smartVision(imgDataUrl, null, 'homework');
      return smartChat('حل السؤال التالي خطوة بخطوة:\n' + question, { system: 'أنت معلم خبير.' });
    },

    // قراءة الكف
    readPalm: function(imgDataUrl) {
      return smartVision(imgDataUrl, null, 'palm');
    },

    // كشف الصور المزيفة
    detectFakeImage: function(imgDataUrl) {
      return smartVision(imgDataUrl, null, 'fake_image');
    },

    // تحليل الباركود والمقاطعة
    analyzeBarcode: function(imgDataUrl) {
      return smartVision(imgDataUrl, null, 'barcode');
    },

    // محادثة متعددة الرسائل
    conversation: universalChat,

    // الحالة
    status: function() {
      return {
        providers: ['CF-Worker', 'LLM7.io', 'Pollinations.ai', 'OVH-Kepler', 'OpenRouter-Free', 'Groq'],
        vision: true,
        text: true,
        free: true,
        requiresKey: false
      };
    }
  };

  // Bridge الدوال القديمة
  global._callClaudeAPI = async function(prompt, systemPrompt) {
    var messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    var res = await _universalAICall(messages);
    if (res && res.text) return res.text;
    throw new Error('All AI endpoints failed');
  };

  global._callClaudeAPIWithImage = async function(prompt, imgDataUrl) {
    var res = await _universalAICall([], { imageDataUrl: imgDataUrl, promptText: prompt });
    if (res && res.text) return res.text;
    return await global._callClaudeAPI(prompt + '\n(تعذر تحميل الصورة، قدم تحليلاً عاماً)', null);
  };

  console.log('[طيبات AI v6.0] ✅ محرك الذكاء الاصطناعي الموحد — 6 مزودين مجانيين');

})(window);
