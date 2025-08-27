// SoftwareDealTracker.js - Complete Software Deal Intelligence System
// Real-time price tracking, historical analysis, and competitive intelligence

class SoftwareDealTracker {
    constructor() {
        this.apiEndpoint = '/.netlify/functions/track-software-deals';
        this.updateInterval = 3600000; // 1 hour
        this.priceThresholds = {
            significant: 0.15,  // 15% drop
            major: 0.30,        // 30% drop
            massive: 0.50       // 50% drop
        };
        
        // Software categories for competitive analysis
        this.categories = {
            design: ['Adobe Creative Cloud', 'Canva Pro', 'Figma', 'Sketch', 'Affinity Suite'],
            productivity: ['Microsoft 365', 'Google Workspace', 'Notion', 'Slack', 'Zoom'],
            development: ['JetBrains IntelliJ', 'Visual Studio', 'GitHub Copilot', 'Postman', 'MongoDB Atlas'],
            marketing: ['HubSpot', 'Mailchimp', 'Hootsuite', 'Ahrefs', 'SEMrush'],
            business: ['Salesforce', 'QuickBooks', 'Shopify', 'Stripe', 'DocuSign'],
            security: ['NordVPN', 'ExpressVPN', '1Password', 'Bitwarden', 'Norton'],
            analytics: ['Google Analytics 360', 'Mixpanel', 'Amplitude', 'Tableau', 'Power BI']
        };
        
        // Software tracking configuration
        this.trackingTargets = {
            'adobe-creative-cloud': {
                name: 'Adobe Creative Cloud',
                company: 'Adobe',
                category: 'design',
                pricing_url: 'https://www.adobe.com/creativecloud/plans.html',
                pricing_selectors: {
                    individual_monthly: '.cc-pricing-card:first-child .price-current',
                    individual_annual: '.cc-pricing-card:first-child .price-annual',
                    teams: '.cc-pricing-card:nth-child(2) .price-current'
                },
                promotion_selectors: {
                    banner: '.promotional-banner',
                    discount_text: '.discount-percentage',
                    end_date: '.promo-end-date'
                },
                typical_price: {
                    individual_monthly: 54.99,
                    individual_annual: 599.88,
                    teams: 84.99
                },
                last_checked: null,
                price_history: []
            },
            
            'microsoft-365': {
                name: 'Microsoft 365 Business',
                company: 'Microsoft',
                category: 'productivity',
                pricing_url: 'https://www.microsoft.com/en-us/microsoft-365/business/compare-all-microsoft-365-business-products',
                pricing_selectors: {
                    business_basic: '[data-m="Business Basic"] .price',
                    business_standard: '[data-m="Business Standard"] .price',
                    business_premium: '[data-m="Business Premium"] .price'
                },
                typical_price: {
                    business_basic: 6.00,
                    business_standard: 12.50,
                    business_premium: 22.00
                },
                last_checked: null,
                price_history: []
            },
            
            'slack-pro': {
                name: 'Slack Pro',
                company: 'Slack',
                category: 'productivity',
                pricing_url: 'https://slack.com/pricing',
                pricing_selectors: {
                    pro_monthly: '[data-qa="pro_monthly_price"]',
                    pro_annual: '[data-qa="pro_annual_price"]'
                },
                typical_price: {
                    pro_monthly: 7.25,
                    pro_annual: 87.00
                },
                last_checked: null,
                price_history: []
            },
            
            'notion-plus': {
                name: 'Notion Plus',
                company: 'Notion',
                category: 'productivity', 
                pricing_url: 'https://www.notion.so/pricing',
                pricing_selectors: {
                    plus_monthly: '[data-testid="plus-monthly"] .price',
                    business_monthly: '[data-testid="business-monthly"] .price'
                },
                typical_price: {
                    plus_monthly: 8.00,
                    business_monthly: 15.00
                },
                last_checked: null,
                price_history: []
            },
            
            'figma-professional': {
                name: 'Figma Professional',
                company: 'Figma',
                category: 'design',
                pricing_url: 'https://www.figma.com/pricing/',
                pricing_selectors: {
                    professional: '[data-testid="professional-price"]',
                    organization: '[data-testid="organization-price"]'
                },
                typical_price: {
                    professional: 12.00,
                    organization: 45.00
                },
                last_checked: null,
                price_history: []
            }
        };
        
        // Initialize price history from localStorage
        this.loadPriceHistory();
        
        // User watchlist and alerts
        this.userWatchlist = JSON.parse(localStorage.getItem('softwareWatchlist') || '[]');
        this.alertSubscribers = JSON.parse(localStorage.getItem('alertSubscribers') || '[]');
    }
    
    // Main method to track all software deals
    async trackAllSoftwareDeals() {
        console.log('🔍 Starting comprehensive software deal tracking...');
        const results = {
            updated: [],
            newDeals: [],
            priceDrops: [],
            errors: []
        };
        
        for (const [softwareId, config] of Object.entries(this.trackingTargets)) {
            try {
                console.log(`📊 Checking ${config.name}...`);
                
                const pricingData = await this.checkSoftwarePricing(softwareId, config);
                
                if (pricingData.hasChanges) {
                    results.updated.push(pricingData);
                    
                    // Check for significant price drops
                    const priceDrops = this.analyzePriceChanges(pricingData);
                    if (priceDrops.length > 0) {
                        results.priceDrops.push(...priceDrops);
                        
                        // Trigger alerts for watched software
                        await this.triggerPriceAlerts(softwareId, priceDrops);
                    }
                }
                
                // Add delay between requests
                await this.delay(2000);
                
            } catch (error) {
                console.error(`❌ Error tracking ${config.name}:`, error);
                results.errors.push({
                    software: config.name,
                    error: error.message
                });
            }
        }
        
        // Update last check timestamp
        localStorage.setItem('lastDealCheck', new Date().toISOString());
        
        console.log(`✅ Deal tracking complete: ${results.updated.length} updates, ${results.priceDrops.length} price drops`);
        return results;
    }
    
    // Check pricing for specific software
    async checkSoftwarePricing(softwareId, config) {
        try {
            // Use serverless function to avoid CORS issues
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'check_pricing',
                    software_id: softwareId,
                    config: config
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Process the pricing data
            const currentPricing = this.processPricingData(data.pricing, config);
            const previousPricing = this.getLatestPricing(softwareId);
            
            // Detect changes
            const changes = this.detectPriceChanges(previousPricing, currentPricing);
            
            // Store pricing history
            if (changes.hasChanges) {
                this.storePricingHistory(softwareId, currentPricing, changes);
            }
            
            return {
                softwareId: softwareId,
                name: config.name,
                company: config.company,
                category: config.category,
                currentPricing: currentPricing,
                previousPricing: previousPricing,
                changes: changes,
                hasChanges: changes.hasChanges,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`Error checking pricing for ${config.name}:`, error);
            throw error;
        }
    }
    
    // Process raw pricing data from scraping
    processPricingData(rawData, config) {
        const processed = {
            software_id: rawData.software_id,
            plans: {},
            promotions: [],
            checked_at: new Date().toISOString()
        };
        
        // Extract pricing for each plan
        if (rawData.pricing) {
            for (const [planKey, price] of Object.entries(rawData.pricing)) {
                processed.plans[planKey] = {
                    current_price: this.parsePrice(price),
                    currency: 'USD', // Default, could be detected
                    billing_cycle: planKey.includes('annual') ? 'annual' : 'monthly'
                };
            }
        }
        
        // Extract promotional information
        if (rawData.promotions) {
            processed.promotions = rawData.promotions.map(promo => ({
                type: this.determinePromotionType(promo),
                description: promo.text,
                discount_percentage: this.extractDiscountPercentage(promo.text),
                end_date: this.parseEndDate(promo.end_date)
            }));
        }
        
        return processed;
    }
    
    // Detect price changes between old and new pricing
    detectPriceChanges(oldPricing, newPricing) {
        const changes = {
            hasChanges: false,
            planChanges: [],
            newPromotions: [],
            endedPromotions: []
        };
        
        if (!oldPricing) {
            changes.hasChanges = true;
            changes.planChanges.push({ type: 'initial_tracking', message: 'Started tracking this software' });
            return changes;
        }
        
        // Compare plan pricing
        for (const [planKey, newPlan] of Object.entries(newPricing.plans)) {
            const oldPlan = oldPricing.plans[planKey];
            
            if (!oldPlan) {
                changes.hasChanges = true;
                changes.planChanges.push({
                    type: 'new_plan',
                    plan: planKey,
                    price: newPlan.current_price,
                    message: `New ${planKey} plan introduced at $${newPlan.current_price}`
                });
            } else if (oldPlan.current_price !== newPlan.current_price) {
                changes.hasChanges = true;
                const priceDiff = newPlan.current_price - oldPlan.current_price;
                const percentChange = (priceDiff / oldPlan.current_price) * 100;
                
                changes.planChanges.push({
                    type: priceDiff < 0 ? 'price_drop' : 'price_increase',
                    plan: planKey,
                    old_price: oldPlan.current_price,
                    new_price: newPlan.current_price,
                    change_amount: priceDiff,
                    change_percentage: percentChange,
                    message: `${planKey} ${priceDiff < 0 ? 'decreased' : 'increased'} by ${Math.abs(percentChange).toFixed(1)}% (${priceDiff < 0 ? '-' : '+'}$${Math.abs(priceDiff)})`
                });
            }
        }
        
        // Compare promotions
        const oldPromoTexts = (oldPricing.promotions || []).map(p => p.description);
        const newPromoTexts = (newPricing.promotions || []).map(p => p.description);
        
        // New promotions
        newPricing.promotions?.forEach(promo => {
            if (!oldPromoTexts.includes(promo.description)) {
                changes.hasChanges = true;
                changes.newPromotions.push(promo);
            }
        });
        
        // Ended promotions
        oldPricing.promotions?.forEach(promo => {
            if (!newPromoTexts.includes(promo.description)) {
                changes.hasChanges = true;
                changes.endedPromotions.push(promo);
            }
        });
        
        return changes;
    }
    
    // Analyze price changes for alert triggering
    analyzePriceChanges(pricingData) {
        const significantChanges = [];
        
        pricingData.changes.planChanges.forEach(change => {
            if (change.type === 'price_drop' && change.change_percentage) {
                const absPercentage = Math.abs(change.change_percentage) / 100;
                
                let significance = null;
                if (absPercentage >= this.priceThresholds.massive) {
                    significance = 'massive';
                } else if (absPercentage >= this.priceThresholds.major) {
                    significance = 'major';
                } else if (absPercentage >= this.priceThresholds.significant) {
                    significance = 'significant';
                }
                
                if (significance) {
                    significantChanges.push({
                        software_id: pricingData.softwareId,
                        software_name: pricingData.name,
                        plan: change.plan,
                        old_price: change.old_price,
                        new_price: change.new_price,
                        discount_percentage: Math.abs(change.change_percentage),
                        discount_amount: Math.abs(change.change_amount),
                        significance: significance,
                        message: `${pricingData.name} ${change.plan} dropped ${Math.abs(change.change_percentage).toFixed(1)}% to $${change.new_price}`,
                        timestamp: pricingData.timestamp
                    });
                }
            }
        });
        
        // Check for new promotions that represent significant value
        pricingData.changes.newPromotions?.forEach(promo => {
            if (promo.discount_percentage >= 15) {
                significantChanges.push({
                    software_id: pricingData.softwareId,
                    software_name: pricingData.name,
                    type: 'promotion',
                    promotion: promo.description,
                    discount_percentage: promo.discount_percentage,
                    end_date: promo.end_date,
                    significance: promo.discount_percentage >= 50 ? 'massive' : 
                                  promo.discount_percentage >= 30 ? 'major' : 'significant',
                    message: `${pricingData.name} new promotion: ${promo.description}`,
                    timestamp: pricingData.timestamp
                });
            }
        });
        
        return significantChanges;
    }
    
    // Get competitive analysis for a category
    getCompetitiveAnalysis(category) {
        const categoryApps = this.categories[category] || [];
        const analysis = {
            category: category,
            competitors: [],
            insights: {
                best_value: null,
                lowest_price: null,
                most_expensive: null,
                avg_price: 0
            }
        };
        
        let totalPrice = 0;
        let priceCount = 0;
        
        categoryApps.forEach(appName => {
            // Find corresponding tracked software
            const trackedApp = Object.values(this.trackingTargets).find(
                target => target.name.toLowerCase() === appName.toLowerCase()
            );
            
            if (trackedApp) {
                const latestPricing = this.getLatestPricing(
                    Object.keys(this.trackingTargets).find(key => 
                        this.trackingTargets[key] === trackedApp
                    )
                );
                
                if (latestPricing && latestPricing.plans) {
                    // Get the main pricing tier (usually the first or most popular)
                    const mainPlan = Object.values(latestPricing.plans)[0];
                    if (mainPlan) {
                        analysis.competitors.push({
                            name: trackedApp.name,
                            company: trackedApp.company,
                            price: mainPlan.current_price,
                            billing_cycle: mainPlan.billing_cycle,
                            has_promotion: latestPricing.promotions?.length > 0
                        });
                        
                        totalPrice += mainPlan.current_price;
                        priceCount++;
                    }
                }
            }
        });
        
        // Calculate insights
        if (analysis.competitors.length > 0) {
            analysis.insights.avg_price = totalPrice / priceCount;
            analysis.competitors.sort((a, b) => a.price - b.price);
            analysis.insights.lowest_price = analysis.competitors[0];
            analysis.insights.most_expensive = analysis.competitors[analysis.competitors.length - 1];
            
            // Determine best value (subjective, could be enhanced with feature scoring)
            analysis.insights.best_value = analysis.competitors.find(comp => 
                comp.price <= analysis.insights.avg_price * 1.2 && comp.has_promotion
            ) || analysis.competitors[0];
        }
        
        return analysis;
    }
    
    // Get historical price analysis
    getHistoricalAnalysis(softwareId, days = 90) {
        const history = this.getPriceHistory(softwareId, days);
        if (!history || history.length < 2) {
            return null;
        }
        
        const analysis = {
            software_id: softwareId,
            period_days: days,
            data_points: history.length,
            price_trend: null,
            volatility: 0,
            seasonal_patterns: [],
            recommendations: []
        };
        
        // Calculate trend
        const firstPrice = history[0].price;
        const lastPrice = history[history.length - 1].price;
        const trendChange = ((lastPrice - firstPrice) / firstPrice) * 100;
        
        analysis.price_trend = {
            direction: trendChange > 5 ? 'increasing' : trendChange < -5 ? 'decreasing' : 'stable',
            change_percentage: trendChange,
            lowest_price: Math.min(...history.map(h => h.price)),
            highest_price: Math.max(...history.map(h => h.price)),
            current_vs_lowest: ((lastPrice - Math.min(...history.map(h => h.price))) / Math.min(...history.map(h => h.price))) * 100
        };
        
        // Calculate volatility (standard deviation)
        const prices = history.map(h => h.price);
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
        analysis.volatility = Math.sqrt(variance);
        
        // Generate recommendations
        if (analysis.price_trend.current_vs_lowest < 10) {
            analysis.recommendations.push({
                type: 'buy_now',
                message: 'Current price is near historical low',
                confidence: 'high'
            });
        } else if (analysis.price_trend.direction === 'decreasing') {
            analysis.recommendations.push({
                type: 'wait',
                message: 'Price trend is decreasing, consider waiting',
                confidence: 'medium'
            });
        }
        
        return analysis;
    }
    
    // Trigger alerts for price drops
    async triggerPriceAlerts(softwareId, priceDrops) {
        // Check if any users are watching this software
        const watchers = this.userWatchlist.filter(item => item.software_id === softwareId);
        
        if (watchers.length === 0) return;
        
        for (const drop of priceDrops) {
            // Create alert object
            const alert = {
                id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                software_id: softwareId,
                software_name: drop.software_name,
                type: 'price_drop',
                significance: drop.significance,
                message: drop.message,
                old_price: drop.old_price,
                new_price: drop.new_price,
                discount_percentage: drop.discount_percentage,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            };
            
            // Store alert
            this.storeAlert(alert);
            
            // Trigger notifications based on user preferences
            await this.sendAlertNotifications(alert, watchers);
        }
    }
    
    // Store alert in localStorage (in production, would use database)
    storeAlert(alert) {
        const alerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');
        alerts.unshift(alert); // Add to beginning
        
        // Keep only last 100 alerts
        if (alerts.length > 100) {
            alerts.splice(100);
        }
        
        localStorage.setItem('priceAlerts', JSON.stringify(alerts));
    }
    
    // Send alert notifications
    async sendAlertNotifications(alert, watchers) {
        for (const watcher of watchers) {
            try {
                // Email notification (would integrate with email service)
                if (watcher.email_notifications) {
                    console.log(`📧 Would send email to ${watcher.email}: ${alert.message}`);
                }
                
                // Browser push notification
                if (watcher.browser_notifications && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification(`Deal Alert: ${alert.software_name}`, {
                        body: alert.message,
                        icon: '/icon-notification.png',
                        tag: alert.id
                    });
                }
                
                // In-app notification
                this.showInAppNotification(alert);
                
            } catch (error) {
                console.error('Error sending notification:', error);
            }
        }
    }
    
    // Show in-app notification
    showInAppNotification(alert) {
        const notification = document.createElement('div');
        notification.className = `alert-notification alert-${alert.significance}`;
        notification.innerHTML = `
            <div class="alert-content">
                <div class="alert-icon">${alert.significance === 'massive' ? '🔥' : alert.significance === 'major' ? '⚡' : '📉'}</div>
                <div class="alert-text">
                    <strong>${alert.software_name} Deal Alert!</strong><br>
                    ${alert.message}
                </div>
                <button class="alert-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }
    
    // User watchlist management
    addToWatchlist(softwareId, userEmail, preferences = {}) {
        const watchItem = {
            id: `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            software_id: softwareId,
            user_email: userEmail,
            email_notifications: preferences.email || true,
            browser_notifications: preferences.browser || true,
            price_drop_threshold: preferences.threshold || 15, // percentage
            created_at: new Date().toISOString()
        };
        
        this.userWatchlist.push(watchItem);
        localStorage.setItem('softwareWatchlist', JSON.stringify(this.userWatchlist));
        
        console.log(`👀 Added ${softwareId} to watchlist for ${userEmail}`);
        return watchItem;
    }
    
    removeFromWatchlist(watchItemId) {
        this.userWatchlist = this.userWatchlist.filter(item => item.id !== watchItemId);
        localStorage.setItem('softwareWatchlist', JSON.stringify(this.userWatchlist));
    }
    
    getUserWatchlist(userEmail) {
        return this.userWatchlist.filter(item => item.user_email === userEmail);
    }
    
    // Utility methods
    parsePrice(priceString) {
        if (!priceString) return 0;
        const cleanPrice = priceString.toString().replace(/[^\d.,]/g, '');
        return parseFloat(cleanPrice) || 0;
    }
    
    determinePromotionType(promotion) {
        const text = promotion.text?.toLowerCase() || '';
        if (text.includes('free') && text.includes('trial')) return 'free_trial_extension';
        if (text.includes('black friday') || text.includes('cyber monday')) return 'seasonal_sale';
        if (text.includes('flash') || text.includes('limited time')) return 'flash_sale';
        if (text.includes('%') || text.includes('off')) return 'percentage_discount';
        return 'general_promotion';
    }
    
    extractDiscountPercentage(text) {
        const match = text.match(/(\d+)%/);
        return match ? parseInt(match[1]) : 0;
    }
    
    parseEndDate(dateString) {
        if (!dateString) return null;
        try {
            return new Date(dateString).toISOString();
        } catch {
            return null;
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Data persistence methods
    loadPriceHistory() {
        const stored = localStorage.getItem('softwarePriceHistory');
        if (stored) {
            try {
                const history = JSON.parse(stored);
                Object.keys(this.trackingTargets).forEach(softwareId => {
                    if (history[softwareId]) {
                        this.trackingTargets[softwareId].price_history = history[softwareId];
                    }
                });
            } catch (error) {
                console.error('Error loading price history:', error);
            }
        }
    }
    
    storePricingHistory(softwareId, pricingData, changes) {
        if (!this.trackingTargets[softwareId]) return;
        
        this.trackingTargets[softwareId].price_history.unshift({
            timestamp: new Date().toISOString(),
            pricing: pricingData,
            changes: changes
        });
        
        // Keep only last 365 days of history
        const cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        this.trackingTargets[softwareId].price_history = this.trackingTargets[softwareId].price_history.filter(
            entry => new Date(entry.timestamp) > cutoffDate
        );
        
        // Save to localStorage
        const allHistory = {};
        Object.keys(this.trackingTargets).forEach(id => {
            allHistory[id] = this.trackingTargets[id].price_history;
        });
        
        localStorage.setItem('softwarePriceHistory', JSON.stringify(allHistory));
    }
    
    getLatestPricing(softwareId) {
        const history = this.trackingTargets[softwareId]?.price_history;
        return history && history.length > 0 ? history[0].pricing : null;
    }
    
    getPriceHistory(softwareId, days = 30) {
        const history = this.trackingTargets[softwareId]?.price_history || [];
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        return history
            .filter(entry => new Date(entry.timestamp) > cutoffDate)
            .map(entry => ({
                date: entry.timestamp,
                price: Object.values(entry.pricing.plans)[0]?.current_price || 0,
                promotions: entry.pricing.promotions || []
            }))
            .reverse(); // Oldest first for trend analysis
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoftwareDealTracker;
} else {
    window.SoftwareDealTracker = SoftwareDealTracker;
}