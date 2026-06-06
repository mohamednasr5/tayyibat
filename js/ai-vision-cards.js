/**
 * ══════════════════════════════════════════════════════════════════
 *  🌿 طيبات — محرك البطاقات الذكية للرؤية المباشرة
 *  ai-vision-cards.js  |  v2.0  — INSTANT LIVE ANALYSIS
 *
 *  ✅ تحليل فوري 100% عند فتح أي كاميرا في أي أداة
 *  ✅ برومبت مخصص ومتخصص لكل أداة
 *  ✅ إرسال مباشر حصري لـ CF Worker (taybat-ai.studegy8.workers.dev)
 *  ✅ نتائج في بطاقات ملونة منظمة ومفصّلة
 *  ✅ يغطي: طعام · منتجات · أدوية · روشتة · تقارير · واجبات · كف · صور مزيفة
 * ══════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════
     ① الإعدادات
  ══════════════════════════════════════════ */
  var CF_WORKER  = 'https://taybat-ai.studegy8.workers.dev';
  var TIMEOUT_MS = 22000;   // 22 ثانية للرؤية
  var LIVE_DELAY = 2000;    // انتظر 2 ثانية قبل أول تحليل تلقائي
  var LIVE_INTERVAL = 4000; // كرر كل 4 ثوانٍ حتى تنجح
  var IMG_QUALITY = 0.88;

  /* ══════════════════════════════════════════
     ② أنماط CSS المشتركة
  ══════════════════════════════════════════ */
  function _injectStyles() {
    if (document.getElementById('tvc2-styles')) return;
    var s = document.createElement('style');
    s.id = 'tvc2-styles';
    s.textContent = [
      '@keyframes tvc2-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-9px)}}',
      '@keyframes tvc2-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
      '@keyframes tvc2-spin{to{transform:rotate(360deg)}}',
      '.tvc2-wrap{direction:rtl;font-family:"Tajawal",sans-serif;display:flex;flex-direction:column;gap:10px;padding:2px 0}',
      '.tvc2-card{border-radius:16px;overflow:hidden;animation:tvc2-in .35s ease both}',
      '.tvc2-head{padding:11px 15px;display:flex;align-items:center;gap:10px}',
      '.tvc2-head-icon{font-size:1.35rem;flex-shrink:0}',
      '.tvc2-head-title{font-size:.9rem;font-weight:900;line-height:1.2}',
      '.tvc2-head-sub{font-size:.63rem;margin-top:2px;opacity:.72}',
      '.tvc2-body{padding:12px 14px}',
      '.tvc2-row{display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.055)}',
      '.tvc2-row:last-child{border-bottom:none}',
      '.tvc2-lbl{font-size:.7rem;font-weight:800;opacity:.6;min-width:68px;flex-shrink:0;padding-top:2px}',
      '.tvc2-val{font-size:.83rem;font-weight:700;flex:1;line-height:1.5}',
      '.tvc2-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.69rem;font-weight:800;margin:2px 3px 0 0}',
      '.tvc2-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin-top:7px}',
      '.tvc2-box{background:rgba(255,255,255,.04);border-radius:11px;padding:9px 10px;text-align:center;border:1.5px solid rgba(255,255,255,.07)}',
      '.tvc2-box .v{font-size:1.05rem;font-weight:900;margin-bottom:2px}',
      '.tvc2-box .l{font-size:.62rem;opacity:.58}',
      '.tvc2-note{padding:9px 12px;border-radius:10px;font-size:.77rem;margin-top:8px;line-height:1.6}',
      '.tvc2-disc{padding:8px 14px 12px;font-size:.66rem;border-top:1px solid rgba(255,255,255,.07);opacity:.5;line-height:1.5}',
      '.tvc2-loader{padding:20px;text-align:center;direction:rtl}',
      '.tvc2-dots{display:flex;justify-content:center;gap:6px;margin-bottom:10px}',
      '.tvc2-dots span{width:9px;height:9px;border-radius:50%;background:#c8960c;animation:tvc2-bounce .8s infinite}',
      '.tvc2-dots span:nth-child(2){animation-delay:.15s}',
      '.tvc2-dots span:nth-child(3){animation-delay:.3s}',
      '.tvc2-status{display:flex;align-items:center;gap:7px;font-size:.8rem;color:rgba(255,255,255,.65)}',
      '.tvc2-spin{width:14px;height:14px;border:2px solid #c8960c;border-top-color:transparent;border-radius:50%;animation:tvc2-spin .7s linear infinite;flex-shrink:0}',
      '.tvc2-retry{width:100%;margin-top:8px;padding:12px;background:linear-gradient(135deg,#c8960c,#e6a800);color:#050e1f;border:none;border-radius:12px;font-family:Tajawal,sans-serif;font-weight:800;font-size:.88rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;box-shadow:0 3px 12px rgba(200,150,12,.3)}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════
     ③ دوال مساعدة
 /** التقط إطار من فيديو → base64 data URL */
function _capture(videoEl, quality) {

  if (!videoEl || !videoEl.videoWidth) {
    console.log("NO VIDEO");
    return null;
  }

  console.log(
    "VIDEO SIZE:",
    videoEl.videoWidth,
    "x",
    videoEl.videoHeight
  );

  var c = document.createElement('canvas');

  c.width = videoEl.videoWidth;
  c.height = videoEl.videoHeight;

  c.getContext('2d').drawImage(videoEl, 0, 0);

  const img = c.toDataURL(
    'image/jpeg',
    quality || IMG_QUALITY
  );

  console.log("BASE64 SIZE:", img.length);

  return img;
}

  /** أرسل صورة + برومبت مباشرة للـ CF Worker → نص الرد */
  async function _toWorker(imgDataUrl, prompt) {
    var base64 = imgDataUrl, mediaType = 'image/jpeg';
    if (imgDataUrl && imgDataUrl.startsWith('data:')) {
      var p = imgDataUrl.split(',');
      base64 = p[1] || imgDataUrl;
      var m = p[0].match(/data:([^;]+)/);
      if (m) mediaType = m[1];
    }
    var ctrl = new AbortController();
    var tid = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);
    try {
      console.log("BASE64 LENGTH:", base64.length);
  console.log("MEDIA TYPE:", mediaType);
  console.log("BASE64 START:", base64.substring(0,50));
      var resp = await fetch(CF_WORKER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({ prompt: prompt, image: base64, mediaType: mediaType })
      });
      clearTimeout(tid);
      if (!resp.ok) return null;
      var data = await resp.json();
      /* استخراج النص من أي صيغة رد ممكنة */
      if (data.choices && data.choices[0]) {
        var msg = data.choices[0].message || data.choices[0];
        var t = msg.content || msg.text || null;
        if (t && t.trim().length > 5) return t.trim();
      }
      if (data.result && data.result.response) {
        var r = data.result.response;
        return (typeof r === 'string' ? r : JSON.stringify(r)).trim();
      }
      if (typeof data === 'string' && data.trim().length > 5) return data.trim();
      if (data.response && typeof data.response === 'string') return data.response.trim();
      return null;
    } catch (e) {
      clearTimeout(tid);
      return null;
    }
  }

  /** مؤشر تحميل */
  function _loader(box, msg) {
    _injectStyles();
    box.innerHTML =
      '<div class="tvc2-loader">' +
      '<div class="tvc2-dots"><span></span><span></span><span></span></div>' +
      '<div class="tvc2-status">' +
      '<div class="tvc2-spin"></div>' +
      '<span>' + (msg || 'جاري التحليل الذكي...') + '</span>' +
      '</div></div>';
  }

  /** رسالة خطأ مع زر إعادة */
  function _error(box, retryFn) {
    box.innerHTML =
      '<div style="padding:14px;text-align:center;direction:rtl">' +
      '<div style="font-size:1.4rem;margin-bottom:8px">⚠️</div>' +
      '<div style="color:rgba(255,255,255,.7);font-size:.83rem;margin-bottom:10px">تعذّر التحليل — تأكد من الإضاءة الجيدة وحاول مرة أخرى</div>' +
      (retryFn ? '<button class="tvc2-retry" onclick="(' + retryFn.toString() + ')()"><i class="fas fa-redo"></i> حاول مرة أخرى</button>' : '') +
      '</div>';
  }

  /* ══════════════════════════════════════════
     ④ البرومبتات المتخصصة لكل أداة
  ══════════════════════════════════════════ */
  var PROMPTS = {

    /* ─── طعام ─── */
    food:
      'أنت خبير تغذية سريري متخصص. افحص الصورة بدقة وتعرّف على كل طعام أو وجبة.\n' +
      'أجب حصراً بـ JSON صالح بدون markdown أو ```:\n' +
      '{"name_ar":"اسم الوجبة الكاملة","serving":"الكمية التقديرية","calories":0,"protein":0.0,"carbs":0.0,"fat":0.0,"fiber":0.0,' +
      '"sugar":0.0,"sodium":0,"glycemic_index":"منخفض/متوسط/مرتفع","tayyibat_approved":true,' +
      '"notes":"نصيحة غذائية مفيدة تشمل توافقها مع نظام طيبات الصحي",' +
      '"items":[{"name":"اسم المكون","cal_per_100g":0,"protein_per_100g":0.0,"carbs_per_100g":0.0,"fat_per_100g":0.0,"estimated_grams":0}]}',

    /* ─── منتج / عبوة ─── */
    product:
      'أنت خبير تغذية ومستهلك ذكي. افحص هذا المنتج أو العبوة بدقة واستخرج كل المعلومات المتاحة.\n' +
      'أجب بتنسيق نصي منظم بالأقسام التالية:\n\n' +
      '🏷️ اسم المنتج:\n' +
      '🏭 المصنّع / العلامة التجارية:\n' +
      '📊 القيم الغذائية لكل 100جم:\n' +
      '   • السعرات الحرارية:\n' +
      '   • البروتين:\n' +
      '   • الكربوهيدرات:\n' +
      '   • الدهون:\n' +
      '   • الدهون المشبعة:\n' +
      '   • السكر:\n' +
      '   • الألياف:\n' +
      '   • الصوديوم:\n' +
      '🧪 المكونات الرئيسية:\n' +
      '⚠️ المواد الحافظة والإضافات:\n' +
      '🔴 مواد مثيرة للقلق الصحي (E-numbers خطرة):\n' +
      '✅ هل مسموح في نظام طيبات؟ (نعم/لا/بحذر — مع السبب):\n' +
      '💡 نصيحة صحية مختصرة:\n' +
      'اكتب بالعربية بوضوح وتفصيل كامل.',

    /* ─── دواء ─── */
    medicine:
      'أنت صيدلاني خبير متخصص. افحص هذه الصورة — قد تكون دواءً أو عبوة دواء أو ورقة ارشادات.\n' +
      'استخرج كل المعلومات الدوائية المتاحة:\n\n' +
      '💊 اسم الدواء التجاري:\n' +
      '🔬 المادة الفعّالة (الاسم العلمي):\n' +
      '🏭 الشركة المصنعة:\n' +
      '📋 التركيز والجرعة:\n' +
      '🎯 دواعي الاستعمال الرئيسية:\n' +
      '⏱️ طريقة الاستخدام والجرعة المعتادة:\n' +
      '🍽️ العلاقة بالأكل (قبل/بعد/مع الطعام):\n' +
      '⚠️ موانع الاستخدام والتحذيرات المهمة:\n' +
      '🔄 التفاعلات الدوائية الهامة:\n' +
      '🤒 الآثار الجانبية الشائعة:\n' +
      '❄️ شروط التخزين:\n' +
      '💡 نصيحة مهمة للمريض:\n' +
      '⚠️ تنبيه: هذا للمعلومات فقط — استشر طبيبك أو صيدلانيك دائماً.\n' +
      'اكتب بالعربية بوضوح وشمولية كاملة.',

    /* ─── تقرير طبي / تحاليل ─── */
    report:
      'أنت طبيب متخصص في قراءة التحاليل الطبية والتقارير المختبرية.\n' +
      'افحص هذه الصورة واقرأ كل القيم والأرقام بدقة.\n' +
      'أجب حصراً بـ JSON صالح بدون markdown:\n' +
      '{"patient_name":"الاسم إن ظهر","date":"التاريخ إن ظهر","lab_name":"المختبر إن ظهر",' +
      '"report_type":"نوع التقرير",' +
      '"findings":[{"test":"اسم التحليل","value":"القيمة المقاسة","unit":"الوحدة","reference":"المعدل الطبيعي","status":"normal/high/low","interpretation":"تفسير سريري مختصر للمريض"}],' +
      '"summary":"ملخص شامل للتقرير بلغة بسيطة",' +
      '"recommendations":"توصيات طبية واضحة ومفيدة",' +
      '"urgent_flags":"أي قيم تستدعي تدخلاً عاجلاً إن وجدت"}',

    /* ─── روشتة طبية ─── */
    prescription:
      'أنت صيدلاني وطبيب خبير متخصص في قراءة روشتات الأطباء العرب.\n' +
      'الخط الطبي صعب — استخدم سياق الكلمة والاسم الطبي المعروف للتعرف عليه.\n' +
      'اقرأ كل الأدوية المكتوبة بدقة قصوى.\n' +
      'أجب حصراً بـ JSON صالح بدون markdown:\n' +
      '{"doctor_name":"اسم الطبيب إن ظهر","speciality":"التخصص إن ظهر","date":"التاريخ إن ظهر","clinic":"العيادة إن ظهرت",' +
      '"drugs":[{"name":"الاسم التجاري الكامل","active":"المادة الفعّالة","type":"برشام/شراب/كبسول/مرهم/قطرة/أخرى",' +
      '"strength":"التركيز","dose":"الجرعة الكاملة كما كتبها الطبيب","frequency":"عدد المرات يومياً",' +
      '"duration":"المدة","timing":"قبل/بعد/مع الأكل","notes":"أي تعليمات إضافية"}],' +
      '"general_notes":"أي ملاحظات عامة في الروشتة",' +
      '"interactions_warning":"تحذير من تفاعل دوائي محتمل إن وجد"}',

    /* ─── كشف الصور المزيفة ─── */
    fake_image:
      'أنت محلل صور رقمي محترف ومتخصص في كشف التزوير والتلاعب وتمييز صور الذكاء الاصطناعي.\n' +
      'افحص هذه الصورة تحليلاً تقنياً شاملاً بهذا التنسيق:\n\n' +
      '🔎 الحكم الرئيسي:\n(حقيقية / مولودة بـ AI بالكامل / معدّلة بـ Photoshop / فلاتر مكثفة / تعديل جزئي / مشبوهة)\n\n' +
      '📊 نسبة الثقة:\n(مثال: 87% احتمال حقيقية)\n\n' +
      '🔬 المؤشرات التقنية:\n' +
      '• الإضاءة والظلال:\n• حواف الأشياء:\n• التفاصيل الدقيقة (بشرة/شعر/خلفية):\n' +
      '• أنماط الضجيج (noise):\n• علامات التقطيع أو الدمج:\n• التناسق والتناظر:\n\n' +
      '🎨 تحليل الألوان والجودة:\n\n' +
      '📋 التقرير النهائي:\n(جملة واضحة تلخص الحكم وأبرز دليل)\n\n' +
      'اكتب بالعربية بأسلوب مهني ودقيق.',

    /* ─── حل الواجبات ─── */
    homework:
      'أنت معلم ومدرّس خبير في جميع المناهج الدراسية العربية (المصرية والخليجية والسورية واللبنانية).\n' +
      'افحص الصورة واقرأ السؤال أو المسألة بدقة.\n' +
      'قدّم الحل بهذا التنسيق المنظم:\n\n' +
      '📖 السؤال كما هو:\n(اكتب نص السؤال كاملاً كما قرأته)\n\n' +
      '✅ الإجابة النموذجية الكاملة:\n(خطوة بخطوة بشكل واضح ومفصّل)\n\n' +
      '💡 الشرح المبسط:\n(اشرح الفكرة الأساسية بلغة سهلة)\n\n' +
      '📚 القوانين والمعلومات المهمة:\n(المعادلات أو القواعد أو المفاهيم المرتبطة)\n\n' +
      '⭐ نصيحة للمذاكرة:\n(تلميح مفيد للطالب لحفظ الموضوع)\n\n' +
      'اكتب بالعربية الواضحة. إذا لم تستطع قراءة الصورة أطلب إعادة التصوير.',

    /* ─── قراءة الكف ─── */
    palm:
      'أنت خبير في علم الكيرولوجيا (قراءة الكف) يجمع بين مناهج Cheiro وBenham والتراث الشرقي الهندي.\n' +
      'افحص صورة الكف بدقة قصوى وقدّم قراءة شاملة ومفصّلة:\n\n' +
      '🖐 شكل الكف والأصابع:\n(نوع الكف: ناري/ترابي/هوائي/مائي — أبعاده — دلالته على الشخصية)\n\n' +
      '📏 خط الحياة:\n(وصف دقيق لشكله وطوله وعمقه — دلالته على الصحة والحيوية والعمر)\n\n' +
      '❤️ خط القلب:\n(وصف دقيق — دلالته في العواطف والعلاقات والحياة العاطفية)\n\n' +
      '🧠 خط الرأس:\n(وصف دقيق — دلالته في التفكير والذكاء ونهج اتخاذ القرارات)\n\n' +
      '⭐ خط القدر:\n(وصف إن ظهر — دلالته في المسار المهني والحظ)\n\n' +
      '☀️ خط الشمس/النجاح:\n(إن ظهر)\n\n' +
      '✨ العلامات الخاصة:\n(نجوم، مربعات، تصليبات، دوائر — وتفسيرها)\n\n' +
      '🔮 القراءة الشاملة:\n(فقرة ختامية شيّقة تلخص شخصية صاحب الكف وأبرز سماته)\n\n' +
      'اكتب بالعربية الجميلة. ⚠️ للترفيه والاستئناس فقط.',

    /* ─── فحص باركود / منتج مقاطعة ─── */
    barcode:
      'أنت محلل منتجات ذكي ومتخصص. افحص الصورة — قد تحتوي باركوداً أو رمز QR أو اسم منتج.\n' +
      'استخرج كل المعلومات المتاحة:\n\n' +
      '📊 رقم الباركود:\n' +
      '🏷️ اسم المنتج الكامل:\n' +
      '🏭 الشركة المصنّعة:\n' +
      '🌍 بلد المنشأ:\n' +
      '📋 فئة المنتج:\n' +
      '⚠️ هل الشركة المصنّعة مدرجة على قوائم المقاطعة؟ (نعم/لا/غير محدد — مع السبب):\n' +
      '🔄 بدائل موصى بها:\n' +
      '✅ هل مسموح به في نظام طيبات الصحي؟\n' +
      '💡 ملاحظات صحية مهمة:\n' +
      'اكتب بالعربية بدقة ووضوح.'
  };

  /* ══════════════════════════════════════════
     ⑤ رسم البطاقات الملونة
  ══════════════════════════════════════════ */
  var THEMES = {
    food:         { bg:'rgba(46,201,81,.09)',   bdr:'rgba(46,201,81,.4)',   hd:'rgba(46,201,81,.18)',   clr:'#2ec951', ico:'🥗' },
    product:      { bg:'rgba(41,182,246,.09)',  bdr:'rgba(41,182,246,.4)',  hd:'rgba(41,182,246,.18)',  clr:'#29b6f6', ico:'📦' },
    medicine:     { bg:'rgba(171,71,188,.09)',  bdr:'rgba(171,71,188,.4)',  hd:'rgba(171,71,188,.18)',  clr:'#ab47bc', ico:'💊' },
    report:       { bg:'rgba(100,181,246,.09)', bdr:'rgba(100,181,246,.4)', hd:'rgba(100,181,246,.18)', clr:'#64b5f6', ico:'🔬' },
    prescription: { bg:'rgba(255,152,0,.09)',   bdr:'rgba(255,152,0,.4)',   hd:'rgba(255,152,0,.18)',   clr:'#ffa726', ico:'📝' },
    fake_image:   { bg:'rgba(255,193,7,.09)',   bdr:'rgba(255,193,7,.4)',   hd:'rgba(255,193,7,.18)',   clr:'#ffc107', ico:'🔍' },
    homework:     { bg:'rgba(33,150,243,.09)',  bdr:'rgba(33,150,243,.4)',  hd:'rgba(33,150,243,.18)',  clr:'#2196f3', ico:'🧠' },
    palm:         { bg:'rgba(255,87,34,.09)',   bdr:'rgba(255,87,34,.4)',   hd:'rgba(255,87,34,.18)',   clr:'#ff5722', ico:'🖐' },
    barcode:      { bg:'rgba(0,188,212,.09)',   bdr:'rgba(0,188,212,.4)',   hd:'rgba(0,188,212,.18)',   clr:'#00bcd4', ico:'📊' },
    general:      { bg:'rgba(200,150,12,.09)',  bdr:'rgba(200,150,12,.4)',  hd:'rgba(200,150,12,.18)',  clr:'#c8960c', ico:'🌿' }
  };

  var MODE_LABELS = {
    food:'تحليل الطعام', product:'تحليل المنتج', medicine:'معلومات الدواء',
    report:'التقرير الطبي', prescription:'الروشتة الطبية', fake_image:'كشف التزوير',
    homework:'الإجابة النموذجية', palm:'قراءة الكف', barcode:'تحليل المنتج'
  };

  /** أنشئ بطاقة HTML */
  function _card(th, icon, title, subtitle, bodyHtml, delay) {
    return '<div class="tvc2-card" style="background:' + th.bg + ';border:2px solid ' + th.bdr + ';animation-delay:' + (delay||0) + 's">' +
      '<div class="tvc2-head" style="background:' + th.hd + '">' +
      '<span class="tvc2-head-icon">' + (icon||th.ico) + '</span>' +
      '<div><div class="tvc2-head-title" style="color:' + th.clr + '">' + _esc(title) + '</div>' +
      (subtitle ? '<div class="tvc2-head-sub" style="color:' + th.clr + '">' + _esc(subtitle) + '</div>' : '') +
      '</div></div>' +
      (bodyHtml ? '<div class="tvc2-body">' + bodyHtml + '</div>' : '') +
      '</div>';
  }

  /** بطاقة قيمة غذائية */
  function _nutBox(val, label, color) {
    return '<div class="tvc2-box"><div class="v" style="color:' + color + '">' +
      (typeof val === 'number' ? (Math.round(val * 10) / 10) : (val || '—')) +
      '</div><div class="l">' + label + '</div></div>';
  }

  /** صف مفتاح/قيمة */
  function _row(label, val, color) {
    return '<div class="tvc2-row"><span class="tvc2-lbl">' + _esc(label) + '</span>' +
      '<span class="tvc2-val"' + (color ? ' style="color:' + color + '"' : '') + '>' + _esc(String(val || '—')) + '</span></div>';
  }

  /** تأمين HTML */
  function _esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /**
   * الرسام الرئيسي — يحوّل أي نص/JSON لبطاقات ملونة
   */
  function renderCards(rawText, mode, retryFn) {
    _injectStyles();
    if (!rawText || !rawText.trim()) return _errorHtml(retryFn);

    var th = THEMES[mode] || THEMES.general;
    var label = MODE_LABELS[mode] || 'النتيجة';

    /* حاول تحليل JSON أولاً */
    var json = null;
    try {
      var clean = rawText.replace(/```json|```/g, '').trim();
      if (clean.startsWith('{') || clean.startsWith('[')) json = JSON.parse(clean);
    } catch (e) {}

    var cardsHtml = '';

    if (json) {
      if (mode === 'food')         cardsHtml = _foodCards(json, th);
      else if (mode === 'report')  cardsHtml = _reportCards(json, th);
      else if (mode === 'prescription') cardsHtml = _prescriptionCards(json, th);
      else                         cardsHtml = _jsonFallback(json, th);
    }

    if (!cardsHtml) cardsHtml = _textCards(rawText, mode, th);

    /* غلاف رئيسي مع ترويسة */
    var headerHtml =
      '<div style="display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,' + th.hd + ',' + th.hd.replace('.18','.06') + ');' +
      'border:1.5px solid ' + th.bdr + ';border-radius:14px;padding:11px 15px;margin-bottom:12px">' +
      '<span style="font-size:1.35rem">' + th.ico + '</span>' +
      '<div style="flex:1"><div style="color:' + th.clr + ';font-weight:900;font-size:.92rem">' + label + '</div>' +
      '<div style="color:#888;font-size:.68rem;margin-top:2px">تحليل بالذكاء الاصطناعي — CF Vision</div></div>' +
      '<div style="background:' + th.hd + ';border:1px solid ' + th.bdr + ';border-radius:20px;padding:3px 10px;font-size:.68rem;color:' + th.clr + ';white-space:nowrap">✓ مكتمل</div>' +
      '</div>';

    var retryBtn = retryFn ?
      '<button class="tvc2-retry" style="margin-top:6px" onclick="(' + retryFn.toString() + ')()">' +
      '<i class="fas fa-camera"></i> تحليل جديد بالكاميرا</button>' : '';

    return '<div class="tvc2-wrap">' + headerHtml + cardsHtml + retryBtn + '</div>';
  }

  /* ── بطاقات الطعام من JSON ── */
  function _foodCards(d, th) {
    var html = '';

    /* بطاقة القيم الغذائية الرئيسية */
    var gridHtml =
      '<div class="tvc2-grid">' +
      _nutBox(d.calories,  'سعرة',       '#ff7043') +
      _nutBox(d.protein,   'بروتين g',   '#29b6f6') +
      _nutBox(d.carbs,     'كارب g',     '#ffa726') +
      _nutBox(d.fat,       'دهون g',     '#ab47bc') +
      '</div>';

    if (d.fiber || d.sugar || d.sodium) {
      gridHtml += '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px">';
      if (d.fiber)  gridHtml += '<span class="tvc2-badge" style="background:rgba(46,201,81,.15);color:#2ec951;border:1.5px solid rgba(46,201,81,.35)">ألياف: ' + d.fiber + 'g</span>';
      if (d.sugar)  gridHtml += '<span class="tvc2-badge" style="background:rgba(255,87,87,.15);color:#ff5757;border:1.5px solid rgba(255,87,87,.35)">سكر: ' + d.sugar + 'g</span>';
      if (d.sodium) gridHtml += '<span class="tvc2-badge" style="background:rgba(255,165,0,.15);color:#ffa500;border:1.5px solid rgba(255,165,0,.35)">صوديوم: ' + d.sodium + 'mg</span>';
      if (d.glycemic_index) gridHtml += '<span class="tvc2-badge" style="background:rgba(100,149,237,.15);color:#6495ed;border:1.5px solid rgba(100,149,237,.35)">مؤشر جلايسيمي: ' + d.glycemic_index + '</span>';
      gridHtml += '</div>';
    }

    html += _card(th, '🥗', (d.name_ar || 'الوجبة'), (d.serving ? 'الكمية: ' + d.serving : ''), gridHtml, 0);

    /* بطاقة المكونات */
    if (d.items && d.items.length) {
      var rows = '';
      d.items.forEach(function (it) {
        rows += '<div class="tvc2-row">' +
          '<span class="tvc2-lbl">' + _esc(it.name || '') + '</span>' +
          '<span class="tvc2-val" style="color:' + th.clr + '">' +
          (it.cal_per_100g || it.calories || 0) + ' سعرة' +
          (it.estimated_grams ? ' · ' + it.estimated_grams + 'g' : '') +
          '</span></div>';
      });
      html += _card(
        {bg:'rgba(255,255,255,.03)',bdr:'rgba(255,255,255,.08)',hd:'rgba(255,255,255,.06)',clr:'rgba(255,255,255,.6)',ico:'📊'},
        '📊', 'تفصيل المكونات', '', rows, 0.05
      );
    }

    /* بطاقة الموافقة + النصيحة */
    var approved = d.tayyibat_approved;
    var noteColor = approved ? '#2ec951' : '#ff5757';
    var noteBg    = approved ? 'rgba(46,201,81,.1)' : 'rgba(255,87,87,.1)';
    var noteBdr   = approved ? 'rgba(46,201,81,.3)' : 'rgba(255,87,87,.3)';
    if (d.notes || approved !== undefined) {
      var noteHtml = '';
      if (approved !== undefined) {
        noteHtml += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
          '<span style="font-size:1.2rem">' + (approved ? '✅' : '❌') + '</span>' +
          '<span style="color:' + noteColor + ';font-weight:800;font-size:.88rem">' +
          (approved ? 'مسموح في نظام طيبات' : 'غير موصى به في نظام طيبات') + '</span></div>';
      }
      if (d.notes) noteHtml += '<div style="font-size:.82rem;color:rgba(255,255,255,.8);line-height:1.7">' + _esc(d.notes) + '</div>';
      html += _card(
        {bg: noteBg, bdr: noteBdr, hd: noteBg, clr: noteColor, ico: '💡'},
        '💡', 'النصيحة الغذائية', '', noteHtml, 0.1
      );
    }

    return html;
  }

  /* ── بطاقات التقرير الطبي من JSON ── */
  function _reportCards(d, th) {
    var html = '';

    /* ترويسة التقرير */
    if (d.patient_name || d.date || d.lab_name) {
      var infoHtml = '';
      if (d.patient_name) infoHtml += _row('المريض', d.patient_name);
      if (d.date)         infoHtml += _row('التاريخ', d.date);
      if (d.lab_name)     infoHtml += _row('المختبر', d.lab_name);
      if (d.report_type)  infoHtml += _row('نوع التقرير', d.report_type);
      html += _card(th, '📋', 'بيانات التقرير', '', infoHtml, 0);
    }

    /* نتائج التحاليل */
    if (d.findings && d.findings.length) {
      d.findings.forEach(function (f, i) {
        var status = f.status || '';
        var statusColor = (status === 'normal' || status === 'طبيعي') ? '#2ec951' :
                          (status === 'high'   || status === 'مرتفع') ? '#ef5350' :
                          (status === 'low'    || status === 'منخفض') ? '#ffa726' : '#888';
        var statusIcon  = (status === 'normal' || status === 'طبيعي') ? '✅ طبيعي' :
                          (status === 'high'   || status === 'مرتفع') ? '⬆️ مرتفع' :
                          (status === 'low'    || status === 'منخفض') ? '⬇️ منخفض' : '';
        var bodyHtml =
          '<div class="tvc2-row"><span class="tvc2-lbl">القيمة</span>' +
          '<span class="tvc2-val" style="color:' + statusColor + ';font-size:1rem;font-weight:900">' +
          _esc(f.value + (f.unit ? ' ' + f.unit : '')) + '</span></div>' +
          (f.reference ? '<div class="tvc2-row"><span class="tvc2-lbl">المعدل</span><span class="tvc2-val">' + _esc(f.reference) + '</span></div>' : '') +
          (statusIcon ? '<div style="margin-top:6px"><span class="tvc2-badge" style="background:' + statusColor + '22;color:' + statusColor + ';border:1.5px solid ' + statusColor + '66">' + statusIcon + '</span></div>' : '') +
          (f.interpretation ? '<div class="tvc2-note" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.8)">' + _esc(f.interpretation) + '</div>' : '');

        var cardTh = (status === 'normal' || status === 'طبيعي')
          ? {bg:'rgba(46,201,81,.07)',bdr:'rgba(46,201,81,.3)',hd:'rgba(46,201,81,.14)',clr:'#2ec951',ico:'✅'}
          : (status === 'high' || status === 'مرتفع')
          ? {bg:'rgba(239,83,80,.07)',bdr:'rgba(239,83,80,.3)',hd:'rgba(239,83,80,.14)',clr:'#ef5350',ico:'⬆️'}
          : (status === 'low' || status === 'منخفض')
          ? {bg:'rgba(255,167,38,.07)',bdr:'rgba(255,167,38,.3)',hd:'rgba(255,167,38,.14)',clr:'#ffa726',ico:'⬇️'}
          : th;

        html += _card(cardTh, null, (f.test || 'تحليل'), '', bodyHtml, i * 0.06);
      });
    }

    /* ملخص وتوصيات */
    if (d.summary) {
      html += _card(
        {bg:'rgba(100,181,246,.07)',bdr:'rgba(100,181,246,.3)',hd:'rgba(100,181,246,.14)',clr:'#64b5f6',ico:'📊'},
        '📊', 'الملخص العام', '', '<div style="font-size:.83rem;line-height:1.8;color:rgba(255,255,255,.85)">' + _esc(d.summary) + '</div>', 0.1
      );
    }
    if (d.recommendations) {
      html += _card(
        {bg:'rgba(46,201,81,.07)',bdr:'rgba(46,201,81,.3)',hd:'rgba(46,201,81,.14)',clr:'#2ec951',ico:'💡'},
        '💡', 'التوصيات', '', '<div style="font-size:.83rem;line-height:1.8;color:rgba(255,255,255,.85)">' + _esc(d.recommendations) + '</div>', 0.12
      );
    }
    if (d.urgent_flags) {
      html += _card(
        {bg:'rgba(239,83,80,.07)',bdr:'rgba(239,83,80,.3)',hd:'rgba(239,83,80,.14)',clr:'#ef5350',ico:'🚨'},
        '🚨', 'تنبيه عاجل', '', '<div style="font-size:.83rem;line-height:1.8;color:#ef9a9a">' + _esc(d.urgent_flags) + '</div>', 0.14
      );
    }

    html += '<div class="tvc2-disc">⚠️ هذا التفسير للاستئناس فقط — استشر طبيبك للتشخيص النهائي</div>';
    return html;
  }

  /* ── بطاقات الروشتة من JSON ── */
  function _prescriptionCards(d, th) {
    var html = '';

    /* بيانات الطبيب */
    if (d.doctor_name || d.date || d.clinic) {
      var infoHtml = '';
      if (d.doctor_name) infoHtml += _row('الطبيب', d.doctor_name);
      if (d.speciality)  infoHtml += _row('التخصص', d.speciality);
      if (d.clinic)      infoHtml += _row('العيادة', d.clinic);
      if (d.date)        infoHtml += _row('التاريخ', d.date);
      html += _card(th, '🩺', 'بيانات الطبيب', '', infoHtml, 0);
    }

    /* كل دواء في بطاقة */
    var drugs = Array.isArray(d) ? d : (d.drugs || []);
    drugs.forEach(function (drug, i) {
      if (!drug) return;
      var name = drug.name || drug['الاسم'] || ('دواء ' + (i+1));
      var type = drug.type || drug['النوع'] || '';
      var bodyHtml = '';
      if (drug.active || drug['المادة الفعّالة']) bodyHtml += _row('المادة الفعّالة', drug.active || drug['المادة الفعّالة'], th.clr);
      if (type)                                   bodyHtml += _row('الشكل', type);
      if (drug.strength || drug['التركيز'])       bodyHtml += _row('التركيز', drug.strength || drug['التركيز'], th.clr);
      if (drug.dose || drug['الجرعة'])            bodyHtml += _row('الجرعة', drug.dose || drug['الجرعة'], '#2ec951');
      if (drug.frequency || drug['التكرار'])      bodyHtml += _row('التكرار', drug.frequency || drug['التكرار']);
      if (drug.duration || drug['المدة'])         bodyHtml += _row('المدة', drug.duration || drug['المدة']);
      if (drug.timing || drug['التوقيت'])         bodyHtml += _row('التوقيت', drug.timing || drug['التوقيت']);
      if (drug.notes || drug['ملاحظات']) {
        bodyHtml += '<div class="tvc2-note" style="background:rgba(255,152,0,.1);border:1px solid rgba(255,152,0,.25);color:#ffa726">' +
          _esc(drug.notes || drug['ملاحظات']) + '</div>';
      }
      html += _card(th, '💊', name, type, bodyHtml, i * 0.08);
    });

    if (d.general_notes) {
      html += _card(
        {bg:'rgba(255,152,0,.07)',bdr:'rgba(255,152,0,.3)',hd:'rgba(255,152,0,.14)',clr:'#ffa726',ico:'📋'},
        '📋', 'ملاحظات الطبيب', '', '<div style="font-size:.83rem;line-height:1.8;color:rgba(255,255,255,.85)">' + _esc(d.general_notes) + '</div>', 0.1
      );
    }
    if (d.interactions_warning) {
      html += _card(
        {bg:'rgba(239,83,80,.07)',bdr:'rgba(239,83,80,.3)',hd:'rgba(239,83,80,.14)',clr:'#ef5350',ico:'⚠️'},
        '⚠️', 'تحذير تفاعل دوائي', '', '<div style="font-size:.83rem;line-height:1.8;color:#ef9a9a">' + _esc(d.interactions_warning) + '</div>', 0.12
      );
    }

    html += '<div class="tvc2-disc">💊 التزم بالجرعات المحددة ولا توقف الدواء بدون استشارة طبيبك</div>';
    return html;
  }

  /* ── fallback لأي JSON غير معروف ── */
  function _jsonFallback(json, th) {
    return _textCards(JSON.stringify(json, null, 2), 'general', th);
  }

  /* ── بطاقات نصية ذكية (للردود النصية غير JSON) ── */
  /* regex لكشف سطر عنوان: إيموجي في البداية أو رقم أو ## */
  var _HEADER_RE = /^(?:[🔥💊📋🖐🧠🔍📝📦🥗📊✅⚠️🌿💡🔬📏✨🔮🩺⭐🏷️🏭🎯⏱️🔄🤒🍽️❄️🔎🎨🔭📖🚨☀️✨❤️☀️🩺🧪🎯🔴💡🔎📊🔬📋🏥💉🧬🧫🩻🧠🩹])|(?:#{1,3}\s)|(?:\d+[\.\)]\s)|(?:[—–-]\s)/.source;

  function _isHeaderLine(line) {
    var t = line.trim();
    if (!t) return false;
    /* إيموجي في البداية */
    if (/^\p{Emoji}/u.test(t)) return true;
    /* ## heading */
    if (/^#{1,3}\s/.test(t)) return true;
    /* رقم في البداية */
    if (/^\d+[\.\)]\s/.test(t)) return true;
    /* سطر قصير ينتهي بـ : */
    if (t.length < 55 && t.endsWith(':') && !t.includes('\n')) return true;
    return false;
  }

  function _textCards(text, mode, th) {
    /* تنظيف */
    var clean = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/```[^\n]*\n?/g, '').trim();

    /* تقسيم على أقسام ## أو # */
    var sections = [];
    var sectionRe = /(?:^|\n)#{1,3}\s*([^\n]+)\n([\s\S]*?)(?=\n#{1,3}\s|$)/g;
    var m;
    while ((m = sectionRe.exec(clean)) !== null) {
      var title = m[1].trim().replace(/^[*#\-–—•]+\s*/, '');
      var content = m[2].trim();
      if (title && content) sections.push({ title: title, content: content });
    }

    /* ── طريقة ٢: تقسيم سطراً سطراً على أي عنوان (إيموجي / رقم / : ) ── */
    if (sections.length < 2) {
      sections = [];
      var allLines = clean.split('\n');
      var cur = null;
      allLines.forEach(function (line) {
        var trimmed = line.trim();
        if (!trimmed) {
          /* سطر فارغ: أنهِ القسم الحالي إن وُجد */
          if (cur && cur.content.trim()) { sections.push(cur); cur = null; }
          return;
        }
        if (_isHeaderLine(trimmed)) {
          /* احفظ القسم السابق */
          if (cur && cur.content.trim()) sections.push(cur);
          /* العنوان هو السطر نفسه (نظّفه) */
          var hTitle = trimmed
            .replace(/^#{1,3}\s*/, '')
            .replace(/:$/, '')
            .trim();
          /* القيمة قد تكون في نفس السطر بعد : */
          var colonIdx = trimmed.indexOf(':');
          var inlineVal = (colonIdx > 0 && colonIdx < trimmed.length - 1)
            ? trimmed.slice(colonIdx + 1).trim() : '';
          cur = { title: hTitle, content: inlineVal };
        } else {
          /* سطر محتوى */
          if (!cur) cur = { title: 'النتيجة', content: '' };
          cur.content += (cur.content ? '\n' : '') + trimmed;
        }
      });
      if (cur && cur.content.trim()) sections.push(cur);
    }

    /* ── طريقة ٣: تقسيم على فقرات ── */
    if (sections.length < 2) {
      sections = [];
      var blocks = clean.split(/\n{2,}/);
      blocks.forEach(function (block) {
        if (!block.trim()) return;
        var lines = block.trim().split('\n');
        var first = lines[0].trim();
        var isHdr = _isHeaderLine(first);
        var secTitle  = isHdr ? first.replace(/^[\d]+[\.\)]\s*/, '').replace(/^[—–-]\s*/, '').replace(/:$/, '').trim() : null;
        var body   = isHdr ? lines.slice(1).join('\n').trim() : block.trim();
        if (secTitle || body) sections.push({ title: secTitle || 'النتيجة', content: body });
      });
    }

    /* آخر fallback → فقرة واحدة */
    if (!sections.length) sections = [{ title: 'التحليل', content: clean }];

    /* أقصى 8 بطاقات */
    sections = sections.slice(0, 8);

    /* الألوان الدورية للبطاقات */
    var altThemes = [
      th,
      {bg:'rgba(255,255,255,.03)',bdr:'rgba(255,255,255,.08)',hd:'rgba(255,255,255,.06)',clr:th.clr,ico:th.ico},
      {bg:'rgba(46,201,81,.06)', bdr:'rgba(46,201,81,.2)', hd:'rgba(46,201,81,.1)', clr:'#2ec951',ico:'✅'},
      {bg:'rgba(100,149,237,.06)',bdr:'rgba(100,149,237,.2)',hd:'rgba(100,149,237,.1)',clr:'#6495ed',ico:'💡'},
      {bg:'rgba(255,165,0,.06)', bdr:'rgba(255,165,0,.2)', hd:'rgba(255,165,0,.1)', clr:'#ffa500',ico:'📌'},
      {bg:'rgba(171,71,188,.06)',bdr:'rgba(171,71,188,.2)',hd:'rgba(171,71,188,.1)',clr:'#ab47bc',ico:'📋'},
      {bg:'rgba(239,83,80,.06)', bdr:'rgba(239,83,80,.2)', hd:'rgba(239,83,80,.1)', clr:'#ef5350',ico:'⚠️'},
      {bg:'rgba(0,188,212,.06)', bdr:'rgba(0,188,212,.2)', hd:'rgba(0,188,212,.1)', clr:'#00bcd4',ico:'📎'}
    ];

    return sections.map(function (sec, i) {
      var secTh = altThemes[i % altThemes.length];

      /* حاول تحويل محتوى "مفتاح: قيمة" إلى صفوف */
      var rows = _parseKeyVal(sec.content, secTh.clr);
      var bodyHtml = rows ||
        '<div style="font-size:.83rem;line-height:1.85;color:rgba(255,255,255,.85);white-space:pre-line">' +
        sec.content.replace(/\n[-•–*] /g, '\n<span style="color:' + secTh.clr + ';margin-left:4px">◆</span> ')
                   .replace(/\n(\d+)\. /g, '\n<span style="color:' + secTh.clr + ';font-weight:700;margin-left:4px">$1.</span> ')
                   .replace(/</g,'&lt;').replace(/>/g,'&gt;')
        + '</div>';

      /* تحديد الأيقونة من العنوان */
      var icon = _iconFromTitle(sec.title, secTh.ico);

      return _card(secTh, icon, sec.title, '', bodyHtml, i * 0.07);
    }).join('');
  }

  /** استخرج أيقونة مناسبة من العنوان */
  function _iconFromTitle(title, def) {
    var t = title;
    if (/اسم|منتج|دواء|طعام|وجبة/.test(t)) return '🏷️';
    if (/سعر|غذائ|قيم|كالوري/.test(t))    return '📊';
    if (/مكون|مواد|مكونات/.test(t))         return '🧪';
    if (/تحذير|سلب|خطر|ممنوع/.test(t))     return '⚠️';
    if (/فائد|إيجاب|مسموح/.test(t))         return '✅';
    if (/توصي|نصيح|اقتراح/.test(t))         return '💡';
    if (/جرعة|استخدام|تعليم/.test(t))       return '💊';
    if (/طبيع|ضمن/.test(t))                 return '✅';
    if (/مرتفع|خارج/.test(t))              return '⬆️';
    if (/منخفض/.test(t))                    return '⬇️';
    if (/خط الحياة/.test(t))               return '📏';
    if (/خط القلب/.test(t))                return '❤️';
    if (/خط الرأس|خط العقل/.test(t))      return '🧠';
    if (/قدر/.test(t))                      return '⭐';
    if (/ملخص|تقييم/.test(t))              return '📊';
    if (/ملاحظ|تنبيه|هام/.test(t))         return '📌';
    if (/نهائ|حكم/.test(t))                return '🔮';
    return def || '📋';
  }

  /** حوّل نص "مفتاح: قيمة" إلى صفوف HTML */
  function _parseKeyVal(text, accentColor) {
    var lines = text.split('\n').filter(function (l) { return l.trim(); });
    var kvLines = lines.filter(function (l) {
      var ci = l.indexOf(':');
      return ci > 0 && ci < 35;
    });
    if (kvLines.length < 2) return null;
    return lines.map(function (line) {
      var ci = line.indexOf(':');
      if (ci > 0 && ci < 35) {
        var lbl = line.slice(0, ci).trim().replace(/^[•\-–—*●◆]+\s*/, '');
        var val = line.slice(ci + 1).trim();
        if (lbl && val) return _row(lbl, val, accentColor);
      }
      return '<div style="padding:4px 0;font-size:.82rem;color:rgba(255,255,255,.75)">' +
             line.replace(/^[•\-–—*●◆]+\s*/, '') + '</div>';
    }).join('');
  }

  function _errorHtml(retryFn) {
    return '<div style="padding:16px;text-align:center;direction:rtl">' +
      '<div style="font-size:1.5rem;margin-bottom:8px">⚠️</div>' +
      '<div style="color:rgba(255,255,255,.65);font-size:.83rem">تعذّر التحليل — أعد المحاولة</div>' +
      (retryFn ? '<button class="tvc2-retry" style="margin-top:10px" onclick="(' + retryFn.toString() + ')()">إعادة التحليل</button>' : '') +
      '</div>';
  }

  /* ══════════════════════════════════════════
     ⑥ محرك التحليل المباشر لأي أداة
  ══════════════════════════════════════════ */

  /**
   * analyzeLiveNow — التقط إطاراً وحلّله فوراً وأظهر النتيجة
   * @param {HTMLVideoElement} videoEl
   * @param {string} mode
   * @param {HTMLElement} resultBox
   * @param {Function} [onDone] — callback اختياري بعد النجاح
   */
  async function analyzeLiveNow(videoEl, mode, resultBox, onDone) {
    if (!videoEl || !resultBox) return;

    var imgData = _capture(videoEl, IMG_QUALITY);
    if (!imgData) {
      _loader(resultBox, '⏳ الكاميرا تبدأ... انتظر لحظة');
      return;
    }

    var prompt = PROMPTS[mode] || PROMPTS.product;
    _loader(resultBox, _loaderMsg(mode));
    resultBox.style.display = 'block';

    try {
      var text = await _toWorker(imgData, prompt);
      if (!text || text.trim().length < 8) throw new Error('empty');

      var retryFn = function () {
        if (typeof window.TayyibatVisionCards2 !== 'undefined') {
          var v = document.getElementById(window.TayyibatVisionCards2._lastVideoId);
          var r = document.getElementById(window.TayyibatVisionCards2._lastResultId);
          if (v && r) window.TayyibatVisionCards2.analyzeLiveNow(v, mode, r);
        }
      };

      resultBox.innerHTML = renderCards(text, mode, retryFn);
      if (typeof onDone === 'function') onDone(text, imgData);

    } catch (e) {
      /* Fallback → TayyibatAI */
      if (window.TayyibatAI && typeof window.TayyibatAI.vision === 'function') {
        try {
          var r2 = await window.TayyibatAI.vision(imgData, prompt);
          var txt2 = (r2 && r2.text) ? r2.text : (typeof r2 === 'string' ? r2 : null);
          if (txt2 && txt2.length > 8) {
            resultBox.innerHTML = renderCards(txt2, mode);
            if (typeof onDone === 'function') onDone(txt2, imgData);
            return;
          }
        } catch (e2) {}
      }
      _error(resultBox);
    }
  }

  var _loaderMsgs = {
    food:'🍕 جاري التعرف على الطعام...', product:'📦 جاري تحليل المنتج...',
    medicine:'💊 جاري قراءة الدواء...', report:'📋 جاري قراءة التقرير...',
    prescription:'📝 جاري قراءة الروشتة...', fake_image:'🔍 جاري فحص الصورة...',
    homework:'🧠 جاري حل السؤال...', palm:'🖐 جاري قراءة خطوط الكف...',
    barcode:'📊 جاري تحليل المنتج...'
  };
  function _loaderMsg(mode) { return _loaderMsgs[mode] || 'جاري التحليل الذكي...'; }

  /**
   * startLiveLoop — شغّل حلقة تحليل مستمرة حتى تنجح مرة واحدة
   * @param {string} videoId
   * @param {string} mode
   * @param {string} resultBoxId
   * @param {Object} streamRef — { stream: MediaStream }
   * @returns {number} intervalId
   */
  function startLiveLoop(videoId, mode, resultBoxId, streamRef) {
    var videoEl   = document.getElementById(videoId);
    var resultBox = document.getElementById(resultBoxId);
    if (!videoEl || !resultBox) return null;

    var done = false;
    var tid  = null;

    var run = function () {
      if (done || !streamRef.stream) return;
      if (!videoEl.videoWidth) return; /* لم يبدأ الفيديو بعد */

      analyzeLiveNow(videoEl, mode, resultBox, function () {
        done = true;
        if (tid) { clearInterval(tid); tid = null; }
      });
    };

    setTimeout(run, LIVE_DELAY);
    tid = setInterval(run, LIVE_INTERVAL);
    return tid;
  }

  /* ══════════════════════════════════════════
     ⑦ Override أدوات الكاميرا
  ══════════════════════════════════════════ */

  function _installHooks() {

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       1. أداة الطعام (fs-video / fsOpenLiveCamera)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    var _origFsOpenLive = window.fsOpenLiveCamera;
    window.fsOpenLiveCamera = function () {
      /* استدع الأصلي أولاً لفتح الكاميرا */
      if (_origFsOpenLive) _origFsOpenLive.apply(this, arguments);

      /* انتظر حتى يشتغل الستريم ثم ابدأ التحليل الفوري */
      var attempts = 0;
      var checkVideo = setInterval(function () {
        attempts++;
        var video = document.getElementById('fs-video');
        var resBox = document.getElementById('fs-result');
        if (video && video.videoWidth && resBox) {
          clearInterval(checkVideo);
          _loader(resBox, _loaderMsg('food'));
          resBox.style.display = 'block';
          analyzeLiveNow(video, 'food', resBox);
        }
        if (attempts > 20) clearInterval(checkVideo); /* 10 ثوانٍ كحد أقصى */
      }, 500);
    };

    /* Override fsAnalyzeImage لعرض بطاقات */
    var _origFsAnalyze = window.fsAnalyzeImage;
    window.fsAnalyzeImage = async function (imgDataUrl) {
      var resBox = document.getElementById('fs-result');
      if (!resBox) { if (_origFsAnalyze) return _origFsAnalyze(imgDataUrl); return; }
      _loader(resBox, _loaderMsg('food'));
      try {
        var text = await _toWorker(imgDataUrl, PROMPTS.food);
        if (!text) throw new Error();
        try {
          var data = JSON.parse(text.replace(/```json|```/g,'').trim());
          if (window.renderFoodAnalysisResult) { window.renderFoodAnalysisResult(data, resBox); return; }
        } catch(e) {}
        resBox.innerHTML = renderCards(text, 'food');
      } catch(e) {
        if (_origFsAnalyze) _origFsAnalyze(imgDataUrl);
      }
    };

    /* Override fsParseAndDisplay */
    var _origFsParse = window.fsParseAndDisplay;
    window.fsParseAndDisplay = function (text) {
      var resBox = document.getElementById('fs-result');
      if (!resBox) { if (_origFsParse) return _origFsParse(text); return; }
      try {
        var clean = text.replace(/```json|```/g,'').trim();
        if (clean.startsWith('{')) {
          var data = JSON.parse(clean);
          if (window.renderFoodAnalysisResult) { window.renderFoodAnalysisResult(data, resBox); return; }
        }
      } catch(e) {}
      resBox.style.display = 'block';
      resBox.innerHTML = renderCards(text, 'food');
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       2. المسح الذكي (pa-video-stream / product+medicine+report+prescription)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    var _origStartCamera = window.startPremiumCameraScanner;
    window.startPremiumCameraScanner = function (onReady) {
      if (_origStartCamera) {
        _origStartCamera(function () {
          if (typeof onReady === 'function') onReady();
          /* بعد بدء الكاميرا، حلّل تلقائياً بحسب الوضع الحالي */
          setTimeout(function () {
            var video  = document.getElementById('pa-video-stream');
            var resBox = document.getElementById('pa-scan-result');
            var mode   = _getPaMode();
            if (video && video.videoWidth && resBox && mode) {
              _loader(resBox, _loaderMsg(mode));
              resBox.style.display = 'block';
              analyzeLiveNow(video, mode, resBox);
            }
          }, LIVE_DELAY);
        });
      }
    };

    /* Override _liveVisionAnalyze → إرسال للـ CF Worker مباشرة */
    var _origLiveVision = window._liveVisionAnalyze;
    window._liveVisionAnalyze = async function (videoEl, prompt, onResult, onError) {
      if (!videoEl || !videoEl.videoWidth) { if (onError) onError('الكاميرا غير جاهزة'); return; }
      var imgData = _capture(videoEl, 0.88);
      var mode = _getPaMode() || 'product';
      var smartPrompt = PROMPTS[mode] || prompt;

      try {
        var text = await _toWorker(imgData, smartPrompt);
        if (text && text.trim().length > 8) {
          var resBox = document.getElementById('pa-scan-result');
          if (resBox) resBox.innerHTML = renderCards(text, mode);
          if (onResult) onResult(text, imgData);
          return;
        }
      } catch(e) {}

      /* fallback للدالة الأصلية */
      if (_origLiveVision) _origLiveVision(videoEl, prompt, function (result, img) {
        var resBox = document.getElementById('pa-scan-result');
        if (resBox) resBox.innerHTML = renderCards(result, mode);
        if (onResult) onResult(result, img);
      }, onError);
    };

    /* captureAndScanProductBlob */
    var _origCaptureBlob = window.captureAndScanProductBlob;
    window.captureAndScanProductBlob = async function () {
      var video  = document.getElementById('pa-video-stream');
      var resBox = document.getElementById('pa-scan-result');
      if (video && video.videoWidth && resBox) {
        var mode = _getPaMode() || 'product';
        await analyzeLiveNow(video, mode, resBox);
        return;
      }
      if (_origCaptureBlob) _origCaptureBlob.apply(this, arguments);
    };

    /* _callClaudeAPIWithImage → CF Worker أولاً */
    var _origCallImg = window._callClaudeAPIWithImage;
    window._callClaudeAPIWithImage = async function (prompt, imgDataUrl) {
      if (!imgDataUrl) { if (_origCallImg) return _origCallImg(prompt, imgDataUrl); return null; }
      try {
        var text = await _toWorker(imgDataUrl, prompt);
        if (text && text.trim().length > 8) return text;
      } catch(e) {}
      if (_origCallImg) return _origCallImg(prompt, imgDataUrl);
      throw new Error('Vision failed');
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       3. تحليل الأدوية
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    var _origAnalyzeMed = window.analyzeMedicineFromCamera;
    window.analyzeMedicineFromCamera = async function () {
      var video  = document.getElementById('pa-video-stream');
      var resBox = document.getElementById('pa-scan-result');
      if (video && video.videoWidth && resBox) {
        await analyzeLiveNow(video, 'medicine', resBox);
        return;
      }
      if (_origAnalyzeMed) _origAnalyzeMed.apply(this, arguments);
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       4. تحليل التقارير الطبية
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    var _origAnalyzeRep = window.analyzeReportFromCamera;
    window.analyzeReportFromCamera = async function () {
      var video  = document.getElementById('pa-video-stream');
      var resBox = document.getElementById('pa-scan-result');
      if (video && video.videoWidth && resBox) {
        await analyzeLiveNow(video, 'report', resBox);
        return;
      }
      if (_origAnalyzeRep) _origAnalyzeRep.apply(this, arguments);
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       5. تحليل الروشتة (_renderPrescriptionResult)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    var _origRenderPres = window._renderPrescriptionResult;
    window._renderPrescriptionResult = async function (text) {
      var resBox = document.getElementById('pa-scan-result');
      if (!resBox) { if (_origRenderPres) return _origRenderPres(text); return; }
      resBox.innerHTML = renderCards(text, 'prescription');
      if (typeof window._stopPaCamera === 'function') window._stopPaCamera();
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       6. كشف الصور المزيفة (fi-video)
       تحليل فوري عند فتح الكاميرا + تحليل عند الضغط
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    var _origFiOpen = window.fakeImageOpenCamera;
    window.fakeImageOpenCamera = function () {
      if (_origFiOpen) _origFiOpen.apply(this, arguments);

      var attempts2 = 0;
      var checkFi = setInterval(function () {
        attempts2++;
        var video  = document.getElementById('fi-video');
        var resBox = document.getElementById('fi-result');
        if (video && video.videoWidth && resBox) {
          clearInterval(checkFi);
          _loader(resBox, _loaderMsg('fake_image'));
          resBox.style.display = 'block';
          analyzeLiveNow(video, 'fake_image', resBox);
        }
        if (attempts2 > 20) clearInterval(checkFi);
      }, 500);
    };

    var _origFiAnalyze = window.fakeImageAnalyze;
    window.fakeImageAnalyze = async function () {
      if (!window._fiImageData) { if (typeof showToast === 'function') showToast('ارفع أو صوّر الصورة أولاً'); return; }
      if (typeof canUseTool === 'function' && !canUseTool('fake-image')) { if (typeof showTrialExpiredModal === 'function') showTrialExpiredModal('fake-image'); return; }
      if (typeof incToolUsage === 'function') incToolUsage('fake-image');
      var resBox = document.getElementById('fi-result');
      if (!resBox) { if (_origFiAnalyze) return _origFiAnalyze(); return; }
      _loader(resBox, _loaderMsg('fake_image'));
      resBox.style.display = 'block';
      try {
        var text = await _toWorker(window._fiImageData, PROMPTS.fake_image);
        if (!text) throw new Error();
        resBox.innerHTML = renderCards(text, 'fake_image');
      } catch(e) {
        if (_origFiAnalyze) _origFiAnalyze();
        else _error(resBox);
      }
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       7. حل الواجبات (hw-video)
       تحليل فوري عند فتح الكاميرا + hwSolve
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    var _origHwOpen = window.hwOpenCamera;
    window.hwOpenCamera = function () {
      if (_origHwOpen) _origHwOpen.apply(this, arguments);

      var attempts3 = 0;
      var checkHw = setInterval(function () {
        attempts3++;
        var video  = document.getElementById('hw-video');
        var resBox = document.getElementById('hw-result');
        if (video && video.videoWidth && resBox) {
          clearInterval(checkHw);
          _loader(resBox, _loaderMsg('homework'));
          resBox.style.display = 'block';
          var grade   = document.getElementById('hw-grade')   ? document.getElementById('hw-grade').value   : '';
          var subject = document.getElementById('hw-subject') ? document.getElementById('hw-subject').value : '';
          var extra   = (grade ? 'الصف: ' + grade + '. ' : '') + (subject ? 'المادة: ' + subject + '. ' : '');
          var prompt  = (extra ? extra + '\n\n' : '') + PROMPTS.homework;
          var imgData = _capture(video, IMG_QUALITY);
          _toWorker(imgData, prompt).then(function (text) {
            if (text && text.length > 8) {
              resBox.innerHTML = renderCards(text, 'homework');
            } else {
              _error(resBox);
            }
          }).catch(function () { _error(resBox); });
        }
        if (attempts3 > 20) clearInterval(checkHw);
      }, 500);
    };

    var _origHwSolve = window.hwSolve;
    window.hwSolve = function () {
      var textInput = document.getElementById('hw-text-input') ? document.getElementById('hw-text-input').value.trim() : '';
      if (!window._hwImageData && !textInput) { if (typeof showToast === 'function') showToast('صوّر السؤال أو اكتبه أولاً 📚'); return; }
      if (typeof canUseTool === 'function' && !canUseTool('homework')) { if (typeof showTrialExpiredModal === 'function') showTrialExpiredModal('homework'); return; }
      if (typeof incToolUsage === 'function') incToolUsage('homework');
      var resBox = document.getElementById('hw-result');
      if (!resBox) { if (_origHwSolve) return _origHwSolve(); return; }
      _loader(resBox, _loaderMsg('homework'));
      resBox.style.display = 'block';

      var grade   = document.getElementById('hw-grade')   ? document.getElementById('hw-grade').value   : '';
      var subject = document.getElementById('hw-subject') ? document.getElementById('hw-subject').value : '';
      var gradeInfo = (grade ? 'الصف: ' + grade + '. ' : '') + (subject ? 'المادة: ' + subject + '. ' : '');
      var prompt = (gradeInfo ? gradeInfo + '\n\n' : '') + PROMPTS.homework + (textInput ? '\n\nالسؤال: ' + textInput : '');

      var apiCall = window._hwImageData
        ? _toWorker(window._hwImageData, prompt)
        : (window._callClaudeAPI ? window._callClaudeAPI(prompt, null).then(function(r){return r;}) : Promise.reject());

      apiCall.then(function (text) {
        if (!text) throw new Error();
        resBox.innerHTML = renderCards(text, 'homework');
      }).catch(function () {
        if (_origHwSolve) _origHwSolve();
        else _error(resBox);
      });
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       8. قراءة الكف (palm-video)
       تحليل فوري عند فتح الكاميرا + palmAnalyze
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    var _origPalmOpen = window.palmOpenCamera;
    window.palmOpenCamera = function () {
      if (_origPalmOpen) _origPalmOpen.apply(this, arguments);

      var attempts4 = 0;
      var checkPalm = setInterval(function () {
        attempts4++;
        var video  = document.getElementById('palm-video');
        var resBox = document.getElementById('palm-result') || document.getElementById('palm-reading-result');
        if (video && video.videoWidth && resBox) {
          clearInterval(checkPalm);
          _loader(resBox, _loaderMsg('palm'));
          resBox.style.display = 'block';
          var modeMap = { full:'قراءة شاملة', love:'ركّز على الجانب العاطفي والعلاقات', career:'ركّز على المسار المهني', health:'ركّز على جانب الصحة والحيوية' };
          var palmPrompt = PROMPTS.palm + (window._palmMode && window._palmMode !== 'full' ? '\n\n' + (modeMap[window._palmMode] || '') : '');
          var imgData = _capture(video, IMG_QUALITY);
          _toWorker(imgData, palmPrompt).then(function (text) {
            if (text && text.length > 8) {
              resBox.innerHTML = renderCards(text, 'palm') +
                '<div class="tvc2-disc">🔮 هذه القراءة للترفيه والاستئناس فقط</div>';
            } else {
              _error(resBox);
            }
          }).catch(function () { _error(resBox); });
        }
        if (attempts4 > 20) clearInterval(checkPalm);
      }, 500);
    };

    var _origPalmAnalyze = window.palmAnalyze;
    window.palmAnalyze = async function () {
      if (!window._palmImageData) { if (typeof showToast === 'function') showToast('صوّر أو ارفع صورة كفك أولاً 🖐'); return; }
      if (typeof canUseTool === 'function' && !canUseTool('palm')) { if (typeof showTrialExpiredModal === 'function') showTrialExpiredModal('palm'); return; }
      if (typeof incToolUsage === 'function') incToolUsage('palm');
      var resBox = document.getElementById('palm-result');
      if (!resBox) { if (_origPalmAnalyze) return _origPalmAnalyze(); return; }
      _loader(resBox, _loaderMsg('palm'));
      resBox.style.display = 'block';

      var modeMap2 = { full:'قراءة شاملة', love:'العواطف والحب', career:'المسار المهني', health:'الصحة والحيوية' };
      var modeExtra = window._palmMode && window._palmMode !== 'full' ? '\n\nركّز على: ' + (modeMap2[window._palmMode] || '') : '';
      try {
        var text = await _toWorker(window._palmImageData, PROMPTS.palm + modeExtra);
        if (!text) throw new Error();
        resBox.innerHTML = renderCards(text, 'palm') +
          '<div class="tvc2-disc">🔮 هذه القراءة للترفيه والاستئناس فقط</div>';
      } catch(e) {
        if (_origPalmAnalyze) _origPalmAnalyze();
        else _error(resBox);
      }
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       9. فحص المنتجات / الباركود (bb-video)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    var _origBbOpen = window.bbOpenCamera;
    window.bbOpenCamera = function () {
      if (_origBbOpen) _origBbOpen.apply(this, arguments);

      var attempts5 = 0;
      var checkBb = setInterval(function () {
        attempts5++;
        var video  = document.getElementById('bb-video');
        var resBox = document.getElementById('bb-result');
        if (video && video.videoWidth && resBox) {
          clearInterval(checkBb);
          _loader(resBox, _loaderMsg('barcode'));
          resBox.style.display = 'block';
          analyzeLiveNow(video, 'barcode', resBox);
        }
        if (attempts5 > 20) clearInterval(checkBb);
      }, 500);
    };

    var _origBbSmart = window.bbSmartCapture;
    window.bbSmartCapture = async function () {
      var video  = document.getElementById('bb-video');
      var resBox = document.getElementById('bb-result');
      if (video && video.videoWidth && resBox) {
        await analyzeLiveNow(video, 'barcode', resBox);
        return;
      }
      if (_origBbSmart) _origBbSmart.apply(this, arguments);
    };

    console.log('[TVC2] ✅ v2.0 — تحليل فوري مباشر لكل الكاميرات مثبّت');
  }

  /* ══════════════════════════════════════════
     ⑧ دالة مساعدة — تحديد وضع pa-scanner
  ══════════════════════════════════════════ */
  function _getPaMode() {
    /* يحاول قراءة الوضع الحالي من متغيرات متعددة */
    var mode = window._scanMode || window._paCurrentMode || '';
    /* أو من الـ active tab */
    var activeTab = document.querySelector('.mode-tab.active, [data-mode].active');
    if (activeTab && !mode) mode = activeTab.getAttribute('data-mode') || '';
    /* Map */
    var map = {
      'product':'product','food':'food','medicine':'medicine','report':'report','prescription':'prescription',
      'ingredients':'product','barcode':'barcode','scan':'product'
    };
    return map[mode] || mode || null;
  }

  /* ══════════════════════════════════════════
     ⑨ تصدير المكتبة
  ══════════════════════════════════════════ */
  window.TayyibatVisionCards2 = {
    version:        '2.0',
    sendToWorker:   _toWorker,
    analyzeLiveNow: analyzeLiveNow,
    startLiveLoop:  startLiveLoop,
    renderCards:    renderCards,
    PROMPTS:        PROMPTS,
    THEMES:         THEMES,
    captureFrame:   _capture
  };

  /* ══════════════════════════════════════════
     ⑩ PA-SCANNER — تحليل فوري مباشر
     يتجاوز liveAnalysisEngine تماماً
  ══════════════════════════════════════════ */
  (function _patchPaScanner() {

    /** التقط إطار وحلّله مباشرة عبر CF Worker */
    async function _paAnalyze(videoEl, mode, resBox, statusEl) {
      if (!videoEl || !resBox) return;

      var imgData = _capture(videoEl, IMG_QUALITY);
      if (!imgData) {
        _loader(resBox, '⏳ الكاميرا تبدأ... انتظر لحظة');
        resBox.style.display = 'block';
        return;
      }

      _loader(resBox, _loaderMsgs[mode] || 'جاري التحليل الذكي...');
      resBox.style.display = 'block';
      if (statusEl) statusEl.style.display = 'none';

      var prompt = PROMPTS[mode] || PROMPTS.product;
      try {
        var text = await _toWorker(imgData, prompt);
        if (text && text.trim().length > 8) {
          var retryFn = function () { _paAnalyze(videoEl, mode, resBox, statusEl); };
          resBox.innerHTML = renderCards(text, mode, retryFn);
        } else {
          throw new Error('empty');
        }
      } catch (e) {
        /* fallback → TayyibatAI.vision */
        var fallbackDone = false;
        if (window.TayyibatAI && typeof window.TayyibatAI.vision === 'function') {
          try {
            var r2 = await window.TayyibatAI.vision(imgData, prompt);
            var t2 = (r2 && r2.text) ? r2.text : (typeof r2 === 'string' ? r2 : null);
            if (t2 && t2.length > 8) {
              resBox.innerHTML = renderCards(t2, mode);
              fallbackDone = true;
            }
          } catch (e2) {}
        }
        if (!fallbackDone) {
          _error(resBox, function () { _paAnalyze(videoEl, mode, resBox, statusEl); });
        }
      }
    }

    /** انتظر حتى يصبح الفيديو جاهزاً ثم حلّل */
    function _waitAndAnalyze(videoId, mode, resBoxId, statusId, maxWaitMs) {
      maxWaitMs = maxWaitMs || 12000;
      var startTs = Date.now();
      var tid = setInterval(function () {
        var video  = document.getElementById(videoId);
        var resBox = document.getElementById(resBoxId);
        var status = statusId ? document.getElementById(statusId) : null;
        if (video && video.videoWidth > 0 && resBox) {
          clearInterval(tid);
          _paAnalyze(video, mode, resBox, status);
        } else if (Date.now() - startTs > maxWaitMs) {
          clearInterval(tid);
        }
      }, 400);
    }

    /* ── Override paAnalyzeManual (زر "تحليل بالذكاء الاصطناعي") ── */
    window.paAnalyzeManual = function () {
      var video  = document.getElementById('pa-video-stream');
      var resBox = document.getElementById('pa-scan-result');
      var status = document.getElementById('live-analysis-status');
      var mode   = window._scanMode || window._paCurrentMode || _getPaMode() || 'product';

      if (video && video.videoWidth > 0 && resBox) {
        _paAnalyze(video, mode, resBox, status);
      } else if (resBox) {
        /* الكاميرا لم تفتح بعد — اعرض رسالة */
        resBox.style.display = 'block';
        _loader(resBox, '📷 افتح الكاميرا أولاً أو وجّهها نحو الشيء المراد تحليله...');
        _waitAndAnalyze('pa-video-stream', mode, 'pa-scan-result', 'live-analysis-status', 10000);
      }
    };

    /* ── Override liveAnalysisEngine.start لإضافة تحليل فوري ── */
    var _laePatchDone = false;
    function _patchLAE() {
      if (_laePatchDone || !window.liveAnalysisEngine) return;
      _laePatchDone = true;

      var _origLAEStart = window.liveAnalysisEngine.start.bind(window.liveAnalysisEngine);
      window.liveAnalysisEngine.start = function (videoId, canvasId, mode) {
        _origLAEStart(videoId, canvasId, mode);
        /* ابدأ تحليلاً فورياً موازياً عبر CF Worker */
        _waitAndAnalyze(videoId, mode || 'product', 'pa-scan-result', 'live-analysis-status', 12000);
      };

      /* Override restart أيضاً */
      var _origLAERestart = window.liveAnalysisEngine.restart.bind(window.liveAnalysisEngine);
      window.liveAnalysisEngine.restart = function () {
        _origLAERestart();
        var mode = window.liveAnalysisEngine.currentMode || _getPaMode() || 'product';
        _waitAndAnalyze('pa-video-stream', mode, 'pa-scan-result', 'live-analysis-status', 12000);
      };
    }

    /* حاول patch فوراً ثم بعد DOM جاهز */
    _patchLAE();
    document.addEventListener('DOMContentLoaded', function () { setTimeout(_patchLAE, 1000); });
    setTimeout(_patchLAE, 1500);

    /* اجعل _paAnalyze متاحاً عالمياً */
    window._paDirectAnalyze = _paAnalyze;
    window._paWaitAndAnalyze = _waitAndAnalyze;

    console.log('[TVC2] ✅ PA-Scanner patch installed — paAnalyzeManual & liveAnalysisEngine overridden');
  })();

  /* تثبيت الـ hooks بعد تحميل الصفحة كاملاً */
  function _ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else setTimeout(fn, 800); /* DOM جاهز لكن window.* قد لا تكون معرّفة بعد */
  }
  _ready(_installHooks);

})();
