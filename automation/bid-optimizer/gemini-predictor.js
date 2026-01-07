/**
 * Gemini AI Predictor
 * 
 * Uses Google's Gemini API to predict optimal bid amounts
 * based on historical bid-rank observation data.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');

class GeminiPredictor {
    constructor(apiKey = config.GEMINI_API_KEY) {
        if (!apiKey) {
            console.warn('⚠️ Gemini API key not set. AI predictions will be disabled.');
            this.enabled = false;
            return;
        }

        try {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
            this.enabled = true;
            console.log('🤖 Gemini AI predictor initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Gemini:', error.message);
            this.enabled = false;
        }
    }

    /**
     * Check if Gemini is available
     * @returns {boolean}
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Predict the optimal bid amount based on historical data
     * @param {array} observations - Historical bid-rank data [{bid, rank}, ...]
     * @param {number} targetRank - Desired rank (default: 1)
     * @returns {Promise<number>} - Predicted optimal bid
     */
    async predictOptimalBid(observations, targetRank = 1) {
        if (!this.enabled) {
            throw new Error('Gemini AI is not enabled. Check API key.');
        }

        if (!observations || observations.length < 5) {
            throw new Error('Not enough observations for prediction. Need at least 5.');
        }

        // Format observations for the prompt
        const recentData = observations.slice(0, 20).map(o => ({
            bid: o.bid,
            rank: o.rank
        }));

        const prompt = `You are a bid optimization expert. Analyze this historical data showing the relationship between bid amounts (in Indian Rupees ₹) and search rankings:

${JSON.stringify(recentData, null, 2)}

Key observations:
- Higher bids generally result in better (lower) rankings
- Rank 1 is the best position
- The goal is to find the MINIMUM bid needed to achieve rank ${targetRank}

Based on this data, predict the minimum bid amount (in ₹) needed to achieve rank ${targetRank}.

IMPORTANT: Respond with ONLY a single number (the bid amount). No text, no currency symbol, just the number.`;

        try {
            console.log('🤖 Asking Gemini for optimal bid prediction...');

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            // Parse the number from response
            const predictedBid = parseInt(text.replace(/[^0-9]/g, ''));

            if (isNaN(predictedBid) || predictedBid <= 0) {
                console.error('⚠️ Invalid prediction from Gemini:', text);
                throw new Error(`Invalid prediction: ${text}`);
            }

            // Apply safety buffer (10% higher to account for variance)
            const safetyBid = Math.round(predictedBid * 1.1);

            console.log(`🤖 Gemini predicted: ₹${predictedBid} (with safety: ₹${safetyBid})`);

            return safetyBid;

        } catch (error) {
            console.error('❌ Gemini prediction error:', error.message);
            throw error;
        }
    }

    /**
     * Get analysis of bid-rank relationship
     * @param {array} observations - Historical data
     * @returns {Promise<string>} - Analysis text
     */
    async analyzePattern(observations) {
        if (!this.enabled) {
            return 'Gemini AI not enabled.';
        }

        const prompt = `Analyze this bid-price vs ranking data and provide insights:
${JSON.stringify(observations.slice(0, 15), null, 2)}

Provide a brief 2-3 sentence analysis of the pattern.`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            return `Analysis failed: ${error.message}`;
        }
    }
}

module.exports = GeminiPredictor;
