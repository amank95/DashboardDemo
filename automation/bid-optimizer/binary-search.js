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
        this.reset();
    }

    /**
     * Reset the search bounds (for new optimization run)
     */
    reset() {
        this.minBid = this.initialMinBid;
        this.maxBid = this.initialMaxBid;
        this.lastRank1Bid = null;  // Track the lowest bid that achieved rank 1
        this.lastBid = null;       // Track the last tested bid
        this.history = [];
    }

    /**
     * Calculate the next bid to try based on current ranking result
     * Uses percentage-based adjustment (5% increase/decrease)
     * @param {number} currentRank - The rank achieved with currentBid
     * @param {number} currentBid - The bid that was just tested
     * @returns {object} - { bid, converged, optimalBid, searchRange }
     */
    calculateNextBid(currentRank, currentBid) {
        // Store in history
        this.history.push({ bid: currentBid, rank: currentRank });
        this.lastBid = currentBid;

        let nextBid;
        const changeAmount = Math.round(currentBid * (this.percentage / 100));

        if (currentRank === 1) {
            // Rank 1 achieved! Try to find a lower bid that still works
            this.lastRank1Bid = currentBid;
            // Decrease bid by percentage (e.g., 5%)
            nextBid = currentBid - changeAmount;
            console.log(`   ✓ Rank 1 achieved at ₹${currentBid}. Decreasing by ${this.percentage}% (₹${changeAmount})...`);
        } else {
            // Rank not 1 - need higher bid
            // Increase bid by percentage (e.g., 5%)
            nextBid = currentBid + changeAmount;
            console.log(`   ✗ Rank ${currentRank} at ₹${currentBid}. Increasing by ${this.percentage}% (₹${changeAmount})...`);
        }

        // Clamp to min/max bounds
        nextBid = Math.max(this.minBid, Math.min(this.maxBid, nextBid));

        // Check if converged (change amount is less than threshold)
        const converged = changeAmount < this.threshold || nextBid === currentBid;

        return {
            bid: nextBid,
            converged,
            optimalBid: this.lastRank1Bid,
            searchRange: {
                min: this.minBid,
                max: this.maxBid,
                difference: changeAmount
            },
            history: this.history
        };
    }

    /**
     * Get the initial bid to start the search
     * @returns {number} - Starting bid (midpoint of range)
     */
    getInitialBid() {
        return Math.round((this.minBid + this.maxBid) / 2);
    }

    /**
     * Get search statistics
     */
    getStats() {
        return {
            iterations: this.history.length,
            searchRange: this.maxBid - this.minBid,
            optimalBid: this.lastRank1Bid,
            history: this.history
        };
    }
}

module.exports = BinarySearchStrategy;
