/**
 * نظام الرسوم المتحركة ثلاثية الأبعاد المتقدمة
 * Advanced 3D Animations System
 */

class Advanced3DAnimations {
    constructor() {
        this.animationQueue = [];
        this.activeAnimations = new Map();
        this.initializeAnimations();
    }

    /**
     * تهيئة نظام الرسوم المتحركة
     */
    initializeAnimations() {
        this.addCSS3DStyles();
        this.setupAnimationListeners();
    }

    /**
     * إضافة أنماط CSS 3D
     */
    addCSS3DStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* العناصر ثلاثية الأبعاد */
            .perspective {
                perspective: 1200px;
                -webkit-perspective: 1200px;
            }

            .transform-3d {
                transform-style: preserve-3d;
                -webkit-transform-style: preserve-3d;
            }

            /* حركات ثلاثية الأبعاد */
            @keyframes rotate3D {
                0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
                25% { transform: rotateX(180deg) rotateY(90deg) rotateZ(0deg); }
                50% { transform: rotateX(180deg) rotateY(180deg) rotateZ(0deg); }
                75% { transform: rotateX(180deg) rotateY(270deg) rotateZ(0deg); }
                100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(0deg); }
            }

            @keyframes flip3D {
                0% { transform: perspective(600px) rotateY(0); }
                100% { transform: perspective(600px) rotateY(360deg); }
            }

            @keyframes swing3D {
                0% { transform: perspective(600px) rotateX(0deg) rotateZ(0deg); }
                25% { transform: perspective(600px) rotateX(20deg) rotateZ(-10deg); }
                50% { transform: perspective(600px) rotateX(0deg) rotateZ(0deg); }
                75% { transform: perspective(600px) rotateX(-20deg) rotateZ(10deg); }
                100% { transform: perspective(600px) rotateX(0deg) rotateZ(0deg); }
            }

            @keyframes float3D {
                0%, 100% { transform: translate3d(0, 0, 0) rotateY(0deg); }
                33% { transform: translate3d(20px, -20px, 30px) rotateY(120deg); }
                66% { transform: translate3d(-20px, 20px, -30px) rotateY(240deg); }
            }

            @keyframes cube3D {
                0% { transform: rotateX(0deg) rotateY(0deg); }
                50% { transform: rotateX(360deg) rotateY(360deg); }
                100% { transform: rotateX(360deg) rotateY(720deg); }
            }

            @keyframes expandPulse3D {
                0%, 100% { transform: scale3d(1, 1, 1); opacity: 1; }
                50% { transform: scale3d(1.2, 1.2, 1.2); opacity: 0.8; }
            }

            @keyframes wavePropagation {
                0% { transform: translate3d(0, 0, 0); opacity: 0; }
                50% { opacity: 1; }
                100% { transform: translate3d(100px, 0, 0); opacity: 0; }
            }

            @keyframes spiralRotate {
                0% { transform: translate3d(0, 0, 0) rotateZ(0deg); }
                100% { transform: translate3d(100px, 100px, 0) rotateZ(360deg); }
            }

            @keyframes particleExplode {
                0% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
                100% { transform: translate3d(var(--tx), var(--ty), var(--tz)) scale(0); opacity: 0; }
            }

            /* حركات الأيقونات */
            @keyframes iconBounce {
                0%, 100% { transform: translateY(0) scale(1); }
                25% { transform: translateY(-15px) scale(1.1); }
                50% { transform: translateY(0) scale(1); }
                75% { transform: translateY(-8px) scale(1.05); }
            }

            @keyframes iconSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @keyframes iconPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.3); }
            }

            @keyframes iconFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            @keyframes iconShake {
                0%, 100% { transform: translateX(0); }
                10% { transform: translateX(-2px); }
                20% { transform: translateX(2px); }
                30% { transform: translateX(-2px); }
                40% { transform: translateX(2px); }
            }

            /* تأثيرات النقر (Tap Effects) */
            @keyframes ripple {
                0% {
                    transform: scale(0);
                    opacity: 1;
                }
                100% {
                    transform: scale(4);
                    opacity: 0;
                }
            }

            @keyframes tapScale {
                0% { transform: scale(1); }
                50% { transform: scale(0.95); }
                100% { transform: scale(1); }
            }

            @keyframes pressGlow {
                0% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7); }
                100% { box-shadow: 0 0 0 20px rgba(255, 107, 107, 0); }
            }

            /* تأثيرات الألوان المتحركة */
            @keyframes colorShift {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }

            @keyframes gradientFlow {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }

            /* تأثيرات الضوء */
            @keyframes lightFlash {
                0%, 100% { text-shadow: 0 0 5px rgba(255, 107, 107, 0.3); }
                50% { text-shadow: 0 0 20px rgba(255, 107, 107, 0.9); }
            }

            @keyframes glowPulse {
                0%, 100% { 
                    box-shadow: 0 0 5px rgba(255, 107, 107, 0.5),
                                inset 0 0 5px rgba(255, 107, 107, 0.2);
                }
                50% { 
                    box-shadow: 0 0 20px rgba(255, 107, 107, 1),
                                inset 0 0 20px rgba(255, 107, 107, 0.5);
                }
            }

            /* فئات الحركات */
            .rotate-3d { animation: rotate3D 3s infinite linear; }
            .flip-3d { animation: flip3D 1.5s infinite ease-in-out; }
            .swing-3d { animation: swing3D 2s infinite ease-in-out; }
            .float-3d { animation: float3D 3s infinite ease-in-out; }
            .cube-3d { animation: cube3D 4s infinite linear; }
            .expand-pulse-3d { animation: expandPulse3D 2s infinite ease-in-out; }
            .wave-propagation { animation: wavePropagation 1.5s infinite; }
            .spiral-rotate { animation: spiralRotate 2s infinite ease-in-out; }

            .icon-bounce { animation: iconBounce 0.8s ease-in-out; }
            .icon-spin { animation: iconSpin 1s linear infinite; }
            .icon-pulse { animation: iconPulse 1.5s ease-in-out infinite; }
            .icon-float { animation: iconFloat 2s ease-in-out infinite; }
            .icon-shake { animation: iconShake 0.5s ease-in-out; }

            .ripple-effect::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 20px;
                height: 20px;
                background: rgba(255, 107, 107, 0.5);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                animation: ripple 0.6s ease-out;
            }

            .tap-scale { animation: tapScale 0.3s ease-out; }
            .press-glow { animation: pressGlow 0.6s ease-out; }

            .color-shift { animation: colorShift 4s linear infinite; }
            .gradient-flow {
                animation: gradientFlow 4s ease infinite;
                background-size: 200% 200%;
            }

            .light-flash { animation: lightFlash 2s ease-in-out infinite; }
            .glow-pulse { animation: glowPulse 2s ease-in-out infinite; }

            /* تأثيرات الانتقال (Transitions) */
            .smooth-3d {
                transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
            }

            .elastic-transition {
                transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .bounce-transition {
                transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            /* تأثيرات التحويل عند المرور */
            .hover-lift-3d:hover {
                transform: translateY(-8px) rotateX(2deg);
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            }

            .hover-flip-3d:hover {
                transform: perspective(1000px) rotateY(8deg) rotateX(-2deg);
            }

            .hover-glow-3d:hover {
                filter: brightness(1.2);
                box-shadow: 0 0 30px rgba(255, 107, 107, 0.6);
            }

            /* استجابة اللمس */
            .touch-feedback {
                -webkit-touch-callout: none;
                -webkit-user-select: none;
            }

            .touch-feedback:active {
                opacity: 0.8;
                transform: scale(0.98);
            }

            /* دعم الأجهزة المختلفة */
            @media (prefers-reduced-motion: reduce) {
                *,
                *::before,
                *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }

            /* التوافقية مع المتصفحات */
            @supports (transform: translate3d(0, 0, 0)) {
                .3d-enabled {
                    will-change: transform;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * إضافة حركة ثلاثية الأبعاد إلى عنصر
     */
    add3DAnimation(element, type = 'rotate3D', duration = 3) {
        if (!element) return;
        
        element.classList.add('transform-3d');
        const animationClass = this.getAnimation3DClass(type);
        element.classList.add(animationClass);
        
        return {
            remove: () => element.classList.remove(animationClass),
            type: type,
            duration: duration
        };
    }

    /**
     * إضافة حركة أيقونة
     */
    addIconAnimation(iconElement, animationType = 'bounce') {
        if (!iconElement) return;

        const animationClass = `icon-${animationType}`;
        iconElement.classList.add(animationClass);

        return {
            stop: () => iconElement.classList.remove(animationClass),
            type: animationType
        };
    }

    /**
     * إضافة تأثير الريبل (نقرة)
     */
    addRippleEffect(element, event) {
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.backgroundColor = 'rgba(255, 107, 107, 0.5)';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.pointerEvents = 'none';

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        ripple.animate([
            { transform: 'scale(0)', opacity: 1 },
            { transform: 'scale(4)', opacity: 0 }
        ], {
            duration: 600,
            easing: 'ease-out'
        });

        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * إضافة تأثير النقر
     */
    addTapEffect(element) {
        element.classList.add('tap-scale');
        element.addEventListener('animationend', () => {
            element.classList.remove('tap-scale');
        }, { once: true });
    }

    /**
     * إضافة تأثير توهج الضغط
     */
    addPressGlowEffect(element) {
        element.classList.add('press-glow');
        element.addEventListener('animationend', () => {
            element.classList.remove('press-glow');
        }, { once: true });
    }

    /**
     * إضافة جسيمات متفجرة
     */
    addParticleExplosion(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const angle = (i / count) * Math.PI * 2;
            const velocity = 100 + Math.random() * 100;
            
            particle.style.position = 'fixed';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.borderRadius = '50%';
            particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '10000';

            document.body.appendChild(particle);

            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;

            particle.animate([
                { 
                    transform: 'translate(0, 0) scale(1)', 
                    opacity: 1 
                },
                { 
                    transform: `translate(${tx}px, ${ty}px) scale(0)`, 
                    opacity: 0 
                }
            ], {
                duration: 800,
                easing: 'ease-out'
            });

            setTimeout(() => particle.remove(), 800);
        }
    }

    /**
     * إضافة موجة انتشار
     */
    addWaveEffect(element, color = 'rgba(255, 107, 107, 0.5)') {
        const wave = document.createElement('div');
        wave.style.position = 'absolute';
        wave.style.width = '20px';
        wave.style.height = '20px';
        wave.style.backgroundColor = color;
        wave.style.borderRadius = '50%';
        wave.style.pointerEvents = 'none';

        element.style.position = 'relative';
        element.appendChild(wave);

        wave.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: 'translate(100px, 0) scale(1)', opacity: 0 }
        ], {
            duration: 1500,
            easing: 'ease-out'
        });

        setTimeout(() => wave.remove(), 1500);
    }

    /**
     * تدوير العنصر بحركة سلسة
     */
    smoothRotate(element, degrees, duration = 1000) {
        element.animate([
            { transform: `rotate(0deg)` },
            { transform: `rotate(${degrees}deg)` }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'forwards'
        });
    }

    /**
     * تكبير/تصغير سلس
     */
    smoothScale(element, scale, duration = 500) {
        element.animate([
            { transform: 'scale(1)' },
            { transform: `scale(${scale})` }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            fill: 'forwards'
        });
    }

    /**
     * تغيير اللون بحركة
     */
    animateColorChange(element, fromColor, toColor, duration = 500) {
        element.animate([
            { color: fromColor },
            { color: toColor }
        ], {
            duration: duration,
            easing: 'ease-in-out',
            fill: 'forwards'
        });
    }

    /**
     * الحصول على فئة الحركة ثلاثية الأبعاد
     */
    getAnimation3DClass(type) {
        const classes = {
            'rotate3D': 'rotate-3d',
            'flip3D': 'flip-3d',
            'swing3D': 'swing-3d',
            'float3D': 'float-3d',
            'cube3D': 'cube-3d',
            'expandPulse3D': 'expand-pulse-3d',
            'wave': 'wave-propagation',
            'spiral': 'spiral-rotate'
        };
        return classes[type] || 'rotate-3d';
    }

    /**
     * إعداد مستمعي الأحداث للرسوم المتحركة
     */
    setupAnimationListeners() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button, [role="button"]');
            if (button) {
                this.addRippleEffect(button, e);
                this.addTapEffect(button);
            }
        });

        document.addEventListener('touchstart', (e) => {
            const element = e.target.closest('[class*="touch"]');
            if (element) {
                this.addTapEffect(element);
            }
        });
    }

    /**
     * تطبيق حركة متسلسلة
     */
    applySequentialAnimation(elements, animationType, delay = 100) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                this.add3DAnimation(element, animationType);
            }, index * delay);
        });
    }
}

// تصدير النظام
window.Advanced3DAnimations = Advanced3DAnimations;
