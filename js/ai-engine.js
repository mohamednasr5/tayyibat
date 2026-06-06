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

        // 1) لو Worker رجع result كسلسلة JSON (حالة بدائل الأدوية)
        if (data && typeof data.result === 'string') {
          try {
            var parsed = JSON.parse(data.result);

            // لو نتيجة بدائل أدوية
            if (
              parsed.drug_name ||
              parsed.active_ingredient ||
              parsed.alternatives
            ) {
              responseText =
                'اسم الدواء: ' +
                (parsed.drug_name || 'غير معروف') +
                '\n' +
                'المادة الفعالة: ' +
                (parsed.active_ingredient || 'غير معروفة');

              if (Array.isArray(parsed.alternatives) && parsed.alternatives.length) {
                responseText +=
                  '\nالبدائل المتاحة في مصر:\n' +
                  parsed.alternatives
                    .map(function (a, i) {
                      var line =
                        (i + 1) +
                        '- ' +
                        (a.name || 'بديل') +
                        (a.dose ? ' — ' + a.dose : '');
                      if (a.company) line += ' — ' + a.company;
                      if (a.country) line += ' [' + a.country + ']';
                      return line;
                    })
                    .join('\n');
              }

              if (parsed.note) {
                responseText += '\n\nملاحظة: ' + parsed.note;
              }
            } else if (parsed.text) {
              responseText = parsed.text;
            } else {
              responseText = JSON.stringify(parsed);
            }
          } catch (e) {
            // ليست JSON، استخدمها كما هي
            responseText = data.result;
          }
        }

        // 2) لو result ككائن
        if (!responseText && data && typeof data.result === 'object') {
          var r = data.result;
          if (r.response && typeof r.response === 'string') {
            responseText = r.response;
          } else if (r.text && typeof r.text === 'string') {
            responseText = r.text;
          } else {
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
