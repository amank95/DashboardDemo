/**
 * MongoDB Data Store
 * 
 * Handles persistence of bid observations to MongoDB.
 * Provides methods to add, retrieve, and query observation data.
 */

const mongoose = require('mongoose');
const path = require('path');
const config = require('./config');

// Import model (handle path from automation folder)
const BidObservation = require(path.join(__dirname, '../../server/models/BidObservation'));

class MongoStore {
    constructor() {
        this.connected = false;
    }

    /**
     * Connect to MongoDB if not already connected
     */
    async connect() {
        if (this.connected || mongoose.connection.readyState === 1) {
            this.connected = true;
            return;
        }

        try {
            console.log('📦 Connecting to MongoDB...');
            await mongoose.connect(config.MONGODB_URI);
            this.connected = true;
            console.log('✅ MongoDB connected');
        } catch (error) {
            console.error('❌ MongoDB connection error:', error.message);
            throw error;
        }
    }

    /**
     * Add a new bid observation
     * @param {object} data - Observation data
     * @returns {Promise<object>} - Created observation
     */
    async addObservation(data) {
        await this.connect();
        const observation = await BidObservation.create({
            ...data,
            timestamp: new Date()
        });
        console.log(`📝 Saved observation: bid=₹${data.bid}, rank=${data.rank}`);
        return observation;
    }

    /**
     * Get all observations
     * @returns {Promise<array>} - All observations sorted by timestamp
     */
    async getAll() {
        await this.connect();
        return BidObservation.find({}).sort({ timestamp: -1 }).lean();
    }

    /**
     * Get observations for a specific product
     * @param {string} productId - Product ID to filter by
     * @returns {Promise<array>} - Matching observations
     */
    async getByProduct(productId) {
        await this.connect();
        return BidObservation.find({ productId }).sort({ timestamp: -1 }).lean();
    }

    /**
     * Get recent observations (for AI training)
     * @param {number} limit - Maximum number of observations
     * @returns {Promise<array>} - Recent observations
     */
    async getRecent(limit = 50) {
        await this.connect();
        return BidObservation.find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
    }

    /**
     * Count total observations
     * @returns {Promise<number>} - Total count
     */
    async count() {
        await this.connect();
        return BidObservation.countDocuments();
    }

    /**
     * Check if there's enough data for AI training
     * @param {number} threshold - Minimum observations needed
     * @returns {Promise<boolean>}
     */
    async hasEnoughData(threshold) {
        const count = await this.count();
        return count >= threshold;
    }

    /**
     * Get training data formatted for Gemini
     * @returns {Promise<array>} - Simplified observations [{bid, rank}, ...]
     */
    async getTrainingData() {
        const observations = await this.getRecent(30);
        return observations.map(o => ({
            bid: o.bid,
            rank: o.rank,
            timestamp: o.timestamp
        }));
    }

    /**
     * Clear all observations (for testing)
     */
    async clear() {
        await this.connect();
        await BidObservation.deleteMany({});
        console.log('🗑️ All observations cleared');
    }

    /**
     * Close connection
     */
    async disconnect() {
        if (this.connected) {
            await mongoose.disconnect();
            this.connected = false;
            console.log('📦 MongoDB disconnected');
        }
    }
}

module.exports = MongoStore;
