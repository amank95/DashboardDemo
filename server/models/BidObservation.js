/**
 * BidObservation Model
 * 
 * MongoDB schema for storing bid optimization observations.
 * Records the relationship between bid amounts and resulting rankings.
 */

const mongoose = require('mongoose');

const bidObservationSchema = new mongoose.Schema({
    // Product identification
    productId: {
        type: String,
        required: true,
        index: true
    },
    productName: String,

    // Bid and result
    bid: {
        type: Number,
        required: true
    },
    rank: {
        type: Number,
        required: true
    },

    // Targeting details
    cities: [String],
    keywords: [String],

    // Metadata
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },

    // Strategy used
    strategy: {
        type: String,
        enum: ['binary_search', 'gemini_ai', 'manual'],
        default: 'binary_search'
    },

    // Iteration info
    iteration: Number,

    // Campaign details (optional)
    campaignName: String,
    budgetStrategy: String
});

// Compound index for efficient queries
bidObservationSchema.index({ productId: 1, timestamp: -1 });

// Check if model already exists (for hot reloading)
module.exports = mongoose.models.BidObservation || mongoose.model('BidObservation', bidObservationSchema);
