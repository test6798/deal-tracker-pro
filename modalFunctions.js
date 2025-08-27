// modalFunctions.js - Complete modal system for deal intelligence
// Includes price charts, comparisons, alerts setup, and analytics

// Show price charts modal (called from main script)
function showPriceChartsModal() {
    const modal = document.createElement('div');
    modal.className = 'price-history-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📈 Software Price Trends</h3>
                <button class="close-modal" onclick="this.closest('.price-history-modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="software-selector">
                    <label for="software-select">Select Software:</label>
                    <select id="software-select" onchange="updatePriceChart(this.value)">
                        <option value="">Choose software to view price history...</option>
                        ${generateSoftwareOptions()}
                    </select>
                </div>
                <div id="chart-container" style="display: none;">
                    <div class="price-chart-container">
                        <canvas id="price-trend-chart" width="600" height="300"></canvas>
                    </div>
                    <div class="price-insights" id="price-insights"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Show comparison modal
function showComparisonModal() {
    const modal = document.createElement('div');
    modal.className = 'comparison-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>⚖️ Software Comparison Tool</h3>
                <button class="close-modal" onclick="this.closest('.comparison-modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="comparison-controls">
                    <label for="category-select">Compare by Category:</label>
                    <select id="category-select" onchange="loadCategoryComparison(this.value)">
                        <option value="">Select category...</option>
                        <option value="design">Design Software</option>
                        <option value="productivity">Productivity Tools</option>
                        <option value="development">Developer Tools</option>
                        <option value="business">Business Software</option>
                        <option value="security">Security & Privacy</option>
                    </select>
                </div>
                <div id="comparison-results" class="comparison-results">
                    <p>Select a category to compare software prices and features.</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Show alerts setup modal
function showAlertsModal() {
    const modal = document.createElement('div');
    modal.className = 'alerts-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🔔 Price Alert Settings</h3>
                <button class="close-modal" onclick="this.closest('.alerts-modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="alerts-setup">
                    <div class="section">
                        <h4>📧 Email Notifications</h4>
                        <div class="form-group">
                            <label for="alert-email">Email Address:</label>
                            <input type="email" id="alert-email" placeholder="your@email.com" 
                                   value="${getUserEmail()}">
                        </div>
                        <div class="form-group">
                            <label for="alert-threshold">Alert Threshold:</label>
                            <select id="alert-threshold">
                                <option value="10">10% price drop or more</option>
                                <option value="15" selected>15% price drop or more</option>
                                <option value="25">25% price drop or more</option>
                                <option value="50">50% price drop or more (rare deals only)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h4>👀 Your Watchlist</h4>
                        <div id="current-watchlist">
                            ${generateWatchlistHTML()}
                        </div>
                        <button class="btn-secondary" onclick="showAddToWatchlistForm()">
                            ➕ Add Software to Watchlist
                        </button>
                    </div>
                    
                    <div class="section">
                        <h4>📱 Notification Preferences</h4>
                        <div class="checkbox-group">
                            <label>
                                <input type="checkbox" id="browser-notifications" checked>
                                Browser notifications (instant)
                            </label>
                            <label>
                                <input type="checkbox" id="email-notifications" checked>
                                Email notifications (daily digest)
                            </label>
                            <label>
                                <input type="checkbox" id="weekend-notifications">
                                Include weekend alerts
                            </label>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-primary" onclick="saveAlertSettings()">
                            💾 Save Alert Settings
                        </button>
                        <button class="btn-secondary" onclick="testAlerts()">
                            🧪 Test Notifications
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Request notification permission if not already granted
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Show analytics modal
function showAnalyticsModal() {
    const analytics = calculateSiteAnalytics();
    
    const modal = document.createElement('div');
    modal.className = 'analytics-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📊 Deal Analytics Dashboard</h3>
                <button class="close-modal" onclick="this.closest('.analytics-modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <h4>🎯 Tracking Performance</h4>
                        <div class="metric">
                            <span class="metric-value">${analytics.totalSoftware}</span>
                            <span class="metric-label">Software Tracked</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${analytics.activeDealCount}</span>
                            <span class="metric-label">Active Deals</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${analytics.avgDiscount}%</span>
                            <span class="metric-label">Average Discount</span>
                        </div>
                    </div>
                    
                    <div class="analytics-card">
                        <h4>📈 Price Movements</h4>
                        <div class="metric">
                            <span class="metric-value">${analytics.priceDropsToday}</span>
                            <span class="metric-label">Price Drops Today</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${analytics.biggestDrop}%</span>
                            <span class="metric-label">Biggest Drop This Week</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${analytics.dealsEndingSoon}</span>
                            <span class="metric-label">Deals Ending Soon</span>
                        </div>
                    </div>
                    
                    <div class="analytics-card">
                        <h4>👥 User Engagement</h4>
                        <div class="metric">
                            <span class="metric-value">${analytics.totalWatchers}</span>
                            <span class="metric-label">Users Watching Deals</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${analytics.alertsSent}</span>
                            <span class="metric-label">Alerts Sent Today</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${analytics.clickThroughRate}%</span>
                            <span class="metric-label">Click-through Rate</span>
                        </div>
                    </div>
                    
                    <div class="analytics-card full-width">
                        <h4>🏆 Top Performing Categories</h4>
                        <div class="category-performance">
                            ${analytics.topCategories.map(cat => `
                                <div class="category-item">
                                    <span class="category-name">${cat.name}</span>
                                    <div class="category-bar">
                                        <div class="category-fill" style="width: ${cat.percentage}%"></div>
                                    </div>
                                    <span class="category-value">${cat.deals} deals</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="analytics-actions">
                    <button class="btn-secondary" onclick="exportAnalytics()">
                        📥 Export Data
                    </button>
                    <button class="btn-secondary" onclick="refreshAnalytics()">
                        🔄 Refresh
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Generate software options for price chart selector
function generateSoftwareOptions() {
    if (!dealTracker) return '<option>No software tracked yet</option>';
    
    return Object.entries(dealTracker.trackingTargets)
        .map(([id, config]) => `<option value="${id}">${config.name}</option>`)
        .join('');
}

// Update price chart based on selected software
function updatePriceChart(softwareId) {
    if (!softwareId || !dealTracker) return;
    
    const container = document.getElementById('chart-container');
    const insightsDiv = document.getElementById('price-insights');
    
    container.style.display = 'block';
    
    const priceHistory = dealTracker.getPriceHistory(softwareId, 90);
    const config = dealTracker.trackingTargets[softwareId];
    
    if (priceHistory.length > 0) {
        drawPriceChart('price-trend-chart', priceHistory, config.name);
        displayPriceInsights(insightsDiv, priceHistory, config);
    } else {
        container.innerHTML = '<p>No price history available for this software yet.</p>';
    }
}

// Draw simple price chart
function drawPriceChart(canvasId, priceHistory, softwareName) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    if (priceHistory.length < 2) {
        ctx.fillStyle = '#666666';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Insufficient data for chart', width/2, height/2);
        return;
    }
    
    // Calculate bounds
    const prices = priceHistory.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    
    const margin = 50;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    
    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();
    
    // Draw price line
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    priceHistory.forEach((point, index) => {
        const x = margin + (index / (priceHistory.length - 1)) * chartWidth;
        const y = height - margin - ((point.price - minPrice) / priceRange) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw data points
    ctx.fillStyle = '#667eea';
    priceHistory.forEach((point, index) => {
        const x = margin + (index / (priceHistory.length - 1)) * chartWidth;
        const y = height - margin - ((point.price - minPrice) / priceRange) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Draw price labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    
    // Y-axis labels (prices)
    for (let i = 0; i <= 4; i++) {
        const price = minPrice + (priceRange * i / 4);
        const y = height - margin - (i / 4) * chartHeight;
        ctx.fillText(`$${price.toFixed(2)}`, margin - 10, y + 4);
    }
    
    // Title
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${softwareName} - 90 Day Price History`, width/2, 30);
}

// Display price insights
function displayPriceInsights(container, priceHistory, config) {
    const currentPrice = priceHistory[priceHistory.length - 1]?.price || 0;
    const prices = priceHistory.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    const insights = [];
    
    if (currentPrice <= minPrice * 1.05) {
        insights.push({
            type: 'excellent',
            icon: '🔥',
            message: 'Current price is at or near historical low!'
        });
    } else if (currentPrice <= avgPrice) {
        insights.push({
            type: 'good',
            icon: '✅',
            message: 'Current price is below average'
        });
    } else {
        insights.push({
            type: 'info',
            icon: 'ℹ️',
            message: 'Consider waiting for a better deal'
        });
    }
    
    // Check for recent price drops
    if (priceHistory.length >= 7) {
        const weekAgo = priceHistory[priceHistory.length - 7]?.price;
        if (weekAgo && currentPrice < weekAgo * 0.9) {
            insights.push({
                type: 'trending',
                icon: '📉',
                message: 'Price has dropped recently'
            });
        }
    }
    
    container.innerHTML = `
        <div class="price-insights-content">
            <h4>💡 Price Intelligence</h4>
            ${insights.map(insight => `
                <div class="insight-item ${insight.type}">
                    <span class="insight-icon">${insight.icon}</span>
                    <span class="insight-message">${insight.message}</span>
                </div>
            `).join('')}
            <div class="price-stats-summary">
                <div class="stat-item">
                    <span class="stat-label">Current:</span>
                    <span class="stat-value">$${currentPrice.toFixed(2)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">90-day Low:</span>
                    <span class="stat-value">$${minPrice.toFixed(2)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">90-day High:</span>
                    <span class="stat-value">$${maxPrice.toFixed(2)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Average:</span>
                    <span class="stat-value">$${avgPrice.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `;
}

// Load category comparison
function loadCategoryComparison(category) {
    if (!category) return;
    
    const container = document.getElementById('comparison-results');
    
    // Get deals for this category
    const categoryDeals = currentDeals.filter(deal => deal.category === category);
    
    if (categoryDeals.length === 0) {
        container.innerHTML = '<p>No software found in this category.</p>';
        return;
    }
    
    // Sort by deal quality
    categoryDeals.sort((a, b) => b.dealQuality.score - a.dealQuality.score);
    
    container.innerHTML = `
        <div class="comparison-table">
            <div class="comparison-header">
                <h4>${category.charAt(0).toUpperCase() + category.slice(1)} Software Comparison</h4>
            </div>
            <div class="comparison-grid">
                <div class="comparison-row header">
                    <div class="col-software">Software</div>
                    <div class="col-price">Price</div>
                    <div class="col-discount">Discount</div>
                    <div class="col-quality">Deal Quality</div>
                    <div class="col-action">Action</div>
                </div>
                ${categoryDeals.map(deal => `
                    <div class="comparison-row">
                        <div class="col-software">
                            <div class="software-info">
                                <span class="software-name">${deal.title}</span>
                                <span class="company-name">${deal.source}</span>
                            </div>
                        </div>
                        <div class="col-price">
                            <span class="current-price">$${deal.currentPrice}</span>
                            ${deal.originalPrice > deal.currentPrice ? 
                                `<span class="original-price">$${deal.originalPrice}</span>` : ''}
                        </div>
                        <div class="col-discount">
                            ${deal.discount > 0 ? `${deal.discount}% OFF` : 'Regular price'}
                        </div>
                        <div class="col-quality">
                            <span class="quality-indicator quality-${deal.dealQuality.tier}">
                                ${deal.dealQuality.icon} ${deal.dealQuality.label}
                            </span>
                        </div>
                        <div class="col-action">
                            <a href="${deal.affiliateLink || deal.sourceUrl}" 
                               class="btn-small" target="_blank" rel="noopener">
                                View Deal
                            </a>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Helper functions
function getUserEmail() {
    // Try to get from localStorage or return empty
    const watchlist = JSON.parse(localStorage.getItem('watchedSoftware') || '[]');
    return watchlist.length > 0 ? watchlist[0].user_email : '';
}

function generateWatchlistHTML() {
    const watchlist = JSON.parse(localStorage.getItem('watchedSoftware') || '[]');
    
    if (watchlist.length === 0) {
        return '<p class="no-watchlist">No software in your watchlist yet.</p>';
    }
    
    return watchlist.map(item => `
        <div class="watchlist-item">
            <span class="software-name">${item.software_name}</span>
            <span class="threshold">${item.threshold}% threshold</span>
            <button class="remove-watch" onclick="removeFromWatchlist('${item.id}')">Remove</button>
        </div>
    `).join('');
}

function saveAlertSettings() {
    const email = document.getElementById('alert-email').value;
    const threshold = document.getElementById('alert-threshold').value;
    const browserNotifications = document.getElementById('browser-notifications').checked;
    const emailNotifications = document.getElementById('email-notifications').checked;
    
    if (!email || !isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    const settings = {
        email: email,
        threshold: parseInt(threshold),
        browserNotifications: browserNotifications,
        emailNotifications: emailNotifications,
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('alertSettings', JSON.stringify(settings));
    showNotification('Alert settings saved successfully!', 'success');
}

function testAlerts() {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🔔 Test Alert', {
            body: 'Your deal alerts are working! You\'ll receive notifications like this when prices drop.',
            icon: '/favicon.ico'
        });
        showNotification('Test notification sent!', 'success');
    } else {
        showNotification('Please enable browser notifications to test alerts', 'info');
    }
}

function removeFromWatchlist(itemId) {
    let watchlist = JSON.parse(localStorage.getItem('watchedSoftware') || '[]');
    watchlist = watchlist.filter(item => item.id !== itemId);
    localStorage.setItem('watchedSoftware', JSON.stringify(watchlist));
    
    // Refresh the watchlist display
    document.getElementById('current-watchlist').innerHTML = generateWatchlistHTML();
    showNotification('Removed from watchlist', 'info');
}

function calculateSiteAnalytics() {
    // Calculate analytics based on current data
    const totalSoftware = dealTracker ? Object.keys(dealTracker.trackingTargets).length : 0;
    const activeDealCount = currentDeals.length;
    const avgDiscount = currentDeals.length > 0 ? 
        Math.round(currentDeals.reduce((sum, deal) => sum + deal.discount, 0) / currentDeals.length) : 0;
    
    // Group by category
    const categoryCount = {};
    currentDeals.forEach(deal => {
        categoryCount[deal.category] = (categoryCount[deal.category] || 0) + 1;
    });
    
    const topCategories = Object.entries(categoryCount)
        .map(([name, count]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            deals: count,
            percentage: (count / activeDealCount) * 100
        }))
        .sort((a, b) => b.deals - a.deals);
    
    return {
        totalSoftware: totalSoftware,
        activeDealCount: activeDealCount,
        avgDiscount: avgDiscount,
        priceDropsToday: Math.floor(Math.random() * 5) + 1, // Mock data
        biggestDrop: Math.max(...currentDeals.map(d => d.discount)),
        dealsEndingSoon: currentDeals.filter(d => getDaysUntilExpiration(d.endDate) <= 7).length,
        totalWatchers: JSON.parse(localStorage.getItem('watchedSoftware') || '[]').length,
        alertsSent: Math.floor(Math.random() * 20), // Mock data
        clickThroughRate: (Math.random() * 10 + 5).toFixed(1), // Mock data
        topCategories: topCategories
    };
}

function exportAnalytics() {
    const analytics = calculateSiteAnalytics();
    const data = JSON.stringify(analytics, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `deal-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('Analytics exported successfully!', 'success');
}

function refreshAnalytics() {
    // Close current modal and reopen with fresh data
    document.querySelector('.analytics-modal')?.remove();
    showAnalyticsModal();
}

// Make functions available globally
window.showPriceChartsModal = showPriceChartsModal;
window.showComparisonModal = showComparisonModal;
window.showAlertsModal = showAlertsModal;
window.showAnalyticsModal = showAnalyticsModal;
window.updatePriceChart = updatePriceChart;
window.loadCategoryComparison = loadCategoryComparison;
window.saveAlertSettings = saveAlertSettings;
window.testAlerts = testAlerts;
window.removeFromWatchlist = removeFromWatchlist;
window.exportAnalytics = exportAnalytics;
window.refreshAnalytics = refreshAnalytics;