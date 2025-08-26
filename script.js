// Sample Deals Data - This will be replaced by automated scraping in later phases
const dealsData = [
    {
        id: 1,
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
        rating: 4.8,
        features: ["Unlimited blocks", "Team collaboration", "API access"]
    },
    {
        id: 2,
        title: "Adobe Creative Suite Flash Sale",
        description: "Complete creative toolkit including Photoshop, Illustrator, Premiere Pro and more.",
        type: "flash",
        currentPrice: 29.99,
        originalPrice: 52.99,
        discount: 43,
        category: "design",
        image: "🎨",
        endDate: "2025-08-30",
        affiliateLink: "#adobe-deal",
        rating: 4.9,
        features: ["20+ Creative Apps", "Cloud Storage", "Mobile Apps"]
    },
    {
        id: 3,
        title: "Zapier Professional",
        description: "Automate workflows between your favorite apps. Connect 5000+ apps with no-code automation.",
        type: "discount",
        currentPrice: 19,
        originalPrice: 49,
        discount: 61,
        category: "business",
        image: "⚡",
        endDate: "2025-09-01",
        affiliateLink: "#zapier-deal",
        rating: 4.7,
        features: ["Multi-step Zaps", "Premium apps", "Priority support"]
    },
    {
        id: 4,
        title: "Visual Studio Code Pro",
        description: "Advanced code editor with AI-powered features, debugging tools, and team collaboration.",
        type: "lifetime",
        currentPrice: 79,
        originalPrice: 299,
        discount: 74,
        category: "developer",
        image: "💻",
        endDate: "2025-09-10",
        affiliateLink: "#vscode-deal",
        rating: 4.9,
        features: ["AI Code Assistant", "Advanced Debugging", "Team Features"]
    },
    {
        id: 5,
        title: "Canva Pro Annual",
        description: "Design anything with premium templates, stock photos, and team collaboration features.",
        type: "discount",
        currentPrice: 89,
        originalPrice: 119,
        discount: 25,
        category: "design",
        image: "🖼️",
        endDate: "2025-09-05",
        affiliateLink: "#canva-deal",
        rating: 4.6,
        features: ["100M+ stock photos", "Background remover", "Brand kit"]
    },
    {
        id: 6,
        title: "Monday.com Lifetime",
        description: "Project management and team collaboration platform. Organize work and increase productivity.",
        type: "lifetime",
        currentPrice: 149,
        originalPrice: 480,
        discount: 69,
        category: "business",
        image: "📊",
        endDate: "2025-09-20",
        affiliateLink: "#monday-deal",
        rating: 4.5,
        features: ["Unlimited boards", "Advanced reporting", "Integrations"]
    },
    {
        id: 7,
        title: "Grammarly Premium Flash",
        description: "Advanced writing assistant with plagiarism checker, tone detection, and style suggestions.",
        type: "flash",
        currentPrice: 8.33,
        originalPrice: 30,
        discount: 72,
        category: "productivity",
        image: "✍️",
        endDate: "2025-08-28",
        affiliateLink: "#grammarly-deal",
        rating: 4.8,
        features: ["Plagiarism checker", "Tone detector", "Style guide"]
    },
    {
        id: 8,
        title: "Figma Professional",
        description: "Collaborative interface design tool with real-time editing, prototyping, and developer handoff.",
        type: "discount",
        currentPrice: 12,
        originalPrice: 15,
        discount: 20,
        category: "design",
        image: "🎯",
        endDate: "2025-09-12",
        affiliateLink: "#figma-deal",
        rating: 4.7,
        features: ["Unlimited projects", "Version history", "Advanced prototyping"]
    }
];

// Global variables for filtering and pagination
let currentDeals = [...dealsData];
let displayedDealsCount = 6;
let currentFilter = 'all';
let currentSort = 'newest';

// DOM Elements
const dealsContainer = document.getElementById('deals-container');
const loadMoreBtn = document.getElementById('load-more');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-deals');
const totalDealsSpan = document.getElementById('total-deals');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateTotalDealsCount();
    displayDeals();
});

// Initialize application
function initializeApp() {
    console.log('DealTracker Pro initialized');
    console.log(`Loaded ${dealsData.length} deals`);
}

// Setup all event listeners
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

    // Newsletter signup (placeholder)
    const newsletterBtn = document.querySelector('.newsletter-btn');
    const newsletterInput = document.querySelector('.newsletter-input');
    
    newsletterBtn.addEventListener('click', () => {
        const email = newsletterInput.value;
        if (email && isValidEmail(email)) {
            alert('Thanks for subscribing! You\'ll receive deal alerts soon.');
            newsletterInput.value = '';
        } else {
            alert('Please enter a valid email address.');
        }
    });
}

// Handle filter changes
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

// Handle sort changes
function handleSortChange(sortType) {
    currentSort = sortType;
    applyFiltersAndSort();
    displayDeals();
}

// Apply current filters and sorting
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
            filteredDeals.sort((a, b) => b.id - a.id);
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

// Display deals in the grid
function displayDeals() {
    const dealsToShow = currentDeals.slice(0, displayedDealsCount);
    
    dealsContainer.innerHTML = '';
    
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

// Create individual deal card
function createDealCard(deal) {
    const card = document.createElement('div');
    card.className = 'deal-card';
    card.dataset.dealId = deal.id;
    
    const daysLeft = getDaysUntilExpiration(deal.endDate);
    const badgeClass = `badge-${deal.type}`;
    const badgeText = deal.type.charAt(0).toUpperCase() + deal.type.slice(1);
    
    card.innerHTML = `
        <div class="deal-badge ${badgeClass}">${badgeText}</div>
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
            <a href="${deal.affiliateLink}" class="deal-cta" onclick="trackClick(${deal.id})">
                Get This Deal →
            </a>
        </div>
    `;
    
    return card;
}

// Load more deals
function loadMoreDeals() {
    displayedDealsCount += 6;
    displayDeals();
}

// Calculate days until expiration
function getDaysUntilExpiration(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    const timeDiff = end.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(0, daysDiff);
}

// Update total deals count
function updateTotalDealsCount() {
    if (totalDealsSpan) {
        totalDealsSpan.textContent = dealsData.length;
    }
}

// Track deal clicks for analytics (placeholder for future implementation)
function trackClick(dealId) {
    console.log(`Deal clicked: ${dealId}`);
    
    // In Phase 3, this will track:
    // - Click-through rates
    // - Popular deals
    // - Revenue attribution
    // - A/B testing results
    
    // For now, just log the click
    const deal = dealsData.find(d => d.id === dealId);
    if (deal) {
        console.log(`Tracking: ${deal.title} - $${deal.currentPrice}`);
    }
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Utility function to add new deal (for manual entry in Phase 1)
function addDeal(dealData) {
    const newDeal = {
        id: Math.max(...dealsData.map(d => d.id)) + 1,
        ...dealData
    };
    
    dealsData.unshift(newDeal); // Add to beginning
    updateTotalDealsCount();
    applyFiltersAndSort();
    displayDeals();
    
    console.log('New deal added:', newDeal);
    return newDeal;
}

// Utility function to remove expired deals
function removeExpiredDeals() {
    const today = new Date();
    const activeDealsBefore = dealsData.length;
    
    // Remove deals where end date has passed
    const activeDeals = dealsData.filter(deal => {
        return new Date(deal.endDate) > today;
    });
    
    const removedCount = activeDealsBefore - activeDeals.length;
    
    if (removedCount > 0) {
        // Update the dealsData array
        dealsData.length = 0;
        dealsData.push(...activeDeals);
        
        console.log(`Removed ${removedCount} expired deals`);
        updateTotalDealsCount();
        applyFiltersAndSort();
        displayDeals();
    }
    
    return removedCount;
}

// Function to manually add a deal (for testing)
function testAddDeal() {
    const sampleDeal = {
        title: "Test Software Deal",
        description: "This is a test deal added manually for verification.",
        type: "lifetime",
        currentPrice: 99,
        originalPrice: 299,
        discount: 67,
        category: "productivity",
        image: "🧪",
        endDate: "2025-12-31",
        affiliateLink: "#test-deal",
        rating: 4.5,
        features: ["Test feature 1", "Test feature 2", "Test feature 3"]
    };
    
    return addDeal(sampleDeal);
}

// Initialize periodic cleanup (runs every hour)
setInterval(removeExpiredDeals, 3600000);

// Export functions for console testing
window.dealTracker = {
    addDeal,
    testAddDeal,
    removeExpiredDeals,
    currentDeals: () => currentDeals,
    allDeals: () => dealsData
};