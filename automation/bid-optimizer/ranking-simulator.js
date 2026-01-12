/**
 * Ranking Simulator
 * 
 * Simulates a real ad platform's ranking system based on bid amounts.
 * Uses configurable competitor bids to determine user's rank.
 */

class RankingSimulator {
    constructor() {
        // Per-keyword Rank 1 thresholds
        // To achieve Rank 1 for a keyword, bid must be > threshold
        this.keywordRank1Bids = {
            'birthday': 8500,   // Bid > 8500 = Rank 1 for "birthday"
            'balloon': 5000,    // Bid > 5000 = Rank 1 for "balloon"
            'party': 6500,
            'celebration': 4000,
            'gift': 7000,
            'decoration': 3500
        };

        // Default threshold for unknown keywords
        this.defaultThreshold = 5000;
    }

    /**
     * Get the ranking for a given keyword and bid amount
     * @param {string} keyword - The keyword to check ranking for
     * @param {number} userBid - The bid amount to check
     * @returns {object} - { rank, threshold, message }
     */
    getRanking(keyword, userBid) {
        const threshold = this.keywordRank1Bids[keyword] || this.defaultThreshold;
        const rank = userBid > threshold ? 1 : 2;

        return {
            rank,
            threshold,
            keyword,
            userBid,
            message: this._getMessage(keyword, rank, threshold, userBid)
        };
    }

    /**
     * Generate a human-readable message about the ranking
     */
    _getMessage(keyword, rank, threshold, userBid) {
        if (rank === 1) {
            return `🏆 "${keyword}": Rank #1 achieved with ₹${userBid}!`;
        } else {
            const bidNeeded = threshold + 1;
            return `📈 "${keyword}": Rank #${rank}. Need > ₹${threshold} for Rank #1 (you bid ₹${userBid}).`;
        }
    }

    /**
     * Get the threshold for a specific keyword
     * @param {string} keyword - The keyword
     * @returns {number} - The Rank 1 threshold
     */
    getThreshold(keyword) {
        return this.keywordRank1Bids[keyword] || this.defaultThreshold;
    }

    /**
     * Set threshold for a keyword
     * @param {string} keyword - The keyword
     * @param {number} threshold - The new threshold
     */
    setThreshold(keyword, threshold) {
        this.keywordRank1Bids[keyword] = threshold;
    }

    /**
     * Get all keyword thresholds (for debugging)
     */
    getAllThresholds() {
        return { ...this.keywordRank1Bids };
    }

    /**
     * Get the minimum bid needed for rank 1 for a keyword
     * @param {string} keyword - The keyword
     * @returns {number} - Minimum bid for Rank 1
     */
    getMinBidForRank1(keyword) {
        const threshold = this.keywordRank1Bids[keyword] || this.defaultThreshold;
        return threshold + 1;
    }
}

module.exports = RankingSimulator;
