// netlify/functions/track-software-deals.js
// Serverless function for software price tracking and deal detection

const cheerio = require('cheerio'); // For HTML parsing
const fetch = require('node-fetch'); // For HTTP requests

// Rate limiting and caching
const REQUEST_CACHE = new Map();
const RATE_LIMITS = new Map();
const CACHE_DURATION = 3600000; // 1 hour
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

// Headers to mimic real browser
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
};

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { action, software_id, config } = JSON.parse(event.body);
        
        // Rate limiting check
        if (!checkRateLimit(context.clientContext?.ip || 'unknown')) {
            return {
                statusCode: 429,
                headers,
                body: JSON.stringify({ error: 'Rate limit exceeded' })
            };
        }

        let result;
        switch (action) {
            case 'check_pricing':
                result = await checkSoftwarePricing(software_id, config);
                break;
            case 'get_competitive_analysis':
                result = await getCompetitiveAnalysis(software_id);
                break;
            case 'validate_deal':
                result = await validateSoftwareDeal(software_id, config);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: result,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};

// Check rate limiting
function checkRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    if (!RATE_LIMITS.has(ip)) {
        RATE_LIMITS.set(ip, []);
    }
    
    const requests = RATE_LIMITS.get(ip);
    
    // Remove old requests
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }
    
    recentRequests.push(now);
    RATE_LIMITS.set(ip, recentRequests);
    
    return true;
}

// Main pricing check function
async function checkSoftwarePricing(softwareId, config) {
    console.log(`🔍 Checking pricing for ${config.name}...`);
    
    // Check cache first
    const cacheKey = `${softwareId}_${config.pricing_url}`;
    const cached = REQUEST_CACHE.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log(`📦 Using cached data for ${config.name}`);
        return cached.data;
    }
    
    try {
        // Fetch the pricing page
        const response = await fetchWithRetry(config.pricing_url, {
            headers: BROWSER_HEADERS,
            timeout: 10000
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extract pricing data
        const pricingData = extractPricingData($, config);
        
        // Extract promotional data
        const promotionData = extractPromotionalData($, config);
        
        // Validate and clean the data
        const result = {
            software_id: softwareId,
            name: config.name,
            company: config.company,
            pricing: pricingData,
            promotions: promotionData,
            scraped_at: new Date().toISOString(),
            source_url: config.pricing_url
        };
        
        // Cache the result
        REQUEST_CACHE.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        console.log(`✅ Successfully scraped ${config.name}: ${Object.keys(pricingData).length} pricing tiers found`);
        return result;
        
    } catch (error) {
        console.error(`❌ Error scraping ${config.name}:`, error.message);
        throw new Error(`Failed to check pricing for ${config.name}: ${error.message}`);
    }
}

// Extract pricing data from HTML
function extractPricingData($, config) {
    const pricingData = {};
    
    for (const [planKey, selector] of Object.entries(config.pricing_selectors)) {
        try {
            const element = $(selector).first();
            if (element.length > 0) {
                let priceText = element.text().trim();
                
                // Try different approaches to get price text
                if (!priceText) {
                    priceText = element.attr('data-price') || 
                               element.attr('aria-label') || 
                               element.find('[class*="price"]').text().trim();
                }
                
                const price = extractPriceFromText(priceText);
                if (price > 0) {
                    pricingData[planKey] = price;
                }
            }
        } catch (error) {
            console.warn(`Warning: Could not extract ${planKey} price:`, error.message);
        }
    }
    
    // Fallback: Try to find any price elements if selectors failed
    if (Object.keys(pricingData).length === 0) {
        pricingData.detected_prices = findPricesInText($.text());
    }
    
    return pricingData;
}

// Extract promotional data
function extractPromotionalData($, config) {
    const promotions = [];
    
    if (config.promotion_selectors) {
        for (const [promoType, selector] of Object.entries(config.promotion_selectors)) {
            try {
                $(selector).each((i, element) => {
                    const text = $(element).text().trim();
                    if (text && text.length > 0) {
                        promotions.push({
                            type: promoType,
                            text: text,
                            selector_used: selector
                        });
                    }
                });
            } catch (error) {
                console.warn(`Warning: Could not extract ${promoType} promotion:`, error.message);
            }
        }
    }
    
    // Fallback: Look for common promotional text patterns
    if (promotions.length === 0) {
        const commonPromotionSelectors = [
            '[class*="promo"]', '[class*="discount"]', '[class*="offer"]',
            '[class*="sale"]', '[class*="banner"]', '.alert', '.notification',
            '[data-testid*="promo"]', '[data-testid*="banner"]'
        ];
        
        commonPromotionSelectors.forEach(selector => {
            $(selector).each((i, element) => {
                const text = $(element).text().trim();
                if (text && (text.includes('%') || text.includes('off') || 
                           text.includes('sale') || text.includes('free'))) {
                    promotions.push({
                        type: 'detected',
                        text: text,
                        selector_used: selector
                    });
                }
            });
        });
    }
    
    return promotions;
}

// Extract price from text using various patterns
function extractPriceFromText(text) {
    if (!text) return 0;
    
    // Remove common currency symbols and clean text
    const cleanText = text.replace(/[^\d.,\$€£¥]/g, ' ');
    
    // Common price patterns
    const patterns = [
        /\$(\d+(?:\.\d{2})?)/,           // $29.99
        /(\d+(?:\.\d{2})?)\s*\/\s*mo/i,  // 29.99/mo
        /(\d+(?:\.\d{2})?)\s*per\s*month/i, // 29.99 per month
        /(\d+(?:\.\d{2})?)\s*monthly/i,     // 29.99 monthly
        /(\d+(?:\.\d{2})?)/               // Any number (last resort)
    ];
    
    for (const pattern of patterns) {
        const match = cleanText.match(pattern);
        if (match) {
            const price = parseFloat(match[1]);
            if (price > 0 && price < 10000) { // Sanity check
                return price;
            }
        }
    }
    
    return 0;
}

// Find all prices mentioned in text (backup method)
function findPricesInText(text) {
    const prices = [];
    const pricePattern = /\$(\d+(?:\.\d{2})?)/g;
    let match;
    
    while ((match = pricePattern.exec(text)) !== null) {
        const price = parseFloat(match[1]);
        if (price > 0 && price < 10000) {
            prices.push(price);
        }
    }
    
    return prices;
}

// Fetch with retry logic
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🌐 Fetching ${url} (attempt ${attempt}/${maxRetries})`);
            
            const response = await fetch(url, {
                ...options,
                timeout: options.timeout || 10000
            });
            
            return response;
            
        } catch (error) {
            lastError = error;
            console.warn(`⚠️ Attempt ${attempt} failed for ${url}:`, error.message);
            
            if (attempt < maxRetries) {
                // Exponential backoff
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts: ${lastError.message}`);
}

// Get competitive analysis
async function getCompetitiveAnalysis(softwareId) {
    // This would involve checking multiple competitors
    // For now, return a placeholder structure
    return {
        software_id: softwareId,
        analysis_type: 'competitive_pricing',
        competitors: [],
        market_position: 'analysis_pending',
        timestamp: new Date().toISOString()
    };
}

// Validate a software deal
async function validateSoftwareDeal(softwareId, dealInfo) {
    try {
        // Check if the deal URL is still valid
        const response = await fetchWithRetry(dealInfo.deal_url, {
            headers: BROWSER_HEADERS,
            timeout: 5000
        });
        
        if (!response.ok) {
            return {
                valid: false,
                reason: `Deal URL returned ${response.status}`,
                checked_at: new Date().toISOString()
            };
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Look for signs that the deal is still active
        const dealText = $.text().toLowerCase();
        const hasPromotionalText = dealText.includes('sale') || 
                                  dealText.includes('discount') || 
                                  dealText.includes('offer') ||
                                  dealText.includes('%');
        
        return {
            valid: hasPromotionalText,
            confidence: hasPromotionalText ? 0.8 : 0.3,
            promotional_text_found: hasPromotionalText,
            checked_at: new Date().toISOString()
        };
        
    } catch (error) {
        return {
            valid: false,
            reason: `Validation error: ${error.message}`,
            checked_at: new Date().toISOString()
        };
    }
}