const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    trim: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  currentRank: {
    type: Number,
    required: true,
    min: 1
  },
  targetRank: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  adTypes: [{
    type: {
      type: String,
      required: true,
      enum: ['Product Ads', 'Brand Ads', 'Listing Spotlight', 'Recommendation Ads']
    },
    priority: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High']
    }
  }],
  targeting: {
    city: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: Number,
      required: true
    },
    timeSlot: {
      start: {
        type: String,
        required: true
      },
      end: {
        type: String,
        required: true
      }
    },
    dayType: {
      type: String,
      required: true,
      enum: ['Weekday', 'Weekend']
    },
    keywords: {
      type: [String],
      required: true,
      default: []
    },
    categoryMatch: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Use existing model if it exists, otherwise create new one
module.exports = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);



