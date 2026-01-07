/**
 * Simple Bid Optimizer Demo
 * 
 * Demonstrates the binary search + Gemini AI hybrid system
 * WITHOUT MongoDB dependency (uses in-memory storage)
 */

const RankingSimulator = require('./ranking-simulator');
const BinarySearchStrategy = require('./binary-search');
const config = require('./config');

// In-memory storage for demo
const observations = [];

async function runDemo() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║      HYBRID BID OPTIMIZER - Demo (No MongoDB)              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const simulator = new RankingSimulator();
    const binarySearch = new BinarySearchStrategy(
        config.MIN_BID,
        config.MAX_BID,
        config.BID_THRESHOLD
    );

    console.log('🎯 Goal: Find minimum bid for Rank #1');
    console.log(`💰 Bid Range: ₹${config.MIN_BID} - ₹${config.MAX_BID}`);
    console.log('\n📊 Simulated Competitors:');
    simulator.getCompetitors().forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name}: ₹${c.bid}`);
    });
    console.log(`\n🔑 Secret: Need > ₹${simulator.getMinBidForRank1() - 1} for Rank #1`);
    console.log('\n' + '='.repeat(60) + '\n');

    let iteration = 0;
    let currentBid = binarySearch.getInitialBid();
    let optimalBid = null;

    while (iteration < config.MAX_ITERATIONS) {
        iteration++;
        console.log(`--- Iteration ${iteration} ---`);
        console.log(`💵 Testing bid: ₹${currentBid}`);

        // Get ranking
        const result = simulator.getRanking(currentBid);
        console.log(`📈 Result: Rank #${result.rank}`);
        console.log(`   ${result.message}`);

        // Store observation
        observations.push({ bid: currentBid, rank: result.rank });

        // Calculate next bid
        const searchResult = binarySearch.calculateNextBid(result.rank, currentBid);

        if (searchResult.converged) {
            optimalBid = searchResult.optimalBid;
            console.log(`\n✅ Converged! Range: ₹${searchResult.searchRange.difference}`);
            break;
        }

        currentBid = searchResult.bid;
        console.log('');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 OPTIMIZATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Optimal Bid: ₹${optimalBid}`);
    console.log(`📊 Iterations: ${iteration}`);
    console.log(`🏆 This achieves Rank #1 at minimum cost!`);
    console.log('='.repeat(60));

    console.log('\n📋 Observation History:');
    observations.forEach((o, i) => {
        console.log(`   ${i + 1}. Bid: ₹${o.bid} → Rank: ${o.rank}`);
    });
}

runDemo().catch(console.error);
