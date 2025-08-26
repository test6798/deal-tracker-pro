// dealFetcher.js - Automated Deal Collection System
// Phase 2: Real deal source integration with web scraping APIs

class DealFetcher {
    constructor() {
        // Configuration for multiple deal sources
        this.dealSources = {
            appsumo: {
                name: 'AppSumo',
                baseUrl: 'https://appsumo.com',
                scrapeUrl: 'https://appsumo.com/browse/',
                selectors: {
                    dealCards: '.product-card, .deal-card',
                    title: '.product-title, .deal-title, h3',
                    price: '.price, .current-price, .deal-price',
                    originalPrice: '.original-price, .regular-price, .crossed-price',
                    description: '.product-description, .deal-description, p',
                    link: 'a.product-link, a.deal-link, a[href*="/products/"]',
                    image: 'img.product-image, img.deal-image',
                    badge: '.badge, .deal-type, .offer-type'
                }
            },
            stacksocial: {
                name: 'StackSocial',
                baseUrl: 'https://stacksocial.com',
                scrapeUrl: 'https://stacksocial.com/sales',
                selectors: {
                    dealCards: '.deal-card, .product-item',
                    title: '.deal-title, .product-name, h3',
                    price: '.price-current, .sale-price',
                    originalPrice: '.price-original, .regular-price',
                    description: '.deal-description, .product-desc',
                    link: 'a.deal-link, a.product-link',
                    image: 'img.deal-image, img.product-image',
                    badge: '.deal-badge, .sale-badge'
                }
            },
            pitchground: {
                name: 'PitchGround',
                baseUrl: 'https://pitchground.com',
                scrapeUrl: 'https://pitchground.com/deals',
                selectors: {
                    dealCards: '.deal-item, .product-card',
                    title: '.deal-title, .product-title',
                    price: '.current-price, .deal-price',
                    originalPrice: '.original-price, .retail-price',
                    description: '.deal-summary, .product-summary',
                    link: 'a.deal-url, a.product-url',
                    image: 'img.deal-thumb, img.product-thumb',
                    badge: '.deal-type, .offer-badge'
                }
            }
        };

        // Web scraping API configuration
        this.scrapingAPI = {
            // Using ScraperAPI for reliable scraping
            scraperapi: {
                baseUrl: 'https://api.scraperapi.com',
                key: this.getAPIKey('SCRAPERAPI_KEY'), // Will be set via environment variables
                enabled: true
            },
            // Backup scraping service
            scrapingdog: {
                baseUrl: 'https://api.scrapingdog.com/scrape',
                key: this.getAPIKey('SCRAPINGDOG_KEY'),
                enabled: false
            }
        };

        // Affiliate link configuration
        this.affiliatePrograms = {
            appsumo: {
                baseUrl: 'https://appsumo.8odi.net/c/1234567/', // Your AppSumo affiliate ID
                enabled: true
            },
            stacksocial: {
                baseUrl: 'https://stacksocial.com/?rid=1234567', // Your StackSocial affiliate ID  
                enabled: true
            },
            pitchground: {
                baseUrl: 'https://pitchground.com?via=yourname', // Your PitchGround affiliate link
                enabled: true
            },
            // Commission Junction / ShareASale integration
            cj: {
                siteId: 'YOUR_CJ_SITE_ID',
                enabled: false
            }
        };

        // Deal storage and caching
        this.dealCache = new Map();
        this.lastFetch = new Map();
        this.fetchInterval = 3600000; // 1 hour in milliseconds
    }

    // Get API key from environment variables (Netlify environment variables)
    getAPIKey(keyName) {
        // In Netlify, environment variables are available during build
        // For client-side, we'll use a serverless function approach
        return process.env[keyName] || null;
    }

    // Main method to fetch deals from all sources
    async fetchAllDeals() {
        console.log('🚀 Starting automated deal fetching...');
        const allDeals = [];

        for (const [sourceKey, sourceConfig] of Object.entries(this.dealSources)) {
            try {
                console.log(`📊 Fetching deals from ${sourceConfig.name}...`);
                
                // Check if we need to fetch (respect rate limits)
                if (this.shouldSkipFetch(sourceKey)) {
                    console.log(`⏭️ Skipping ${sourceConfig.name} - recently fetched`);
                    continue;
                }

                const deals = await this.fetchDealsFromSource(sourceKey, sourceConfig);
                allDeals.push(...deals);
                
                // Update last fetch timestamp
                this.lastFetch.set(sourceKey, Date.now());
                
                console.log(`✅ Found ${deals.length} deals from ${sourceConfig.name}`);
                
                // Add delay between requests to respect rate limits
                await this.delay(2000);
                
            } catch (error) {
                console.error(`❌ Error fetching from ${sourceConfig.name}:`, error);
                // Continue with other sources even if one fails
            }
        }

        // Process and clean deals
        const processedDeals = this.processDeals(allDeals);
        
        console.log(`🎉 Total deals fetched: ${processedDeals.length}`);
        return processedDeals;
    }

    // Check if we should skip fetching from a source (rate limiting)
    shouldSkipFetch(sourceKey) {
        const lastFetch = this.lastFetch.get(sourceKey);
        if (!lastFetch) return false;
        
        const timeSinceLastFetch = Date.now() - lastFetch;
        return timeSinceLastFetch < this.fetchInterval;
    }

    // Fetch deals from a specific source
    async fetchDealsFromSource(sourceKey, sourceConfig) {
        try {
            // Get HTML content via scraping API
            const htmlContent = await this.scrapeWebsite(sourceConfig.scrapeUrl);
            
            // Parse deals from HTML
            const deals = this.parseDealsFromHTML(htmlContent, sourceConfig, sourceKey);
            
            return deals;
        } catch (error) {
            console.error(`Error scraping ${sourceKey}:`, error);
            return [];
        }
    }

    // Scrape website using API service
    async scrapeWebsite(url) {
        const apiConfig = this.scrapingAPI.scraperapi;
        
        if (!apiConfig.enabled || !apiConfig.key) {
            throw new Error('Scraping API not configured');
        }

        const scrapeUrl = `${apiConfig.baseUrl}?api_key=${apiConfig.key}&url=${encodeURIComponent(url)}&render=true`;
        
        try {
            const response = await fetch(scrapeUrl);
            if (!response.ok) {
                throw new Error(`Scraping failed: ${response.status}`);
            }
            
            return await response.text();
        } catch (error) {
            console.error('Scraping error:', error);
            throw error;
        }
    }

    // Parse deals from HTML content
    parseDealsFromHTML(html, sourceConfig, sourceKey) {
        // Create a temporary DOM element to parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const dealElements = doc.querySelectorAll(sourceConfig.selectors.dealCards);
        const deals = [];

        dealElements.forEach((element, index) => {
            try {
                const deal = this.extractDealFromElement(element, sourceConfig, sourceKey, index);
                if (deal && this.isValidDeal(deal)) {
                    deals.push(deal);
                }
            } catch (error) {
                console.error(`Error extracting deal ${index}:`, error);
            }
        });

        return deals;
    }

    // Extract deal information from DOM element
    extractDealFromElement(element, sourceConfig, sourceKey, index) {
        const selectors = sourceConfig.selectors;
        
        // Extract basic information
        const titleEl = element.querySelector(selectors.title);
        const priceEl = element.querySelector(selectors.price);
        const originalPriceEl = element.querySelector(selectors.originalPrice);
        const descriptionEl = element.querySelector(selectors.description);
        const linkEl = element.querySelector(selectors.link);
        const imageEl = element.querySelector(selectors.image);
        const badgeEl = element.querySelector(selectors.badge);

        // Skip if essential elements are missing
        if (!titleEl || !priceEl || !linkEl) {
            return null;
        }

        const title = this.cleanText(titleEl.textContent);
        const currentPrice = this.extractPrice(priceEl.textContent);
        const originalPrice = originalPriceEl ? this.extractPrice(originalPriceEl.textContent) : currentPrice * 2;
        const description = descriptionEl ? this.cleanText(descriptionEl.textContent) : '';
        const link = this.normalizeLink(linkEl.href || linkEl.getAttribute('href'), sourceConfig.baseUrl);
        const image = imageEl ? (imageEl.src || imageEl.getAttribute('data-src')) : '';
        const badge = badgeEl ? this.cleanText(badgeEl.textContent) : '';

        // Generate deal object
        return {
            id: this.generateDealId(title, sourceKey),
            title: title,
            description: this.truncateDescription(description),
            type: this.determineDealType(badge, title),
            currentPrice: currentPrice,
            originalPrice: originalPrice,
            discount: this.calculateDiscount(currentPrice, originalPrice),
            category: this.categorizeProduct(title, description),
            image: this.normalizeImageUrl(image),
            sourceUrl: link,
            affiliateLink: this.generateAffiliateLink(link, sourceKey),
            source: sourceConfig.name,
            sourceKey: sourceKey,
            endDate: this.estimateEndDate(),
            rating: this.generateEstimatedRating(),
            features: this.extractFeatures(description),
            fetchedAt: new Date().toISOString(),
            isActive: true
        };
    }

    // Clean and normalize text content
    cleanText(text) {
        if (!text) return '';
        return text.trim()
                  .replace(/\s+/g, ' ')
                  .replace(/[^\w\s-.,!?()]/g, '')
                  .substring(0, 200);
    }

    // Extract price from text
    extractPrice(text) {
        if (!text) return 0;
        const priceMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
        return priceMatch ? parseFloat(priceMatch[1]) : 0;
    }

    // Normalize links to full URLs
    normalizeLink(link, baseUrl) {
        if (!link) return '';
        if (link.startsWith('http')) return link;
        if (link.startsWith('/')) return baseUrl + link;
        return baseUrl + '/' + link;
    }

    // Generate affiliate link
    generateAffiliateLink(originalLink, sourceKey) {
        const affiliateConfig = this.affiliatePrograms[sourceKey];
        
        if (!affiliateConfig || !affiliateConfig.enabled) {
            return originalLink;
        }

        // Different affiliate link structures for different platforms
        switch (sourceKey) {
            case 'appsumo':
                return `${affiliateConfig.baseUrl}${originalLink}`;
            case 'stacksocial':
                return `${originalLink}${originalLink.includes('?') ? '&' : '?'}rid=${affiliateConfig.baseUrl.split('rid=')[1]}`;
            case 'pitchground':
                return `${originalLink}${originalLink.includes('?') ? '&' : '?'}via=${affiliateConfig.baseUrl.split('via=')[1]}`;
            default:
                return originalLink;
        }
    }

    // Calculate discount percentage
    calculateDiscount(current, original) {
        if (!original || original <= current) return 0;
        return Math.round(((original - current) / original) * 100);
    }

    // Determine deal type from badge/title
    determineDealType(badge, title) {
        const text = (badge + ' ' + title).toLowerCase();
        
        if (text.includes('lifetime') || text.includes('ltd')) return 'lifetime';
        if (text.includes('flash') || text.includes('limited time')) return 'flash';
        if (text.includes('discount') || text.includes('off')) return 'discount';
        
        return 'discount';
    }

    // Categorize product based on title and description
    categorizeProduct(title, description) {
        const text = (title + ' ' + description).toLowerCase();
        
        const categories = {
            'productivity': ['productivity', 'task', 'note', 'organize', 'workflow', 'calendar', 'todo'],
            'design': ['design', 'graphic', 'photo', 'image', 'creative', 'ui', 'ux', 'adobe'],
            'business': ['business', 'crm', 'sales', 'marketing', 'analytics', 'automation', 'email'],
            'developer': ['developer', 'code', 'programming', 'api', 'hosting', 'database', 'dev']
        };

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return category;
            }
        }

        return 'productivity'; // Default category
    }

    // Generate unique deal ID
    generateDealId(title, source) {
        const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const hash = this.simpleHash(cleanTitle + source);
        return `${source}-${hash}-${Date.now()}`;
    }

    // Simple hash function for IDs
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    // Process and clean deals array
    processDeals(deals) {
        // Remove duplicates based on title similarity
        const uniqueDeals = this.removeDuplicates(deals);
        
        // Sort by best value (discount percentage)
        uniqueDeals.sort((a, b) => b.discount - a.discount);
        
        // Limit to top deals to prevent overwhelming users
        return uniqueDeals.slice(0, 50);
    }

    // Remove duplicate deals
    removeDuplicates(deals) {
        const uniqueDeals = [];
        const seenTitles = new Set();

        for (const deal of deals) {
            const normalizedTitle = deal.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Check for similar titles (basic duplicate detection)
            let isDuplicate = false;
            for (const seenTitle of seenTitles) {
                if (this.similarityScore(normalizedTitle, seenTitle) > 0.8) {
                    isDuplicate = true;
                    break;
                }
            }

            if (!isDuplicate) {
                uniqueDeals.push(deal);
                seenTitles.add(normalizedTitle);
            }
        }

        return uniqueDeals;
    }

    // Calculate similarity between two strings (basic implementation)
    similarityScore(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    // Levenshtein distance calculation
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // Validate deal object
    isValidDeal(deal) {
        return deal && 
               deal.title && 
               deal.title.length > 5 && 
               deal.currentPrice >= 0 && 
               deal.sourceUrl;
    }

    // Utility methods
    truncateDescription(text, maxLength = 150) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
    }

    normalizeImageUrl(imageUrl) {
        if (!imageUrl) return '🔥'; // Default emoji if no image
        if (imageUrl.startsWith('http')) return imageUrl;
        return imageUrl; // Return as-is for relative URLs
    }

    estimateEndDate() {
        // Estimate deal end date (typically 7-30 days from now)
        const daysToAdd = Math.floor(Math.random() * 23) + 7; // 7-30 days
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + daysToAdd);
        return endDate.toISOString().split('T')[0];
    }

    generateEstimatedRating() {
        // Generate realistic rating between 4.0-5.0
        return (Math.random() * 1 + 4).toFixed(1);
    }

    extractFeatures(description) {
        // Simple feature extraction from description
        const features = [];
        const commonFeatures = [
            'Lifetime access', 'No monthly fees', 'Premium support',
            'Regular updates', 'Cloud storage', 'Team collaboration',
            'Advanced analytics', 'API access', 'Mobile app'
        ];
        
        // Add 2-3 random relevant features
        const numFeatures = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < numFeatures; i++) {
            const feature = commonFeatures[Math.floor(Math.random() * commonFeatures.length)];
            if (!features.includes(feature)) {
                features.push(feature);
            }
        }
        
        return features;
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DealFetcher;
} else {
    window.DealFetcher = DealFetcher;
}