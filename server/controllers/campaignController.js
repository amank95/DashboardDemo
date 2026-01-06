const Campaign = require('../models/Campaign');

// Create a new campaign
exports.createCampaign = async (req, res) => {
  try {
    const {
      productId,
      productName,
      category,
      brand,
      currentRank,
      targetRank,
      adTypes,
      targeting
    } = req.body;

    // Validation
    if (!productId || !productName || !category || !brand || 
        currentRank === undefined || targetRank === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields in Section A' 
      });
    }

    if (!adTypes || adTypes.length === 0) {
      return res.status(400).json({ 
        error: 'At least one Ad Type must be selected' 
      });
    }

    if (!targeting || !targeting.city || !targeting.pincode || 
        !targeting.timeSlot || !targeting.dayType || 
        !targeting.keywords || targeting.categoryMatch === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields in Targeting Rules' 
      });
    }

    // Convert keywords string to array if needed
    let keywordsArray = targeting.keywords;
    if (typeof targeting.keywords === 'string') {
      keywordsArray = targeting.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
    }

    // Create campaign
    const campaign = new Campaign({
      productId,
      productName,
      category,
      brand,
      currentRank: parseInt(currentRank),
      targetRank: parseInt(targetRank) || 1,
      adTypes,
      targeting: {
        ...targeting,
        keywords: keywordsArray,
        pincode: parseInt(targeting.pincode)
      }
    });

    const savedCampaign = await campaign.save();
    res.status(201).json({
      message: 'Campaign created successfully',
      campaign: savedCampaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ 
      error: 'Failed to create campaign',
      details: error.message 
    });
  }
};

// Get all campaigns
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .exec();
    
    res.status(200).json({
      count: campaigns.length,
      campaigns
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ 
      error: 'Failed to fetch campaigns',
      details: error.message 
    });
  }
};





