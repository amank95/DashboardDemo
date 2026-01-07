/**
 * Ranking Simulator
 * 
 * Simulates a real ad platform's ranking system based on bid amounts.
 * Uses configurable competitor bids to determine user's rank.
 */

class RankingSimulator {
    constructor() {
        // Simulated competitor bids (hidden from optimizer)
        // These represent what competitors are bidding
        this.competitors = [
            { id: 'comp1', name: 'Competitor Alpha', bid: 8500 },
            { id: 'comp2', name: 'Competitor Beta', bid: 6200 },
            { id: 'comp3', name: 'Competitor Gamma', bid: 4800 },
            { id: 'comp4', name: 'Competitor Delta', bid: 3500 },
            { id: 'comp5', name: 'Competitor Epsilon', bid: 2000 },
        ];
    }

    /**
     * Get the ranking for a given bid amount
     * @param {number} userBid - The bid amount to check
     * @returns {object} - { rank, totalCompetitors, message, breakdown }
     */
    getRanking(userBid) {
        // Combine user bid with competitors
        const allBids = [
            ...this.competitors.map(c => ({ ...c, isUser: false })),
            { id: 'user', name: 'Your Bid', bid: userBid, isUser: true }
        ];

        // Sort by bid amount (highest first = best rank)
        allBids.sort((a, b) => b.bid - a.bid);

        // Find user's position (1-indexed)
        const userRank = allBids.findIndex(b => b.isUser) + 1;

        // Get the bid needed to move up
        let bidNeededToMoveUp = null;
        if (userRank > 1) {
            bidNeededToMoveUp = allBids[userRank - 2].bid + 1;
        }

        return {
            rank: userRank,
            totalCompetitors: allBids.length,
            bidNeededToMoveUp,
            message: this._getMessage(userRank, bidNeededToMoveUp),
            breakdown: allBids.map((b, i) => ({
                rank: i + 1,
                name: b.name,
                bid: b.bid,
                isUser: b.isUser
            }))
        };
    }

    /**
     * Generate a human-readable message about the ranking
     */
    _getMessage(rank, bidNeeded) {
        if (rank === 1) {
            return '🏆 Congratulations! You are Rank #1!';
        } else if (rank === 2) {
            return `📈 You are Rank #${rank}. Bid ₹${bidNeeded} or more to reach #1.`;
        } else {
            return `📊 You are Rank #${rank}. Bid ₹${bidNeeded} to move up one position.`;
        }
    }

    /**
     * Add random fluctuation to competitor bids (simulates market changes)
     * @param {number} maxChange - Maximum change in either direction
     */
    addNoise(maxChange = 500) {
        this.competitors.forEach(c => {
            const change = Math.floor((Math.random() - 0.5) * 2 * maxChange);
            c.bid = Math.max(500, c.bid + change);  // Minimum bid of ₹500
        });
        console.log('📊 Competitor bids have fluctuated');
    }

    /**
     * Update a specific competitor's bid
     */
    updateCompetitor(id, newBid) {
        const comp = this.competitors.find(c => c.id === id);
        if (comp) {
            comp.bid = newBid;
        }
    }

    /**
     * Get all competitor bids (for debugging)
     */
    getCompetitors() {
        return this.competitors;
    }

    /**
     * Get the minimum bid needed for rank 1 (cheat mode for testing)
     */
    getMinBidForRank1() {
        const maxCompetitorBid = Math.max(...this.competitors.map(c => c.bid));
        return maxCompetitorBid + 1;
    }
}

module.exports = RankingSimulator;
