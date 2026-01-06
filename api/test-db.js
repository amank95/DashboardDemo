const connectDB = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('Testing MongoDB connection...');
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    await connectDB();
    
    return res.status(200).json({
      success: true,
      message: 'MongoDB connection successful',
      hasUri: !!process.env.MONGODB_URI
    });
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      hasUri: !!process.env.MONGODB_URI
    });
  }
};



