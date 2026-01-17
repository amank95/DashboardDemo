/**
 * Visual Ranking Checker
 * 
 * Opens a visible browser window to show the ranking check process.
 * Uses a demo HTML page to visually display the ranking lookup.
 */

const { chromium } = require('playwright');
const path = require('path');

class RankingChecker {
    constructor(options = {}) {
        this.options = {
            visualDuration: options.visualDuration || 3000,  // How long to show the result
            slowMo: options.slowMo || 50,
            ...options
        };
        this.browser = null;
        this.context = null;
    }

    /**
     * Generate Blinkit-style search results HTML page
     */
    _generateDemoHTML(keyword, bid, rank) {
        // Generate mock product data - target product at the specified rank position
        const products = [
            { name: 'Go Daily Milk', weight: '1 l', price: 65, oldPrice: 75, time: '8 MINS', isAd: true, img: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/images/products/sliding_image/271654a.jpg' },
            { name: 'Amul Taaza Toned Milk', weight: '500 ml', price: 29, time: '8 MINS', img: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/images/products/sliding_image/4738a.jpg' },
            { name: 'Amul Cow Milk', weight: '500 ml', price: 29, time: '8 MINS', img: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/images/products/sliding_image/35122a.jpg' },
            { name: 'Gokul Full Cream Milk', weight: '500 ml', price: 37, time: '8 MINS', img: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/images/products/sliding_image/391599a.jpg' },
            { name: 'Pride of Cows Farm Cow Milk', weight: '500 ml', price: 85, time: '8 MINS', img: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/images/products/sliding_image/452979a.jpg' },
            { name: 'Amul Taaza Homogenised Toned Milk', weight: '1 l', price: 75, time: '8 MINS', img: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/images/products/sliding_image/4738a.jpg' },
            { name: 'Gokul Full Cream Milk', weight: '1 l', price: 74, time: '8 MINS', img: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/images/products/sliding_image/391599a.jpg' },
            { name: 'Country Delight Cow Fresh Milk', weight: '450 ml', price: 44, oldPrice: 49, time: '8 MINS', isAd: true, img: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/images/products/sliding_image/411215a.jpg' },
        ];

        // Insert the target product at the specified rank position
        const targetProduct = {
            name: `Your Product (${keyword})`,
            weight: 'Bid: ₹' + bid.toLocaleString(),
            price: bid,
            time: '8 MINS',
            isTarget: true,
            img: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/images/products/sliding_image/4738a.jpg'
        };

        // Insert target at rank-1 position (0-indexed)
        products.splice(rank - 1, 0, targetProduct);

        // Generate product cards HTML
        const productCardsHTML = products.slice(0, 8).map((p, i) => `
            <div class="product-card ${p.isTarget ? 'target-product' : ''}" ${p.isTarget ? 'id="target"' : ''}>
                ${p.isAd ? '<span class="ad-badge">Ad</span>' : ''}
                ${p.isTarget ? '<span class="rank-badge">#' + rank + '</span>' : ''}
                <div class="product-image">
                    <img src="${p.img}" alt="${p.name}" onerror="this.style.background='#f0f0f0'; this.alt='📦';">
                </div>
                <div class="delivery-time">⏱ ${p.time}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-weight">${p.weight}</div>
                <div class="product-footer">
                    <div class="price-section">
                        <span class="price">₹${typeof p.price === 'number' && p.price > 100 ? Math.floor(p.price / 100) : p.price}</span>
                        ${p.oldPrice ? '<span class="old-price">₹' + p.oldPrice + '</span>' : ''}
                    </div>
                    <button class="add-btn ${p.isTarget ? 'target-btn' : ''}">ADD</button>
                </div>
            </div>
        `).join('');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ranking Check - ${keyword}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #fff;
            min-height: 100vh;
        }
        
        /* Header */
        .header {
            background: #f8cb46;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            gap: 20px;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #0c831f;
            font-style: italic;
        }
        .search-box {
            flex: 1;
            max-width: 700px;
            background: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            padding: 10px 16px;
            gap: 10px;
        }
        .search-box input {
            flex: 1;
            border: none;
            font-size: 16px;
            outline: none;
        }
        .search-icon { color: #666; font-size: 18px; }
        .cart-btn {
            background: #0c831f;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
        }
        
        /* Status Banner */
        .status-banner {
            background: linear-gradient(90deg, #0c831f, #1aa347);
            color: white;
            padding: 12px 20px;
            text-align: center;
            font-size: 14px;
        }
        .status-banner.checking {
            background: linear-gradient(90deg, #3b82f6, #60a5fa);
        }
        .pulse { animation: pulse 1.5s infinite; }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        /* Main Content */
        .main {
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .results-header {
            color: #666;
            font-size: 14px;
            margin-bottom: 16px;
        }
        .results-header span { color: #333; font-weight: 600; }
        
        /* Product Grid */
        .product-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
        }
        .product-card {
            border: 1px solid #e8e8e8;
            border-radius: 12px;
            padding: 12px;
            background: white;
            position: relative;
            transition: all 0.3s ease;
        }
        .product-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .target-product {
            border: 3px solid #0c831f;
            background: linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%);
            animation: highlight 2s ease-in-out infinite;
            transform: scale(1.02);
        }
        @keyframes highlight {
            0%, 100% { box-shadow: 0 0 20px rgba(12, 131, 31, 0.4); }
            50% { box-shadow: 0 0 30px rgba(12, 131, 31, 0.7); }
        }
        .ad-badge {
            position: absolute;
            top: 8px;
            left: 8px;
            background: #fef3c7;
            color: #92400e;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
        }
        .rank-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            background: #0c831f;
            color: white;
            font-size: 14px;
            padding: 4px 10px;
            border-radius: 20px;
            font-weight: bold;
        }
        .product-image {
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
        }
        .product-image img {
            max-height: 100%;
            max-width: 100%;
            object-fit: contain;
        }
        .delivery-time {
            font-size: 11px;
            color: #666;
            margin-bottom: 4px;
        }
        .product-name {
            font-size: 13px;
            font-weight: 500;
            color: #333;
            margin-bottom: 4px;
            line-height: 1.3;
            height: 34px;
            overflow: hidden;
        }
        .product-weight {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
        }
        .product-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .price-section { display: flex; align-items: center; gap: 6px; }
        .price { font-size: 14px; font-weight: 700; color: #333; }
        .old-price { font-size: 12px; color: #999; text-decoration: line-through; }
        .add-btn {
            background: white;
            color: #0c831f;
            border: 1px solid #0c831f;
            padding: 6px 16px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
        }
        .target-btn {
            background: #0c831f;
            color: white;
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="logo">blink<span style="color:#333">it</span></div>
        <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" value="${keyword}" readonly>
            <span style="color:#999">×</span>
        </div>
        <button class="cart-btn">🛒 My Cart</button>
    </header>
    
    <div id="status-banner" class="status-banner checking">
        <span class="pulse">🔍 Checking ranking for "${keyword}" with bid ₹${bid.toLocaleString()}...</span>
    </div>
    
    <main class="main">
        <div class="results-header">Showing results for "<span>${keyword}</span>"</div>
        <div class="product-grid">
            ${productCardsHTML}
        </div>
    </main>
    
    <script>
        // Show result after animation  
        setTimeout(() => {
            const banner = document.getElementById('status-banner');
            banner.className = 'status-banner';
            banner.innerHTML = '${rank === 1
                ? '✅ <strong>Rank #1 achieved!</strong> Your product is at the top position.'
                : '📊 <strong>Current Rank: #' + rank + '</strong> - Need higher bid for Rank #1'}';
            
            // Scroll to target product
            const target = document.getElementById('target');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 1500);
    </script>
</body>
</html>`;
    }

    /**
     * Check ranking with visual browser display (single keyword)
     * @param {string} keyword - The keyword to check
     * @param {number} bid - Current bid amount
     * @param {number} simulatedRank - The simulated rank result to display
     * @returns {object} - { rank, keyword, message }
     */
    async checkRanking(keyword, bid, simulatedRank) {
        console.log(`   🖥️  Opening visual ranking check for "${keyword}"...`);

        try {
            // Launch visible browser if not already open
            if (!this.browser) {
                this.browser = await chromium.launch({
                    headless: false,
                    slowMo: this.options.slowMo,
                    args: ['--window-size=1100,800']
                });

                this.context = await this.browser.newContext({
                    viewport: { width: 1050, height: 750 }
                });
            }

            const page = await this.context.newPage();

            // Generate and load demo HTML
            const html = this._generateDemoHTML(keyword, bid, simulatedRank);
            await page.setContent(html);

            // Wait for the animation to complete and show result
            await this.delay(2500);  // Wait for "checking" animation
            await this.delay(this.options.visualDuration);  // Show result

            // Close the tab
            await page.close();

            console.log(`   ✅ Visual check complete: Rank #${simulatedRank}`);

            return {
                rank: simulatedRank,
                keyword,
                userBid: bid,
                message: simulatedRank === 1
                    ? `🏆 "${keyword}": Rank #1 achieved with ₹${bid}!`
                    : `📈 "${keyword}": Rank #${simulatedRank}. Need higher bid for Rank #1 (you bid ₹${bid}).`
            };

        } catch (error) {
            console.error(`   ❌ Visual ranking check failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Check multiple keywords simultaneously with separate tabs
     * @param {Array} keywordChecks - Array of { keyword, bid, simulatedRank }
     * @returns {Array} - Array of results
     */
    async checkMultipleRankings(keywordChecks) {
        console.log(`   🖥️  Opening ${keywordChecks.length} tabs for visual ranking checks...`);

        try {
            // Launch visible browser
            this.browser = await chromium.launch({
                headless: false,
                slowMo: this.options.slowMo,
                args: ['--window-size=1200,800']
            });

            this.context = await this.browser.newContext({
                viewport: { width: 1050, height: 750 }
            });

            const pages = [];
            const results = [];

            // Open a tab for each keyword
            for (const check of keywordChecks) {
                const page = await this.context.newPage();
                const html = this._generateDemoHTML(check.keyword, check.bid, check.simulatedRank);
                await page.setContent(html);
                pages.push({ page, ...check });
                console.log(`   📑 Opened tab for "${check.keyword}" (Bid: ₹${check.bid})`);
                await this.delay(300); // Small delay between tabs
            }

            // Wait for all animations to complete
            await this.delay(2500);  // Wait for "checking" animation
            await this.delay(this.options.visualDuration);  // Show results

            // Collect results
            for (const { page, keyword, bid, simulatedRank } of pages) {
                results.push({
                    rank: simulatedRank,
                    keyword,
                    userBid: bid,
                    message: simulatedRank === 1
                        ? `🏆 "${keyword}": Rank #1 achieved with ₹${bid}!`
                        : `📈 "${keyword}": Rank #${simulatedRank}. Need higher bid for Rank #1 (you bid ₹${bid}).`
                });
            }

            // Close browser
            await this.browser.close();
            this.browser = null;

            console.log(`   ✅ All ${keywordChecks.length} visual checks complete`);
            return results;

        } catch (error) {
            console.error(`   ❌ Visual ranking checks failed: ${error.message}`);
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
            throw error;
        }
    }

    /**
     * Close any open browser
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = RankingChecker;
