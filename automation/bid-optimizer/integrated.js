/**
 * Full Bid Optimizer with Campaign Automation Integration
 * 
 * Connects the bid optimization logic with the campaign form automation.
 * When rank < 1, runs the automation to submit a new bid until optimal.
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
            this.config.BID_THRESHOLD
        );
        this.results = [];
        this.runId = Date.now();
    }

    /**
     * Run full optimization with campaign automation
     * @param {object} campaignConfig - Campaign configuration
     * @param {boolean} dryRun - If true, skip actual automation (just simulate)
     */
    async optimize(campaignConfig, dryRun = false) {
        console.log('\n' + '═'.repeat(60));
        console.log('🚀 INTEGRATED BID OPTIMIZER WITH CAMPAIGN AUTOMATION');
        console.log('═'.repeat(60));
        console.log(`📦 Product: ${campaignConfig.products?.[0] || 'Products from config'}`);
        console.log(`🎯 Target: Rank #${this.config.TARGET_RANK}`);
        console.log(`💰 Bid Range: ₹${this.config.MIN_BID} - ₹${this.config.MAX_BID}`);
        console.log(`🤖 Mode: ${dryRun ? 'DRY RUN (no actual automation)' : 'LIVE (will run automation)'}`);
        console.log('═'.repeat(60) + '\n');

        let iteration = 0;
        let currentBid = this.binarySearch.getInitialBid();
        let optimalBid = null;

        while (iteration < this.config.MAX_ITERATIONS) {
            iteration++;
            console.log(`\n${'─'.repeat(50)}`);
            console.log(`📍 ITERATION ${iteration}/${this.config.MAX_ITERATIONS}`);
            console.log(`${'─'.repeat(50)}`);
            console.log(`💵 Testing bid: ₹${currentBid}`);

            // Step 1: Run campaign automation with this bid
            if (!dryRun) {
                console.log('\n🌐 Running campaign automation...');
                try {
                    await runCampaignAutomation({
                        ...campaignConfig,
                        budgetAmount: currentBid,
                        campaignName: `${campaignConfig.campaignName || 'Auto-Optimized'} - Bid ₹${currentBid}`
                    }, {
                        headless: this.config.HEADLESS,
                        slowMo: this.config.SLOW_MO
                    });
                    console.log('✅ Campaign submitted successfully!');
                } catch (error) {
                    console.error('❌ Campaign automation failed:', error.message);
                    // Continue anyway to check ranking
                }
            } else {
                console.log('⏭️  [DRY RUN] Skipping automation...');
            }

            // Step 2: Wait for ranking to update (simulated)
            console.log(`\n⏳ Waiting for rank update (${this.config.RANKING_CHECK_INTERVAL}ms)...`);
            await this.delay(this.config.RANKING_CHECK_INTERVAL);

            // Step 3: Check current ranking (using simulator)
            const rankResult = this.simulator.getRanking(currentBid);
            console.log(`\n📈 RANK RESULT: #${rankResult.rank}`);
            console.log(`   ${rankResult.message}`);

            // Store result
            this.results.push({
                iteration,
                bid: currentBid,
                rank: rankResult.rank,
                timestamp: new Date()
            });

            // Step 4: Decide next action based on rank
            if (rankResult.rank === this.config.TARGET_RANK) {
                console.log('\n🎯 Target rank achieved! Trying to find lower bid...');
            } else {
                console.log(`\n⚠️ Rank ${rankResult.rank} - Need to adjust bid...`);
            }

            // Step 5: Calculate next bid using binary search
            const searchResult = this.binarySearch.calculateNextBid(rankResult.rank, currentBid);

            if (searchResult.converged) {
                optimalBid = searchResult.optimalBid;
                console.log(`\n✅ CONVERGED! Search range: ₹${searchResult.searchRange.difference}`);
                break;
            }

            currentBid = searchResult.bid;
            console.log(`\n📊 Next bid to try: ₹${currentBid}`);
        }

        // Final result
        console.log('\n' + '═'.repeat(60));
        console.log('🎉 OPTIMIZATION COMPLETE');
        console.log('═'.repeat(60));

        if (optimalBid) {
            console.log(`✅ Optimal Bid Found: ₹${optimalBid}`);
            console.log(`📊 Total Iterations: ${iteration}`);
            console.log(`🏆 This achieves Rank #1 at minimum cost!`);

            // Run final campaign with optimal bid
            if (!dryRun) {
                console.log('\n🚀 Submitting final campaign with optimal bid...');
                try {
                    await runCampaignAutomation({
                        ...campaignConfig,
                        budgetAmount: optimalBid,
                        campaignName: `${campaignConfig.campaignName || 'Optimized'} - FINAL ₹${optimalBid}`
                    }, {
                        headless: false,  // Show final submission
                        slowMo: 100
                    });
                    console.log('✅ Final campaign submitted!');
                } catch (error) {
                    console.error('❌ Final submission failed:', error.message);
                }
            }
        } else {
            console.log(`⚠️ Could not find optimal bid in ${iteration} iterations`);
        }

        console.log('═'.repeat(60) + '\n');

        // Print history
        console.log('📋 Optimization History:');
        console.log('┌─────────┬──────────┬────────┐');
        console.log('│ Iter    │ Bid (₹)  │ Rank   │');
        console.log('├─────────┼──────────┼────────┤');
        this.results.forEach(r => {
            console.log(`│ ${String(r.iteration).padEnd(7)} │ ${String(r.bid).padEnd(8)} │ ${String(r.rank).padEnd(6)} │`);
        });
        console.log('└─────────┴──────────┴────────┘');

        return {
            success: optimalBid !== null,
            optimalBid,
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
    console.log('║     INTEGRATED BID OPTIMIZER + CAMPAIGN AUTOMATION         ║');
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

    // Override starting bid if provided (keeps full range, just changes first bid)
    if (startBid) {
        // Don't limit range - just set the starting point
        // Binary search will expand from there
        console.log(`💵 Custom starting bid: ₹${startBid}`);
        console.log(`   Full search range: ₹${optimizer.config.MIN_BID} - ₹${optimizer.config.MAX_BID}`);
        console.log(`   (Will adjust up/down based on rank results)\n`);

        // Override the getInitialBid method to return custom start
        optimizer.binarySearch.getInitialBid = () => startBid;
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
            keywords: ['birthday', 'balloon'],  // Use actual suggested keywords
            categoryTargeting: true,

            // Budget
            budgetStrategy: 'overall',
            overallBudget: 50000,       // Fixed total campaign budget
            budgetAmount: 10000         // Keyword bid (will be optimized)
        }, dryRun);

        console.log('\n📋 Final Result:');
        console.log(JSON.stringify({
            success: result.success,
            optimalBid: result.optimalBid,
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
