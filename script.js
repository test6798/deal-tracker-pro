// script.js - Integrated Real Software Deal Tracking System
// Combines existing website with comprehensive deal intelligence

// Global state management
let dealTracker = null;
let currentDeals = [];
let watchedSoftware = JSON.parse(localStorage.getItem('watchedSoftware') || '[]');
let priceAlerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');
let displayedDealsCount = 6;
let currentFilter = 'all';
let currentSort = 'price-drops';

// DOM Elements
const dealsContainer = document.getElementById('deals-container');
const loadMoreBtn = document.getElementById('load-more');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-deals');
const totalDealsSpan = document.getElementById('total-deals');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeDealTracker();
    setupEventListeners();
    createDealIntelligenceUI();
    startRealTimeTracking();
});

// Initialize deal tracking system
async function initializeDealTracker() {
    console.log('🎯 Initializing Real Software Deal Tracker...');
    
    try {
        // Initialize the tracking system
        if (typeof SoftwareDealTracker !== 'undefined') {
            dealTracker = new SoftwareDealTracker();
            console.log('✅ Deal tracking system loaded');
            
            // Load initial data
            await loadRealSoftwareDeals();
            
        } else {
            console.warn('⚠️ SoftwareDealTracker not found, loading fallback');
            loadFallbackDeals();
        }
        
        // Setup automatic updates every hour
        setInterval(async () => {
            console.log('🔄 Automatic deal update...');
            await updateAllSoftwareDeals();
        }, 3600000); // 1 hour
        
    } catch (error) {
        console.error('❌ Error initializing deal tracker:', error);
        loadFallbackDeals();
    }
}

// Create enhanced UI for deal intelligence
function createDealIntelligenceUI() {
    const filterBar = document.querySelector('.filter-bar .container');
    
    // Add deal intelligence controls
    const intelligenceBar = document.createElement('div');
    intelligenceBar.className = 'deal-intelligence-bar';
    intelligenceBar.innerHTML = `
        <div class="intelligence-controls">
            <div class="live-status">
                <span class="status-dot live"></span>
                <span class="status-text">Live Price Tracking</span>
                <span class="update-time">Updated: <span id="last-track-time">checking...</span></span>
            </div>
            
            <div class="intelligence-actions">
                <button class="intelligence-btn" id="show-price-charts">📈 Price History</button>
                <button class="intelligence-btn" id="show-comparisons">⚖️ Compare Software</button>
                <button class="intelligence-btn" id="setup-alerts">🔔 Set Price Alerts</button>
                <button class="intelligence-btn" id="view-analytics">📊 Deal Analytics</button>
            </div>
        </div>
    `;
    
    filterBar.appendChild(intelligenceBar);
    
    // Update sort options for deal intelligence
    if (sortSelect) {
        sortSelect.innerHTML = `
            <option value="price-drops">Biggest Price Drops</option>
            <option value="best-deals">Best Value Deals</option>
            <option value="ending-soon">Ending Soon</option>
            <option value="newest-deals">Newest Deals</option>
            <option value="most-watched">Most Watched</option>
        `;
    }
    
    // Add event listeners for new features
    setupIntelligenceEventListeners();
}

// Setup event listeners for intelligence features
function setupIntelligenceEventListeners() {
    const priceChartsBtn = document.getElementById('show-price-charts');
    const comparisonsBtn = document.getElementById('show-comparisons'); 
    const alertsBtn = document.getElementById('setup-alerts');
    const analyticsBtn = document.getElementById('view-analytics');
    
    if (priceChartsBtn) priceChartsBtn.addEventListener('click', showPriceChartsModal);
    if (comparisonsBtn) comparisonsBtn.addEventListener('click', showComparisonModal);
    if (alertsBtn) alertsBtn.addEventListener('click', showAlertsModal);
    if (analyticsBtn) analyticsBtn.addEventListener('click', showAnalyticsModal);
}

// Load real software deals with tracking
async function loadRealSoftwareDeals() {
    if (!dealTracker) {
        console.log('❌ Deal tracker not available');
        return;
    }
    
    try {
        console.log('🔍 Loading real-time software deals...');
        
        // Track all software deals
        const trackingResults = await dealTracker.trackAllSoftwareDeals();
        
        // Convert to display format
        currentDeals = await convertTrackingResultsToDeals(trackingResults);
        
        console.log(`✅ Loaded ${currentDeals.length} real software deals`);
        
        // Update UI
        updateDisplays();
        showDealTrackingSuccess(trackingResults);
        
    } catch (error) {
        console.error('❌ Error loading real deals:', error);
        showDealTrackingError(error);
    }
}

// Convert tracking results to deal display format
async function convertTrackingResultsToDeals(trackingResults) {
    const deals = [];
    
    // Get current pricing for all tracked software
    for (const [softwareId, config] of Object.entries(dealTracker.trackingTargets)) {
        try {
            const latestPricing = dealTracker.getLatestPricing(softwareId);
            const historicalAnalysis = dealTracker.getHistoricalAnalysis(softwareId, 30);
            
            if (latestPricing && latestPricing.plans) {
                // Create deals for each pricing plan
                for (const [planKey, planData] of Object.entries(latestPricing.plans)) {
                    
                    // Calculate discount percentage if we have historical data
                    let discount = 0;
                    let originalPrice = planData.current_price;
                    
                    if (config.typical_price && config.typical_price[planKey]) {
                        originalPrice = config.typical_price[planKey];
                        discount = Math.round(((originalPrice - planData.current_price) / originalPrice) * 100);
                    }
                    
                    // Determine deal quality
                    const dealQuality = calculateDealQuality(planData.current_price, originalPrice, historicalAnalysis);
                    
                    const deal = {
                        id: `${softwareId}-${planKey}`,
                        title: `${config.name} ${formatPlanName(planKey)}`,
                        description: generateDealDescription(config, planKey, dealQuality),
                        type: determineDealType(discount, latestPricing.promotions),
                        currentPrice: planData.current_price,
                        originalPrice: originalPrice,
                        discount: Math.max(0, discount),
                        category: config.category,
                        image: getCategoryEmoji(config.category),
                        sourceUrl: config.pricing_url,
                        affiliateLink: generateAffiliateLink(config.pricing_url, config.name),
                        source: config.company,
                        sourceKey: softwareId,
                        endDate: estimateEndDate(latestPricing.promotions),
                        rating: generateSoftwareRating(config.name),
                        features: extractKeyFeatures(config, planKey),
                        fetchedAt: latestPricing.checked_at || new Date().toISOString(),
                        isActive: true,
                        
                        // Deal intelligence data
                        priceHistory: dealTracker.getPriceHistory(softwareId, 90),
                        historicalAnalysis: historicalAnalysis,
                        dealQuality: dealQuality,
                        watchCount: getWatchCount(softwareId),
                        priceDrops: findRecentPriceDrops(softwareId),
                        competitivePosition: await getCompetitivePosition(softwareId, config.category),
                        isWatched: isUserWatching(softwareId)
                    };
                    
                    deals.push(deal);
                }
            }
        } catch (error) {
            console.error(`Error processing ${softwareId}:`, error);
        }
    }
    
    return deals.sort((a, b) => b.dealQuality.score - a.dealQuality.score);
}

// Enhanced deal card with intelligence features
function createIntelligentDealCard(deal) {
    const card = document.createElement('div');
    card.className = `deal-card intelligent-deal deal-quality-${deal.dealQuality.tier}`;
    card.dataset.dealId = deal.id;
    card.dataset.softwareId = deal.sourceKey;
    
    const daysLeft = getDaysUntilExpiration(deal.endDate);
    const badgeClass = `badge-${deal.type}`;
    const badgeText = deal.type.charAt(0).toUpperCase() + deal.type.slice(1);
    
    card.innerHTML = `
        <div class="deal-badges">
            <div class="deal-badge ${badgeClass}">${badgeText}</div>
            <div class="quality-badge quality-${deal.dealQuality.tier}">
                ${deal.dealQuality.icon} ${deal.dealQuality.label}
            </div>
            ${deal.priceDrops.length > 0 ? `<div class="drop-badge">📉 ${deal.priceDrops[0].percentage}% drop</div>` : ''}
        </div>
        
        <div class="deal-image">${deal.image}</div>
        
        <div class="deal-content">
            <div class="deal-header">
                <h4 class="deal-title">${deal.title}</h4>
                <div class="software-meta">
                    <span class="company-name">${deal.source}</span>
                    ${deal.watchCount > 0 ? `<span class="watch-count">👀 ${deal.watchCount} watching</span>` : ''}
                </div>
            </div>
            
            <p class="deal-description">${deal.description}</p>
            
            <div class="intelligence-insights">
                ${deal.dealQuality.insights.map(insight => 
                    `<div class="insight ${insight.type}">
                        ${insight.icon} ${insight.message}
                     </div>`
                ).join('')}
            </div>
            
            <div class="pricing-section">
                <div class="deal-pricing">
                    <span class="deal-price-current">$${deal.currentPrice}</span>
                    ${deal.originalPrice > deal.currentPrice ? 
                        `<span class="deal-price-original">$${deal.originalPrice}</span>
                         <span class="deal-discount">${deal.discount}% OFF</span>` 
                        : ''}
                </div>
                
                <div class="price-context">
                    ${deal.historicalAnalysis ? 
                        `<small>📈 ${deal.historicalAnalysis.price_trend.current_vs_lowest < 10 ? 
                            'Near historical low' : 
                            `${deal.historicalAnalysis.price_trend.current_vs_lowest.toFixed(0)}% above lowest`}</small>`
                        : ''}
                </div>
            </div>
            
            <div class="deal-meta">
                <span class="deal-rating">⭐ ${deal.rating}</span>
                ${daysLeft > 0 ? `<span class="deal-timer">⏰ ${daysLeft} days left</span>` : ''}
            </div>
            
            <div class="deal-actions">
                <a href="${deal.affiliateLink || deal.sourceUrl}" 
                   class="deal-cta primary-cta" 
                   target="_blank"
                   onclick="trackDealClick('${deal.id}', '${deal.sourceKey}', ${deal.currentPrice})"
                   rel="noopener">
                    Get ${deal.source} Deal →
                </a>
                
                <div class="secondary-actions">
                    <button class="action-btn ${deal.isWatched ? 'watching' : ''}" 
                            onclick="toggleWatch('${deal.sourceKey}', '${deal.title}')">
                        ${deal.isWatched ? '👁️ Watching' : '👀 Watch'}
                    </button>
                    
                    <button class="action-btn" onclick="showPriceHistory('${deal.sourceKey}')">
                        📊 History
                    </button>
                    
                    <button class="action-btn" onclick="showComparisons('${deal.category}')">
                        ⚖️ Compare
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Calculate deal quality score and insights
function calculateDealQuality(currentPrice, originalPrice, historicalAnalysis) {
    let score = 50; // Base score
    const insights = [];
    
    // Price discount factor
    const discountPercent = ((originalPrice - currentPrice) / originalPrice) * 100;
    if (discountPercent > 0) {
        score += Math.min(discountPercent * 2, 40); // Up to 40 points for discount
        insights.push({
            type: 'discount',
            icon: '💰',
            message: `${discountPercent.toFixed(0)}% off regular price`
        });
    }
    
    // Historical context
    if (historicalAnalysis) {
        const vsLowest = historicalAnalysis.price_trend.current_vs_lowest;
        if (vsLowest < 5) {
            score += 30;
            insights.push({
                type: 'historical-low',
                icon: '🔥',
                message: 'Near historical low price'
            });
        } else if (vsLowest < 20) {
            score += 15;
            insights.push({
                type: 'good-price',
                icon: '✅',
                message: 'Below average price'
            });
        }
        
        // Trend analysis
        if (historicalAnalysis.price_trend.direction === 'decreasing') {
            score += 10;
            insights.push({
                type: 'trend',
                icon: '📉',
                message: 'Price trending down'
            });
        }
    }
    
    // Determine tier
    let tier, label, icon;
    if (score >= 80) {
        tier = 'excellent';
        label = 'Excellent Deal';
        icon = '🔥';
    } else if (score >= 65) {
        tier = 'good';
        label = 'Good Deal';
        icon = '✅';
    } else if (score >= 50) {
        tier = 'fair';
        label = 'Fair Price';
        icon = '👍';
    } else {
        tier = 'poor';
        label = 'Not a Deal';
        icon = '❌';
    }
    
    return {
        score: score,
        tier: tier,
        label: label,
        icon: icon,
        insights: insights
    };
}

// Toggle watching software
function toggleWatch(softwareId, softwareName) {
    const isCurrentlyWatched = watchedSoftware.some(w => w.software_id === softwareId);
    
    if (isCurrentlyWatched) {
        // Remove from watchlist
        watchedSoftware = watchedSoftware.filter(w => w.software_id !== softwareId);
        showNotification(`Stopped watching ${softwareName}`, 'info');
    } else {
        // Add to watchlist
        const userEmail = prompt('Enter your email for price alerts:', '');
        if (userEmail && isValidEmail(userEmail)) {
            watchedSoftware.push({
                id: `watch_${Date.now()}`,
                software_id: softwareId,
                software_name: softwareName,
                user_email: userEmail,
                threshold: 15, // 15% price drop threshold
                created_at: new Date().toISOString()
            });
            showNotification(`Now watching ${softwareName} for price drops!`, 'success');
        } else if (userEmail !== null) {
            showNotification('Please enter a valid email address', 'error');
            return;
        } else {
            return; // User cancelled
        }
    }
    
    // Save and refresh
    localStorage.setItem('watchedSoftware', JSON.stringify(watchedSoftware));
    refreshDealCards();
}

// Show price history modal
function showPriceHistory(softwareId) {
    if (!dealTracker) return;
    
    const priceHistory = dealTracker.getPriceHistory(softwareId, 90);
    const config = dealTracker.trackingTargets[softwareId];
    
    if (!priceHistory || priceHistory.length === 0) {
        showNotification('Price history not available yet', 'info');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'price-history-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📈 ${config.name} - Price History</h3>
                <button class="close-modal" onclick="this.closest('.price-history-modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="price-chart-container">
                    <canvas id="price-chart" width="400" height="200"></canvas>
                </div>
                <div class="price-stats">
                    <div class="stat">
                        <span class="label">Current:</span>
                        <span class="value">$${priceHistory[priceHistory.length - 1]?.price || 'N/A'}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Lowest (90d):</span>
                        <span class="value">$${Math.min(...priceHistory.map(p => p.price))}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Highest (90d):</span>
                        <span class="value">$${Math.max(...priceHistory.map(p => p.price))}</span>
                    </div>
                </div>
                <div class="price-recommendations">
                    ${generatePriceRecommendations(priceHistory)}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Draw simple price chart (could be enhanced with Chart.js)
    drawSimplePriceChart('price-chart', priceHistory);
}

// Enhanced event listeners
function setupEventListeners() {
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleFilterChange(e.target.dataset.filter);
        });
    });

    // Sort dropdown
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            handleSortChange(e.target.value);
        });
    }

    // Load more button
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreDeals);
    }

    // Newsletter signup with deal alerts
    const newsletterBtn = document.querySelector('.newsletter-btn');
    const newsletterInput = document.querySelector('.newsletter-input');
    
    if (newsletterBtn && newsletterInput) {
        newsletterBtn.addEventListener('click', () => {
            const email = newsletterInput.value;
            if (email && isValidEmail(email)) {
                subscribeToDealsNewsletter(email);
                newsletterInput.value = '';
            } else {
                showNotification('Please enter a valid email address', 'error');
            }
        });
    }
}

// Enhanced sort handling for deal intelligence
function handleSortChange(sortType) {
    currentSort = sortType;
    
    switch (sortType) {
        case 'price-drops':
            currentDeals.sort((a, b) => {
                const aDrops = a.priceDrops.length > 0 ? a.priceDrops[0].percentage : 0;
                const bDrops = b.priceDrops.length > 0 ? b.priceDrops[0].percentage : 0;
                return bDrops - aDrops;
            });
            break;
        case 'best-deals':
            currentDeals.sort((a, b) => b.dealQuality.score - a.dealQuality.score);
            break;
        case 'most-watched':
            currentDeals.sort((a, b) => (b.watchCount || 0) - (a.watchCount || 0));
            break;
        case 'ending-soon':
            currentDeals.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
            break;
        default:
            currentDeals.sort((a, b) => new Date(b.fetchedAt) - new Date(a.fetchedAt));
    }
    
    displayDeals();
}

// Update all software deals (periodic refresh)
async function updateAllSoftwareDeals() {
    if (!dealTracker) return;
    
    try {
        console.log('🔄 Updating all software deals...');
        updateLastTrackTime('Checking...');
        
        const results = await dealTracker.trackAllSoftwareDeals();
        
        // Process new price drops for alerts
        if (results.priceDrops && results.priceDrops.length > 0) {
            await processNewPriceDrops(results.priceDrops);
        }
        
        // Refresh deal display
        currentDeals = await convertTrackingResultsToDeals(results);
        displayDeals();
        
        updateLastTrackTime('Just now');
        console.log(`✅ Updated: ${results.updated.length} changes, ${results.priceDrops.length} price drops`);
        
    } catch (error) {
        console.error('❌ Error updating deals:', error);
        updateLastTrackTime('Error - will retry');
    }
}

// Utility functions
function updateLastTrackTime(timeText) {
    const timeSpan = document.getElementById('last-track-time');
    if (timeSpan) {
        timeSpan.textContent = timeText;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-text">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function refreshDealCards() {
    displayedDealsCount = 6;
    displayDeals();
}

// Display deals with intelligent features
function displayDeals() {
    const dealsToShow = currentDeals.slice(0, displayedDealsCount);
    
    if (!dealsContainer) return;
    
    dealsContainer.innerHTML = '';
    
    if (dealsToShow.length === 0) {
        dealsContainer.innerHTML = `
            <div class="no-deals-message">
                <h3>No deals found</h3>
                <p>We're still tracking software prices. Check back soon for live deals!</p>
            </div>
        `;
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }
    
    dealsToShow.forEach(deal => {
        const dealCard = createIntelligentDealCard(deal);
        dealsContainer.appendChild(dealCard);
    });
    
    // Show/hide load more button
    if (loadMoreBtn) {
        if (displayedDealsCount >= currentDeals.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }
    
    updateTotalDealsCount();
}

// Start real-time tracking
function startRealTimeTracking() {
    // Initial load
    updateLastTrackTime('Starting...');
    
    // Set up periodic updates every 6 hours for price tracking
    setInterval(updateAllSoftwareDeals, 6 * 60 * 60 * 1000);
    
    // Set up more frequent checks for high-priority deals every hour
    setInterval(checkHighPriorityDeals, 60 * 60 * 1000);
}

// Fallback deals if tracking system fails
function loadFallbackDeals() {
    currentDeals = [
        {
            id: 'fallback-adobe',
            title: 'Adobe Creative Cloud',
            description: 'Professional creative tools for design, photography, and video editing.',
            type: 'discount',
            currentPrice: 54.99,
            originalPrice: 79.99,
            discount: 31,
            category: 'design',
            image: '🎨',
            source: 'Adobe',
            dealQuality: { score: 75, tier: 'good', label: 'Good Deal', icon: '✅', insights: [] },
            watchCount: 45,
            priceDrops: [],
            isWatched: false
        }
    ];
    
    updateDisplays();
}

function updateDisplays() {
    displayDeals();
    updateLastTrackTime('Data loaded');
}

// Export functions for console access and testing
window.dealTracker = dealTracker;
window.showPriceHistory = showPriceHistory;
window.toggleWatch = toggleWatch;
window.updateAllSoftwareDeals = updateAllSoftwareDeals;

// Helper functions (implement these based on your needs)
function formatPlanName(planKey) { return planKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
function generateDealDescription(config, planKey, dealQuality) { return `${config.name} ${formatPlanName(planKey)} - ${dealQuality.insights[0]?.message || 'Professional software tool'}`; }
function determineDealType(discount, promotions) { return discount > 30 ? 'lifetime' : promotions?.length > 0 ? 'flash' : 'discount'; }
function getCategoryEmoji(category) { const emojis = { design: '🎨', productivity: '📋', development: '💻', business: '💼', security: '🛡️' }; return emojis[category] || '⚡'; }
function generateAffiliateLink(url, name) { return url; } // Implement affiliate link generation
function estimateEndDate(promotions) { return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; }
function generateSoftwareRating(name) { return (4.0 + Math.random()).toFixed(1); }
function extractKeyFeatures(config, planKey) { return ['Professional Tools', 'Cloud Storage', 'Premium Support']; }
function getWatchCount(softwareId) { return watchedSoftware.filter(w => w.software_id === softwareId).length; }
function findRecentPriceDrops(softwareId) { return []; } // Implement price drop detection
function getCompetitivePosition(softwareId, category) { return Promise.resolve({ position: 'competitive' }); }
function isUserWatching(softwareId) { return watchedSoftware.some(w => w.software_id === softwareId); }
function trackDealClick(dealId, softwareId, price) { console.log(`🎯 Deal clicked: ${dealId}`); }
function getDaysUntilExpiration(endDate) { return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)); }
function updateTotalDealsCount() { if (totalDealsSpan) totalDealsSpan.textContent = currentDeals.length; }
function loadMoreDeals() { displayedDealsCount += 6; displayDeals(); }
function handleFilterChange(filter) { currentFilter = filter; displayDeals(); }
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function subscribeToDealsNewsletter(email) { showNotification('Thanks! You\'ll receive deal alerts soon.', 'success'); }