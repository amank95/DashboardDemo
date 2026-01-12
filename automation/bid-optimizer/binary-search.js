/**
 * Binary Search Strategy
 * 
 * Implements binary search algorithm to find the optimal bid amount.
 * Converges on the minimum bid needed to achieve target rank.
 */

class BinarySearchStrategy {
    /**
     * @param {number} minBid - Minimum possible bid
     * @param {number} maxBid - Maximum possible bid
     * @param {number} threshold - Stop when difference < threshold
     * @param {number} percentage - Bid change percentage (default 5%)
     */
    constructor(minBid, maxBid, threshold, percentage = 5) {
        this.initialMinBid = minBid;
        this.initialMaxBid = maxBid;
        this.threshold = threshold;
        this.percentage = percentage;  // 5% by default

        // Per-keyword state tracking
        this.keywordState = new Map();
    }

    /**
     * Get or create state for a keyword
     */
    _getKeywordState(keyword) {
        if (!this.keywordState.has(keyword)) {
            this.keywordState.set(keyword, {
                lastBid: null,
                lastRank1Bid: null,
                lastRank: null,              // Track previous rank for oscillation detection
                currentPercentage: this.percentage,  // Start at initial percentage (5%)
                converged: false,
                history: []
            });
        }
        return this.keywordState.get(keyword);
    }

    /**
     * Reset state for all keywords
     */
    reset() {
        this.keywordState = new Map();
    }

    /**
     * Get the initial bid for a keyword
     * @param {string} keyword - The keyword
     * @returns {number} - Starting bid (midpoint of range)
     */
    getInitialBid(keyword) {
        return Math.round((this.initialMinBid + this.initialMaxBid) / 2);
    }

    /**
     * Get current bid for a keyword
     * @param {string} keyword - The keyword
     * @returns {number} - Current bid or initial bid
     */
    getCurrentBid(keyword) {
        const state = this._getKeywordState(keyword);
        return state.lastBid || this.getInitialBid(keyword);
    }

    /**
     * Calculate the next bid for a specific keyword
     * Uses decreasing percentage strategy:
     * - Starts at 5%, decreases by 1% each time rank oscillates (1→2 or 2→1)
     * - Converges when percentage reaches 1% and rank is 1
     * @param {string} keyword - The keyword being optimized
     * @param {number} currentRank - The rank achieved with currentBid
     * @param {number} currentBid - The bid that was just tested
     * @returns {object} - { bid, converged, optimalBid, searchRange }
     */
    calculateNextBid(keyword, currentRank, currentBid) {
        const state = this._getKeywordState(keyword);

        // Store in history
        state.history.push({ bid: currentBid, rank: currentRank, percentage: state.currentPercentage });
        state.lastBid = currentBid;

        // Detect oscillation (rank changed from last time)
        const oscillated = state.lastRank !== null && state.lastRank !== currentRank;

        if (oscillated && state.currentPercentage > 1) {
            state.currentPercentage--;  // Reduce percentage by 1%
            console.log(`   ⚡ [${keyword}] Oscillation detected! Reducing to ${state.currentPercentage}%`);
        }

        // Update last rank for next iteration
        state.lastRank = currentRank;

        // Calculate change amount using current percentage for this keyword
        const changeAmount = Math.round(currentBid * (state.currentPercentage / 100));

        let nextBid;
        if (currentRank === 1) {
            // Rank 1 achieved! Try to find a lower bid that still works
            state.lastRank1Bid = currentBid;
            // Decrease bid by current percentage
            nextBid = currentBid - changeAmount;
            console.log(`   ✓ [${keyword}] Rank 1 at ₹${currentBid}. Decreasing by ${state.currentPercentage}% (₹${changeAmount})...`);
        } else {
            // Rank not 1 - need higher bid
            // Increase bid by current percentage
            nextBid = currentBid + changeAmount;
            console.log(`   ✗ [${keyword}] Rank ${currentRank} at ₹${currentBid}. Increasing by ${state.currentPercentage}% (₹${changeAmount})...`);
        }

        // Clamp to min/max bounds
        nextBid = Math.max(this.initialMinBid, Math.min(this.initialMaxBid, nextBid));

        // Converge when:
        // 1. Percentage reaches 1% AND current rank is 1 (optimal found!)
        // 2. OR bid can't change anymore (at boundaries)
        const converged = (state.currentPercentage === 1 && currentRank === 1) || nextBid === currentBid;
        state.converged = converged;

        if (converged && currentRank === 1) {
            console.log(`   🎯 [${keyword}] CONVERGED at ₹${currentBid} with ${state.currentPercentage}%!`);
        }

        return {
            keyword,
            bid: nextBid,
            converged,
            optimalBid: state.lastRank1Bid,
            currentPercentage: state.currentPercentage,
            searchRange: {
                min: this.initialMinBid,
                max: this.initialMaxBid,
                difference: changeAmount
            },
            history: state.history
        };
    }

    /**
     * Check if a keyword has converged
     * @param {string} keyword - The keyword
     * @returns {boolean}
     */
    isConverged(keyword) {
        const state = this._getKeywordState(keyword);
        return state.converged;
    }

    /**
     * Get optimal bid for a keyword
     * @param {string} keyword - The keyword
     * @returns {number|null}
     */
    getOptimalBid(keyword) {
        const state = this._getKeywordState(keyword);
        return state.lastRank1Bid;
    }

    /**
     * Check if all keywords have converged
     * @param {string[]} keywords - Array of keywords
     * @returns {boolean}
     */
    allConverged(keywords) {
        return keywords.every(kw => this.isConverged(kw));
    }

    /**
     * Get all keyword states (for debugging)
     */
    getAllStates() {
        const result = {};
        for (const [keyword, state] of this.keywordState) {
            result[keyword] = { ...state };
        }
        return result;
    }
}

module.exports = BinarySearchStrategy;
