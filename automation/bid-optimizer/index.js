/**
 * Bid Optimizer - Main Orchestrator
 * 
 * Coordinates the hybrid bid optimization system:
 * - Uses Binary Search when <20 observations
 * - Uses Gemini AI prediction when >=20 observations
 * - Stores all observations in MongoDB
 * - Runs campaign automation to test bids
 */

const config = require('./config');
const RankingSimulator = require('./ranking-simulator');
const BinarySearchStrategy = require('./binary-search');
const MongoStore = require('./mongo-store');
const GeminiPredictor = require('./gemini-predictor');

class BidOptimizer {
    constructor(options = {}) {
        this.config = { ...config, ...options };
        this.simulator = new RankingSimulator();
        this.binarySearch = new BinarySearchStrategy(
            this.config.MIN_BID,
            this.config.MAX_BID,
            this.config.BID_THRESHOLD
        );
        this.mongoStore = new MongoStore();
        this.geminiPredictor = new GeminiPredictor();

        // Track current optimization run
        this.runId = Date.now();
        this.results = [];
    }

    /**
     * Main optimization loop
     * @param {object} productConfig - Product and campaign configuration
     * @returns {Promise<object>} - { success, optimalBid, iterations, history }
     */
    async optimize(productConfig) {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 STARTING BID OPTIMIZATION');
        console.log('='.repeat(60));
        console.log(`📦 Product: ${productConfig.productName || productConfig.productId}`);
        console.log(`🎯 Target: Rank #${this.config.TARGET_RANK}`);
        console.log(`💰 Bid Range: ₹${this.config.MIN_BID} - ₹${this.config.MAX_BID}`);
        console.log('='.repeat(60) + '\n');

        let iteration = 0;
        let currentBid = 0;
        let optimalBid = null;
        let strategy = 'binary_search';

        try {
            // Connect to MongoDB
            await this.mongoStore.connect();

            // Determine strategy based on available data
            const hasEnoughData = await this.mongoStore.hasEnoughData(this.config.AI_TRAINING_THRESHOLD);

            if (hasEnoughData && this.geminiPredictor.isEnabled()) {
                strategy = 'gemini_ai';
                console.log('📊 Strategy: Gemini AI Prediction (20+ observations available)');

                // Get historical data and predict
                const trainingData = await this.mongoStore.getTrainingData();
                try {
                    currentBid = await this.geminiPredictor.predictOptimalBid(trainingData, this.config.TARGET_RANK);
                } catch (error) {
                    console.log('⚠️ Gemini prediction failed, falling back to binary search');
                    strategy = 'binary_search';
                    currentBid = this.binarySearch.getInitialBid();
                }
            } else {
                strategy = 'binary_search';
                const observationCount = await this.mongoStore.count();
                console.log(`🔍 Strategy: Binary Search (${observationCount}/${this.config.AI_TRAINING_THRESHOLD} observations for AI)`);
                currentBid = this.binarySearch.getInitialBid();
            }

            // Main optimization loop
            while (iteration < this.config.MAX_ITERATIONS) {
                iteration++;
                console.log(`\n--- Iteration ${iteration}/${this.config.MAX_ITERATIONS} ---`);
                console.log(`💵 Testing bid: ₹${currentBid}`);

                // 1. Get ranking for this bid (using simulator)
                const rankingResult = this.simulator.getRanking(currentBid);
                console.log(`📈 Result: Rank #${rankingResult.rank}`);
                console.log(`   ${rankingResult.message}`);

                // 2. Store observation in MongoDB
                await this.mongoStore.addObservation({
                    productId: productConfig.productId || 'unknown',
                    productName: productConfig.productName || '',
                    bid: currentBid,
                    rank: rankingResult.rank,
                    cities: productConfig.cities || [],
                    keywords: productConfig.keywords || [],
                    strategy,
                    iteration,
                    campaignName: productConfig.campaignName || `Optimization Run ${this.runId}`
                });

                // 3. Track results
                this.results.push({
                    iteration,
                    bid: currentBid,
                    rank: rankingResult.rank,
                    timestamp: new Date()
                });

                // 4. Check if we found optimal bid
                if (strategy === 'binary_search') {
                    const searchResult = this.binarySearch.calculateNextBid(rankingResult.rank, currentBid);

                    if (searchResult.converged) {
                        optimalBid = searchResult.optimalBid;
                        console.log(`\n✅ Binary Search Converged!`);
                        console.log(`   Search range narrowed to: ₹${searchResult.searchRange.difference}`);
                        break;
                    }

                    currentBid = searchResult.bid;
                } else {
                    // AI strategy - check if we hit target
                    if (rankingResult.rank === this.config.TARGET_RANK) {
                        // Try to find lower bid
                        console.log('🎯 Target rank achieved! Trying to find lower bid...');
                        this.binarySearch.maxBid = currentBid;
                        strategy = 'binary_search';  // Switch to binary search for refinement
                        const searchResult = this.binarySearch.calculateNextBid(rankingResult.rank, currentBid);
                        currentBid = searchResult.bid;

                        if (searchResult.converged) {
                            optimalBid = searchResult.optimalBid;
                            break;
                        }
                    } else {
                        // AI prediction was wrong, use binary search
                        console.log('⚠️ AI prediction did not achieve target. Refining with binary search...');
                        strategy = 'binary_search';
                        const searchResult = this.binarySearch.calculateNextBid(rankingResult.rank, currentBid);
                        currentBid = searchResult.bid;
                    }
                }

                // 5. Wait between iterations (simulates real-world delay)
                if (iteration < this.config.MAX_ITERATIONS) {
                    console.log(`⏳ Waiting ${this.config.RANKING_CHECK_INTERVAL / 1000}s...`);
                    await this.delay(this.config.RANKING_CHECK_INTERVAL);
                }
            }

            // Final result
            console.log('\n' + '='.repeat(60));
            console.log('🎉 OPTIMIZATION COMPLETE');
            console.log('='.repeat(60));

            if (optimalBid) {
                console.log(`✅ Optimal Bid Found: ₹${optimalBid}`);
                console.log(`📊 Iterations: ${iteration}`);
                console.log(`🏆 This bid achieves Rank #1 at minimum cost!`);
            } else {
                console.log(`⚠️ Could not find optimal bid in ${iteration} iterations`);
                const bestResult = this.results.filter(r => r.rank === 1).sort((a, b) => a.bid - b.bid)[0];
                if (bestResult) {
                    optimalBid = bestResult.bid;
                    console.log(`📌 Best bid achieving Rank #1: ₹${optimalBid}`);
                }
            }
            console.log('='.repeat(60) + '\n');

            return {
                success: optimalBid !== null,
                optimalBid,
                iterations: iteration,
                history: this.results,
                strategy
            };

        } catch (error) {
            console.error('❌ Optimization error:', error.message);
            throw error;
        }
    }

    /**
     * Run a test optimization without campaign automation
     * (Uses simulator only)
     */
    async testRun(productConfig = {}) {
        const defaultConfig = {
            productId: 'TEST-001',
            productName: 'Test Product',
            cities: ['Mumbai', 'Delhi'],
            keywords: ['test', 'demo']
        };

        return this.optimize({ ...defaultConfig, ...productConfig });
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clean up
     */
    async cleanup() {
        await this.mongoStore.disconnect();
    }
}

// CLI Entry Point
async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         HYBRID BID OPTIMIZER - Test Mode                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const optimizer = new BidOptimizer();

    try {
        const result = await optimizer.testRun({
            productId: 'NIKE-001',
            productName: 'Nike Air Max',
            cities: ['Mumbai', 'Bangalore', 'New Delhi'],
            keywords: ['running shoes', 'nike', 'sports']
        });

        console.log('\n📋 Final Result:');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Failed:', error);
    } finally {
        await optimizer.cleanup();
        process.exit(0);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { BidOptimizer };
