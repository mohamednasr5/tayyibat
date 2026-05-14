/**
 * Advanced AI System for Tayyibat Recipe App
 * Provides intelligent recipe recommendations, NLP processing, and ML features
 */

class AdvancedAI {
    constructor() {
        this.recipes = [];
        this.userPreferences = this.loadUserPreferences();
        this.searchHistory = this.loadSearchHistory();
        this.savedRecipes = this.loadSavedRecipes();
        this.userRatings = this.loadUserRatings();
        this.init();
    }

    /**
     * Initialize AI system
     */
    init() {
        console.log('Advanced AI System Initialized');
        this.setupEventListeners();
        this.startRecommendationEngine();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for recipe views
        window.addEventListener('recipeViewed', (e) => this.recordRecipeView(e.detail));
        
        // Listen for recipe saves
        window.addEventListener('recipeSaved', (e) => this.recordRecipeSave(e.detail));
        
        // Listen for ratings
        window.addEventListener('recipeRated', (e) => this.recordRating(e.detail));
    }

    /**
     * Natural Language Processing for search
     */
    processSearchQuery(query) {
        // Tokenize query
        const tokens = this.tokenize(query);
        
        // Extract entities (ingredients, cuisines, etc.)
        const entities = this.extractEntities(tokens);
        
        // Calculate query relevance
        const relevance = this.calculateRelevance(tokens, entities);
        
        return {
            tokens,
            entities,
            relevance,
            processedQuery: query.toLowerCase().trim()
        };
    }

    /**
     * Tokenize text
     */
    tokenize(text) {
        return text
            .toLowerCase()
            .split(/\s+/)
            .filter(token => token.length > 0);
    }

    /**
     * Extract entities from tokens
     */
    extractEntities(tokens) {
        const ingredients = this.ingredientDictionary();
        const cuisines = this.cuisineDictionary();
        const techniques = this.techniqueDictionary();

        const entities = {
            ingredients: [],
            cuisines: [],
            techniques: [],
            allergies: [],
            dietaryRestrictions: []
        };

        tokens.forEach(token => {
            // Check ingredients
            Object.entries(ingredients).forEach(([key, values]) => {
                if (values.includes(token)) {
                    entities.ingredients.push(key);
                }
            });

            // Check cuisines
            Object.entries(cuisines).forEach(([key, values]) => {
                if (values.includes(token)) {
                    entities.cuisines.push(key);
                }
            });

            // Check techniques
            Object.entries(techniques).forEach(([key, values]) => {
                if (values.includes(token)) {
                    entities.techniques.push(key);
                }
            });

            // Check allergies
            if (['بدون', 'خالي', 'حساسية', 'حساس'].includes(token)) {
                entities.allergies.push(token);
            }

            // Check dietary restrictions
            if (['نباتي', 'دايت', 'صحي', 'قليل', 'بدون سكر'].includes(token)) {
                entities.dietaryRestrictions.push(token);
            }
        });

        return entities;
    }

    /**
     * Ingredient Dictionary
     */
    ingredientDictionary() {
        return {
            'لحم': ['لحم', 'لحمة', 'لحوم', 'دجاج', 'دجاجة'],
            'سمك': ['سمك', 'سمكة', 'أسماك', 'سلمون', 'تونة'],
            'خضار': ['خضار', 'خضرة', 'بندورة', 'خيار', 'فلفل'],
            'طماطم': ['طماطم', 'بندورة', 'تماتم', 'طماطة'],
            'حمص': ['حمص', 'حمصة'],
            'برغل': ['برغل', 'برقوق'],
            'أرز': ['أرز', 'ارز'],
            'بصل': ['بصل', 'بصلة', 'بصيل'],
            'ثوم': ['ثوم', 'ثومة', 'توم'],
            'فلفل': ['فلفل', 'فلفلة'],
            'زيت': ['زيت', 'زيتون', 'دهن'],
            'ملح': ['ملح', 'ملحة'],
            'سكر': ['سكر', 'سكرة'],
            'دقيق': ['دقيق', 'طحين'],
            'زبدة': ['زبدة', 'زبدة'],
            'حليب': ['حليب', 'لبن', 'حليب'],
            'بيض': ['بيض', 'بيضة']
        };
    }

    /**
     * Cuisine Dictionary
     */
    cuisineDictionary() {
        return {
            'سوري': ['سوري', 'شامي', 'شام'],
            'لبناني': ['لبناني', 'لبنان'],
            'فلسطيني': ['فلسطيني', 'فلسطين'],
            'مصري': ['مصري', 'مصر'],
            'خليجي': ['خليجي', 'خليج', 'سعودي'],
            'تركي': ['تركي', 'تركيا'],
            'آسيوي': ['آسيوي', 'اسيوي', 'صيني', 'ياباني']
        };
    }

    /**
     * Technique Dictionary
     */
    techniqueDictionary() {
        return {
            'مشوي': ['مشوي', 'شي', 'شواء'],
            'مقلي': ['مقلي', 'قلي', 'قلية'],
            'مطبوخ': ['مطبوخ', 'طبخ', 'طهي'],
            'مخبوز': ['مخبوز', 'خبز', 'فرن'],
            'مسلوق': ['مسلوق', 'سلق', 'سلق'],
            'مبخر': ['مبخر', 'بخار']
        };
    }

    /**
     * Calculate search query relevance
     */
    calculateRelevance(tokens, entities) {
        return {
            ingredientCount: entities.ingredients.length,
            cuisineCount: entities.cuisines.length,
            techniqueCount: entities.techniques.length,
            hasAllergyInfo: entities.allergies.length > 0,
            hasDietaryInfo: entities.dietaryRestrictions.length > 0,
            score: (entities.ingredients.length * 2 + 
                   entities.cuisines.length * 1.5 + 
                   entities.techniques.length + 
                   (entities.allergies.length > 0 ? 1 : 0) +
                   (entities.dietaryRestrictions.length > 0 ? 1 : 0))
        };
    }

    /**
     * Recommendation Engine
     */
    generateRecommendations(recipes, limit = 5) {
        // Calculate similarity scores
        const scored = recipes.map(recipe => ({
            ...recipe,
            recommendationScore: this.calculateSimilarity(recipe)
        }));

        // Sort by score
        const recommended = scored
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, limit);

        return recommended;
    }

    /**
     * Calculate similarity based on user preferences
     */
    calculateSimilarity(recipe) {
        let score = 0;

        // Based on saved recipes
        if (this.savedRecipes.includes(recipe.id)) {
            score += 10;
        }

        // Based on view history
        const viewCount = this.searchHistory.filter(h => h.recipeId === recipe.id).length;
        score += viewCount * 2;

        // Based on ratings
        const userRating = this.userRatings[recipe.id];
        if (userRating) {
            score += userRating * 3;
        }

        // Based on category preferences
        if (this.userPreferences.favoriteCategories.includes(recipe.category)) {
            score += 5;
        }

        // Based on difficulty preference
        if (this.userPreferences.preferredDifficulty === recipe.difficulty) {
            score += 3;
        }

        // Based on rating
        score += recipe.rating * 2;

        // Add randomness for diversity
        score += Math.random() * 2;

        return score;
    }

    /**
     * Collaborative Filtering - Similar users' preferences
     */
    collaborativeFiltering(userId, recipes) {
        // Find similar users based on preferences
        const similarUsers = this.findSimilarUsers(userId);

        // Get their favorite recipes
        const favoritesByOthers = new Map();
        similarUsers.forEach(user => {
            user.savedRecipes.forEach(recipeId => {
                favoritesByOthers.set(
                    recipeId,
                    (favoritesByOthers.get(recipeId) || 0) + 1
                );
            });
        });

        // Score recipes based on similar users' preferences
        return recipes.map(recipe => ({
            ...recipe,
            collaborativeScore: favoritesByOthers.get(recipe.id) || 0
        }));
    }

    /**
     * Content-Based Filtering
     */
    contentBasedFiltering(recipe, recipes) {
        return recipes.map(otherRecipe => ({
            ...otherRecipe,
            contentScore: this.calculateContentSimilarity(recipe, otherRecipe)
        }));
    }

    /**
     * Calculate content similarity between recipes
     */
    calculateContentSimilarity(recipe1, recipe2) {
        let score = 0;

        // Category similarity
        if (recipe1.category === recipe2.category) {
            score += 3;
        }

        // Difficulty similarity
        if (recipe1.difficulty === recipe2.difficulty) {
            score += 2;
        }

        // Time similarity
        const timeDiff = Math.abs(
            this.timeToMinutes(recipe1.time) - this.timeToMinutes(recipe2.time)
        );
        if (timeDiff < 15) {
            score += 2;
        }

        // Ingredient overlap
        const ingredients1 = recipe1.ingredients || [];
        const ingredients2 = recipe2.ingredients || [];
        const overlap = ingredients1.filter(i => ingredients2.includes(i)).length;
        score += overlap;

        return score;
    }

    /**
     * Convert time string to minutes
     */
    timeToMinutes(timeStr) {
        const match = timeStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * Record recipe view
     */
    recordRecipeView(recipeId) {
        this.searchHistory.push({
            recipeId,
            timestamp: Date.now()
        });
        this.saveSearchHistory();
    }

    /**
     * Record recipe save
     */
    recordRecipeSave(recipeId) {
        if (!this.savedRecipes.includes(recipeId)) {
            this.savedRecipes.push(recipeId);
            this.saveSavedRecipes();
        }
    }

    /**
     * Record user rating
     */
    recordRating(data) {
        const { recipeId, rating } = data;
        this.userRatings[recipeId] = rating;
        this.saveUserRatings();
    }

    /**
     * Find similar users
     */
    findSimilarUsers(userId) {
        // Mock implementation - in real app, would query database
        return [];
    }

    /**
     * Start recommendation engine
     */
    startRecommendationEngine() {
        // Periodically update recommendations
        setInterval(() => {
            this.updateRecommendations();
        }, 60000); // Update every minute
    }

    /**
     * Update recommendations
     */
    updateRecommendations() {
        const event = new CustomEvent('recommendationsUpdated', {
            detail: {
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * Get trending recipes
     */
    getTrendingRecipes(recipes, limit = 5) {
        return recipes
            .sort((a, b) => {
                const viewsA = this.searchHistory.filter(h => h.recipeId === a.id).length;
                const viewsB = this.searchHistory.filter(h => h.recipeId === b.id).length;
                return viewsB - viewsA;
            })
            .slice(0, limit);
    }

    /**
     * Fuzzy search
     */
    fuzzySearch(query, recipes, threshold = 0.6) {
        return recipes
            .map(recipe => ({
                ...recipe,
                score: this.levenshteinSimilarity(
                    query.toLowerCase(),
                    recipe.title.toLowerCase()
                )
            }))
            .filter(item => item.score >= threshold)
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Levenshtein similarity
     */
    levenshteinSimilarity(str1, str2) {
        const track = Array(str2.length + 1)
            .fill(null)
            .map(() => Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i += 1) {
            track[0][i] = i;
        }
        for (let j = 0; j <= str2.length; j += 1) {
            track[j][0] = j;
        }

        for (let j = 1; j <= str2.length; j += 1) {
            for (let i = 1; i <= str1.length; i += 1) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                track[j][i] = Math.min(
                    track[j][i - 1] + 1,
                    track[j - 1][i] + 1,
                    track[j - 1][i - 1] + indicator
                );
            }
        }

        const levenshtein = track[str2.length][str1.length];
        const maxLength = Math.max(str1.length, str2.length);
        return 1 - levenshtein / maxLength;
    }

    /**
     * Sentiment Analysis
     */
    analyzeSentiment(text) {
        const positiveWords = [
            'رائع', 'ممتاز', 'لذيذ', 'شهي', 'جميل', 'متميز', 'مميز',
            'أحب', 'أعجب', 'رعيب', 'جيد', 'ممتاز', 'فاخر'
        ];
        
        const negativeWords = [
            'سيء', 'رهيب', 'مكروه', 'بغيض', 'سيء', 'مؤلم', 'محبط',
            'فاشل', 'سخيف', 'مقزز'
        ];

        const words = text.toLowerCase().split(/\s+/);
        let score = 0;

        words.forEach(word => {
            if (positiveWords.some(pw => word.includes(pw))) {
                score += 1;
            }
            if (negativeWords.some(nw => word.includes(nw))) {
                score -= 1;
            }
        });

        return {
            score,
            sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
            confidence: Math.min(Math.abs(score) / Math.max(words.length, 1), 1)
        };
    }

    /**
     * Load user preferences
     */
    loadUserPreferences() {
        const stored = localStorage.getItem('userPreferences');
        return stored ? JSON.parse(stored) : {
            favoriteCategories: [],
            preferredDifficulty: 'all',
            dietaryRestrictions: [],
            allergies: [],
            maxPrepTime: 120
        };
    }

    /**
     * Save user preferences
     */
    saveUserPreferences() {
        localStorage.setItem('userPreferences', JSON.stringify(this.userPreferences));
    }

    /**
     * Load search history
     */
    loadSearchHistory() {
        const stored = localStorage.getItem('searchHistory');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Save search history
     */
    saveSearchHistory() {
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }

    /**
     * Load saved recipes
     */
    loadSavedRecipes() {
        const stored = localStorage.getItem('savedRecipes');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Save saved recipes
     */
    saveSavedRecipes() {
        localStorage.setItem('savedRecipes', JSON.stringify(this.savedRecipes));
    }

    /**
     * Load user ratings
     */
    loadUserRatings() {
        const stored = localStorage.getItem('userRatings');
        return stored ? JSON.parse(stored) : {};
    }

    /**
     * Save user ratings
     */
    saveUserRatings() {
        localStorage.setItem('userRatings', JSON.stringify(this.userRatings));
    }

    /**
     * Export analytics
     */
    exportAnalytics() {
        return {
            totalViewsCount: this.searchHistory.length,
            totalSavedCount: this.savedRecipes.length,
            averageRating: this.calculateAverageRating(),
            favoriteCategory: this.getFavoriteCategory(),
            mostViewedRecipe: this.getMostViewedRecipe(),
            userPreferences: this.userPreferences
        };
    }

    /**
     * Calculate average rating
     */
    calculateAverageRating() {
        const ratings = Object.values(this.userRatings);
        if (ratings.length === 0) return 0;
        return ratings.reduce((a, b) => a + b, 0) / ratings.length;
    }

    /**
     * Get favorite category
     */
    getFavoriteCategory() {
        // Implementation based on saved recipes
        return 'all';
    }

    /**
     * Get most viewed recipe
     */
    getMostViewedRecipe() {
        const counts = {};
        this.searchHistory.forEach(h => {
            counts[h.recipeId] = (counts[h.recipeId] || 0) + 1;
        });
        return Object.keys(counts).reduce((a, b) => 
            counts[a] > counts[b] ? a : b
        );
    }
}

// Initialize AI system
const tayyibatAI = new AdvancedAI();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedAI;
}
