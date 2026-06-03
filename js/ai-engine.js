/**
 * ══════════════════════════════════════════════════════════════════
 *  🌿 طيبات — محرك الذكاء الاصطناعي المجاني
 *  ai-engine.js  |  v2.0  |  100% Free & Open-Source
 *
 *  المكتبات المستخدمة:
 *  - Transformers.js  → تشغيل نماذج HuggingFace في المتصفح
 *  - Tesseract.js     → OCR عربي/إنجليزي بدون خادم
 *  - Pollinations.ai  → نصوص وصور بدون مفتاح API
 *  - OpenRouter       → نماذج مجانية (اختياري، إذا توفر مفتاح)
 *
 *  الاستخدام:
 *    window.TayyibatAI.chat(prompt)           → رد نصي
 *    window.TayyibatAI.vision(imageUrl, q)    → تحليل صورة
 *    window.TayyibatAI.ocr(imageUrl)          → استخراج نص
 *    window.TayyibatAI.foodLookup(query)      → بحث Open Food Facts
 *    window.TayyibatAI.barcode(code)          → بحث بالباركود
 *    window.TayyibatAI.drugLookup(name)       → بحث الأدوية
 *    window.TayyibatAI.carcinogenCheck(name)  → فحص المواد المسرطنة
 * ══════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  /* ─────────────────────────────────────────────
     0. الثوابت والإعدادات
  ───────────────────────────────────────────── */
  var CFG = {
    // Pollinations — مجاني 100% بدون مفتاح
    pollinationsText:   'https://text.pollinations.ai/openai',
    pollinationsImage:  'https://image.pollinations.ai/prompt/',

    // OpenRouter — اختياري (نماذج مجانية بمفتاح مجاني)
    openrouterEndpoint: 'https://openrouter.ai/api/v1/chat/completions',

    // Open Food Facts — مجاني بالكامل
    offSearch:  'https://world.openfoodfacts.org/cgi/search.pl',
    offBarcode: 'https://world.openfoodfacts.org/api/v2/product/',

    // DailyMed — قاعدة بيانات الأدوية الأمريكية المجانية
    dailymedSearch: 'https://dailymed.nlm.nih.gov/dailymed/services/v2/drugnames.json',
    dailymedSPL:    'https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json',

    // OpenFDA — مجاني
    fdaDrugSearch: 'https://api.fda.gov/drug/label.json',

    // Tesseract CDN — OCR محلي
    tesseractCDN: 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js',

    // نماذج Pollinations المتاحة
    polModels: [
      'openai',           // GPT-4o-mini مجاناً
      'openai-large',     // GPT-4o مجاناً
      'mistral',          // Mistral Large
      'llama',            // Llama 3.3 70B
      'qwen-coder',       // Qwen 2.5
      'deepseek',         // DeepSeek V3
      'claude-hybridspace' // Claude عبر Pollinations
    ],

    // نماذج OpenRouter المجانية
    orFreeModels: [
      'deepseek/deepseek-chat',
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemma-2-9b-it:free',
      'mistralai/mistral-7b-instruct:free',
      'qwen/qwen-2.5-7b-instruct:free'
    ],

    // الحد الزمني للطلبات
    timeoutMs: 12000
  };

  /* ─────────────────────────────────────────────
     1. مساعدات عامة
  ───────────────────────────────────────────── */
  function timeout(ms) {
    return new Promise(function (_, rej) {
      setTimeout(function () { rej(new Error('TIMEOUT')); }, ms);
    });
  }

  function race(promise, ms) {
    return Promise.race([promise, timeout(ms || CFG.timeoutMs)]);
  }

  function parsePollinationsResp(data) {
    if (!data) return null;
    var choices = data.choices;
    if (choices && choices[0] && choices[0].message)
      return choices[0].message.content || null;
    if (typeof data === 'string') return data;
    return null;
  }

  /* ─────────────────────────────────────────────
     2. Pollinations — النص
  ───────────────────────────────────────────── */
  async function pollinationsChat(sysPrompt, userMsg, modelId) {
    modelId = modelId || 'openai';
    var body = {
      model: modelId,
      messages: [
        { role: 'system', content: sysPrompt || 'أنت مساعد صحي مفيد باللغة العربية.' },
        { role: 'user',   content: userMsg }
      ],
      temperature: 0.7,
      max_tokens: 1200
    };
    var res = await race(
      fetch(CFG.pollinationsText, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    );
    if (!res.ok) return null;
    var data = await res.json();
    return parsePollinationsResp(data);
  }

  /* ─────────────────────────────────────────────
     3. Pollinations — رؤية الصور (Vision)
  ───────────────────────────────────────────── */
  async function pollinationsVision(imageDataUrl, prompt, modelId) {
    modelId = modelId || 'openai-large'; // GPT-4o يفهم الصور
    var base64 = imageDataUrl.split(',')[1];
    var mtype  = imageDataUrl.split(';')[0].split(':')[1] || 'image/jpeg';

    var body = {
      model: modelId,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: 'data:' + mtype + ';base64,' + base64 } },
          { type: 'text',      text: prompt }
        ]
      }],
      max_tokens: 1000
    };

    var res = await race(
      fetch(CFG.pollinationsText, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    );
    if (!res.ok) return null;
    var data = await res.json();
    return parsePollinationsResp(data);
  }

  /* ─────────────────────────────────────────────
     4. OpenRouter — نصوص (احتياطي مع مفتاح مجاني)
  ───────────────────────────────────────────── */
  async function openrouterChat(sysPrompt, userMsg, modelId) {
    var key = window.__OR_KEY_FB || window.__OR_KEY;
    if (!key) return null;
    modelId = modelId || CFG.orFreeModels[0];

    var body = {
      model: modelId,
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user',   content: userMsg }
      ],
      temperature: 0.7,
      max_tokens: 1200
    };

    var res = await race(
      fetch(CFG.openrouterEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key,
          'HTTP-Referer': 'https://tayyibat.online',
          'X-Title': 'طيبات'
        },
        body: JSON.stringify(body)
      }),
      20000
    );
    if (!res.ok) return null;
    var data = await res.json();
    return parsePollinationsResp(data);
  }

  /* ─────────────────────────────────────────────
     5. المحرك الرئيسي للدردشة — يحاول بالترتيب
  ───────────────────────────────────────────── */
  var _polIdx = 0;

  async function smartChat(sysPrompt, userMsg) {
    // أولاً: OpenRouter إذا توفر مفتاح
    var orResult = await openrouterChat(sysPrompt, userMsg).catch(function () { return null; });
    if (orResult) return { text: orResult, source: 'openrouter' };

    // ثانياً: Pollinations بنماذج مختلفة
    for (var i = 0; i < CFG.polModels.length; i++) {
      var idx = (_polIdx + i) % CFG.polModels.length;
      var model = CFG.polModels[idx];
      try {
        var res = await pollinationsChat(sysPrompt, userMsg, model);
        if (res) {
          _polIdx = (idx + 1) % CFG.polModels.length;
          return { text: res, source: 'pollinations:' + model };
        }
      } catch (e) { /* جرّب النموذج التالي */ }
    }

    // ثالثاً: رد محلي مولّد
    return { text: _localFallback(userMsg), source: 'local' };
  }

  /* ─────────────────────────────────────────────
     6. رد محلي احتياطي (بدون إنترنت)
  ───────────────────────────────────────────── */
  var LOCAL_TIPS = [
    'تناول الطعام الحقيقي غير المصنّع قدر الإمكان.',
    'شرب الماء الكافي يحسن الهضم ويقلل الشهية.',
    'الصيام المتقطع يساعد على تحسين حساسية الأنسولين.',
    'مرق العظام غني بالكولاجين ومفيد للأمعاء والمفاصل.',
    'قلّل السكر المكرر والنشويات البيضاء للحفاظ على وزن صحي.',
    'النوم المبكر ينظّم هرمونات الجوع والشبع.',
    'المشي بعد الوجبات يحسن حرق السعرات الحرارية.',
    'زيت الزيتون والسمن البلدي من أفضل مصادر الدهون الصحية.'
  ];
  var _localIdx = 0;

  function _localFallback(question) {
    // بحث بسيط بالكلمات المفتاحية
    var q = question.toLowerCase();
    if (q.includes('صيام') || q.includes('fasting'))
      return 'الصيام المتقطع (16:8) من أفضل الطرق لتحسين الأيض وفقدان الوزن. ابدأ بصيام 12 ساعة ثم زد تدريجياً. تأكد من شرب الماء بكثرة أثناء الصيام.';
    if (q.includes('سكري') || q.includes('سكر') || q.includes('diabetes'))
      return 'لمرضى السكري: قلّل النشويات البيضاء والسكر المكرر، وركّز على البروتين والدهون الصحية والخضار المطهوة. المشي بعد الوجبات يساعد كثيراً.';
    if (q.includes('وزن') || q.includes('رجيم') || q.includes('دايت'))
      return 'لإنقاص الوزن بصورة صحية: تناول الطعام الحقيقي، قلّل السكر والمصنّع، مارس الصيام المتقطع، وانم مبكراً. الجسم يحتاج وقتاً — لا تتعجل النتائج.';
    if (q.includes('ضغط') || q.includes('blood pressure'))
      return 'لضغط الدم: قلّل الملح المكرر والإجهاد. زد الماء والأطعمة الغنية بالبوتاسيوم كالبطاطا والأفوكادو. الصيام المتقطع يساعد على تخفيض الضغط.';
    // نصيحة عامة
    var tip = LOCAL_TIPS[_localIdx % LOCAL_TIPS.length];
    _localIdx++;
    return '💡 ' + tip + '\n\n(هذا رد محلي — تأكد من الاتصال بالإنترنت للحصول على تحليل كامل من الذكاء الاصطناعي.)';
  }

  /* ─────────────────────────────────────────────
     7. OCR — استخراج النص من الصور (Tesseract.js)
  ───────────────────────────────────────────── */
  var _tesseractLoaded = false;
  var _tesseractWorker = null;

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
    lang = lang || 'ara+eng'; // عربي + إنجليزي
    try {
      await _loadTesseract();
      var Tesseract = window.Tesseract;
      if (!Tesseract) throw new Error('Tesseract not loaded');

      var result = await Tesseract.recognize(imageDataUrl, lang, {
        logger: function (m) {
          if (m.status === 'recognizing text' && global.onOCRProgress)
            global.onOCRProgress(Math.round(m.progress * 100));
        }
      });
      return (result.data && result.data.text) ? result.data.text.trim() : '';
    } catch (e) {
      // fallback: اطلب من Pollinations Vision
      return await pollinationsVision(
        imageDataUrl,
        'استخرج كل النص الموجود في هذه الصورة بدقة. أعد النص كما هو دون أي تعديل أو تفسير. إذا كان النص عربياً فأعده عربياً، وإذا كان إنجليزياً فأعده إنجليزياً.'
      ).catch(function () { return ''; });
    }
  }

  /* ─────────────────────────────────────────────
     8. Open Food Facts — بحث الطعام
  ───────────────────────────────────────────── */
  async function foodSearch(query, maxResults) {
    maxResults = maxResults || 5;
    var url = CFG.offSearch + '?' + new URLSearchParams({
      search_terms: query,
      search_simple: 1,
      action: 'process',
      json: 1,
      page_size: maxResults,
      fields: 'product_name,brands,ingredients_text,nutriments,nutriscore_grade,ecoscore_grade,additives_tags,allergens,image_url,code'
    });
    var res = await race(fetch(url), 8000);
    if (!res.ok) return [];
    var data = await res.json();
    return _formatOFFProducts(data.products || []);
  }

  async function foodBarcode(barcode) {
    var url = CFG.offBarcode + encodeURIComponent(barcode) + '.json';
    var res = await race(fetch(url), 8000);
    if (!res.ok) return null;
    var data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    var products = _formatOFFProducts([data.product]);
    return products[0] || null;
  }

  function _formatOFFProducts(products) {
    return products.filter(Boolean).map(function (p) {
      var n = p.nutriments || {};
      return {
        name:        p.product_name || 'غير محدد',
        brand:       p.brands || '',
        code:        p.code || '',
        ingredients: p.ingredients_text || '',
        image:       p.image_url || '',
        nutriscore:  (p.nutriscore_grade || '').toUpperCase(),
        ecoscore:    (p.ecoscore_grade || '').toUpperCase(),
        additives:   p.additives_tags || [],
        allergens:   p.allergens || '',
        calories:    Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
        fat:         (n.fat_100g || 0).toFixed(1),
        carbs:       (n.carbohydrates_100g || 0).toFixed(1),
        protein:     (n.proteins_100g || 0).toFixed(1),
        sugar:       (n.sugars_100g || 0).toFixed(1),
        salt:        (n.salt_100g || 0).toFixed(2),
        fiber:       (n.fiber_100g || 0).toFixed(1)
      };
    });
  }

  /* ─────────────────────────────────────────────
     9. البحث عن الأدوية (DailyMed + OpenFDA)
  ───────────────────────────────────────────── */
  async function drugSearch(name) {
    var results = [];

    // OpenFDA — أسرع وأشمل
    try {
      var fdaUrl = CFG.fdaDrugSearch + '?search=openfda.generic_name:"' + encodeURIComponent(name) + '"&limit=3';
      var fdaRes = await race(fetch(fdaUrl), 8000);
      if (fdaRes.ok) {
        var fdaData = await fdaRes.json();
        if (fdaData.results) {
          fdaData.results.forEach(function (item) {
            var ofd = item.openfda || {};
            results.push({
              source: 'openfda',
              name: (ofd.brand_name && ofd.brand_name[0]) || (ofd.generic_name && ofd.generic_name[0]) || name,
              generic: ofd.generic_name ? ofd.generic_name[0] : '',
              brand: ofd.brand_name ? ofd.brand_name[0] : '',
              manufacturer: ofd.manufacturer_name ? ofd.manufacturer_name[0] : '',
              route: ofd.route ? ofd.route[0] : '',
              indications: (item.indications_and_usage || [''])[0].substring(0, 400),
              warnings: (item.warnings || [''])[0].substring(0, 400),
              dosage: (item.dosage_and_administration || [''])[0].substring(0, 300),
              interactions: (item.drug_interactions || [''])[0].substring(0, 300)
            });
          });
        }
      }
    } catch (e) {}

    // DailyMed — احتياطي
    if (results.length === 0) {
      try {
        var dmUrl = CFG.dailymedSearch + '?drug_name=' + encodeURIComponent(name) + '&pagesize=5';
        var dmRes = await race(fetch(dmUrl), 8000);
        if (dmRes.ok) {
          var dmData = await dmRes.json();
          if (dmData.data) {
            dmData.data.forEach(function (item) {
              results.push({
                source: 'dailymed',
                name: item.drug_name || name,
                generic: '',
                brand: item.drug_name || '',
                manufacturer: '',
                route: '',
                indications: '',
                warnings: '',
                dosage: '',
                interactions: ''
              });
            });
          }
        }
      } catch (e) {}
    }

    return results;
  }

  /* ─────────────────────────────────────────────
     10. فحص المواد المضافة والمسرطنة
         (IARC Groups + E-number database)
  ───────────────────────────────────────────── */
  // قاعدة بيانات مدمجة لأشهر المواد المضافة والمسرطنة
  var ADDITIVES_DB = {
    // المواد المسرطنة المؤكدة — المجموعة 1 (IARC)
    'E250': { name: 'نيتريت الصوديوم', risk: 'high', iarc: 1, note: 'مسرطن مؤكد — مرتبط بسرطان القولون' },
    'E249': { name: 'نيتريت البوتاسيوم', risk: 'high', iarc: 1, note: 'مسرطن مؤكد' },
    'E251': { name: 'نيترات الصوديوم', risk: 'medium', iarc: '2A', note: 'مسرطن محتمل' },
    'E621': { name: 'غلوتامات أحادي الصوديوم (MSG)', risk: 'medium', note: 'مثير للجدل — حساسية لدى بعض الأشخاص' },
    'E211': { name: 'بنزوات الصوديوم', risk: 'medium', note: 'قد يتحول لمادة مسرطنة مع فيتامين C' },
    'E102': { name: 'تارترازين', risk: 'medium', note: 'صبغة اصطناعية — فرط نشاط لدى الأطفال' },
    'E110': { name: 'صانسيت يلو FCF', risk: 'medium', note: 'صبغة اصطناعية — حساسية' },
    'E129': { name: 'ألورا ريد', risk: 'medium', note: 'صبغة حمراء اصطناعية' },
    'E320': { name: 'BHA', risk: 'medium', iarc: '2B', note: 'مسرطن محتمل' },
    'E321': { name: 'BHT', risk: 'medium', note: 'مضاد أكسدة — مثير للجدل' },
    'E330': { name: 'حمض الستريك', risk: 'low', note: 'آمن عموماً' },
    'E300': { name: 'حمض الأسكوربيك (فيتامين C)', risk: 'safe', note: 'آمن تماماً' },
    'E440': { name: 'البكتين', risk: 'safe', note: 'آمن — من الفواكه' },
    'E471': { name: 'أحادي وثنائي جليسريدات الأحماض الدهنية', risk: 'medium', note: 'مشتق من الدهون — قد يكون من مصادر حيوانية' },
    'E472e': { name: 'DATEM', risk: 'medium', note: 'مستحلب مصنّع' },
    'E951': { name: 'أسبارتام', risk: 'medium', iarc: '2B', note: 'مسرطن محتمل — 2023' },
    'E954': { name: 'السكارين', risk: 'medium', note: 'حلو صناعي — ارتبط بالسرطان في الفئران' },
    'E955': { name: 'سكرالوز', risk: 'low', note: 'حلو صناعي — دراسات مستمرة' },
    'E150d': { name: 'كراميل IV', risk: 'medium', note: 'صبغة كراميل — تحتوي على 4-MEI المسرطن المحتمل' },
    'E407': { name: 'الكاراجينان', risk: 'medium', note: 'مكثّف — مثير للجدل صحياً للأمعاء' },
    'E420': { name: 'السوربيتول', risk: 'low', note: 'سكر كحولي — آمن بكميات معتدلة' },
    'E120': { name: 'كارمين (أحمر الكوشنيل)', risk: 'medium', note: 'مستخرج من حشرات — حلال؟ راجع علماءك' },
    'E441': { name: 'الجيلاتين', risk: 'medium', note: 'من عظام الحيوانات — حلال؟ راجع علماءك' }
  };

  function checkAdditives(ingredientsText) {
    var found = [];
    var text = ingredientsText.toUpperCase();

    Object.keys(ADDITIVES_DB).forEach(function (code) {
      if (text.includes(code.toUpperCase())) {
        found.push(Object.assign({ code: code }, ADDITIVES_DB[code]));
      }
    });

    // فحص بالاسم أيضاً
    var nameMap = {
      'aspartame': 'E951', 'أسبارتام': 'E951',
      'sodium nitrite': 'E250', 'نيتريت الصوديوم': 'E250',
      'msg': 'E621', 'glutamate': 'E621', 'غلوتامات': 'E621',
      'bha': 'E320', 'bht': 'E321',
      'sodium benzoate': 'E211', 'بنزوات': 'E211',
      'tartrazine': 'E102', 'تارترازين': 'E102',
      'carrageenan': 'E407', 'كاراجينان': 'E407',
      'saccharin': 'E954', 'سكارين': 'E954',
      'sucralose': 'E955', 'سكرالوز': 'E955',
      'carmine': 'E120', 'كارمين': 'E120',
      'gelatin': 'E441', 'جيلاتين': 'E441'
    };

    var lowerText = ingredientsText.toLowerCase();
    Object.keys(nameMap).forEach(function (keyword) {
      if (lowerText.includes(keyword)) {
        var code = nameMap[keyword];
        if (ADDITIVES_DB[code] && !found.some(function (f) { return f.code === code; })) {
          found.push(Object.assign({ code: code }, ADDITIVES_DB[code]));
        }
      }
    });

    return found;
  }

  /* ─────────────────────────────────────────────
     11. تحليل الصورة للمنتج (Vision + OCR + OFF)
  ───────────────────────────────────────────── */
  async function analyzeProductImage(imageDataUrl) {
    var result = { barcode: null, productName: null, ingredients: null, food: null, additives: [] };

    // 1) حاول قراءة الباركود عبر BarcodeDetector
    if ('BarcodeDetector' in window) {
      try {
        var detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code'] });
        var img = new Image();
        img.src = imageDataUrl;
        await new Promise(function (res) { img.onload = res; });
        var codes = await detector.detect(img);
        if (codes && codes.length) {
          result.barcode = codes[0].rawValue;
          result.food = await foodBarcode(result.barcode).catch(function () { return null; });
        }
      } catch (e) {}
    }

    // 2) Vision AI لاسم المنتج
    if (!result.productName) {
      try {
        var namePrompt = 'انظر لهذه الصورة. إذا وجدت منتجاً أو طعاماً أو دواءً، اذكر اسمه التجاري فقط بدون أي شرح. إذا كان هناك باركود اذكره. أجب بسطر واحد فقط.';
        var visionRes = await pollinationsVision(imageDataUrl, namePrompt);
        if (visionRes) result.productName = visionRes.trim().split('\n')[0];
      } catch (e) {}
    }

    // 3) OCR للمكونات
    try {
      var ocrText = await ocrImage(imageDataUrl, 'ara+eng');
      if (ocrText && ocrText.length > 20) {
        result.ingredients = ocrText;
        result.additives = checkAdditives(ocrText);
      }
    } catch (e) {}

    // 4) بحث في Open Food Facts
    if (!result.food && result.productName) {
      var foods = await foodSearch(result.productName, 3).catch(function () { return []; });
      if (foods.length) result.food = foods[0];
    }

    return result;
  }

  /* ─────────────────────────────────────────────
     12. تحليل الروشتة (OCR + Vision + AI)
  ───────────────────────────────────────────── */
  async function analyzePrescription(imageDataUrl, textFallback) {
    var extractedText = textFallback || '';

    if (imageDataUrl && !textFallback) {
      // أولاً OCR
      extractedText = await ocrImage(imageDataUrl, 'ara+eng').catch(function () { return ''; });

      // إذا كان النص قصيراً جداً، استخدم Vision
      if (extractedText.length < 30) {
        var visionPrompt = 'هذه صورة روشتة طبية. اقرأ جميع أسماء الأدوية والجرعات والتعليمات المكتوبة فيها بدقة. أعد النص كما هو.';
        extractedText = await pollinationsVision(imageDataUrl, visionPrompt).catch(function () { return extractedText; });
      }
    }

    if (!extractedText) return null;

    var sysPrompt = 'أنت صيدلاني ومساعد طبي محترف. تحلل وصفات طبية وتشرحها للمريض بوضوح.';
    var userPrompt = 'هذا نص الروشتة الطبية:\n\n' + extractedText + '\n\n'
      + 'قدم لي التالي بالتنسيق التالي:\n'
      + 'دواء_1:\n  الاسم: [اسم الدواء]\n  النوع: [أقراص/شراب/حقن/إلخ]\n  التركيز: [mg إذا ذُكر]\n  الجرعة: [كيفية ووقت الأخذ]\n\n'
      + 'كرر لكل دواء. أجب بالعربية فقط.';

    return await smartChat(sysPrompt, userPrompt);
  }

  /* ─────────────────────────────────────────────
     13. تحليل التقرير الطبي
  ───────────────────────────────────────────── */
  async function analyzeMedicalReport(imageDataUrl, textFallback) {
    var extractedText = textFallback || '';

    if (imageDataUrl && !textFallback) {
      extractedText = await ocrImage(imageDataUrl, 'ara+eng').catch(function () { return ''; });
      if (extractedText.length < 30) {
        var visionPrompt = 'هذه صورة تقرير طبي أو تحاليل. اقرأ جميع الأرقام والقيم والنتائج بدقة.';
        extractedText = await pollinationsVision(imageDataUrl, visionPrompt).catch(function () { return extractedText; });
      }
    }

    if (!extractedText) return null;

    var sysPrompt = 'أنت طبيب ومساعد صحي. تشرح نتائج التحاليل الطبية للمريض بلغة بسيطة مفهومة مع توضيح القيم الطبيعية والغير طبيعية.';
    var userPrompt = 'هذا نص التقرير/التحليل الطبي:\n\n' + extractedText + '\n\n'
      + 'اشرح:\n1. ماذا تعني كل قيمة\n2. هل هي ضمن النطاق الطبيعي؟\n3. ما الذي يجب الانتباه إليه؟\n4. نصائح عامة\n\n'
      + 'أجب بالعربية. أضف في النهاية: "هذا شرح توعوي فقط، استشر طبيبك."';

    return await smartChat(sysPrompt, userPrompt);
  }

  /* ─────────────────────────────────────────────
     14. الواجهة العامة للمكتبة
  ───────────────────────────────────────────── */
  var TayyibatAI = {
    /**
     * دردشة نصية ذكية
     * @param {string} prompt - السؤال
     * @param {string} [systemContext] - سياق النظام
     */
    chat: function (prompt, systemContext) {
      var sys = systemContext || (
        typeof buildUserContext === 'function'
          ? buildUserContext()
          : 'أنت مساعد صحي تابع لنظام طيبات. تتحدث بالعربية وتقدم نصائح صحية مفيدة.'
      );
      return smartChat(sys, prompt);
    },

    /**
     * تحليل صورة
     * @param {string} imageDataUrl - الصورة بصيغة base64
     * @param {string} question - السؤال عن الصورة
     */
    vision: function (imageDataUrl, question) {
      return pollinationsVision(imageDataUrl, question)
        .then(function (text) { return { text: text, source: 'pollinations-vision' }; })
        .catch(function () {
          return ocrImage(imageDataUrl).then(function (t) {
            return { text: t, source: 'ocr-fallback' };
          });
        });
    },

    /**
     * استخراج النص من صورة (OCR)
     * @param {string} imageDataUrl - الصورة بصيغة base64
     * @param {string} [lang] - اللغة (افتراضي: ara+eng)
     */
    ocr: function (imageDataUrl, lang) {
      return ocrImage(imageDataUrl, lang);
    },

    /**
     * بحث المنتجات الغذائية
     * @param {string} query - اسم المنتج أو المكوّن
     */
    foodLookup: function (query) {
      return foodSearch(query);
    },

    /**
     * بحث بالباركود
     * @param {string} barcode - رقم الباركود
     */
    barcode: function (barcode) {
      return foodBarcode(barcode);
    },

    /**
     * بحث الأدوية
     * @param {string} name - اسم الدواء
     */
    drugLookup: function (name) {
      return drugSearch(name);
    },

    /**
     * فحص المواد المضافة والمسرطنة في قائمة المكونات
     * @param {string} ingredientsText - نص المكونات
     */
    carcinogenCheck: function (ingredientsText) {
      return checkAdditives(ingredientsText);
    },

    /**
     * تحليل صورة منتج كامل (باركود + OCR + Vision + OFF)
     * @param {string} imageDataUrl - صورة المنتج
     */
    analyzeProduct: function (imageDataUrl) {
      return analyzeProductImage(imageDataUrl);
    },

    /**
     * تحليل روشتة طبية
     * @param {string|null} imageDataUrl - صورة الروشتة
     * @param {string|null} [text] - نص بديل
     */
    analyzePrescription: function (imageDataUrl, text) {
      return analyzePrescription(imageDataUrl, text);
    },

    /**
     * تحليل تقرير طبي
     * @param {string|null} imageDataUrl - صورة التقرير
     * @param {string|null} [text] - نص بديل
     */
    analyzeMedicalReport: function (analyzeMedicalReportImg, text) {
      return analyzeMedicalReport(analyzeMedicalReportImg, text);
    },

    /**
     * الرد المحلي الاحتياطي (بدون إنترنت)
     */
    localFallback: function (question) {
      return { text: _localFallback(question), source: 'local' };
    },

    /**
     * قاعدة بيانات المواد المضافة
     */
    additivesDB: ADDITIVES_DB,

    /**
     * الإصدار
     */
    version: '2.0.0'
  };

  /* ─────────────────────────────────────────────
     15. تصدير إلى النافذة
  ───────────────────────────────────────────── */
  global.TayyibatAI = TayyibatAI;

  // توافق مع الكود القديم — يُرسل _callClaudeAPI
  global._callClaudeAPI = function (prompt, imageDataUrl) {
    if (imageDataUrl) {
      return pollinationsVision(imageDataUrl, prompt);
    }
    return smartChat(
      (typeof buildUserContext === 'function' ? buildUserContext() : 'أنت مساعد صحي.'),
      prompt
    ).then(function (r) { return r.text; });
  };

  global._callClaudeAPIWithImage = function (prompt, imageDataUrl) {
    return pollinationsVision(imageDataUrl, prompt);
  };

  global._smartVisionAnalysis = function (imageDataUrl, prompt) {
    return pollinationsVision(imageDataUrl, prompt)
      .then(function (text) { return { text: text }; });
  };

  console.log('[TayyibatAI] ✅ محرك الذكاء الاصطناعي المجاني جاهز — v' + TayyibatAI.version);

})(window);
