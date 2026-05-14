# 📱 دليل التثبيت الشامل - طيبات النسخة المحسنة

## 🎯 معلومات التحديث

**الإصدار:** 2.0.0
**التاريخ:** مايو 2024
**الحالة:** ✅ نسخة محسنة كاملة

### ✨ المميزات الجديدة:

- 🤖 نظام AI متقدم مع API مجاني
- 🥬 تحليل ذكي للمكونات المتاحة
- 🏥 نظام صحي شامل (تتبع الأمراض والحساسيات)
- ⏰ صيام متقطع متقدم + نظام كيتو
- 🎨 رسوم متحركة ثلاثية الأبعاد
- 📊 إحصائيات صحية شاملة
- 🔐 بيانات محلية آمنة 100%

---

## 📋 المتطلبات

### للجميع:
- ✅ متصفح حديث (آخر إصدار)
- ✅ اتصال إنترنت (للمرة الأولى فقط)
- ✅ تفعيل JavaScript

### المتصفحات المدعومة:

| المتصفح | الإصدار الأدنى | المنصات |
|--------|---------------|---------|
| Chrome | 90+ | Windows, Mac, Linux, Android |
| Firefox | 88+ | Windows, Mac, Linux, Android |
| Safari | 14+ | macOS, iOS, iPadOS |
| Edge | 90+ | Windows, Mac, Linux |
| Samsung Internet | 14+ | Android |
| Opera | 76+ | Windows, Mac, Linux, Android |

---

## 🚀 طرق التثبيت

### **الطريقة 1: التثبيت المباشر (الأسهل)**

```bash
# 1. انسخ الملفات
cp index-enhanced.html index.html
cp manifest-enhanced.json manifest.json
cp sw-advanced.js sw.js
cp health-ai-system.js .
cp advanced-3d-animations.js .

# 2. رفع على خادم ويب
# تأكد من HTTPS

# 3. افتح في المتصفح
https://yourdomain.com
```

### **الطريقة 2: التطوير المحلي**

#### باستخدام Python:
```bash
# Python 3.x
cd tayyibat-app
python -m http.server 8000

# أو Python 2.x
python -m SimpleHTTPServer 8000

# ثم افتح: http://localhost:8000
```

#### باستخدام Node.js:
```bash
# تثبيت http-server (مرة واحدة)
npm install -g http-server

# تشغيل الخادم
cd tayyibat-app
http-server -p 8000

# افتح: http://localhost:8000
```

#### باستخدام Live Server في VS Code:
```
1. ثبت تطبيق "Live Server"
2. كليك يمين على index.html
3. اختر "Open with Live Server"
4. سيفتح تلقائياً على http://localhost:5500
```

### **الطريقة 3: النشر على Vercel (موصى به)**

```bash
# 1. ثبت Vercel CLI
npm install -g vercel

# 2. ادخل المجلد
cd tayyibat-app

# 3. انشر
vercel

# 4. اتبع التعليمات على الشاشة
```

### **الطريقة 4: النشر على Netlify**

```bash
# الطريقة الأولى: عبر CLI
netlify deploy --prod --dir=.

# الطريقة الثانية: سحب وإفلات
# 1. اذهب إلى netlify.com
# 2. اسحب المجلد
# 3. سيتم النشر تلقائياً
```

### **الطريقة 5: النشر على GitHub Pages**

```bash
# 1. أنشئ مستودع جديد
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/tayyibat.git
git push -u origin main

# 2. في إعدادات المستودع
# Settings → Pages → Source: main branch
# سيكون الموقع: https://username.github.io/tayyibat
```

---

## ⚙️ إعدادات الخادم

### **Apache (.htaccess)**

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # السماح بالملفات والمجلدات الموجودة
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]
    
    # إعادة توجيه الطلبات الأخرى للـ index.html
    RewriteRule ^ index.html [QSA,L]
</IfModule>

# HTTPS
<IfModule mod_ssl.c>
    SSLEngine on
</IfModule>

# CORS
<FilesMatch "\.(js|css|json)$">
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, OPTIONS"
</FilesMatch>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache Control
<FilesMatch "\.(html|htm)$">
    Header set Cache-Control "max-age=3600, must-revalidate"
</FilesMatch>

<FilesMatch "\.(js|css|jpg|jpeg|png|gif|ico|svg)$">
    Header set Cache-Control "max-age=31536000, immutable"
</FilesMatch>

<FilesMatch "^sw\.js$">
    Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate"
</FilesMatch>
```

### **Nginx**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/tayyibat;
    index index.html;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/tayyibat;
    index index.html;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Service Worker - No Cache
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate, public, max-age=0";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Static Assets - Long Cache
    location ~* \.(js|css|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        expires 365d;
    }

    # GZIP Compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
    gzip_min_length 1000;
    gzip_vary on;

    # Logging
    access_log /var/log/nginx/tayyibat_access.log;
    error_log /var/log/nginx/tayyibat_error.log;
}
```

---

## 🔐 إعدادات الأمان

### **HTTPS (ضروري جداً)**

```bash
# استخدام Let's Encrypt (مجاني)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# التجديد التلقائي
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### **Content Security Policy**

أضف هذا في `<head>` من index.html:

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline';
    font-src 'self' data:;
    connect-src 'self' https://www.themealdb.com https://api.edamam.com;
    img-src 'self' data: https: blob:;
    media-src 'self' blob:;
    object-src 'none';
    frame-ancestors 'none';
">
```

### **Headers الأمان**

```html
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
<meta name="referrer" content="strict-origin-when-cross-origin">
```

---

## 📱 التثبيت على الأجهزة

### **Android (Chrome/Firefox)**

1. افتح التطبيق في المتصفح
2. اضغط القائمة (⋮)
3. اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"
4. سيظهر أيقونة على الشاشة الرئيسية

### **iOS/iPadOS (Safari)**

1. افتح التطبيق في Safari
2. اضغط زر المشاركة (Share)
3. اختر "Add to Home Screen"
4. أعطِ التطبيق اسماً
5. اضغط "Add"

### **Windows (Edge/Chrome)**

1. افتح التطبيق
2. اضغط الزر على يسار شريط العنوان
3. اختر "تثبيت هذا التطبيق"
4. سيتم إنشاء اختصار على سطح المكتب

### **macOS (Safari)**

1. افتح في Safari
2. اذهب إلى File → Add to Dock
3. أو اضغط Cmd + Shift + D

---

## 🧪 الاختبار

### **اختبار Service Worker**

```javascript
// في console
navigator.serviceWorker.getRegistrations().then(regs => {
    console.log('Service Workers:', regs);
});

// تحديث
navigator.serviceWorker.getRegistration().then(reg => {
    reg.update();
});

// إلغاء التسجيل
navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
});
```

### **اختبار الـ PWA**

```javascript
// التحقق من تثبيت PWA
console.log(window.navigator.standalone); // iOS
console.log(window.matchMedia('(display-mode: standalone)').matches); // Android

// إظهار نموذج التثبيت
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
    deferredPrompt = e;
    // إظهار زر التثبيت
    installButton.hidden = false;
});
```

### **اختبار Lighthouse**

```bash
# باستخدام Chrome DevTools
1. فتح DevTools (F12)
2. اذهب إلى Lighthouse
3. اختر Mobile
4. اضغط "Analyze page load"
```

### **اختبار الوظائف**

```javascript
// اختبار نظام الصحة
const health = new HealthAISystem();
console.log('BMI:', health.calculateBMI());
console.log('Calories:', health.calculateCalorieNeeds());

// اختبار الرسوم المتحركة
const animations = new Advanced3DAnimations();
const element = document.querySelector('.card');
animations.add3DAnimation(element, 'rotate3D');
```

---

## 🐛 استكشاف الأخطاء

### **Service Worker لا يعمل**

```javascript
// افحص التسجيل
navigator.serviceWorker.getRegistrations().then(regs => {
    if (regs.length === 0) {
        console.log('❌ Service Worker غير مسجل');
    } else {
        console.log('✅ Service Worker مسجل');
    }
});
```

**الحلول:**
- ✅ تأكد من HTTPS
- ✅ افحص ملف sw.js موجود
- ✅ امسح الـ cache وأعد تحميل الصفحة
- ✅ افتح DevTools → Application → Service Workers

### **الأداء بطيء**

```javascript
// قياس الأداء
console.time('pageLoad');
// ... (كود)
console.timeEnd('pageLoad');

// أو استخدم Performance API
const perf = performance.getEntriesByType('navigation')[0];
console.log('Load time:', perf.loadEventEnd - perf.loadEventStart);
```

**الحلول:**
- ✅ قلل حجم الملفات (minify)
- ✅ فعّل GZIP compression
- ✅ استخدم CDN
- ✅ حسّن الصور

### **البيانات لا تُحفظ**

```javascript
// افحص localStorage
console.log(localStorage);

// افحص الـ IndexedDB
indexedDB.databases().then(dbs => {
    console.log('Available databases:', dbs);
});
```

**الحلول:**
- ✅ افحص Storage في DevTools
- ✅ افحص Private/Incognito Mode
- ✅ تأكد من عدم امتلاء التخزين

---

## 📊 مراقبة الأداء

### **مقاييس الأداء الأساسية:**

```javascript
// Core Web Vitals
const perfData = performance.getEntriesByType('navigation')[0];

// First Contentful Paint (FCP)
const fcp = performance.getEntriesByName('first-contentful-paint')[0];
console.log('FCP:', fcp?.startTime);

// Largest Contentful Paint (LCP)
const observer = new PerformanceObserver(list => {
    const lastEntry = list.getEntries().pop();
    console.log('LCP:', lastEntry);
});
observer.observe({entryTypes: ['largest-contentful-paint']});

// Cumulative Layout Shift (CLS)
let cls = 0;
const clsObserver = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
            cls += entry.value;
            console.log('CLS:', cls);
        }
    }
});
clsObserver.observe({entryTypes: ['layout-shift']});
```

---

## 🔄 التحديثات

### **التحقق من التحديثات التلقائي:**

```javascript
if ('serviceWorker' in navigator) {
    setInterval(() => {
        navigator.serviceWorker.getRegistration().then(reg => {
            if (reg) reg.update();
        });
    }, 60000); // كل دقيقة
}
```

### **إخطار المستخدم بالتحديثات:**

```javascript
navigator.serviceWorker.addEventListener('controllerchange', () => {
    showNotification('نسخة جديدة متاحة! يرجى تحديث الصفحة.');
});
```

---

## 📈 الإحصائيات والتحليل

### **Google Analytics (اختياري)**

```html
<!-- في head -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_ID', {
        'anonymize_ip': true
    });
    
    // تتبع الأحداث
    gtag('event', 'recipe_viewed', {
        'recipe_id': recipeId,
        'recipe_title': title
    });
</script>
```

---

## 🌍 السيو (SEO)

```html
<meta name="theme-color" content="#FF6B6B">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="طيبات">
<meta name="msapplication-TileColor" content="#FF6B6B">
<meta name="msapplication-TileImage" content="/icon-144x144.png">
```

---

## 📞 الدعم والمساعدة

- 📧 البريد: support@tayyibat.com
- 💬 Chat: live chat على الموقع
- 🐛 تقارير الأخطاء: issues على GitHub

---

## 📄 الترخيص

MIT License - يمكنك استخدامه بحرية في المشاريع الشخصية والتجارية

---

**آخر تحديث:** مايو 2024
**الإصدار:** 2.0.0
**الحالة:** ✅ جاهز للإنتاج

---

صُنع بـ ❤️ بواسطة فريق Tayyibat 🍳
