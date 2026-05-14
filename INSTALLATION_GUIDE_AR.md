# دليل التثبيت والنشر - Tayyibat Installation Guide

## 🚀 البدء السريع

### المتطلبات الأساسية:
- متصفح ويب حديث (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- اتصال إنترنت (للمرة الأولى فقط)
- جهاز يدعم PWA

---

## 📥 طرق التثبيت

### **الطريقة 1: التثبيت المباشر (الأسهل)**

1. **انسخ جميع الملفات إلى خادم الويب:**
   ```
   tayyibat-main/
   ├── index.html
   ├── sw.js
   ├── manifest.json
   ├── animations.css
   ├── advanced-ai.js
   └── README_AR.md
   ```

2. **تأكد أن الخادم يدعم HTTPS** (مهم جداً للـ Service Worker)

3. **أضف رؤوس HTTP الصحيحة:**
   ```
   Content-Type: text/html; charset=UTF-8
   X-UA-Compatible: IE=edge
   ```

4. **الوصول للتطبيق:**
   - عبر المتصفح: `https://yourdomain.com/tayyibat-main/`

### **الطريقة 2: التطوير المحلي**

**باستخدام Python:**
```bash
cd tayyibat-main
python -m http.server 8000

# ثم افتح: http://localhost:8000
```

**باستخدام Node.js (http-server):**
```bash
npm install -g http-server

cd tayyibat-main
http-server -p 8000

# ثم افتح: http://localhost:8000
```

**باستخدام Live Server (VS Code):**
1. ثبت عملية `Live Server` من VS Code
2. اضغط كليك يمين على `index.html`
3. اختر "Open with Live Server"

### **الطريقة 3: النشر على Vercel (موصى به)**

```bash
# 1. ثبت Vercel CLI
npm i -g vercel

# 2. ادخل المجلد
cd tayyibat-main

# 3. انشر
vercel

# اتبع التعليمات
```

### **الطريقة 4: النشر على Netlify**

```bash
# 1. ثبت Netlify CLI
npm install -g netlify-cli

# 2. ادخل المجلد
cd tayyibat-main

# 3. انشر
netlify deploy --prod

# أو قم برفع المجلد مباشرة على netlify.com
```

### **الطريقة 5: النشر على GitHub Pages**

```bash
# 1. انشئ مستودع على GitHub
# 2. انسخ الملفات
git clone https://github.com/yourusername/tayyibat.git
cd tayyibat

# 3. ادفع للمستودع
git add .
git commit -m "Initial commit"
git push origin main

# 4. في إعدادات المستودع، فعّل GitHub Pages
# Settings -> GitHub Pages -> Source: main branch
```

---

## ⚙️ إعدادات الخادم

### **Apache (.htaccess)**

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /tayyibat-main/
    
    # رجوع الطلبات غير الموجودة للـ index.html
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [QSA,L]
</IfModule>

# رؤوس CORS
<FilesMatch "\.(js|css|json)$">
    Header set Access-Control-Allow-Origin "*"
</FilesMatch>

# دعم Service Worker
<FilesMatch "^sw\.js$">
    Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
</FilesMatch>

# دعم Manifest
<FilesMatch "^manifest\.json$">
    Header set Content-Type "application/manifest+json; charset=UTF-8"
</FilesMatch>
```

### **Nginx**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/tayyibat-main;

    # الملف الأساسي
    index index.html;

    # دعم URL rewriting
    location / {
        try_files $uri $uri/ /index.html;
    }

    # عدم تخزين Service Worker
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate, public, max-age=0";
        expires 0;
    }

    # تخزين الملفات الثابتة
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        expires 365d;
    }

    # GZIP compression
    gzip on;
    gzip_types text/plain text/css text/js application/json application/javascript;
    gzip_min_length 1000;

    # SSL (إذا كان موجود)
    # listen 443 ssl;
    # ssl_certificate /path/to/cert.pem;
    # ssl_certificate_key /path/to/key.pem;
}
```

---

## 🔐 إعدادات الأمان

### **HTTPS (ضروري)**
```bash
# استخدم Let's Encrypt للحصول على شهادة مجانية
certbot certonly --standalone -d yourdomain.com
```

### **Content Security Policy**
```html
<!-- أضف في <head> من index.html -->
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    font-src 'self' data:;
    connect-src 'self';
    img-src 'self' data: https:;
">
```

### **X-Frame-Options**
```html
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
```

---

## 📊 أداء التطبيق

### **قياس الأداء:**

```javascript
// في console
// 1. First Contentful Paint
performance.getEntriesByName('first-contentful-paint')[0];

// 2. Largest Contentful Paint
new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        console.log('LCP:', entry.renderTime || entry.loadTime);
    }
}).observe({entryTypes: ['largest-contentful-paint']});

// 3. Cumulative Layout Shift
let cls = 0;
new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
            cls += entry.value;
        }
    }
    console.log('CLS:', cls);
}).observe({entryTypes: ['layout-shift']});
```

### **تحسينات الأداء:**

1. **Lazy Loading للصور:**
   ```html
   <img src="recipe.jpg" loading="lazy">
   ```

2. **Code Splitting:**
   - فصل الملفات الكبيرة
   - تحميل الملفات عند الحاجة

3. **Minification:**
   ```bash
   # Minify CSS
   cleancss -o animations.min.css animations.css
   
   # Minify JS
   uglifyjs advanced-ai.js -o advanced-ai.min.js
   ```

4. **Compression:**
   - تفعيل GZIP على الخادم
   - استخدام Brotli لأداء أفضل

---

## 🧪 الاختبار

### **اختبار Service Worker:**

```javascript
// في console
navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Registrations:', registrations);
});

// تحديث Service Worker
navigator.serviceWorker.getRegistration().then(reg => {
    reg.update();
});

// إلغاء Service Worker
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
});
```

### **اختبار الوظائف:**

```javascript
// اختبار البحث
const ai = new AdvancedAI();
const results = ai.fuzzySearch('حمص', recipes);
console.log('Search results:', results);

// اختبار التوصيات
const recommendations = ai.generateRecommendations(recipes, 5);
console.log('Recommendations:', recommendations);

// اختبار تحليل المشاعر
const sentiment = ai.analyzeSentiment('هذه الوصفة رائعة جداً');
console.log('Sentiment:', sentiment);
```

### **اختبار Lighthouse (Chrome DevTools):**

1. افتح DevTools (F12)
2. اذهب إلى Lighthouse
3. اختر Mobile أو Desktop
4. اضغط Generate report

---

## 📱 إعدادات الهاتف

### **تثبيت على Android:**

1. افتح التطبيق في Chrome
2. اضغط على ⋮ (القائمة الثلاث نقاط)
3. اختر "Install app" أو "Add to Home screen"
4. التطبيق سيظهر كأيقونة على الشاشة الرئيسية

### **تثبيت على iOS:**

1. افتح التطبيق في Safari
2. اضغط على مشاركة (Share)
3. اختر "Add to Home Screen"
4. أعطِ التطبيق اسماً
5. اضغط "Add"

### **الصلاحيات المطلوبة:**

```json
// في manifest.json
"permissions": [
    "storage",
    "network"
]
```

---

## 🐛 تصحيح الأخطاء

### **في DevTools:**

1. **Console Tab:**
   - افحص الأخطاء والتحذيرات
   - استخدم `console.log()` للـ debugging

2. **Network Tab:**
   - تفقد طلبات الشبكة
   - افحص الرؤوس (Headers)
   - تحقق من حجم الملفات

3. **Application Tab:**
   - تفقد Service Worker
   - تفقد Manifest
   - تفقد Local Storage
   - تفقد Cache Storage

4. **Performance Tab:**
   - سجل الأداء
   - افحص bottlenecks
   - حلل الـ frame rate

### **المشاكل الشائعة والحلول:**

| المشكلة | السبب | الحل |
|--------|------|------|
| Service Worker لا يعمل | HTTPS غير مفعل | فعّل HTTPS على الخادم |
| الصفحة بطيئة | ملفات كبيرة | ضغط واختزل الملفات |
| البيانات لا تُحفظ | Storage مغلق | فعّل localStorage |
| الحركات بطيئة | GPU غير مفعل | استخدم `will-change` في CSS |

---

## 🔄 التحديثات

### **إصدار تحديث جديد:**

```bash
# 1. غيّر الإصدار في manifest.json
"version": "1.1.0"

# 2. حدّث Service Worker
// في sw.js: const CACHE_NAME = 'tayyibat-v2';

# 3. ادفع التغييرات
git add .
git commit -m "Release v1.1.0"
git push origin main
```

### **إستراتيجية التحديث:**

```javascript
// Check for updates
if ('serviceWorker' in navigator) {
    setInterval(() => {
        navigator.serviceWorker.getRegistration().then(reg => {
            reg.update();
        });
    }, 60000); // كل دقيقة
}

// Listen for updates
navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('New version available!');
    // أخبر المستخدم
});
```

---

## 📊 الإحصائيات والتحليل

### **إضافة Google Analytics:**

```html
<!-- في head من index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_ID');
    
    // تتبع الأحداث
    gtag('event', 'recipe_viewed', {
        'recipe_id': recipeId,
        'recipe_title': title
    });
</script>
```

---

## 📞 الدعم الفني

**للمساعدة:**
- 📧 البريد: support@tayyibat.com
- 💬 Chat: live chat على الموقع
- 📱 WhatsApp: +966-XX-XXXX

---

**آخر تحديث:** مايو 2024
**الإصدار:** 1.0.0
