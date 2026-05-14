# 📚 التوثيق الشامل - طيبات v2.0

## 🎯 نظرة عامة

**طيبات** هو تطبيق ويب متقدم يجمع بين:
- 🤖 نظام ذكاء اصطناعي صحي متطور
- 📱 تطبيق ويب تقدمي (PWA)
- 🎨 واجهة مستخدم عصرية مع رسوم متحركة 3D
- 🔐 أمان وخصوصية كاملة
- ⚡ أداء فائقة السرعة

---

## 📦 الملفات الرئيسية

### **1. index-enhanced.html** - الصفحة الرئيسية
```html
<!-- الملف الرئيسي الذي يحتوي على:
- واجهة المستخدم كاملة
- نموذج تسجيل البيانات الشخصية
- علامات التبويب (وصفات، صحة، إعدادات)
- نظام البحث والتحليل
-->
```

**المحتويات:**
- الشريط العلوي مع الملاحة
- نموذج تحرير البيانات الشخصية
- شبكة الوصفات
- أدوات تحليل المكونات
- عرض الإحصائيات الصحية
- لوحة الإعدادات

### **2. health-ai-system.js** - نظام الصحة الذكي

```javascript
// الفئة الرئيسية
const healthAI = new HealthAISystem();

// الوظائف الأساسية:
healthAI.calculateBMI();                    // حساب مؤشر كتلة الجسم
healthAI.calculateCalorieNeeds();           // حساب السعرات الحرارية
healthAI.generateDailyHealthPlan();         // خطة يومية
healthAI.getPersonalizedHealthTips();       // نصائح مخصصة
healthAI.updateUserData(updates);           // تحديث البيانات
```

**الميزات:**
- ✅ 8+ أمراض مدعومة مع توصيات مخصصة
- ✅ نظام صيام متقطع متقدم (4 خطط)
- ✅ نظام كيتو مع حسابات الماكروز
- ✅ تحليل ذكي للمكونات
- ✅ API مجاني بدون تسجيل

### **3. advanced-3d-animations.js** - نظام الرسوم المتحركة

```javascript
// الفئة الرئيسية
const animations = new Advanced3DAnimations();

// الوظائف الأساسية:
animations.add3DAnimation(element, 'rotate3D');   // حركة 3D
animations.addIconAnimation(icon, 'bounce');      // حركة أيقونة
animations.addRippleEffect(btn, event);           // تأثير موجة
animations.addParticleExplosion(x, y);            // جسيمات
```

**الحركات المدعومة:**
- 30+ حركة ثلاثية الأبعاد
- تأثيرات نقر وتفاعل
- حركات أيقونات متقدمة
- موجات وجسيمات
- انتقالات سلسة

### **4. sw-advanced.js** - Service Worker المتقدم

**الاستراتيجيات:**
- Network First: للـ API
- Cache First: للملفات الثابتة
- Stale While Revalidate: للصفحات

**المميزات:**
- ✅ العمل بدون اتصال كامل
- ✅ مزامنة تلقائية
- ✅ تحديثات ذكية
- ✅ صفحة بدون اتصال احترافية

### **5. manifest-enhanced.json** - بيانات التطبيق

**المحتويات:**
- إعدادات التثبيت
- الألوان والأيقونات
- الاختصارات (Shortcuts)
- معالجات الملفات
- بيانات المشاركة

---

## 🏥 نظام الصحة المتقدم

### **الأمراض المدعومة:**

```javascript
const diseases = {
    'cancer': { name: 'سرطان', icon: '⚠️' },
    'diabetes': { name: 'السكري', icon: '🩺' },
    'heart': { name: 'أمراض القلب', icon: '❤️' },
    'kidney': { name: 'أمراض الكلى', icon: '🫘' },
    'liver': { name: 'أمراض الكبد', icon: '🍵' },
    'allergy': { name: 'الحساسية', icon: '🚫' },
    'celiac': { name: 'الاضطرابات الهضمية', icon: '🌾' },
    'hypertension': { name: 'ارتفاع ضغط الدم', icon: '📊' }
};
```

### **خطط الصيام المتقطع:**

| الخطة | الصيام | الأكل | السعرات | الكيتو |
|------|--------|-------|---------|--------|
| IF 16:8 | 16 ساعة | 8 ساعات | 2000 | ❌ |
| IF 18:6 | 18 ساعة | 6 ساعات | 1800 | ❌ |
| IF 20:4 | 20 ساعة | 4 ساعات | 1600 | ❌ |
| Keto 20:4 | 20 ساعة | 4 ساعات | 1600 | ✅ |

### **حسابات الماكروز للكيتو:**

```javascript
// نسبة التوزيع للكيتو:
{
    protein: 0.30,      // 30% بروتين
    fat: 0.65,          // 65% دهون
    carbs: 0.05         // 5% كربوهيدرات فقط
}
```

### **الإحصائيات المتتبعة:**

```javascript
// البيانات الشاملة:
{
    name: string,                    // الاسم
    age: number,                     // العمر
    weight: number,                  // الوزن
    height: number,                  // الطول
    bmi: number,                     // مؤشر كتلة الجسم
    bmiCategory: string,             // فئة BMI
    tdee: number,                    // السعرات اليومية
    diseases: string[],              // الأمراض
    allergies: string[],             // الحساسيات
    ifPlan: string,                  // خطة الصيام
    isKeto: boolean,                 // تفعيل الكيتو
    goal: string,                    // الهدف (lose/maintain/gain)
    activityLevel: string            // مستوى النشاط
}
```

---

## 🥬 نظام تحليل المكونات

### **الوظيفة الأساسية:**

```javascript
// تحليل المكونات المتاحة
const results = await healthAI.analyzeAvailableIngredientsAndSuggest([
    'دجاج',
    'طماطم',
    'جزر',
    'زيت زيتون'
]);

// النتائج تشمل:
// - الوصفات المناسبة
// - درجة التوافق الصحي
// - الفوائد والتحذيرات
// - التوافق مع الأمراض
// - توافقية الكيتو
```

### **مراحل التحليل:**

1. **الاستخراج**: استخراج المكونات من النص
2. **المطابقة**: مطابقة مع قاعدة البيانات
3. **التصفية**: تصفية حسب الأمراض والحساسيات
4. **الترتيب**: ترتيب حسب درجة التوافق
5. **الإرجاع**: إرجاع النتائج المرتبة

---

## 🎨 نظام الرسوم المتحركة

### **أنواع الحركات:**

#### **ثلاثية الأبعاد:**
```javascript
'rotate3D'      // دوران متعدد المحاور
'flip3D'        // قلب 3D
'swing3D'       // تأرجح 3D
'float3D'       // تحويم 3D
'cube3D'        // دوران مكعب
'expandPulse3D' // نبض مع تمدد
```

#### **أيقونات:**
```javascript
'bounce'        // قفزة
'spin'          // دوران سريع
'pulse'         // نبض
'float'         // تحويم
'shake'         // اهتزاز
```

#### **تفاعلات:**
```javascript
'ripple'        // تأثير موجة
'tapScale'      // تغيير حجم عند النقر
'pressGlow'     // توهج عند الضغط
'particleExplode' // انفجار جسيمات
```

### **الاستخدام:**

```javascript
// إضافة حركة
const animation = animations.add3DAnimation(element, 'rotate3D', 3);

// إزالة الحركة
animation.remove();

// إضافة تأثير نقر
animations.addRippleEffect(button, event);

// إضافة حركة أيقونة
animations.addIconAnimation(icon, 'bounce');
```

---

## 💾 نظام البيانات المحلية

### **التخزين:**

```javascript
// حفظ البيانات تلقائياً
localStorage.setItem('tayyibat_user_profile', JSON.stringify(profile));

// تحميل البيانات
const profile = JSON.parse(localStorage.getItem('tayyibat_user_profile'));

// مسح البيانات
localStorage.removeItem('tayyibat_user_profile');
```

### **الأمان:**

✅ **بيانات محلية 100%**
- لا توجد عمليات نقل للخوادم
- التخزين في localStorage المحمي
- تشفير بيانات الحساسة (اختياري)

---

## 📱 واجهة المستخدم

### **العناصر الرئيسية:**

#### **الشريط العلوي:**
```html
<!-- الشعار والملاحة -->
<header class="header">
    <div class="logo">🍳 طيبات الصحي</div>
    <nav class="nav-buttons">
        <button>👤 بيانات الملف</button>
        <button>🌙 المظهر</button>
    </nav>
</header>
```

#### **علامات التبويب:**
```html
<!-- 🍽️ الوصفات - 🥬 المكونات - 🏥 الصحة - ⚙️ الإعدادات -->
<div class="tabs">
    <button class="tab" onclick="switchTab('recipes')">🍽️</button>
    <button class="tab" onclick="switchTab('ingredients')">🥬</button>
    <button class="tab" onclick="switchTab('health')">🏥</button>
    <button class="tab" onclick="switchTab('settings')">⚙️</button>
</div>
```

#### **نموذج البيانات:**
```html
<!-- نموذج شامل لتحرير البيانات -->
<form id="profileForm">
    <input id="nameInput" placeholder="الاسم">
    <input id="ageInput" type="number" placeholder="العمر">
    <input id="weightInput" type="number" placeholder="الوزن">
    <input id="heightInput" type="number" placeholder="الطول">
    <select id="genderSelect">
        <option value="male">ذكر</option>
        <option value="female">أنثى</option>
    </select>
    <!-- ... حقول أخرى -->
</form>
```

---

## 🔌 التكامل مع API المجانية

### **الـ APIs المدعومة:**

```javascript
// TheMealDB (مجاني بدون تسجيل)
https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken

// Edamam (يتطلب مفتاح - اختياري)
https://api.edamam.com/api/recipes/v2

// OpenWeather (اختياري)
https://api.openweathermap.org/data/2.5/weather
```

### **المعالجة:**

```javascript
// استدعاء API وتصفية النتائج
const suggestions = await queryFreeRecipeAPI(ingredients);
const filtered = filterRecipesByHealth(suggestions);
const ranked = rankRecipesByHealthScore(filtered);
```

---

## 🧮 الحسابات الصحية

### **BMI:**

```javascript
// صيغة حساب مؤشر كتلة الجسم
bmi = weight / (height² / 10000)

// الفئات:
< 18.5      → نقص الوزن
18.5 - 24.9 → وزن صحي
25 - 29.9   → زيادة الوزن
≥ 30        → السمنة
```

### **TDEE (احتياجات السعرات):**

```javascript
// معادلة Harris-Benedict

// للرجال:
BMR = 88.362 + (13.397 × weight) + (4.799 × height) - (5.677 × age)

// للنساء:
BMR = 447.593 + (9.247 × weight) + (3.098 × height) - (4.330 × age)

// TDEE = BMR × Activity Factor
// Activity Factors:
// Sedentary: 1.2
// Light: 1.375
// Moderate: 1.55
// Active: 1.725
// Very Active: 1.9
```

### **السعرات الغذائية للمكونات:**

```javascript
{
    'دجاج': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    'سمك': { calories: 100, protein: 22, carbs: 0, fat: 1 },
    'بيض': { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
    'أرز': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    // ... المزيد
}
```

---

## 🔧 التطوير والتخصيص

### **إضافة وصفة جديدة:**

```javascript
const newRecipe = {
    id: 9,
    title: 'اسم الوصفة',
    emoji: '🍳',
    time: '30 دقيقة',
    difficulty: 'سهل',
    rating: 4.5,
    reviews: 100,
    ingredients: ['مكون1', 'مكون2'],
    steps: ['خطوة1', 'خطوة2'],
    calories: 300,
    protein: 25,
    carbs: 30,
    fat: 10
};
```

### **إضافة مرض جديد:**

```javascript
healthAI.freeDiseases['newDisease'] = {
    name: 'اسم المرض',
    icon: '🏥',
    risks: ['المكونات المضرة'],
    benefits: ['المكونات المفيدة']
};
```

### **تخصيص الألوان:**

```css
:root {
    --primary: #FF6B6B;      /* اللون الأساسي */
    --secondary: #4ECDC4;    /* اللون الثانوي */
    --accent: #FFE66D;       /* اللون الإضافي */
    --dark: #2C3E50;         /* اللون الداكن */
    --light: #ECF0F1;        /* اللون الفاتح */
}
```

---

## 📊 الإحصائيات والتقارير

### **تصدير التقرير:**

```javascript
// الحصول على التقرير الكامل
const report = healthAI.exportHealthReport();

// يحتوي على:
// - بيانات المستخدم
// - الإحصائيات الصحية
// - الخطة اليومية
// - النصائح الشخصية

// تصدير كـ JSON
const json = JSON.stringify(report, null, 2);
const blob = new Blob([json], { type: 'application/json' });
```

---

## 🚨 معالجة الأخطاء

### **أخطاء شائعة وحلولها:**

```javascript
// خطأ 1: Service Worker لا يعمل
try {
    await navigator.serviceWorker.register('sw.js');
} catch (error) {
    console.error('Service Worker registration failed:', error);
}

// خطأ 2: API غير متاح
try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('API Error');
} catch (error) {
    console.log('Fallback to local recipes');
    return suggestFromLocalRecipes(ingredients);
}

// خطأ 3: localStorage ممتلئ
try {
    localStorage.setItem(key, value);
} catch (error) {
    if (error.name === 'QuotaExceededError') {
        clearOldData();
        localStorage.setItem(key, value);
    }
}
```

---

## 🌐 الدعم المتعدد اللغات

### **إضافة لغة جديدة:**

```javascript
const translations = {
    'ar': {
        'welcome': 'أهلاً وسهلاً',
        'analyze': 'تحليل'
    },
    'en': {
        'welcome': 'Welcome',
        'analyze': 'Analyze'
    }
};

function t(key) {
    return translations[currentLang][key];
}
```

---

## 📞 دوال مساعدة

### **دوال UI:**

```javascript
// عرض رسالة نجاح
showSuccess('تم الحفظ بنجاح ✓');

// عرض تنبيه
showAlert('حدث خطأ ما');

// التحميل
showLoading(true);

// إغلاق النموذج
closeProfileModal();
```

### **دوال البيانات:**

```javascript
// حفظ الملف الشخصي
saveProfile();

// تحديث خطة IF
updateIFPlan();

// تفعيل/تعطيل الكيتو
toggleKeto();

// تصدير التقرير
exportHealthReport();

// إعادة تعيين البيانات
resetAllData();
```

---

## 🎓 أمثلة الاستخدام

### **مثال 1: إضافة مستخدم جديد**

```javascript
const profile = {
    name: 'أحمد',
    age: 30,
    weight: 80,
    height: 175,
    diseases: ['diabetes', 'heart'],
    allergies: ['gluten'],
    ifPlan: 'IF_16_8',
    isKeto: false
};

const healthAI = new HealthAISystem();
healthAI.updateUserData(profile);
```

### **مثال 2: تحليل المكونات**

```javascript
const ingredients = ['دجاج', 'طماطم', 'جزر'];
const suggestions = await healthAI.analyzeAvailableIngredientsAndSuggest(ingredients);

suggestions.forEach(recipe => {
    console.log(`${recipe.title} - ${recipe.healthScore}%`);
});
```

### **مثال 3: إضافة رسوم متحركة**

```javascript
const animations = new Advanced3DAnimations();
const cards = document.querySelectorAll('.card');

cards.forEach((card, index) => {
    setTimeout(() => {
        animations.add3DAnimation(card, 'float3D');
    }, index * 100);
});
```

---

## 🎉 الخلاصة

طيبات v2.0 هو تطبيق متكامل يجمع بين:
- ✅ تكنولوجيا PWA حديثة
- ✅ نظام صحي ذكي متقدم
- ✅ رسوم متحركة جميلة
- ✅ واجهة سهلة الاستخدام
- ✅ أمان وخصوصية عالية
- ✅ أداء فائقة

**جاهز للاستخدام والتطوير!** 🚀

---

صُنع بـ ❤️ بواسطة فريق Tayyibat 🍳
