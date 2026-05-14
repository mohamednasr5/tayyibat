/**
 * نظام الذكاء الاصطناعي الصحي المتقدم
 * Health AI System with Free API Integration
 */

class HealthAISystem {
    constructor() {
        this.userProfile = this.loadUserProfile();
        this.recipes = [];
        this.freeDiseases = {
            'cancer': { name: 'سرطان', icon: '⚠️', risks: ['عالي الدهون', 'المواد المحفوظة'], benefits: ['فيتامينات', 'مضادات أكسدة'] },
            'diabetes': { name: 'السكري', icon: '🩺', risks: ['السكريات', 'الكربوهيدرات البسيطة'], benefits: ['البروتين', 'الألياف'] },
            'heart': { name: 'أمراض القلب', icon: '❤️', risks: ['الدهون المشبعة', 'الملح'], benefits: ['الألياف', 'أوميغا 3'] },
            'kidney': { name: 'أمراض الكلى', icon: '🫘', risks: ['الصوديوم', 'البوتاسيوم'], benefits: ['البروتين المحدود', 'السوائل'] },
            'liver': { name: 'أمراض الكبد', icon: '🍵', risks: ['الدهون', 'الكحول'], benefits: ['الفواكه', 'الخضار'] },
            'allergy': { name: 'الحساسية', icon: '🚫', risks: [], benefits: [] },
            'celiac': { name: 'الاضطرابات الهضمية', icon: '🌾', risks: ['الغلوتين'], benefits: ['الخالي من الغلوتين'] },
            'hypertension': { name: 'ارتفاع ضغط الدم', icon: '📊', risks: ['الملح', 'الدهون'], benefits: ['البوتاسيوم', 'الكالسيوم'] }
        };
        
        this.intermittentFastingPlans = {
            'IF_16_8': { name: '16:8 الصيام المتقطع', fastHours: 16, eatHours: 8, calories: 2000 },
            'IF_18_6': { name: '18:6 الصيام المتقطع', fastHours: 18, eatHours: 6, calories: 1800 },
            'IF_20_4': { name: '20:4 الصيام المتقطع', fastHours: 20, eatHours: 4, calories: 1600 },
            'KETO_20_4': { name: 'كيتو 20:4', fastHours: 20, eatHours: 4, calories: 1600, isKeto: true, macros: { protein: 0.30, fat: 0.65, carbs: 0.05 } }
        };

        this.initializeHealthAI();
    }

    /**
     * تحميل بيانات المستخدم المحفوظة
     */
    loadUserProfile() {
        const stored = localStorage.getItem('tayyibat_user_profile');
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            name: 'مستخدم',
            age: 30,
            weight: 70,
            height: 170,
            gender: 'male',
            diseases: [],
            allergies: [],
            ifPlan: 'IF_16_8',
            isKeto: false,
            activityLevel: 'moderate',
            goal: 'maintain',
            registrationDate: new Date().toISOString()
        };
    }

    /**
     * حفظ بيانات المستخدم
     */
    saveUserProfile(profile) {
        this.userProfile = profile;
        localStorage.setItem('tayyibat_user_profile', JSON.stringify(profile));
        this.notifyUpdate('profile');
    }

    /**
     * تهيئة نظام الذكاء الاصطناعي
     */
    initializeHealthAI() {
        this.calculateBMI();
        this.calculateCalorieNeeds();
        this.loadFreeNLPModels();
    }

    /**
     * حساب مؤشر كتلة الجسم (BMI)
     */
    calculateBMI() {
        const { weight, height } = this.userProfile;
        const heightInMeters = height / 100;
        this.userProfile.bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
        
        if (this.userProfile.bmi < 18.5) {
            this.userProfile.bmiCategory = 'نقص الوزن';
        } else if (this.userProfile.bmi < 25) {
            this.userProfile.bmiCategory = 'وزن صحي';
        } else if (this.userProfile.bmi < 30) {
            this.userProfile.bmiCategory = 'زيادة الوزن';
        } else {
            this.userProfile.bmiCategory = 'السمنة';
        }
        return this.userProfile.bmi;
    }

    /**
     * حساب احتياجات السعرات الحرارية
     * استخدام معادلة Harris-Benedict
     */
    calculateCalorieNeeds() {
        const { weight, height, age, gender, activityLevel } = this.userProfile;
        let bmr = 0;

        if (gender === 'male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }

        const activityFactors = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'veryActive': 1.9
        };

        const tdee = bmr * (activityFactors[activityLevel] || 1.55);
        this.userProfile.tdee = Math.round(tdee);

        // تطبيق خطة الصيام المتقطع
        const plan = this.intermittentFastingPlans[this.userProfile.ifPlan];
        this.userProfile.dailyCalories = plan.calories;
        this.userProfile.tdee = this.userProfile.dailyCalories;

        return this.userProfile.tdee;
    }

    /**
     * تحميل نماذج معالجة اللغة الطبيعية المجانية
     */
    loadFreeNLPModels() {
        // استخدام Compromise.js أو نموذج بسيط محلي
        this.ingredientDatabase = {
            'proteins': ['دجاج', 'سمك', 'لحم', 'بيض', 'حليب', 'جبن', 'عدس', 'فول', 'حمص'],
            'vegetables': ['جزر', 'بصل', 'ثوم', 'خيار', 'طماطم', 'خس', 'فلفل', 'كوسة', 'باذنجان'],
            'fruits': ['تمر', 'تفاح', 'برتقال', 'موز', 'عنب', 'فراولة', 'شمام'],
            'carbs': ['أرز', 'خبز', 'معكرونة', 'بطاطس', 'ذرة'],
            'fats': ['زيت', 'زبدة', 'جوز هند', 'أفوكادو', 'جوز', 'بذور'],
            'herbs': ['نعناع', 'ريحان', 'كزبرة', 'بقدونس', 'زعتر']
        };
    }

    /**
     * تحليل المكونات المتاحة وإرجاع توصيات الوصفات
     * استخدام API مجانية
     */
    async analyzeAvailableIngredientsAndSuggest(availableIngredients) {
        try {
            // استخدام API مجاني - RecipeAPI أو TheMealDB
            const suggestions = await this.queryFreeRecipeAPI(availableIngredients);
            
            // تصفية حسب الأمراض والحساسيات
            const filtered = this.filterRecipesByHealth(suggestions);
            
            // ترتيب حسب التوافق الصحي
            const ranked = this.rankRecipesByHealthScore(filtered);
            
            return ranked;
        } catch (error) {
            console.log('استخدام الوصفات المحلية', error);
            return this.suggestFromLocalRecipes(availableIngredients);
        }
    }

    /**
     * الاستعلام عن API مجاني للوصفات
     */
    async queryFreeRecipeAPI(ingredients) {
        try {
            // TheMealDB API - مجاني بدون تسجيل
            const ingredientList = ingredients.join(',');
            const response = await fetch(
                `https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredients[0]}`,
                { method: 'GET' }
            );
            
            if (response.ok) {
                const data = await response.json();
                return data.meals || [];
            }
            return [];
        } catch (error) {
            console.log('خطأ في الاتصال بـ API:', error);
            return [];
        }
    }

    /**
     * تصفية الوصفات حسب الأمراض والحساسيات
     */
    filterRecipesByHealth(recipes) {
        const { diseases, allergies } = this.userProfile;
        
        return recipes.filter(recipe => {
            // التحقق من الحساسيات
            for (const allergy of allergies) {
                if (recipe.ingredients && recipe.ingredients.some(ing => 
                    ing.toLowerCase().includes(allergy.toLowerCase())
                )) {
                    return false;
                }
            }

            // التحقق من الأمراض
            for (const disease of diseases) {
                const diseaseInfo = this.freeDiseases[disease];
                if (diseaseInfo && diseaseInfo.risks) {
                    const hasRisks = diseaseInfo.risks.some(risk =>
                        JSON.stringify(recipe).toLowerCase().includes(risk.toLowerCase())
                    );
                    if (hasRisks) {
                        return false;
                    }
                }
            }

            return true;
        });
    }

    /**
     * ترتيب الوصفات حسب درجة التوافق الصحي
     */
    rankRecipesByHealthScore(recipes) {
        const { diseases, ifPlan, isKeto, tdee } = this.userProfile;
        
        return recipes.map(recipe => {
            let score = 100;
            const benefits = [];
            const warnings = [];

            // تقييم البروتين
            if (recipe.protein && recipe.protein > 20) {
                score += 15;
                benefits.push('غني بالبروتين');
            }

            // تقييم الألياف
            if (recipe.fiber && recipe.fiber > 5) {
                score += 10;
                benefits.push('غني بالألياف');
            }

            // تقييم السعرات (حسب خطة IF)
            if (recipe.calories && recipe.calories <= tdee) {
                score += 20;
                benefits.push(`مناسب لـ ${ifPlan}`);
            } else if (recipe.calories) {
                warnings.push(`سعرات عالية: ${recipe.calories}`);
                score -= 10;
            }

            // تقييم الكيتو
            if (isKeto) {
                if (recipe.carbs && recipe.carbs < 20) {
                    score += 20;
                    benefits.push('مناسب للكيتو');
                } else {
                    warnings.push('سعرات كربوهيدراتية عالية للكيتو');
                    score -= 15;
                }
            }

            // تقييم الفوائد الصحية للأمراض
            for (const disease of diseases) {
                const diseaseInfo = this.freeDiseases[disease];
                if (diseaseInfo && diseaseInfo.benefits) {
                    const hasBenefits = diseaseInfo.benefits.some(benefit =>
                        JSON.stringify(recipe).toLowerCase().includes(benefit.toLowerCase())
                    );
                    if (hasBenefits) {
                        score += 15;
                        benefits.push(`مفيد لـ ${diseaseInfo.name}`);
                    }
                }
            }

            return {
                ...recipe,
                healthScore: Math.min(100, score),
                benefits,
                warnings,
                compatibility: score >= 70 ? 'ممتاز' : score >= 50 ? 'جيد' : 'تحذير'
            };
        }).sort((a, b) => b.healthScore - a.healthScore);
    }

    /**
     * التوصية من الوصفات المحلية
     */
    suggestFromLocalRecipes(availableIngredients) {
        return this.recipes.filter(recipe => {
            const matchCount = recipe.ingredients.filter(ing =>
                availableIngredients.some(avail =>
                    avail.toLowerCase().includes(ing.toLowerCase()) ||
                    ing.toLowerCase().includes(avail.toLowerCase())
                )
            ).length;
            return matchCount >= recipe.ingredients.length * 0.6;
        });
    }

    /**
     * إنشاء خطة صحية يومية شاملة
     */
    generateDailyHealthPlan() {
        const { ifPlan, tdee, diseases, isKeto } = this.userProfile;
        const plan = this.intermittentFastingPlans[ifPlan];
        
        const dayPlan = {
            date: new Date().toLocaleDateString('ar-SA'),
            fastingHours: plan.fastHours,
            eatingWindow: plan.eatHours,
            totalCalories: tdee,
            meals: [],
            tips: [],
            warnings: []
        };

        // توزيع السعرات على الوجبات
        const mealCount = plan.eatHours >= 8 ? 3 : 2;
        const caloriesPerMeal = Math.round(tdee / mealCount);

        // إضافة نصائح التغذية
        dayPlan.tips.push('شرب الماء بكثرة أثناء الصيام');
        dayPlan.tips.push('المشي الخفيف يحسن الهضم');
        dayPlan.tips.push('تجنب الأطعمة الدسمة في الوجبة الأخيرة');

        // تحذيرات للأمراض
        for (const disease of diseases) {
            const diseaseInfo = this.freeDiseases[disease];
            if (diseaseInfo) {
                dayPlan.warnings.push(`تجنب: ${diseaseInfo.risks.join(', ')}`);
            }
        }

        // خطة الكيتو
        if (isKeto) {
            dayPlan.ketoInfo = {
                carbsLimit: 20,
                proteinPercentage: 30,
                fatPercentage: 65,
                tip: 'تجنب الكربوهيدرات البسيطة بالكامل'
            };
        }

        return dayPlan;
    }

    /**
     * حساب السعرات الحرارية للوجبة
     */
    calculateMealNutrition(ingredients) {
        const nutritionDatabase = {
            'دجاج': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
            'سمك': { calories: 100, protein: 22, carbs: 0, fat: 1 },
            'بيض': { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
            'أرز': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
            'خبز': { calories: 265, protein: 9, carbs: 49, fat: 3.3 },
            'جزر': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
            'طماطم': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
            'زيت': { calories: 120, protein: 0, carbs: 0, fat: 14 }
        };

        let totalNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        
        ingredients.forEach(ingredient => {
            const nutrition = nutritionDatabase[ingredient];
            if (nutrition) {
                Object.keys(nutrition).forEach(key => {
                    totalNutrition[key] += nutrition[key];
                });
            }
        });

        return totalNutrition;
    }

    /**
     * تقديم نصائح صحية مخصصة
     */
    getPersonalizedHealthTips() {
        const { age, bmi, diseases, ifPlan } = this.userProfile;
        const tips = [];

        // نصائح حسب العمر
        if (age > 50) {
            tips.push('⚠️ ركز على الكالسيوم وفيتامين D لصحة العظام');
        } else if (age < 30) {
            tips.push('💪 بناء عادات صحية قوية منذ الآن');
        }

        // نصائح حسب BMI
        if (bmi > 25) {
            tips.push('📉 الصيام المتقطع يساعد في خسارة الوزن بشكل صحي');
        } else if (bmi < 18.5) {
            tips.push('📈 ركز على الأطعمة الغنية بالسعرات والبروتين');
        }

        // نصائح حسب الأمراض
        diseases.forEach(disease => {
            const diseaseInfo = this.freeDiseases[disease];
            if (diseaseInfo) {
                tips.push(`🏥 ${diseaseInfo.name}: تجنب ${diseaseInfo.risks.join(' و ')}`);
            }
        });

        // نصائح الصيام المتقطع
        const plan = this.intermittentFastingPlans[ifPlan];
        tips.push(`⏰ خطتك: ${plan.name} (${plan.fastHours}h صيام، ${plan.eatHours}h أكل)`);

        return tips;
    }

    /**
     * تحديث بيانات المستخدم
     */
    updateUserData(updates) {
        this.userProfile = { ...this.userProfile, ...updates };
        this.saveUserProfile(this.userProfile);
        this.calculateBMI();
        this.calculateCalorieNeeds();
        return this.userProfile;
    }

    /**
     * إشعار بالتحديثات
     */
    notifyUpdate(type) {
        const event = new CustomEvent('healthAIUpdate', { 
            detail: { type, profile: this.userProfile } 
        });
        document.dispatchEvent(event);
    }

    /**
     * تصدير التقرير الصحي
     */
    exportHealthReport() {
        return {
            date: new Date().toLocaleDateString('ar-SA'),
            userProfile: this.userProfile,
            bmi: this.userProfile.bmi,
            bmiCategory: this.userProfile.bmiCategory,
            dailyCalories: this.userProfile.tdee,
            ifPlan: this.intermittentFastingPlans[this.userProfile.ifPlan],
            healthTips: this.getPersonalizedHealthTips(),
            dailyPlan: this.generateDailyHealthPlan()
        };
    }
}

// تصدير النظام
window.HealthAISystem = HealthAISystem;
