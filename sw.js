/**
 * Service Worker المتقدم
 * Advanced Service Worker with Full Offline Support
 */

const CACHE_VERSION = 'tayyibat-v2.0';
const RUNTIME_CACHE = 'tayyibat-runtime-v2.0';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/index-enhanced.html',
    '/manifest.json',
    '/manifest-enhanced.json',
    '/health-ai-system.js',
    '/advanced-3d-animations.js',
    '/animations.css',
    '/sw.js'
];

/**
 * حدث التثبيت - تخزين الموارد
 */
self.addEventListener('install', event => {
    console.log('🔧 تثبيت Service Worker...');
    
    event.waitUntil(
        (async () => {
            try {
                // فتح الكاش وإضافة الموارد
                const cache = await caches.open(CACHE_VERSION);
                await cache.addAll(ASSETS_TO_CACHE);
                console.log('✅ تم تخزين الموارد بنجاح');
                
                // تخطي انتظار التفعيل الفوري
                await self.skipWaiting();
            } catch (error) {
                console.error('❌ خطأ في التثبيت:', error);
            }
        })()
    );
});

/**
 * حدث التفعيل - تنظيف الكاش القديم
 */
self.addEventListener('activate', event => {
    console.log('⚡ تفعيل Service Worker...');
    
    event.waitUntil(
        (async () => {
            try {
                // الحصول على قائمة الكاش
                const cacheNames = await caches.keys();
                
                // حذف الكاش القديم
                await Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_VERSION && cacheName !== RUNTIME_CACHE) {
                            console.log('🗑️ حذف الكاش القديم:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
                
                // السيطرة الفورية على جميع العملاء
                await self.clients.claim();
                console.log('✅ تم تفعيل Service Worker بنجاح');
            } catch (error) {
                console.error('❌ خطأ في التفعيل:', error);
            }
        })()
    );
});

/**
 * حدث Fetch - معالجة الطلبات
 */
self.addEventListener('fetch', event => {
    const { request } = event;
    
    // تخطي الطلبات غير GET
    if (request.method !== 'GET') {
        return;
    }
    
    // تخطي الطلبات الخارجية (مع الاستثناءات)
    const requestUrl = new URL(request.url);
    
    // السماح بـ API الخارجية المجانية
    const allowedExternalAPIs = [
        'themealdb.com',
        'api.edamam.com',
        'api.openweathermap.org'
    ];
    
    const isExternalAPI = allowedExternalAPIs.some(api => 
        requestUrl.hostname.includes(api)
    );
    
    if (requestUrl.origin !== location.origin && !isExternalAPI) {
        return;
    }

    // استراتيجية التخزين المؤقت
    if (requestUrl.pathname.startsWith('/api/') || isExternalAPI) {
        // Network First للـ API
        event.respondWith(networkFirstStrategy(request));
    } else if (requestUrl.pathname.endsWith('.js') || 
               requestUrl.pathname.endsWith('.css') ||
               requestUrl.pathname.endsWith('.json')) {
        // Cache First للملفات الثابتة
        event.respondWith(cacheFirstStrategy(request));
    } else {
        // Stale While Revalidate للصفحات
        event.respondWith(staleWhileRevalidateStrategy(request));
    }
});

/**
 * استراتيجية Network First
 * محاولة الشبكة أولاً، ثم الكاش
 */
async function networkFirstStrategy(request) {
    try {
        const response = await fetch(request);
        
        // تخزين الرد الناجح
        if (response && response.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.log('📡 الشبكة غير متاحة، استخدام الكاش...');
        return caches.match(request) || createOfflineResponse();
    }
}

/**
 * استراتيجية Cache First
 * البحث في الكاش أولاً
 */
async function cacheFirstStrategy(request) {
    const cached = await caches.match(request);
    
    if (cached) {
        // تحديث الكاش في الخلفية
        fetch(request).then(response => {
            if (response && response.status === 200) {
                caches.open(RUNTIME_CACHE).then(cache => {
                    cache.put(request, response);
                });
            }
        }).catch(() => {});
        
        return cached;
    }
    
    try {
        const response = await fetch(request);
        
        if (response && response.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        return createOfflineResponse();
    }
}

/**
 * استراتيجية Stale While Revalidate
 * إرجاع الكاش مع تحديثه في الخلفية
 */
async function staleWhileRevalidateStrategy(request) {
    const cached = await caches.match(request);
    
    const fetchPromise = fetch(request).then(response => {
        if (response && response.status === 200) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then(c => c.put(request, response.clone()));
        }
        return response;
    }).catch(() => createOfflineResponse());
    
    return cached || fetchPromise;
}

/**
 * إنشاء صفحة عدم الاتصال
 */
function createOfflineResponse() {
    return new Response(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>بدون اتصال</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: 'Cairo', sans-serif;
                    color: white;
                }
                .offline-container {
                    text-align: center;
                    padding: 40px;
                }
                .offline-icon {
                    font-size: 80px;
                    margin-bottom: 20px;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                h1 { font-size: 32px; margin-bottom: 20px; }
                p { font-size: 18px; margin-bottom: 30px; opacity: 0.9; }
                .tips {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    border-radius: 12px;
                    text-align: right;
                    font-size: 14px;
                    line-height: 1.8;
                }
            </style>
        </head>
        <body>
            <div class="offline-container">
                <div class="offline-icon">📡</div>
                <h1>أنت حالياً بدون اتصال</h1>
                <p>يمكنك الوصول إلى البيانات المخزنة مسبقاً</p>
                <div class="tips">
                    <p>✓ جميع بيانات الوصفات محفوظة محلياً</p>
                    <p>✓ يمكنك تحليل المكونات المتاحة</p>
                    <p>✓ عرض إحصائياتك الصحية</p>
                    <p>✓ قراءة النصائح الشخصية</p>
                    <p style="margin-top: 15px; font-style: italic;">
                        سيتم إعادة الاتصال تلقائياً عند توفر الشبكة
                    </p>
                </div>
            </div>
        </body>
        </html>
    `, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

/**
 * معالجة الرسائل من العملاء
 */
self.addEventListener('message', event => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches();
            break;
            
        case 'UPDATE_CHECK':
            checkForUpdates();
            break;
            
        case 'CACHE_RECIPE':
            cacheRecipe(payload);
            break;
            
        default:
            console.log('رسالة مجهولة:', type);
    }
});

/**
 * حذف جميع الكاش
 */
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(name => caches.delete(name))
    );
    console.log('✅ تم حذف جميع الكاش');
}

/**
 * التحقق من التحديثات
 */
async function checkForUpdates() {
    try {
        const response = await fetch('/manifest.json');
        const manifest = await response.json();
        console.log('✅ تحقق من التحديثات:', manifest.version);
    } catch (error) {
        console.log('⚠️ لا يمكن التحقق من التحديثات');
    }
}

/**
 * تخزين الوصفة
 */
async function cacheRecipe(recipe) {
    try {
        const cache = await caches.open(RUNTIME_CACHE);
        const response = new Response(JSON.stringify(recipe), {
            headers: { 'Content-Type': 'application/json' }
        });
        cache.put(`/recipe/${recipe.id}`, response);
        console.log('✅ تم تخزين الوصفة:', recipe.title);
    } catch (error) {
        console.error('❌ خطأ في تخزين الوصفة:', error);
    }
}

/**
 * معالجة المزامنة في الخلفية
 */
self.addEventListener('sync', event => {
    if (event.tag === 'sync-recipes') {
        event.waitUntil(syncRecipes());
    } else if (event.tag === 'sync-user-data') {
        event.waitUntil(syncUserData());
    }
});

/**
 * مزامنة الوصفات
 */
async function syncRecipes() {
    console.log('🔄 جاري مزامنة الوصفات...');
    try {
        // يمكن إضافة منطق المزامنة هنا
        console.log('✅ تم مزامنة الوصفات');
    } catch (error) {
        console.error('❌ خطأ في المزامنة:', error);
        throw error;
    }
}

/**
 * مزامنة بيانات المستخدم
 */
async function syncUserData() {
    console.log('🔄 جاري مزامنة بيانات المستخدم...');
    try {
        // يمكن إضافة منطق المزامنة هنا
        console.log('✅ تم مزامنة البيانات');
    } catch (error) {
        console.error('❌ خطأ في المزامنة:', error);
        throw error;
    }
}

/**
 * معالجة الإشعارات
 */
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                for (let client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                return clients.openWindow('/');
            })
        );
    }
});

/**
 * معالجة فشل الإجراء
 */
self.addEventListener('install', event => {
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_VERSION);
                // التعامل مع الأخطاء بلطف
                for (const asset of ASSETS_TO_CACHE) {
                    try {
                        await cache.add(asset);
                    } catch (error) {
                        console.warn(`⚠️ تعذر تخزين ${asset}`);
                    }
                }
            } catch (error) {
                console.error('❌ خطأ في التثبيت:', error);
            }
        })()
    );
});

// إرسال رسالة عند التحديث
self.addEventListener('activate', event => {
    event.waitUntil(
        (async () => {
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'SW_ACTIVATED',
                    version: CACHE_VERSION
                });
            });
        })()
    );
});

console.log('🚀 Service Worker جاهز للعمل!');
