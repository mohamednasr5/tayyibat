/** 
 * ══════════════════════════════════════════════════════════════════
 *  🌿 طيبات — خدمة البيانات المجانية
 *  data-service.js  |  v2.0
 *
 *  المصادر:
 *  - Open Food Facts  → ملايين المنتجات الغذائية مع الباركود
 *  - OpenFDA          → قاعدة بيانات الأدوية الأمريكية
 *  - DailyMed         → معلومات الأدوية التفصيلية
 *  - IARC Monographs  → المواد المسرطنة (مدمجة)
 *  - WHO ICD Codes    → تصنيف الأمراض
 *  - IndexedDB        → تخزين محلي سريع (SQLite بديل للمتصفح)
 * ══════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  /* ─────────────────────────────────────────────
     1. IndexedDB — التخزين المحلي السريع
     (يحل محل SQLite في بيئة المتصفح)
  ───────────────────────────────────────────── */
  var DB_NAME    = 'TayyibatDB';
  var DB_VERSION = 2;
  var _idb       = null;

  function openDB() {
    if (_idb) return Promise.resolve(_idb);
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        // مخزن الطعام
        if (!db.objectStoreNames.contains('foods'))
          db.createObjectStore('foods', { keyPath: 'code' });
        // مخزن الأدوية
        if (!db.objectStoreNames.contains('drugs'))
          db.createObjectStore('drugs', { keyPath: 'name' });
        // مخزن نتائج الذكاء الاصطناعي
        if (!db.objectStoreNames.contains('ai_cache'))
          db.createObjectStore('ai_cache', { keyPath: 'key' });
        // مخزن نشاط المستخدم
        if (!db.objectStoreNames.contains('activity'))
          db.createObjectStore('activity', { keyPath: 'ts' });
      };
      req.onsuccess = function (e) { _idb = e.target.result; resolve(_idb); };
      req.onerror   = function (e) { reject(e.target.error); };
    });
  }

  function dbGet(store, key) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx  = db.transaction(store, 'readonly');
        var req = tx.objectStore(store).get(key);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror   = function () { resolve(null); };
      });
    });
  }

  function dbPut(store, value) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx  = db.transaction(store, 'readwrite');
        var req = tx.objectStore(store).put(value);
        req.onsuccess = function () { resolve(true); };
        req.onerror   = function () { resolve(false); };
      });
    });
  }

  function dbGetAll(store) {
    return openDB().then(function (db) {
      return new Promise(function (resolve) {
        var tx  = db.transaction(store, 'readonly');
        var req = tx.objectStore(store).getAll();
        req.onsuccess = function () { resolve(req.result || []); };
        req.onerror   = function () { resolve([]); };
      });
    });
  }

  /* ─────────────────────────────────────────────
     2. Cache للطلبات الشبكية (يوم واحد)
  ───────────────────────────────────────────── */
  var CACHE_TTL = 24 * 60 * 60 * 1000; // 24 ساعة

  async function cachedFetch(url, parseJSON) {
    var cacheKey = url;
    var cached   = await dbGet('ai_cache', cacheKey).catch(function () { return null; });
    if (cached && (Date.now() - cached.ts) < CACHE_TTL) return cached.data;

    var res  = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    var data = parseJSON !== false ? await res.json() : await res.text();

    await dbPut('ai_cache', { key: cacheKey, data: data, ts: Date.now() }).catch(function () {});
    return data;
  }

  /* ─────────────────────────────────────────────
     3. Open Food Facts — بحث شامل
  ───────────────────────────────────────────── */
  var OFF_BASE = 'https://world.openfoodfacts.org';

  var DataService = {

    /**
     * بحث بالاسم في Open Food Facts
     */
    searchFood: async function (query, options) {
      options = options || {};
      var limit   = options.limit   || 10;
      var country = options.country || 'world'; // يمكن: sa, eg, kw, ae
      var lang    = options.lang    || 'ar,en';

      var url = OFF_BASE + '/cgi/search.pl?' + new URLSearchParams({
        search_terms:   query,
        search_simple:  1,
        action:         'process',
        json:           1,
        page_size:      limit,
        fields:         'product_name,product_name_ar,brands,ingredients_text,ingredients_text_ar,nutriments,nutriscore_grade,ecoscore_grade,additives_tags,allergens,image_url,code,categories,quantity,serving_size',
        lc:             'ar,en',
        cc:             country
      });

      try {
        var data = await cachedFetch(url);
        return (data && data.products) ? data.products.map(DataService._formatFood) : [];
      } catch (e) { return []; }
    },

    /**
     * بحث بالباركود
     */
    lookupBarcode: async function (barcode) {
      var cached = await dbGet('foods', barcode).catch(function () { return null; });
      if (cached && (Date.now() - (cached._ts || 0)) < CACHE_TTL) return cached;

      var url = OFF_BASE + '/api/v2/product/' + encodeURIComponent(barcode) + '.json?fields=product_name,product_name_ar,brands,ingredients_text,ingredients_text_ar,nutriments,nutriscore_grade,additives_tags,allergens,image_url,code,categories';
      try {
        var data = await cachedFetch(url);
        if (!data || data.status !== 1 || !data.product) return null;
        var product = DataService._formatFood(data.product);
        product._ts = Date.now();
        await dbPut('foods', product).catch(function () {});
        return product;
      } catch (e) { return null; }
    },

    /**
     * تنسيق منتج OFF
     */
    _formatFood: function (p) {
      if (!p) return null;
      var n = p.nutriments || {};
      var nameAr = p.product_name_ar || p.product_name || 'غير محدد';
      var ingAr  = p.ingredients_text_ar || p.ingredients_text || '';

      // حساب Nutriscore لوني
      var grade = (p.nutriscore_grade || '').toUpperCase();
      var gradeColors = { A: '#1a7a2e', B: '#5cb85c', C: '#f0ad4e', D: '#e07b39', E: '#c0392b' };

      return {
        code:         p.code || '',
        name:         nameAr,
        brand:        p.brands || '',
        ingredients:  ingAr,
        image:        p.image_url || '',
        categories:   p.categories || '',
        quantity:     p.quantity || '',
        serving:      p.serving_size || '100g',
        nutriscore:   grade,
        nutriscoreColor: gradeColors[grade] || '#888',
        ecoscore:     (p.ecoscore_grade || '').toUpperCase(),
        additives:    p.additives_tags || [],
        allergens:    p.allergens || '',
        // قيم غذائية لكل 100 غرام
        nutrition: {
          calories:  Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
          fat:       +(n.fat_100g || 0).toFixed(1),
          saturated: +(n['saturated-fat_100g'] || 0).toFixed(1),
          carbs:     +(n.carbohydrates_100g || 0).toFixed(1),
          sugar:     +(n.sugars_100g || 0).toFixed(1),
          fiber:     +(n.fiber_100g || 0).toFixed(1),
          protein:   +(n.proteins_100g || 0).toFixed(1),
          salt:      +(n.salt_100g || 0).toFixed(2),
          sodium:    +(n.sodium_100g || 0).toFixed(3)
        }
      };
    },

    /* ──────────────────────────────────────────
       4. OpenFDA — قاعدة بيانات الأدوية
    ────────────────────────────────────────── */
    FDA_BASE: 'https://api.fda.gov/drug',

    /**
     * بحث دواء بالاسم
     */
    searchDrug: async function (name, limit) {
      limit = limit || 5;
      var queries = [
        'openfda.generic_name:"' + name + '"',
        'openfda.brand_name:"' + name + '"',
        'openfda.generic_name:' + name,
        'openfda.brand_name:' + name
      ];

      for (var i = 0; i < queries.length; i++) {
        try {
          var url = DataService.FDA_BASE + '/label.json?search=' + encodeURIComponent(queries[i]) + '&limit=' + limit;
          var data = await cachedFetch(url);
          if (data && data.results && data.results.length) {
            return data.results.map(DataService._formatDrug);
          }
        } catch (e) {}
      }
      return [];
    },

    /**
     * بحث تفاعلات الدواء
     */
    drugInteractions: async function (name) {
      var drugs = await DataService.searchDrug(name, 1);
      if (!drugs.length) return null;
      return drugs[0].interactions;
    },

    /**
     * تنسيق دواء FDA
     */
    _formatDrug: function (item) {
      var ofd = item.openfda || {};
      return {
        name:          (ofd.brand_name && ofd.brand_name[0]) || (ofd.generic_name && ofd.generic_name[0]) || 'غير محدد',
        generic:       (ofd.generic_name && ofd.generic_name[0]) || '',
        brand:         (ofd.brand_name  && ofd.brand_name[0])   || '',
        manufacturer:  (ofd.manufacturer_name && ofd.manufacturer_name[0]) || '',
        route:         (ofd.route && ofd.route[0]) || '',
        substance:     (ofd.substance_name && ofd.substance_name[0]) || '',
        indications:   DataService._trim(item.indications_and_usage),
        warnings:      DataService._trim(item.warnings),
        dosage:        DataService._trim(item.dosage_and_administration),
        contraindications: DataService._trim(item.contraindications),
        interactions:  DataService._trim(item.drug_interactions),
        sideEffects:   DataService._trim(item.adverse_reactions),
        storage:       DataService._trim(item.storage_and_handling),
        pregnancy:     DataService._trim(item.pregnancy)
      };
    },

    _trim: function (arr, len) {
      len = len || 500;
      if (!arr || !arr[0]) return '';
      return arr[0].substring(0, len).replace(/\s+/g, ' ').trim();
    },

    /* ──────────────────────────────────────────
       5. DailyMed — أسماء الأدوية
    ────────────────────────────────────────── */
    DAILYMED_BASE: 'https://dailymed.nlm.nih.gov/dailymed/services/v2',

    searchDrugNames: async function (name) {
      var url = DataService.DAILYMED_BASE + '/drugnames.json?drug_name=' + encodeURIComponent(name) + '&pagesize=10';
      try {
        var data = await cachedFetch(url);
        return (data && data.data) ? data.data : [];
      } catch (e) { return []; }
    },

    /* ──────────────────────────────────────────
       6. مجموعة تصنيفات IARC (مدمجة)
          المجموعة 1   = مسرطن مؤكد
          المجموعة 2A  = مسرطن محتمل
          المجموعة 2B  = مسرطن ممكن
          المجموعة 3   = غير مصنف
    ────────────────────────────────────────── */
    IARC_GROUPS: {
      // Group 1 — مسرطن مؤكد
      'Processed meat': { group: 1, ar: 'اللحوم المصنعة', note: 'النقانق، اللانشون، القديد' },
      'Red meat':       { group: '2A', ar: 'اللحوم الحمراء', note: 'عند الإفراط في تناولها' },
      'Formaldehyde':   { group: 1, ar: 'الفورمالديهيد', note: 'مادة حافظة صناعية' },
      'Benzene':        { group: 1, ar: 'البنزين', note: 'مذيب صناعي' },
      'Aflatoxins':     { group: 1, ar: 'السموم الأفلاتوكسينية', note: 'عفن الأغذية المخزنة' },
      'Alcohol':        { group: 1, ar: 'الكحول', note: 'مشروبات كحولية' },
      // Group 2A
      'Acrylamide':     { group: '2A', ar: 'الأكريلاميد', note: 'يتكون في الأطعمة المقلية والمحروقة' },
      'Nitrates':       { group: '2A', ar: 'النيترات (في اللحوم)', note: 'مواد حافظة في اللحوم المصنعة' },
      'Aspartame':      { group: '2B', ar: 'الأسبارتام', note: 'محلي صناعي — IARC 2023' },
      // Group 2B
      'Aloe vera (extract)': { group: '2B', ar: 'مستخلص الصبار', note: 'عند الاستهلاك المفرط' },
      'Pickled vegetables':  { group: '2B', ar: 'الخضار المخللة التقليدية', note: 'أنواع معينة' }
    },

    /**
     * فحص المكون بقاعدة IARC
     */
    checkCarcinogen: function (ingredient) {
      var lc = ingredient.toLowerCase();
      var found = [];
      Object.keys(DataService.IARC_GROUPS).forEach(function (key) {
        if (lc.includes(key.toLowerCase())) {
          found.push(Object.assign({ agent: key }, DataService.IARC_GROUPS[key]));
        }
      });
      return found;
    },

    /* ──────────────────────────────────────────
       7. قاعدة بيانات المكونات الغذائية الشائعة
          (مكتبة محلية للمقارنة الفورية)
    ────────────────────────────────────────── */
    INGREDIENTS_RISKS: {
      // مواد حمراء - يجنبها نظام الطيبات
      'دجاج':           { risk: 'forbidden', reason: 'ممنوع في نظام الطيبات' },
      'بيض':            { risk: 'forbidden', reason: 'ممنوع في نظام الطيبات' },
      'دقيق أبيض':      { risk: 'forbidden', reason: 'ممنوع في نظام الطيبات' },
      'طحين أبيض':      { risk: 'forbidden', reason: 'ممنوع في نظام الطيبات' },
      'حليب سائل':      { risk: 'forbidden', reason: 'ممنوع في نظام الطيبات' },
      'عدس':            { risk: 'forbidden', reason: 'بقوليات — ممنوعة في نظام الطيبات' },
      'فول':            { risk: 'forbidden', reason: 'بقوليات — ممنوعة في نظام الطيبات' },
      'حمص':            { risk: 'forbidden', reason: 'بقوليات — ممنوعة في نظام الطيبات' },
      'سكر أبيض':       { risk: 'forbidden', reason: 'سكر مكرر — ممنوع' },
      'زيت نباتي':      { risk: 'warning', reason: 'يُفضل استخدام زيت الزيتون أو السمن' },
      'مرجرين':         { risk: 'forbidden', reason: 'دهون مهدرجة — ممنوع' },
      // مواد خضراء - مسموح بها
      'أرز':            { risk: 'allowed', reason: 'مسموح' },
      'بطاطس':          { risk: 'allowed', reason: 'مسموح' },
      'سمك':            { risk: 'allowed', reason: 'مسموح ومستحسن' },
      'لحم':            { risk: 'allowed', reason: 'مسموح — يُفضل المشوي' },
      'زيت زيتون':      { risk: 'allowed', reason: 'مسموح ومستحسن' },
      'سمن':            { risk: 'allowed', reason: 'مسموح' },
      'جبن معتق':       { risk: 'allowed', reason: 'مسموح' },
      // مواد صفراء - تحتاج انتباه
      'chicken': { risk: 'forbidden', reason: 'Chicken (دجاج) — ممنوع' },
      'egg':     { risk: 'forbidden', reason: 'Egg (بيض) — ممنوع' }
    },

    /**
     * تحليل قائمة المكونات مقابل قواعد نظام الطيبات
     */
    checkTayyibatRules: function (ingredientsText) {
      var results = { forbidden: [], warnings: [], allowed: [] };
      var lowerText = ingredientsText.toLowerCase();

      Object.keys(DataService.INGREDIENTS_RISKS).forEach(function (ingredient) {
        if (lowerText.includes(ingredient.toLowerCase())) {
          var info = DataService.INGREDIENTS_RISKS[ingredient];
          if (info.risk === 'forbidden') results.forbidden.push({ name: ingredient, reason: info.reason });
          else if (info.risk === 'warning') results.warnings.push({ name: ingredient, reason: info.reason });
          else if (info.risk === 'allowed') results.allowed.push({ name: ingredient, reason: info.reason });
        }
      });

      return results;
    },

    /* ──────────────────────────────────────────
       8. مولّد خطة الوجبات (محلي، بدون AI)
    ────────────────────────────────────────── */
    MEAL_PLANS: {
      // خطة أساسية - نظام طيبات
      default: {
        breakfast: [
          'شوربة عظام مع خضار مطبوخة',
          'بيضتان مع توست من دقيق البر الكامل (للغير ممنوعين)',
          'سلطة خضار مطبوخة مع زيت زيتون',
          'كوب مرق لحم دافئ'
        ],
        lunch: [
          'أرز بسمتي مع قطعة لحم مشوي وخضار مطبوخة',
          'سمكة مشوية مع بطاطس مسلوقة وسلطة مطبوخة',
          'لحم مطبوخ مع كوسا ومرق عظام',
          'تبسي لحم وبطاطس بالفرن'
        ],
        dinner: [
          'شوربة خضار مع قطعة لحم صغيرة',
          'كوب مرق عظام مع خضار مطبوخة',
          'سلطة مطبوخة مع زيت زيتون وليمون',
          'أرز بحليب جوز الهند (بدون سكر)'
        ],
        snacks: [
          'مكسرات طبيعية (جوز، لوز، بندق) — حفنة صغيرة',
          'فاكهة موسمية (تفاح، كمثرى) — باعتدال',
          'جبن معتق مع خيار'
        ]
      }
    },

    generateMealPlan: function (userProfile, days) {
      days = days || 7;
      var plan = DataService.MEAL_PLANS.default;
      var diseases = (userProfile && userProfile.diseases) || [];
      var result = [];

      for (var d = 1; d <= days; d++) {
        var idx = (d - 1) % plan.breakfast.length;
        result.push({
          day: d,
          breakfast: plan.breakfast[idx],
          lunch:     plan.lunch[idx % plan.lunch.length],
          dinner:    plan.dinner[idx % plan.dinner.length],
          snack:     plan.snacks[idx % plan.snacks.length],
          notes: diseases.includes('sugar') ? '⚠️ تجنب النشويات الزائدة — قسّم الوجبات' :
                 diseases.includes('pressure') ? '⚠️ قلل الملح واشرب الماء بكثرة' : ''
        });
      }
      return result;
    },

    /* ──────────────────────────────────────────
       9. حاسبة السعرات الحرارية
    ────────────────────────────────────────── */
    FOODS_CALORIES: {
      'أرز مطبوخ (100غ)': 130, 'خبز أبيض (شريحة)': 79, 'خبز بر (شريحة)': 70,
      'لحم بقري مشوي (100غ)': 217, 'دجاج مشوي (100غ)': 165, 'سمك مشوي (100غ)': 150,
      'بيضة مسلوقة': 78, 'حليب كامل (كوب)': 149, 'جبن معتق (30غ)': 110,
      'بطاطس مسلوقة (100غ)': 87, 'موزة متوسطة': 89, 'تفاحة متوسطة': 52,
      'زيت زيتون (ملعقة كبيرة)': 119, 'سمن (ملعقة كبيرة)': 102,
      'لوز (30غ)': 173, 'جوز (30غ)': 196, 'تمرة واحدة': 20
    },

    calculateCalories: function (foods) {
      return foods.reduce(function (total, food) {
        return total + (DataService.FOODS_CALORIES[food] || 0);
      }, 0);
    },

    /**
     * حساب BMR + TDEE
     */
    calculateBMR: function (weight, height, age, gender, activityLevel) {
      // معادلة Mifflin-St Jeor
      var bmr = gender === 'female'
        ? (10 * weight) + (6.25 * height) - (5 * age) - 161
        : (10 * weight) + (6.25 * height) - (5 * age) + 5;

      var multipliers = {
        sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, extra: 1.9
      };
      var tdee = bmr * (multipliers[activityLevel] || 1.2);

      return {
        bmr:         Math.round(bmr),
        tdee:        Math.round(tdee),
        loseWeight:  Math.round(tdee - 500),
        gainWeight:  Math.round(tdee + 500)
      };
    },

    /* ──────────────────────────────────────────
       10. IndexedDB API مكشوف
    ────────────────────────────────────────── */
    db: {
      get:    dbGet,
      put:    dbPut,
      getAll: dbGetAll
    }
  };

  /* تصدير */
  global.TayyibatData = DataService;
  console.log('[TayyibatData] ✅ خدمة البيانات المجانية جاهزة');

})(window);
