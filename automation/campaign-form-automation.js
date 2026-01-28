/**
 * Campaign Form Automation Script
 * 
 * This script automates the 5-step campaign creation form at http://localhost:3000/
 * Uses Playwright to fill and submit the form programmatically.
 * 
 * Usage: node campaign-form-automation.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Screenshot output directory
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// ============================================
// CAMPAIGN CONFIGURATION - Modify these values
// ============================================
const campaignConfig = {
    // Step 1: Ad Format
    campaignName: 'Summer Sale 2024',
    advertisingObjective: 'performance', // 'performance' or 'reach'
    adAsset: 'productBooster', // 'productBooster' or 'recommendationAds'

    // Step 2: Ad Settings
    startDate: '01-07-2024',
    endDate: '31-07-2024',
    noEndDate: false,
    region: 'selectCities', // 'panIndia' or 'selectCities'
    // Available cities: New Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune,
    // Ahmedabad, Jaipur, Lucknow, Chandigarh, and more...
    cities: ['Mumbai', 'Bangalore', 'New Delhi'], // Cities to select

    // Step 3: Product Details
    // Available products: 'Pop Boba - Strawberry', 'Pop Boba - Mango', 
    // 'Pop Goli - Apple Mojito', 'Coco Poco - Tender Coconut'
    products: ['Pop Boba - Lychee', 'Coco Poco - Mango'], // Products to select by name
    selectAllProducts: false, // Set to true to select all products
    brands: ['Dobra'], // Filter by brands: Dobra
    categories: ['Beverages'], // Filter by categories: Beverages

    // Step 4: Targeting Options
    keywordTargeting: true,
    keywords: ['summer', 'sale', 'discount'],
    negativeKeywords: [],
    categoryTargeting: true,

    // Step 5: Budget Details
    budgetStrategy: 'overall', // 'overall' or 'daily'
    overallBudget: 50000,       // Total campaign budget (fixed)
    budgetAmount: 100,          // Keyword bid amount (optimized by bid optimizer)
};

// ============================================
// AUTOMATION FUNCTIONS
// ============================================

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Create screenshots directory if it doesn't exist
function ensureScreenshotDir() {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
}

// Take a screenshot with timestamp
async function takeScreenshot(page, stepName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${stepName}_${timestamp}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`   📸 Screenshot saved: ${filename}`);
    return filepath;
}

async function fillCampaignForm(config, options = {}) {
    console.log('🚀 Starting Campaign Form Automation...\n');

    // Ensure screenshot directory exists
    ensureScreenshotDir();
    console.log(`📁 Screenshots will be saved to: ${SCREENSHOT_DIR}\n`);

    const browser = await chromium.launch({
        headless: options.headless !== undefined ? options.headless : false,
        slowMo: options.slowMo !== undefined ? options.slowMo : 100,
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
    });

    const page = await context.newPage();

    try {
        // Navigate to the form
        console.log('📍 Navigating to http://localhost:3000/...');
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
        await delay(1000);

        // ========== STEP 1: Ad Format ==========
        console.log('\n📝 Step 1: Filling Ad Format...');

        // Campaign Name
        const campaignNameInput = page.locator('input[placeholder*="Trial"], input[name*="campaign"], input[type="text"]').first();
        await campaignNameInput.click();
        await campaignNameInput.fill(config.campaignName);
        console.log(`   ✓ Campaign Name: ${config.campaignName}`);

        // Advertising Objective
        if (config.advertisingObjective === 'performance') {
            await page.click('text=Performance');
            console.log('   ✓ Objective: Performance');
        } else {
            await page.click('text=Reach');
            console.log('   ✓ Objective: Reach');
        }

        // Ad Asset
        await page.evaluate(() => window.scrollBy(0, 300));
        await delay(500);

        if (config.adAsset === 'productBooster') {
            await page.click('text=Product Booster');
            console.log('   ✓ Ad Asset: Product Booster');
        } else {
            await page.click('text=Recommendation Ads');
            console.log('   ✓ Ad Asset: Recommendation Ads');
        }

        // Take screenshot of Step 1 before proceeding
        await page.evaluate(() => window.scrollTo(0, 0));
        await delay(300);
        await takeScreenshot(page, 'Step1_AdFormat');

        // Click Next
        await page.evaluate(() => window.scrollBy(0, 500));
        await delay(500);
        await page.click('button:has-text("Next")');
        await delay(1000);

        // ========== STEP 2: Ad Settings ==========
        console.log('\n📝 Step 2: Filling Ad Settings...');

        // Start Date
        const startDateInput = page.locator('input[type="date"], input[placeholder*="dd-mm-yyyy"]').first();
        await startDateInput.click();
        // Convert date format if needed
        const startDateValue = convertDateFormat(config.startDate);
        await startDateInput.fill(startDateValue);
        console.log(`   ✓ Start Date: ${config.startDate}`);

        // End Date (if not no end date)
        if (!config.noEndDate) {
            const endDateInput = page.locator('input[type="date"], input[placeholder*="dd-mm-yyyy"]').nth(1);
            await endDateInput.click();
            const endDateValue = convertDateFormat(config.endDate);
            await endDateInput.fill(endDateValue);
            console.log(`   ✓ End Date: ${config.endDate}`);
        } else {
            await page.click('text=No End Date');
            console.log('   ✓ No End Date: Enabled');
        }

        // Campaign Region
        if (config.region === 'panIndia') {
            await page.click('text=Pan India');
            console.log('   ✓ Region: Pan India');
        } else {
            // Select Cities option
            await page.click('text=Select Cities');
            await delay(500);
            console.log('   ✓ Region: Select Cities');

            // Select individual cities from the checklist
            if (config.cities && config.cities.length > 0) {
                for (const city of config.cities) {
                    try {
                        // Find and click the city checkbox/label
                        const cityLabel = page.locator(`label:has-text("${city}")`).first();
                        if (await cityLabel.isVisible({ timeout: 2000 })) {
                            await cityLabel.click();
                            console.log(`   ✓ Selected City: ${city}`);
                            await delay(200);
                        } else {
                            // Try scrolling to find the city
                            await page.evaluate(() => window.scrollBy(0, 100));
                            await delay(200);
                            const cityLabelRetry = page.locator(`label:has-text("${city}")`).first();
                            if (await cityLabelRetry.isVisible({ timeout: 1000 })) {
                                await cityLabelRetry.click();
                                console.log(`   ✓ Selected City: ${city}`);
                            } else {
                                console.log(`   ⚠ City not found: ${city}`);
                            }
                        }
                    } catch (e) {
                        console.log(`   ⚠ Could not select city: ${city}`);
                    }
                }
            } else {
                console.log('   ⏭ No cities specified in config');
            }
        }

        // Take screenshot of Step 2 before proceeding
        await page.evaluate(() => window.scrollTo(0, 0));
        await delay(300);
        await takeScreenshot(page, 'Step2_AdSettings');

        // Click Next
        await page.click('button:has-text("Next")');
        await delay(1000);

        // ========== STEP 3: Product Details ==========
        console.log('\n📝 Step 3: Filling Product Details...');

        // Wait for the product selection page to load
        await delay(500);

        // Click the "Select products" dropdown to open it
        const productDropdown = page.locator('input[placeholder*="Select products"], [placeholder*="products"]').first();
        await productDropdown.click();
        await delay(500);

        if (config.selectAllProducts) {
            // Click "Select All" checkbox
            const selectAllCheckbox = page.locator('text=Select All').first();
            if (await selectAllCheckbox.isVisible()) {
                await selectAllCheckbox.click();
                console.log('   ✓ Selected All Products');
            }
        } else if (config.products.length > 0) {
            // Select individual products by name
            for (const productName of config.products) {
                try {
                    // Look for the product in the dropdown list
                    const productOption = page.locator(`text=${productName}`).first();
                    if (await productOption.isVisible({ timeout: 2000 })) {
                        await productOption.click();
                        console.log(`   ✓ Selected Product: ${productName}`);
                        await delay(300);

                        // Re-open dropdown for next product
                        if (config.products.indexOf(productName) < config.products.length - 1) {
                            await productDropdown.click();
                            await delay(300);
                        }
                    } else {
                        console.log(`   ⚠ Product not found: ${productName}`);
                    }
                } catch (e) {
                    console.log(`   ⚠ Could not select: ${productName}`);
                }
            }
        } else {
            console.log('   ⏭ No products specified in config');
        }

        // Close dropdown by clicking elsewhere
        await page.click('body', { position: { x: 10, y: 10 } });
        await delay(500);

        // Take screenshot of Step 3 before proceeding
        await page.evaluate(() => window.scrollTo(0, 0));
        await delay(300);
        await takeScreenshot(page, 'Step3_ProductDetails');

        // Click Next to proceed to Step 4
        await page.click('button:has-text("Next")');
        await delay(1000);

        // ========== STEP 4: Targeting Options ==========
        console.log('\n📝 Step 4: Filling Targeting Options...');

        // Scroll down to see the Suggested keywords section
        await page.evaluate(() => window.scrollBy(0, 200));
        await delay(500);

        // Select keywords from suggested list
        // IMPORTANT: Keywords are <button> elements with React onClick handlers
        // Must use Playwright's click method to trigger React synthetic events
        const keywordsToSelect = config.keywords.length > 0
            ? config.keywords
            : ['dobra', 'dobra drinks', 'dobra beverages', 'dobra snacks', 'dobra confentionery', 'boba drink',
                'pop boba',
                'fruit boba',
                'flavoured boba',
                'goli soda',
                'pop goli',
                'flavoured soda',
                'masala soda',
                'mango drink',
                'lychee drink',
                'strawberry drink',
                'coconut drink',
                'tender coconut drink'];
        // Default fallback keywords

        let keywordsSelected = 0;

        for (const keyword of keywordsToSelect) {
            try {
                console.log(`   🔍 Looking for keyword button: ${keyword}`);

                // The keyword cards are <button> elements with text content
                // Use Playwright locator to find button containing the keyword text
                // Look for buttons that contain the keyword and "(searches)" text
                const keywordButton = page.locator(`button:has-text("${keyword}"):has-text("searches")`).first();

                if (await keywordButton.isVisible({ timeout: 2000 })) {
                    // Check if button is disabled (already selected)
                    const isDisabled = await keywordButton.isDisabled();
                    if (!isDisabled) {
                        await keywordButton.scrollIntoViewIfNeeded();
                        await keywordButton.click();
                        console.log(`   ✓ Clicked keyword button: ${keyword}`);
                        keywordsSelected++;
                        await delay(1000); // Wait for React state to update
                    } else {
                        console.log(`   ⏭ Keyword already selected: ${keyword}`);
                    }
                } else {
                    // Try alternative selector - button with exact keyword text
                    const altButton = page.locator(`button:has(div:text-is("${keyword}"))`).first();
                    if (await altButton.isVisible({ timeout: 500 })) {
                        const isDisabled = await altButton.isDisabled();
                        if (!isDisabled) {
                            await altButton.click();
                            console.log(`   ✓ Clicked keyword button (alt): ${keyword}`);
                            keywordsSelected++;
                            await delay(1000);
                        }
                    } else {
                        console.log(`   ⚠ Keyword button not found: ${keyword}`);
                    }
                }
            } catch (e) {
                console.log(`   ⚠ Could not select keyword: ${keyword} - ${e.message}`);
            }
        }

        // If no keywords were selected, try clicking the first available keyword buttons
        if (keywordsSelected === 0) {
            console.log('   ⚠ No specified keywords found, trying to click first available buttons...');

            // Find all keyword buttons (buttons that contain "searches" text)
            const keywordButtons = page.locator('button:has-text("searches")');
            const count = await keywordButtons.count();
            console.log(`   📊 Found ${count} keyword buttons`);

            for (let i = 0; i < Math.min(count, 2); i++) {
                try {
                    const btn = keywordButtons.nth(i);
                    if (await btn.isVisible() && !await btn.isDisabled()) {
                        await btn.click();
                        console.log(`   ✓ Clicked keyword button #${i + 1}`);
                        keywordsSelected++;
                        await delay(1000);
                    }
                } catch (e) { }
            }
        }

        // Wait for selected keywords section to fully update
        await delay(2000);

        // Check how many bid inputs are now available
        const bidInputCount = await page.locator('input[placeholder="Enter..."]').count();
        console.log(`   📊 Bid inputs available after selection: ${bidInputCount}`);

        // Now enter bid amount for each selected keyword
        // The bid input is a number input inside the Selected keywords section
        // It has placeholder="Enter..." and is wrapped in a div with ₹ prefix

        // Support per-keyword bids (keywordBids) or single bid (budgetAmount)
        const hasPerKeywordBids = config.keywordBids && Object.keys(config.keywordBids).length > 0;

        if (hasPerKeywordBids || config.budgetAmount) {
            if (hasPerKeywordBids) {
                console.log('   💰 Using per-keyword bids:');
                for (const [kw, bid] of Object.entries(config.keywordBids)) {
                    console.log(`      • "${kw}": ₹${bid}`);
                }
            } else {
                console.log(`   💰 Target bid amount: ₹${config.budgetAmount} (same for all)`);
            }

            // Try multiple selectors for bid inputs
            // Selector 1: input with placeholder="Enter..."
            let bidInputs = page.locator('input[placeholder="Enter..."]');
            let bidCount = await bidInputs.count();

            // Selector 2: If not found, try number inputs in the Selected keywords section
            if (bidCount === 0) {
                console.log('   🔍 Trying alternative selector for bid inputs...');
                bidInputs = page.locator('input[type="number"]');
                bidCount = await bidInputs.count();
            }

            // Selector 3: Look for inputs near the ₹ symbol
            if (bidCount === 0) {
                console.log('   🔍 Trying to find inputs near currency symbol...');
                bidInputs = page.locator('div.relative.w-full input');
                bidCount = await bidInputs.count();
            }

            console.log(`   📊 Found ${bidCount} bid input field(s)`);

            // Get the keywords that were selected (for mapping bids)
            const selectedKeywords = keywordsToSelect.slice(0, bidCount);

            if (bidCount > 0) {
                for (let i = 0; i < bidCount; i++) {
                    try {
                        const bidInput = bidInputs.nth(i);
                        if (await bidInput.isVisible({ timeout: 500 })) {
                            await bidInput.scrollIntoViewIfNeeded();

                            // Read current bid value before changing
                            const currentBidValue = await bidInput.inputValue();

                            // Determine bid for this keyword
                            const keyword = selectedKeywords[i] || `keyword_${i + 1}`;
                            let targetBid;

                            if (hasPerKeywordBids) {
                                // Use per-keyword bid if available, fallback to budgetAmount or default
                                targetBid = config.keywordBids[keyword] || config.budgetAmount || 100;
                            } else {
                                targetBid = config.budgetAmount;
                            }

                            // Clear and set new bid value
                            await bidInput.click();
                            await bidInput.fill('');
                            await delay(100);
                            await bidInput.type(String(targetBid));

                            // Verify the bid was set correctly
                            await delay(200);
                            const newBidValue = await bidInput.inputValue();
                            if (newBidValue === String(targetBid)) {
                                console.log(`   ✓ "${keyword}": ₹${currentBidValue || '0'} → ₹${targetBid} (verified)`);
                            } else {
                                console.log(`   ⚠ "${keyword}": Set to ₹${targetBid}, but value shows ₹${newBidValue}`);
                            }
                            await delay(100);
                        }
                    } catch (e) {
                        console.log(`   ⚠ Could not set bid for keyword #${i + 1}: ${e.message}`);
                    }
                }
            } else {
                console.log('   ⚠ No bid input fields found - keywords may not be selected');
                // Take a debug screenshot
                await takeScreenshot(page, 'Step4_Debug_NoBidInputs');
            }
        }

        // Scroll down to see more options
        await page.evaluate(() => window.scrollBy(0, 300));
        await delay(500);

        // Take screenshot of Step 4 before proceeding
        await page.evaluate(() => window.scrollTo(0, 0));
        await delay(300);
        await takeScreenshot(page, 'Step4_TargetingOptions');

        // Click Next
        await page.click('button:has-text("Next")');
        await delay(1000);

        // ========== STEP 5: Budget Details ==========
        console.log('\n📝 Step 5: Filling Budget Details...');

        // Budget Strategy
        if (config.budgetStrategy === 'overall') {
            await page.click('text=Overall campaign budget');
            console.log('   ✓ Strategy: Overall Campaign Budget');
        } else {
            await page.click('text=Daily budget');
            console.log('   ✓ Strategy: Daily Budget');
        }

        await delay(500);

        // Budget Amount - ALWAYS use overallBudget (fixed), never the keyword bid amount
        // The overall campaign budget stays constant, only keyword bids change per iteration
        const overallBudget = config.overallBudget || 50000;  // Fixed budget, never uses budgetAmount
        const budgetInput = page.locator('input[placeholder*="Budget"], input[type="number"]').first();
        await budgetInput.click();
        await budgetInput.fill(overallBudget.toString());
        console.log(`   ✓ Overall Budget: ₹${overallBudget} (fixed)`);
        console.log(`   📝 Note: Only keyword bids change per iteration, overall budget stays at ₹${overallBudget}`);

        // Take screenshot of Step 5 before submitting
        await page.evaluate(() => window.scrollTo(0, 0));
        await delay(300);
        await takeScreenshot(page, 'Step5_BudgetDetails');

        // Submit Campaign
        console.log('\n🎯 Submitting Campaign...');
        await delay(500);

        // Look for submit button
        const submitButton = page.locator('button:has-text("Submit Campaign"), button:has-text("Submit")');
        if (await submitButton.isVisible()) {
            await submitButton.click();
            console.log('✅ Campaign submitted successfully!');
        } else {
            console.log('⚠️ Submit button not found - form may need manual submission');
        }

        // Wait for submission response
        await delay(2000);

        // Take final screenshot after submission
        await takeScreenshot(page, 'Step6_SubmissionComplete');

        console.log('\n🎉 Automation Complete!');
        console.log(`\n📁 All screenshots saved to: ${SCREENSHOT_DIR}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('❌ Error during automation:', error.message);
        throw error;
    } finally {
        // Keep browser open for review (close after 5 seconds)
        console.log('\n⏱️ Closing browser in 5 seconds...');
        await delay(5000);
        await browser.close();
    }
}

// Helper function to convert date format
function convertDateFormat(dateStr) {
    // Convert dd-mm-yyyy to yyyy-mm-dd (for date input)
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
}

// ============================================
// EXPORTS FOR PROGRAMMATIC USE
// ============================================

/**
 * Run campaign automation with custom config
 * @param {object} customConfig - Override default campaign config
 * @param {object} options - { headless: true/false, slowMo: number }
 * @returns {Promise<void>}
 */
async function runCampaignAutomation(customConfig = {}, options = { headless: false, slowMo: 50 }) {
    const mergedConfig = { ...campaignConfig, ...customConfig };
    return fillCampaignForm(mergedConfig, options);
}

module.exports = {
    runCampaignAutomation,
    fillCampaignForm,
    campaignConfig
};

// ============================================
// RUN IF CALLED DIRECTLY
// ============================================
if (require.main === module) {
    fillCampaignForm(campaignConfig)
        .then(() => {
            console.log('Script finished successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}
