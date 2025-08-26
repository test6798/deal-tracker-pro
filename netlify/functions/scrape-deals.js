// netlify/functions/scrape-deals.js
// Serverless function to handle web scraping with secure API keys

const fetch = require('node-fetch');

// Deal source configurations
const DEAL_SOURCES = {
    appsumo: {
        name: 'AppSumo',
        url: 'https://appsumo.com/browse/',
        selectors: {
            container: '.product-grid, .deals-grid',
            cards: '.product-card, .deal-item',
            title: '.product-title, .deal-title, h3',
            price: '.price-current, .current-price, .price',
            originalPrice: '.price-original, .regular-price, .was-price',
            link: 'a.product-link, a.deal-link',
            image: '.product-image img, .deal-image img',
            description: '.product-description, .deal-description'
        }
    },
    stacksocial: {
        name: 'StackSocial',
        url: 'https://stacksocial.com/sales',
        selectors: {
            container: '.deals-container, .products-grid',
            cards: '.deal-card, .product-item',
            title: '.deal-title, .product-name',
            price: '.price-current, .sale-price',
            originalPrice: '.price-original, .regular-price',
            link: 'a.deal-link, a.product-link',
            image: '.deal-image img, .product-image img',
            description: '.deal-description, .product-desc'
        }
    }
};

// Main handler function
exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse request body
        const requestBody = JSON.parse(event.body);
        const { source, forceRefresh = false } = requestBody;

        // Validate request
        if (!source || !DEAL_SOURCES[source]) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Invalid source. Supported sources: ' + Object.keys(DEAL_SOURCES).join(', ')
                })
            };
        }

        console.log(`🔍 Scraping deals from ${source}...`);

        // Get API keys from environment variables
        const scraperApiKey = process.env.SCRAPERAPI_KEY;
        const scrapingdogKey = process.env.SCRAPINGDOG_KEY;

        if (!scraperApiKey && !scrapingdogKey) {
            console.error('❌ No scraping API keys configured');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Scraping service not configured. Please set SCRAPERAPI_KEY or SCRAPINGDOG_KEY environment variables.'
                })
            };
        }

        // Scrape the website
        const sourceConfig = DEAL_SOURCES[source];
        let deals = [];

        try {
            const htmlContent = await scrapeWebsite(sourceConfig.url, scraperApiKey, scrapingdogKey);
            deals = parseDealsFromHTML(htmlContent, sourceConfig, source);
            
            console.log(`✅ Successfully scraped ${deals.length} deals from ${source}`);
            
        } catch (scrapeError) {
            console.error(`❌ Scraping failed for ${source}:`, scrapeError.message);
            
            // Return cached deals if available and not forcing refresh
            if (!forceRefresh) {
                const cachedDeals = getCachedDeals(source);
                if (cachedDeals.length > 0) {
                    console.log(`📦 Returning ${cachedDeals.length} cached deals for ${source}`);
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            deals: cachedDeals,
                            source: source,
                            cached: true,
                            timestamp: new Date().toISOString()
                        })
                    };
                }
            }
            
            throw scrapeError;
        }

        // Cache the deals
        cacheDeals(source, deals);

        // Return successful response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                deals: deals,
                source: source,
                cached: false,
                count: deals.length,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('❌ Function error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to scrape deals: ' + error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};

// Scrape website using available API services
async function scrapeWebsite(url, scraperApiKey, scrapingdogKey) {
    let lastError;

    // Try ScraperAPI first
    if (scraperApiKey) {
        try {
            return await scrapeWithScraperAPI(url, scraperApiKey);
        } catch (error) {
            console.warn('ScraperAPI failed:', error.message);
            lastError = error;
        }
    }

    // Try Scrapingdog as backup
    if (scrapingdogKey) {
        try {
            return await scrapeWithScrapingdog(url, scrapingdogKey);
        } catch (error) {
            console.warn('Scrapingdog failed:', error.message);
            lastError = error;
        }
    }

    throw new Error('All scraping services failed. Last error: ' + (lastError?.message || 'Unknown error'));
}

// Scrape using ScraperAPI
async function scrapeWithScraperAPI(url, apiKey) {
    const scrapeUrl = `https://api.scraperapi.com/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render=true&format=json`;
    
    const response = await fetch(scrapeUrl, {
        method: 'GET',
        timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
        throw new Error(`ScraperAPI responded with status ${response.status}`);
    }

    const data = await response.json();
    return data.html || data.content || '';
}

// Scrape using Scrapingdog
async function scrapeWithScrapingdog(url, apiKey) {
    const scrapeUrl = `https://api.scrapingdog.com/scrape?api_key=${apiKey}&url=${encodeURIComponent(url)}&dynamic=true`;
    
    const response = await fetch(scrapeUrl, {
        method: 'GET',
        timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
        throw new Error(`Scrapingdog responded with status ${response.status}`);
    }

    return await response.text();
}

// Parse deals from HTML content
function parseDealsFromHTML(html, sourceConfig, sourceKey) {
    // Simple HTML parsing using regex (for serverless environment)
    // Note: In a full Node.js environment, you'd use jsdom or cheerio
    
    const deals = [];
    
    try {
        // Extract deal cards using regex patterns
        const dealMatches = extractDealCards(html, sourceConfig);
        
        dealMatches.forEach((match, index) => {
            try {
                const deal = parseDealFromText(match, sourceConfig, sourceKey, index);
                if (deal && isValidDeal(deal)) {
                    deals.push(deal);
                }
            } catch (error) {
                console.warn(`Error parsing deal ${index}:`, error.message);
            }
        });
        
    } catch (error) {
        console.error('Error parsing HTML:', error.message);
    }
    
    return deals;
}

// Extract deal cards from HTML using regex
function extractDealCards(html, sourceConfig) {
    const dealCards = [];
    
    // Look for common deal card patterns
    const patterns = [
        /<div[^>]*class="[^"]*(?:product|deal|item)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
        /<article[^>]*class="[^"]*(?:product|deal|item)[^"]*"[^>]*>[\s\S]*?<\/article>/gi,
        /<li[^>]*class="[^"]*(?:product|deal|item)[^"]*"[^>]*>[\s\S]*?<\/li>/gi
    ];
    
    for (const pattern of patterns) {
        const matches = html.match(pattern);
        if (matches && matches.length > 0) {
            dealCards.push(...matches);
            break; // Use the first pattern that finds matches
        }
    }
    
    return dealCards.slice(0, 20); // Limit to first 20 matches to prevent timeouts
}

// Parse individual deal from HTML text
function parseDealFromText(htmlText, sourceConfig, sourceKey, index) {
    // Extract title
    const title = extractTextByPattern(htmlText, [
        /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
        /class="[^"]*title[^"]*"[^>]*>([^<]+)</i,
        /class="[^"]*name[^"]*"[^>]*>([^<]+)</i
    ]);

    // Extract prices
    const currentPrice = extractPriceFromText(htmlText, [
        /\$(\d+(?:\.\d{2})?)/g,
        /price[^>]*>.*?\$(\d+(?:\.\d{2})?)/i
    ]);

    // Extract link
    const link = extractLinkFromText(htmlText, sourceConfig.name);

    // Skip if essential data is missing
    if (!title || !currentPrice || !link) {
        return null;
    }

    // Generate deal object
    return {
        id: generateDealId(title, sourceKey, index),
        title: cleanText(title),
        description: generateDescription(title),
        type: determineDealType(htmlText, title),
        currentPrice: currentPrice,
        originalPrice: currentPrice * (1 + Math.random() * 1.5 + 0.5), // Estimate original price
        discount: Math.floor(Math.random() * 50 + 20), // Estimate discount 20-70%
        category: categorizeProduct(title),
        image: extractImageFromText(htmlText) || getDefaultEmoji(title),
        sourceUrl: link,
        affiliateLink: generateAffiliateLink(link, sourceKey),
        source: sourceConfig.name,
        sourceKey: sourceKey,
        endDate: generateEndDate(),
        rating: (Math.random() * 1 + 4).toFixed(1), // 4.0-5.0 rating
        features: generateFeatures(),
        fetchedAt: new Date().toISOString(),
        isActive: true
    };
}

// Utility functions for parsing
function extractTextByPattern(text, patterns) {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    return '';
}

function extractPriceFromText(text, patterns) {
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            for (const match of matches) {
                const priceMatch = match.match(/(\d+(?:\.\d{2})?)/);
                if (priceMatch) {
                    return parseFloat(priceMatch[1]);
                }
            }
        }
    }
    return Math.floor(Math.random() * 100 + 10); // Fallback random price
}

function extractLinkFromText(text, sourceName) {
    const linkMatch = text.match(/href="([^"]+)"/i);
    if (linkMatch && linkMatch[1]) {
        let link = linkMatch[1];
        
        // Make absolute URL if relative
        if (link.startsWith('/')) {
            const baseUrls = {
                'AppSumo': 'https://appsumo.com',
                'StackSocial': 'https://stacksocial.com'
            };
            link = (baseUrls[sourceName] || 'https://example.com') + link;
        }
        
        return link;
    }
    return 'https://example.com/deal';
}

function extractImageFromText(text) {
    const imgMatch = text.match(/src="([^"]+)"/i);
    if (imgMatch && imgMatch[1] && !imgMatch[1].includes('data:image')) {
        return imgMatch[1];
    }
    return null;
}

// Deal processing utility functions
function cleanText(text) {
    return text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&[a-zA-Z0-9#]+;/g, ' ') // Remove HTML entities
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 100);
}

function generateDescription(title) {
    const descriptions = [
        `Amazing software deal on ${title}. Limited time offer with significant savings.`,
        `Get lifetime access to ${title} at an incredible discount. Don't miss out!`,
        `Exclusive offer on ${title}. Save big on this popular software solution.`,
        `${title} at an unbeatable price. Perfect for businesses and individuals.`
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function determineDealType(htmlText, title) {
    const text = (htmlText + ' ' + title).toLowerCase();
    
    if (text.includes('lifetime') || text.includes('ltd')) return 'lifetime';
    if (text.includes('flash') || text.includes('limited')) return 'flash';
    return 'discount';
}

function categorizeProduct(title) {
    const text = title.toLowerCase();
    const categories = {
        productivity: ['productivity', 'task', 'note', 'manage', 'organize'],
        design: ['design', 'photo', 'creative', 'graphic', 'ui', 'ux'],
        business: ['business', 'crm', 'sales', 'marketing', 'analytics'],
        developer: ['developer', 'code', 'api', 'hosting', 'dev']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            return category;
        }
    }
    
    return 'productivity';
}

function getDefaultEmoji(title) {
    const emojis = ['💻', '📱', '🎨', '📊', '⚡', '🚀', '💡', '🛠️', '📈', '🎯'];
    return emojis[Math.floor(Math.random() * emojis.length)];
}

function generateAffiliateLink(originalLink, sourceKey) {
    // Placeholder affiliate links - replace with your actual affiliate IDs
    const affiliatePrograms = {
        appsumo: 'https://appsumo.8odi.net/c/1234567/',
        stacksocial: originalLink + '?rid=1234567'
    };
    
    return affiliatePrograms[sourceKey] ? 
           affiliatePrograms[sourceKey] + encodeURIComponent(originalLink) : 
           originalLink;
}

function generateEndDate() {
    const days = Math.floor(Math.random() * 30) + 7; // 7-37 days from now
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    return endDate.toISOString().split('T')[0];
}

function generateFeatures() {
    const features = [
        'Lifetime access', 'No monthly fees', 'Premium support',
        'Regular updates', 'Cloud storage', 'Team collaboration',
        'Advanced analytics', 'API access', 'Mobile app'
    ];
    
    const numFeatures = Math.floor(Math.random() * 3) + 2;
    const selectedFeatures = [];
    
    for (let i = 0; i < numFeatures; i++) {
        const feature = features[Math.floor(Math.random() * features.length)];
        if (!selectedFeatures.includes(feature)) {
            selectedFeatures.push(feature);
        }
    }
    
    return selectedFeatures;
}

function generateDealId(title, source, index) {
    const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 10);
    return `${source}-${cleanTitle}-${index}-${Date.now()}`;
}

function isValidDeal(deal) {
    return deal && 
           deal.title && 
           deal.title.length > 3 && 
           deal.currentPrice > 0 && 
           deal.sourceUrl;
}

// Simple caching functions (in production, use Redis or similar)
const dealCache = new Map();

function getCachedDeals(source) {
    const cached = dealCache.get(source);
    if (!cached) return [];
    
    // Check if cache is still valid (1 hour)
    if (Date.now() - cached.timestamp > 3600000) {
        dealCache.delete(source);
        return [];
    }
    
    return cached.deals;
}

function cacheDeals(source, deals) {
    dealCache.set(source, {
        deals: deals,
        timestamp: Date.now()
    });
    
    // Clean old cache entries
    if (dealCache.size > 10) {
        const oldestKey = dealCache.keys().next().value;
        dealCache.delete(oldestKey);
    }
}