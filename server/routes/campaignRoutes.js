const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

// POST /api/campaigns - Create a new campaign
router.post('/', campaignController.createCampaign);

// GET /api/campaigns - Get all campaigns
router.get('/', campaignController.getAllCampaigns);

module.exports = router;



