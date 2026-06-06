/**
 * ══════════════════════════════════════════════════════════════════
 * 🌿 طيبات — محرك الذكاء الاصطناعي (Cloudflare فقط)
 * ai-engine.js | v5.0 — CF-WORKER ONLY
 *
 * ✅ يعتمد فقط على Cloudflare Worker (taybat-ai.studegy8.workers.dev)
 * ✅ لا يستخدم أي مزوّدات أخرى (Kepler / LLM7 / Pollinations / OpenRouter)
 * ✅ واجهة موحدة: smartChat و TayyibatAI.chat
 * ✅ يدعم بدائل الأدوية (JSON منسق) وباقي الأدوات النصية
 * ══════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  /* ══════════════════════════════════ CONFIG ══════════════════════════════════ */

  var CF_WORKER = 'https://taybat-ai.studegy8.workers.dev';
  var FAST_TIMEOUT = 8000; // مهلة للطلبات النصية

  /* ══════════════════════════════════ HELPERS ══════════════════════════════════ */

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, rej) {
        setTimeout(function () {
          rej(new Error('TIMEOUT_' + ms));
        }, ms);
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

  /* ══════════════════════════════════ CF Worker Chat فقط ══════════════════════════════════ */

  /**
   * _cfChat:
   * يأخذ messages (نفس فورمات OpenAI)
   * ويرسل prompt واحد للـ Worker
   * ويعيد { text, source } أو null
   */
  function _cfChat(messages) {
    console.log('[TayyibatAI] USING CLOUDFLARE AI ONLY');

    // تحويل messages إلى نص واحد (للـ Worker)
    var prompt = messages
      .map(function (m) {
        return m.role + ': ' + m.content;
      })
      .join('\n');

    return fetch(CF_WORKER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt }),
    })
      .then(function (resp) {
        if (!resp.ok) {
          throw new Error('HTTP_' + resp.status);
        }
        return resp.json();
      })
      .then(function (data) {
        console.log('CF RESPONSE:', data);

        var responseText = null;

        // 1) لو Worker رجع result كسلسلة — نرجعها كما هي (JSON أو نص)
        if (data && typeof data.result === 'string') {
          // نمسح الـ markdown backticks لو وُجدت
          var rawResult = data.result.replace(/```json|```/g, '').trim();
          // نحاول نتحقق إنها JSON صالح — لكن نرجعها دائماً كـ string
          // حتى تستطيع onResult/renderDaResult تعمل parse بنفسها
          try {
            var _test = JSON.parse(rawResult);
            // JSON صالح — نرجعه كـ string مباشرة بدون تحويل
            responseText = rawResult;
          } catch (e) {
            // نص عادي — نستخدمه كما هو
            responseText = rawResult;
          }
        }

        // 2) لو result ككائن
        if (!responseText && data && typeof data.result === 'object') {
          var r = data.result;
          var rText = (r.response || r.text || '');
          if (typeof rText === 'string' && rText.trim()) {
            responseText = rText.replace(/```json|```/g, '').trim();
          } else {
            // نرجع الـ object كـ JSON string ليتعامل معه المستقبِل
            responseText = JSON.stringify(r);
          }
        }

        // 3) fallback: response نصّي مباشر
        if (!responseText && data && typeof data.response === 'string') {
          responseText = data.response;
        }

        if (isGoodText(responseText)) {
          console.log('CF SUCCESS');
          return {
            text: String(responseText).trim(),
            source: data.provider || 'CF-Worker',
            raw: data,
          };
        }

        console.log('CF EMPTY RESPONSE');
        return null;
      })
      .catch(function (err) {
        console.error('Cloudflare Error:', err);
        return null;
      });
  }

  /* ══════════════════════════════════ smartChat — واجهة موحدة ══════════════════════════════════ */

  /**
   * smartChat:
   * - input: prompt (string)
   * - options:
   *    - toolType: نوع الأداة (مثلاً 'drug-alt')
   *    - extra: بيانات إضافية (optional)
   * - output: { text, source, raw }
   */
  async function smartChat(prompt, options) {
    options = options || {};
    var toolType = options.toolType || 'generic';
    var extra = options.extra || null;

    prompt = _normalizeText(prompt);
    if (!prompt) {
      return {
        text: 'الرجاء إدخال نص للاستعلام.',
        source: 'local',
        raw: null,
      };
    }

    // يمكنك تخصيص prompt حسب الأداة قبل إرساله للـ Worker
    var finalPrompt = prompt;

    if (toolType === 'drug-alt') {
      finalPrompt =
        'أنت صيدلي مصري خبير.\n' +
        'المطلوب: اقتراح 3 أدوية بديلة للدواء التالي متاحة في مصر، مع البيانات التالية لكل بديل: ' +
        'الاسم التجاري بالعربية، المادة الفعالة، التركيز (جرعة)، الشركة المنتجة، والدولة.\n' +
        'أعد النتيجة في JSON كما يلي:\n' +
        '{ "drug_name": "...", "active_ingredient": "...", "alternatives": [ { "name": "...", "dose": "...", "company": "...", "country": "مصر" }, ... ], "note": "تحذير طبي قصير" }.\n\n' +
        'اسم الدواء: ' +
        prompt;
    }

    // نبني messages بسيطة: system + user
    var messages = [
      {
        role: 'system',
        content:
          toolType === 'drug-alt'
            ? 'أنت مساعد طبي وصيدلي مصري، لا تعطي جرعات، فقط معلومات عامة وبدائل.'
            : 'أنت مساعد عربي ودود يقدّم إجابات واضحة ومختصرة.',
      },
      {
        role: 'user',
        content: finalPrompt,
      },
    ];

    var cfResult = await withTimeout(_cfChat(messages), FAST_TIMEOUT).catch(
      function () {
        return null;
      }
    );

    if (cfResult) return cfResult;

    // لو فشل الـ Worker
    return {
      text:
        'تعذر الاتصال بخادم الذكاء الاصطناعي الآن، حاول مرة أخرى لاحقاً.',
      source: 'CF-Worker-fail',
      raw: null,
    };
  }

  /* ══════════════════════════════════ واجهة عامة للاستخدام من باقي السكربتات ══════════════════════════════════ */

  /* ══════ universalChat — دالة عامة لإرسال messages array مباشرةً للـ Worker ══════ */
  /**
   * universalChat(messages)
   * messages: [{role:'system',content:'...'},{role:'user',content:'...'}]
   * returns: {text, source, raw} أو null
   */
  async function universalChat(messages) {
    if (!Array.isArray(messages) || !messages.length) {
      return { text: 'الرجاء إدخال نص للاستعلام.', source: 'local', raw: null };
    }
    var cfResult = await withTimeout(_cfChat(messages), FAST_TIMEOUT).catch(function () { return null; });
    if (cfResult) return cfResult;
    return {
      text: 'تعذر الاتصال بخادم الذكاء الاصطناعي الآن، حاول مرة أخرى لاحقاً.',
      source: 'CF-Worker-fail',
      raw: null,
    };
  }

  // تصدير universalChat كدالة عامة
  global.universalChat = universalChat;

  // API عام: TayyibatAI.chat
  global.TayyibatAI = {
    /**
     * chat(prompt, toolType, extra)
     * مثال:
     *   TayyibatAI.chat('كونترولوك', 'drug-alt')
     */
    chat: async function (prompt, toolType, extra) {
      return smartChat(prompt, {
        toolType: toolType,
        extra: extra,
      });
    },

    // دالة مختصّة لأداة بدائل الأدوية
    drugAlternatives: async function (drugName) {
      return smartChat(drugName, { toolType: 'drug-alt' });
    },
  };
})(window);
