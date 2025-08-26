// Updated script.js - Phase 2: Automated Deal Integration
// Combines manual deals with automated deal fetching

// Import automated deal fetcher (will be loaded separately)
let dealFetcher = null;

// Enhanced deals data structure with automated and manual deals
let dealsData = [];
let manualDeals = [
    // Keep some manual deals as examples/backup
    {
        id: 'manual-1',
        title: "Notion Pro - Lifetime Deal",
        description: "All-in-one workspace for notes, tasks, wikis, and databases. Perfect for teams and personal productivity.",
        type: "lifetime",
        currentPrice: 49,
        originalPrice: 240,
        discount: 80,
        category: "productivity",
        image: "📝",
        endDate: "2025-09-15",
        affiliateLink: "#notion-deal",
        sourceUrl: "#notion-source",
        source: "Manual Entry",
        sourceKey: "manual",
        rating: 4.8,
        features: ["Unlimited blocks", "Team collaboration", "API access"],
        fetchedAt: new Date().toISOString(),
        isActive: true
    }
];

// Global variables for filtering and pagination
let currentDeals = [];
let displayedDealsCount = 6;
let currentFilter = 'all';
let currentSort = 'newest';
let isAutomatedMode = true;
let lastAutoFetch = null;
let autoFetchInterval = 3600000; // 1 hour

// DOM Elements
const dealsContainer = document.getElementById('deals-container');
const loadMoreBtn = document.getElementById('load-more');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-deals');
const totalDealsSpan = document.getElementById('total-deals');

// New elements for automation controls
let automationToggle = null;
let lastUpdateSpan = null;
let refreshButton = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    createAutomationControls();
    initializeAutomation();
});

// Initialize application with enhanced features
async function initializeApp() {
    console.log('🚀 DealTracker Pro Phase 2 initialized');
    
    // Load deal fetcher if available
    if (typeof DealFetcher !== 'undefined') {
        dealFetcher = new DealFetcher();
        console.log('✅ Automated deal fetching enabled');
    } else {
        console.log('⚠️ Automated deal fetching not available - using manual deals');
        isAutomatedMode = false;
    }
    
    // Start with manual deals
    dealsData = [...manualDeals];
    
    // Try to fetch automated deals
    if (isAutomatedMode) {
        await loadAutomatedDeals();
    }
    
    updateTotalDealsCount();
    applyFiltersAndSort();
    displayDeals();
}

// Create automation control elements
function createAutomationControls() {
    const filterBar = document.querySelector('.filter-bar .container');
    
    // Create automation status bar
    const automationBar = document.createElement('div');
    automationBar.className = 'automation-bar';
    automationBar.innerHTML = `
        <div class="automation-status">
            <span class="status-indicator ${isAutomatedMode ? 'active' : 'inactive'}"></span>
            <span class="status-text">Automation: ${isAutomatedMode ? 'Active' : 'Manual'}</span>
            <span class="last-update">Last update: <span id="last-update-time">Never</span></span>
            <button class="refresh-btn" id="refresh-deals">🔄 Refresh Deals</button>
        </div>
    `;
    
    filterBar.appendChild(automationBar);
    
    // Get references to new elements
    lastUpdateSpan = document.getElementById('last-update-time');
    refreshButton = document.getElementById('refresh-deals');
    
    // Add refresh button event listener
    refreshButton.addEventListener('click', handleManualRefresh);
}

// Handle manual refresh of deals
async function handleManualRefresh() {
    if (!isAutomatedMode) {
        alert('Automated deal fetching is not available. Check browser console for details.');
        return;
    }
    
    refreshButton.textContent = '🔄 Refreshing...';
    refreshButton.disabled = true;
    
    try {
        await loadAutomatedDeals(true); // Force refresh
        alert('Deals refreshed successfully!');
    } catch (error) {
        console.error('Manual refresh failed:', error);
        alert('Failed to refresh deals. Please try again later.');
    } finally {
        refreshButton.textContent = '🔄 Refresh Deals';
        refreshButton.disabled = false;
    }
}

// Load automated deals
async function loadAutomatedDeals(forceRefresh = false) {
    if (!dealFetcher) {
        console.log('❌ Deal fetcher not available');
        return;
    }
    
    // Check if we should skip fetching (unless forced)
    if (!forceRefresh && lastAutoFetch) {
        const timeSinceLastFetch = Date.now() - lastAutoFetch;
        if (timeSinceLastFetch < autoFetchInterval) {
            console.log(`⏭️ Skipping auto-fetch - last fetch was ${Math.round(timeSinceLastFetch / 60000)} minutes ago`);
            return;
        }
    }
    
    try {
        console.log('🔄 Fetching automated deals...');
        
        // Show loading state
        if (lastUpdateSpan) {
            lastUpdateSpan.textContent = 'Updating...';
        }
        
        // Fetch deals from all sources
        const automatedDeals = await dealFetcher.fetchAllDeals();
        
        if (automatedDeals && automatedDeals.length > 0) {
            // Combine manual and automated deals
            dealsData = [...manualDeals, ...automatedDeals];
            
            console.log(`✅ Loaded ${automatedDeals.length} automated deals`);
            
            // Update last fetch timestamp
            lastAutoFetch = Date.now();
            updateLastUpdateTime();
            
            // Update display
            updateTotalDealsCount();
            applyFiltersAndSort();
            displayDeals();
            
            // Track successful fetch for analytics
            trackDealFetch(automatedDeals.length);
            
        } else {
            console.log('⚠️ No automated deals found - using manual deals');
        }
        
    } catch (error) {
        console.error('❌ Error loading automated deals:', error);
        
        // Fall back to manual deals
        dealsData = [...manualDeals];
        updateTotalDealsCount();
        applyFiltersAndSort();
        displayDeals();
        
        // Show error message to user
        showErrorMessage('Unable to fetch latest deals. Showing cached results.');
    }
}

// Update last update time display
function updateLastUpdateTime() {
    if (!lastUpdateSpan || !lastAutoFetch) return;
    
    const updateTime = new Date(lastAutoFetch);
    const now = new Date();
    const diffMinutes = Math.round((now - updateTime) / 60000);
    
    if (diffMinutes < 1) {
        lastUpdateSpan.textContent = 'Just now';
    } else if (diffMinutes < 60) {
        lastUpdateSpan.textContent = `${diffMinutes} minutes ago`;
    } else {
        const diffHours = Math.round(diffMinutes / 60);
        lastUpdateSpan.textContent = `${diffHours} hours ago`;
    }
}

// Initialize automation with periodic updates
function initializeAutomation() {
    // Set up periodic automatic updates every hour
    setInterval(async () => {
        if (isAutomatedMode) {
            console.log('🔄 Automatic deal refresh...');
            await loadAutomatedDeals();
        }
    }, autoFetchInterval);
    
    // Update time display every minute
    setInterval(updateLastUpdateTime, 60000);
}

// Enhanced setup event listeners
function setupEventListeners() {
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleFilterChange(e.target.dataset.filter);
        });
    });

    // Sort dropdown
    sortSelect.addEventListener('change', (e) => {
        handleSortChange(e.target.value);
    });

    // Load more button
    loadMoreBtn.addEventListener('click', loadMoreDeals);

    // Newsletter signup
    const newsletterBtn = document.querySelector('.newsletter-btn');
    const newsletterInput = document.querySelector('.newsletter-input');
    
    if (newsletterBtn && newsletterInput) {
        newsletterBtn.addEventListener('click', () => {
            const email = newsletterInput.value;
            if (email && isValidEmail(email)) {
                alert('Thanks for subscribing! You\'ll receive deal alerts soon.');
                newsletterInput.value = '';
                trackNewsletterSignup(email);
            } else {
                alert('Please enter a valid email address.');
            }
        });
    }
}

// Enhanced deal display with source attribution
function createDealCard(deal) {
    const card = document.createElement('div');
    card.className = 'deal-card';
    card.dataset.dealId = deal.id;
    card.dataset.source = deal.source || 'Manual';
    
    const daysLeft = getDaysUntilExpiration(deal.endDate);
    const badgeClass = `badge-${deal.type}`;
    const badgeText = deal.type.charAt(0).toUpperCase() + deal.type.slice(1);
    
    // Enhanced card with source attribution and improved tracking
    card.innerHTML = `
        <div class="deal-badge ${badgeClass}">${badgeText}</div>
        <div class="deal-source-badge">${deal.source}</div>
        <div class="deal-image">${deal.image}</div>
        <div class="deal-content">
            <h4 class="deal-title">${deal.title}</h4>
            <p class="deal-description">${deal.description}</p>
            <div class="deal-pricing">
                <span class="deal-price-current">$${deal.currentPrice}</span>
                <span class="deal-price-original">$${deal.originalPrice}</span>
                <span class="deal-discount">${deal.discount}% OFF</span>
            </div>
            <div class="deal-meta">
                <span class="deal-rating">⭐ ${deal.rating}</span>
                <span class="deal-timer">${daysLeft} days left</span>
            </div>
            <a href="${deal.affiliateLink || deal.sourceUrl}" 
               class="deal-cta" 
               target="_blank"
               onclick="trackClick('${deal.id}', '${deal.source}', ${deal.currentPrice})"
               rel="noopener">
                Get This Deal →
            </a>
        </div>
    `;
    
    return card;
}

// Enhanced click tracking with source attribution
function trackClick(dealId, source, price) {
    console.log(`🎯 Deal clicked: ${dealId} from ${source} - $${price}`);
    
    // Enhanced analytics data
    const clickData = {
        dealId: dealId,
        source: source,
        price: price,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
    };
    
    // Store click data for analytics
    const clicks = JSON.parse(localStorage.getItem('dealClicks') || '[]');
    clicks.push(clickData);
    
    // Keep only last 100 clicks to prevent storage bloat
    if (clicks.length > 100) {
        clicks.splice(0, clicks.length - 100);
    }
    
    localStorage.setItem('dealClicks', JSON.stringify(clicks));
    
    // In Phase 3, this will send data to analytics service
    console.log('📊 Click tracked:', clickData);
}

// Track deal fetch success for monitoring
function trackDealFetch(dealCount) {
    const fetchData = {
        count: dealCount,
        timestamp: new Date().toISOString(),
        sources: [...new Set(dealsData.map(deal => deal.source))]
    };
    
    console.log('📈 Deal fetch tracked:', fetchData);
    
    // Store fetch history
    const fetches = JSON.parse(localStorage.getItem('dealFetches') || '[]');
    fetches.push(fetchData);
    
    // Keep only last 24 fetches (1 day of hourly fetches)
    if (fetches.length > 24) {
        fetches.splice(0, fetches.length - 24);
    }
    
    localStorage.setItem('dealFetches', JSON.stringify(fetches));
}

// Track newsletter signups
function trackNewsletterSignup(email) {
    const signupData = {
        email: email,
        timestamp: new Date().toISOString(),
        source: 'main-site'
    };
    
    console.log('📧 Newsletter signup tracked:', signupData);
    
    // In Phase 3, this will integrate with email service
}

// Show error messages to users
function showErrorMessage(message) {
    // Create error banner if it doesn't exist
    let errorBanner = document.getElementById('error-banner');
    
    if (!errorBanner) {
        errorBanner = document.createElement('div');
        errorBanner.id = 'error-banner';
        errorBanner.className = 'error-banner';
        
        const header = document.querySelector('.header');
        header.insertAdjacentElement('afterend', errorBanner);
    }
    
    errorBanner.innerHTML = `
        <div class="container">
            <span class="error-text">⚠️ ${message}</span>
            <button class="error-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
        </div>
    `;
    
    errorBanner.style.display = 'block';
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        errorBanner.style.display = 'none';
    }, 10000);
}

// Enhanced utility functions (keeping existing functionality)
function handleFilterChange(filter) {
    currentFilter = filter;
    displayedDealsCount = 6; // Reset pagination
    
    // Update active filter button
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    // Apply filter and redisplay
    applyFiltersAndSort();
    displayDeals();
}

function handleSortChange(sortType) {
    currentSort = sortType;
    applyFiltersAndSort();
    displayDeals();
}

function applyFiltersAndSort() {
    // Start with all deals
    let filteredDeals = [...dealsData];
    
    // Apply type filter
    if (currentFilter !== 'all') {
        filteredDeals = filteredDeals.filter(deal => deal.type === currentFilter);
    }
    
    // Apply sorting
    switch (currentSort) {
        case 'newest':
            filteredDeals.sort((a, b) => new Date(b.fetchedAt) - new Date(a.fetchedAt));
            break;
        case 'ending-soon':
            filteredDeals.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
            break;
        case 'best-value':
            filteredDeals.sort((a, b) => b.discount - a.discount);
            break;
    }
    
    currentDeals = filteredDeals;
}

function displayDeals() {
    const dealsToShow = currentDeals.slice(0, displayedDealsCount);
    
    dealsContainer.innerHTML = '';
    
    if (dealsToShow.length === 0) {
        dealsContainer.innerHTML = `
            <div class="no-deals-message">
                <h3>No deals found</h3>
                <p>Try adjusting your filters or check back later for new deals.</p>
            </div>
        `;
        loadMoreBtn.style.display = 'none';
        return;
    }
    
    dealsToShow.forEach(deal => {
        const dealCard = createDealCard(deal);
        dealsContainer.appendChild(dealCard);
    });
    
    // Show/hide load more button
    if (displayedDealsCount >= currentDeals.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
}

function loadMoreDeals() {
    displayedDealsCount += 6;
    displayDeals();
}

function getDaysUntilExpiration(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    const timeDiff = end.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(0, daysDiff);
}

function updateTotalDealsCount() {
    if (totalDealsSpan) {
        totalDealsSpan.textContent = dealsData.length;
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Enhanced utility functions for manual deal management
function addDeal(dealData) {
    const newDeal = {
        id: `manual-${Date.now()}`,
        source: 'Manual Entry',
        sourceKey: 'manual',
        fetchedAt: new Date().toISOString(),
        isActive: true,
        ...dealData
    };
    
    dealsData.unshift(newDeal); // Add to beginning
    manualDeals.unshift(newDeal); // Also add to manual deals backup
    
    updateTotalDealsCount();
    applyFiltersAndSort();
    displayDeals();
    
    console.log('✅ New manual deal added:', newDeal);
    return newDeal;
}

function removeExpiredDeals() {
    const today = new Date();
    const activeDealsBefore = dealsData.length;
    
    // Remove deals where end date has passed
    dealsData = dealsData.filter(deal => {
        const endDate = new Date(deal.endDate);
        return endDate > today;
    });
    
    // Also clean manual deals
    manualDeals = manualDeals.filter(deal => {
        const endDate = new Date(deal.endDate);
        return endDate > today;
    });
    
    const removedCount = activeDealsBefore - dealsData.length;
    
    if (removedCount > 0) {
        console.log(`🧹 Removed ${removedCount} expired deals`);
        updateTotalDealsCount();
        applyFiltersAndSort();
        displayDeals();
    }
    
    return removedCount;
}

// Analytics and reporting functions
function getDealAnalytics() {
    const clicks = JSON.parse(localStorage.getItem('dealClicks') || '[]');
    const fetches = JSON.parse(localStorage.getItem('dealFetches') || '[]');
    
    return {
        totalDeals: dealsData.length,
        automatedDeals: dealsData.filter(deal => deal.source !== 'Manual Entry').length,
        manualDeals: dealsData.filter(deal => deal.source === 'Manual Entry').length,
        totalClicks: clicks.length,
        averageDiscount: Math.round(dealsData.reduce((sum, deal) => sum + deal.discount, 0) / dealsData.length),
        topSources: [...new Set(dealsData.map(deal => deal.source))],
        recentFetches: fetches.slice(-5),
        recentClicks: clicks.slice(-10)
    };
}

// Initialize periodic cleanup (runs every hour)
setInterval(removeExpiredDeals, 3600000);

// Export functions for console testing and automation
window.dealTracker = {
    // Original functions
    addDeal,
    removeExpiredDeals,
    currentDeals: () => currentDeals,
    allDeals: () => dealsData,
    
    // New automation functions
    loadAutomatedDeals,
    getDealAnalytics,
    refreshDeals: () => loadAutomatedDeals(true),
    toggleAutomation: () => {
        isAutomatedMode = !isAutomatedMode;
        console.log(`Automation ${isAutomatedMode ? 'enabled' : 'disabled'}`);
    },
    
    // Debug functions
    testDealFetcher: () => dealFetcher,
    getClickData: () => JSON.parse(localStorage.getItem('dealClicks') || '[]'),
    getFetchData: () => JSON.parse(localStorage.getItem('dealFetches') || '[]'),
    clearAnalytics: () => {
        localStorage.removeItem('dealClicks');
        localStorage.removeItem('dealFetches');
        console.log('Analytics data cleared');
    }
};