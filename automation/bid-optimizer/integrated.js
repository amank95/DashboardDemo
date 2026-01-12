/**
 * Full Bid Optimizer with Campaign Automation Integration
 * 
 * Connects the bid optimization logic with the campaign form automation.
 * Optimizes each keyword independently with different bid amounts.
 */

const config = require('./config');
const RankingSimulator = require('./ranking-simulator');
const BinarySearchStrategy = require('./binary-search');
const { runCampaignAutomation } = require('../campaign-form-automation');

class IntegratedBidOptimizer {
    constructor(options = {}) {
        this.config = { ...config, ...options };
        this.simulator = new RankingSimulator();
        this.binarySearch = new BinarySearchStrategy(
            this.config.MIN_BID,
            this.config.MAX_BID,
            this.config.BID_THRESHOLD,
            this.config.BID_PERCENTAGE || 5  // 5% bid change per iteration
        );
        this.results = [];
        this.runId = Date.now();
    }

    /**
     * Run full optimization with campaign automation
     * Optimizes each keyword independently
     * @param {object} campaignConfig - Campaign configuration
     * @param {boolean} dryRun - If true, skip actual automation (just simulate)
     */
    async optimize(campaignConfig, dryRun = false) {
        const keywords = campaignConfig.keywords || ['birthday', 'balloon'];

        console.log('\n' + '═'.repeat(60));
        console.log('🚀 PER-KEYWORD BID OPTIMIZER');
        console.log('═'.repeat(60));
        console.log(`📦 Product: ${campaignConfig.products?.[0] || 'Products from config'}`);
        console.log(`🎯 Target: Rank #${this.config.TARGET_RANK}`);
        console.log(`💰 Bid Range: ₹${this.config.MIN_BID} - ₹${this.config.MAX_BID}`);
        console.log(`📝 Keywords: ${keywords.join(', ')}`);
        console.log(`🤖 Mode: ${dryRun ? 'DRY RUN (no actual automation)' : 'LIVE (will run automation)'}`);
        console.log('═'.repeat(60));

        // Show per-keyword thresholds
        console.log('\n📊 Rank 1 Thresholds per Keyword:');
        keywords.forEach(kw => {
            const threshold = this.simulator.getThreshold(kw);
            console.log(`   • "${kw}": Need > ₹${threshold} for Rank 1`);
        });
        console.log('');

        let iteration = 0;

        // Initialize current bids for each keyword
        const currentBids = {};
        keywords.forEach(kw => {
            currentBids[kw] = this.binarySearch.getInitialBid(kw);
        });

        while (iteration < this.config.MAX_ITERATIONS) {
            iteration++;
            console.log(`\n${'─'.repeat(50)}`);
            console.log(`📍 ITERATION ${iteration}/${this.config.MAX_ITERATIONS}`);
            console.log(`${'─'.repeat(50)}`);

            // Show current bids for each keyword
            console.log('💵 Current bids:');
            keywords.forEach(kw => {
                const isConverged = this.binarySearch.isConverged(kw);
                const status = isConverged ? '✅ CONVERGED' : '🔄';
                console.log(`   • "${kw}": ₹${currentBids[kw]} ${status}`);
            });

            // Step 1: Run campaign automation with per-keyword bids
            if (!dryRun) {
                console.log('\n🌐 Running campaign automation...');
                try {
                    await runCampaignAutomation({
                        ...campaignConfig,
                        keywordBids: currentBids,  // Pass per-keyword bids
                        campaignName: `${campaignConfig.campaignName || 'Auto-Optimized'} - Iter ${iteration}`
                    }, {
                        headless: this.config.HEADLESS,
                        slowMo: this.config.SLOW_MO
                    });
                    console.log('✅ Campaign submitted successfully!');
                } catch (error) {
                    console.error('❌ Campaign automation failed:', error.message);
                }
            } else {
                console.log('\n⏭️  [DRY RUN] Skipping automation...');
            }

            // Step 2: Wait for ranking to update (simulated)
            console.log(`\n⏳ Waiting for rank update (${this.config.RANKING_CHECK_INTERVAL}ms)...`);
            await this.delay(this.config.RANKING_CHECK_INTERVAL);

            // Step 3: Check ranking for each keyword and calculate next bids
            console.log('\n📈 RANK RESULTS:');
            const iterationResult = { iteration, keywords: {}, timestamp: new Date() };

            for (const keyword of keywords) {
                // Skip if already converged
                if (this.binarySearch.isConverged(keyword)) {
                    const optimalBid = this.binarySearch.getOptimalBid(keyword);
                    console.log(`   ✅ "${keyword}": Converged at ₹${optimalBid}`);
                    iterationResult.keywords[keyword] = {
                        bid: optimalBid,
                        rank: 1,
                        converged: true
                    };
                    continue;
                }

                // Get ranking for this keyword
                const rankResult = this.simulator.getRanking(keyword, currentBids[keyword]);
                console.log(`   ${rankResult.message}`);

                // Calculate next bid for this keyword
                const searchResult = this.binarySearch.calculateNextBid(
                    keyword,
                    rankResult.rank,
                    currentBids[keyword]
                );

                iterationResult.keywords[keyword] = {
                    bid: currentBids[keyword],
                    rank: rankResult.rank,
                    converged: searchResult.converged,
                    nextBid: searchResult.bid
                };

                // Update bid for next iteration
                if (!searchResult.converged) {
                    currentBids[keyword] = searchResult.bid;
                }
            }

            this.results.push(iterationResult);

            // Check if all keywords have converged
            if (this.binarySearch.allConverged(keywords)) {
                console.log('\n✅ ALL KEYWORDS CONVERGED!');
                break;
            }
        }

        // Final result
        console.log('\n' + '═'.repeat(60));
        console.log('🎉 OPTIMIZATION COMPLETE');
        console.log('═'.repeat(60));

        // Get optimal bids for each keyword
        const optimalBids = {};
        keywords.forEach(kw => {
            optimalBids[kw] = this.binarySearch.getOptimalBid(kw);
        });

        console.log('\n🏆 OPTIMAL BIDS PER KEYWORD:');
        keywords.forEach(kw => {
            const bid = optimalBids[kw];
            const threshold = this.simulator.getThreshold(kw);
            console.log(`   • "${kw}": ₹${bid || 'N/A'} (threshold: ₹${threshold})`);
        });

        // Run final campaign with optimal bids
        if (!dryRun && Object.values(optimalBids).some(b => b !== null)) {
            console.log('\n🚀 Submitting final campaign with optimal bids...');
            try {
                await runCampaignAutomation({
                    ...campaignConfig,
                    keywordBids: optimalBids,
                    campaignName: `${campaignConfig.campaignName || 'Optimized'} - FINAL`
                }, {
                    headless: false,
                    slowMo: 500
                });
                console.log('✅ Final campaign submitted!');
            } catch (error) {
                console.error('❌ Final submission failed:', error.message);
            }
        }

        console.log('\n' + '═'.repeat(60));

        // Print history
        console.log('\n📋 Optimization History:');
        console.log('─'.repeat(60));
        this.results.forEach(r => {
            console.log(`\n📍 Iteration ${r.iteration}:`);
            for (const [kw, data] of Object.entries(r.keywords)) {
                const status = data.converged ? '✅' : (data.rank === 1 ? '🎯' : '❌');
                console.log(`   • "${kw}": ₹${data.bid} → Rank #${data.rank} ${status}`);
            }
        });
        console.log('─'.repeat(60));

        return {
            success: this.binarySearch.allConverged(keywords),
            optimalBids,
            iterations: iteration,
            history: this.results
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI Entry Point
async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run') || args.includes('-d');

    // Parse command line arguments
    const getArg = (name) => {
        const idx = args.findIndex(a => a.startsWith(`--${name}=`));
        if (idx !== -1) return parseInt(args[idx].split('=')[1]);
        const idx2 = args.indexOf(`--${name}`);
        if (idx2 !== -1 && args[idx2 + 1]) return parseInt(args[idx2 + 1]);
        return null;
    };

    const startBid = getArg('start-bid') || getArg('start');
    const minBid = getArg('min-bid') || getArg('min');
    const maxBid = getArg('max-bid') || getArg('max');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     PER-KEYWORD BID OPTIMIZER + CAMPAIGN AUTOMATION        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📋 Usage: node integrated.js [options]');
    console.log('   --dry-run, -d     Run without browser automation');
    console.log('   --start-bid=N     Set starting bid (default: midpoint)');
    console.log('   --min-bid=N       Set minimum bid (default: 100)');
    console.log('   --max-bid=N       Set maximum bid (default: 50000)\n');

    if (dryRun) {
        console.log('🔸 Running in DRY RUN mode (no actual browser automation)\n');
    } else {
        console.log('🔹 Running in LIVE mode (will open browser and submit campaigns)\n');
    }

    // Build config with custom bid range
    const optimizerConfig = {
        RANKING_CHECK_INTERVAL: dryRun ? 100 : 2000
    };
    if (minBid) optimizerConfig.MIN_BID = minBid;
    if (maxBid) optimizerConfig.MAX_BID = maxBid;

    const optimizer = new IntegratedBidOptimizer(optimizerConfig);

    // Override starting bid if provided
    if (startBid) {
        console.log(`💵 Custom starting bid: ₹${startBid}`);
        console.log(`   Full search range: ₹${optimizer.config.MIN_BID} - ₹${optimizer.config.MAX_BID}`);
        console.log(`   (Will adjust up/down based on rank results)\n`);

        // Override getInitialBid to return custom start for all keywords
        const originalGetInitialBid = optimizer.binarySearch.getInitialBid.bind(optimizer.binarySearch);
        optimizer.binarySearch.getInitialBid = (keyword) => startBid;
    }

    try {
        const result = await optimizer.optimize({
            // Campaign settings
            campaignName: 'Auto-Optimized Campaign',
            advertisingObjective: 'performance',
            adAsset: 'productBooster',

            // Dates
            startDate: '07-01-2026',
            endDate: '31-01-2026',

            // Region
            region: 'selectCities',
            cities: ['Mumbai', 'Bangalore', 'New Delhi'],

            // Products
            products: ['Nike Air Max'],
            selectAllProducts: false,

            // Targeting
            keywordTargeting: true,
            keywords: ['birthday', 'balloon'],  // Each keyword optimized independently
            categoryTargeting: true,

            // Budget
            budgetStrategy: 'overall',
            overallBudget: 50000       // Fixed total campaign budget
        }, dryRun);

        console.log('\n📋 Final Result:');
        console.log(JSON.stringify({
            success: result.success,
            optimalBids: result.optimalBids,
            iterations: result.iterations
        }, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { IntegratedBidOptimizer };
