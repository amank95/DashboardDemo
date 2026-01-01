const connectDB = require('./db');
const Campaign = require('./models/Campaign');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Connect to MongoDB
    console.log('Attempting to connect to MongoDB...');
    await connectDB();
    console.log('MongoDB connection established');

    if (req.method === 'POST') {
      // Create campaign
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
      return res.status(201).json({
        message: 'Campaign created successfully',
        campaign: savedCampaign
      });
    } else if (req.method === 'GET') {
      // Get all campaigns
      const campaigns = await Campaign.find()
        .sort({ createdAt: -1 })
        .exec();
      
      return res.status(200).json({
        count: campaigns.length,
        campaigns
      });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more detailed error information
    const errorMessage = error.message || 'Internal server error';
    const errorDetails = process.env.NODE_ENV === 'production' 
      ? 'An error occurred processing your request'
      : errorMessage;
    
    return res.status(500).json({ 
      error: errorDetails,
      message: errorMessage
    });
  }
};

