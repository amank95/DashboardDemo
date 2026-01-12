/**
 * Bid Optimizer Configuration
 * 
 * Settings for the hybrid bid optimization system.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

module.exports = {
    // Bid range limits (in ₹)
    MIN_BID: 100,
    MAX_BID: 50000,
    BID_THRESHOLD: 50,  // Stop when difference < ₹50
    BID_PERCENTAGE: 5,  // Bid changes by 5% each iteration

    // Timing
    RANKING_CHECK_INTERVAL: 100,  // 100ms for fast testing
    MAX_ITERATIONS: 25,

    // AI settings
    AI_TRAINING_THRESHOLD: 20,  // Use Gemini after 20+ observations
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'AIzaSyCOR8iwHV3yAg70gNZEAa0OYaCFujRumt4',

    // Target
    TARGET_RANK: 1,

    // MongoDB
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ad-rank-controller',

    // Browser settings
    HEADLESS: false,  // Run browser in headless mode for automation
    SLOW_MO: 500,     // Milliseconds between actions

    // Screenshot settings
    SCREENSHOT_DIR: require('path').join(__dirname, '../screenshots')
};
