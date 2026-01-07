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
     */
    constructor(minBid, maxBid, threshold) {
        this.initialMinBid = minBid;
        this.initialMaxBid = maxBid;
        this.threshold = threshold;
        this.reset();
    }

    /**
     * Reset the search bounds (for new optimization run)
     */
    reset() {
        this.minBid = this.initialMinBid;
        this.maxBid = this.initialMaxBid;
        this.lastRank1Bid = null;  // Track the lowest bid that achieved rank 1
        this.history = [];
    }

    /**
     * Calculate the next bid to try based on current ranking result
     * @param {number} currentRank - The rank achieved with currentBid
     * @param {number} currentBid - The bid that was just tested
     * @returns {object} - { bid, converged, optimalBid, searchRange }
     */
    calculateNextBid(currentRank, currentBid) {
        // Store in history
        this.history.push({ bid: currentBid, rank: currentRank });

        if (currentRank === 1) {
            // Rank 1 achieved! Try to find a lower bid that still works
            this.lastRank1Bid = currentBid;
            this.maxBid = currentBid;
            console.log(`   ✓ Rank 1 achieved at ₹${currentBid}. Trying lower...`);
        } else {
            // Rank not 1 - need higher bid
            this.minBid = currentBid;
            console.log(`   ✗ Rank ${currentRank} at ₹${currentBid}. Trying higher...`);
        }

        // Check if converged
        const difference = this.maxBid - this.minBid;
        const converged = difference < this.threshold;

        // Calculate next bid (midpoint)
        const nextBid = Math.round((this.minBid + this.maxBid) / 2);

        return {
            bid: nextBid,
            converged,
            optimalBid: this.lastRank1Bid,
            searchRange: {
                min: this.minBid,
                max: this.maxBid,
                difference
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
