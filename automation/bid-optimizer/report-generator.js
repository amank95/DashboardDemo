/**
 * Report Generator
 * 
 * Generates detailed optimization reports in PDF format.
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

class ReportGenerator {
    constructor() {
        this.reportsDir = path.join(__dirname, 'reports');
    }

    /**
     * Generate and save a PDF report from optimization data
     * @param {object} data - Optimization result data
     * @param {string} filename - Optional custom filename
     * @returns {string} - Path to saved file
     */
    generatePDF(data, filename = null) {
        const {
            campaignConfig = {},
            optimalBids = {},
            totalSavings = 0,
            iterations = 0,
            history = [],
            startingBid = 0,
            keywords = []
        } = data;

        // Create reports directory if it doesn't exist
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }

        // Generate filename with timestamp
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
        const defaultFilename = `report_${dateStr}_${timeStr}.pdf`;
        const filepath = path.join(this.reportsDir, filename || defaultFilename);

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('BID OPTIMIZATION REPORT', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(`Generated: ${now.toLocaleString('en-IN')}`, { align: 'center' });
        doc.moveDown(1);

        // Horizontal line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        // Campaign Details Section
        doc.fontSize(16).font('Helvetica-Bold').text('CAMPAIGN DETAILS');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Campaign Name: ${campaignConfig.campaignName || 'N/A'}`);
        doc.text(`Start Date: ${campaignConfig.startDate || 'N/A'}`);
        doc.text(`End Date: ${campaignConfig.endDate || 'N/A'}`);
        doc.text(`Products: ${(campaignConfig.products || []).join(', ') || 'N/A'}`);
        doc.text(`Target Regions: ${(campaignConfig.cities || []).join(', ') || 'N/A'}`);
        doc.moveDown(1);

        // Optimization Settings Section
        doc.fontSize(16).font('Helvetica-Bold').text('OPTIMIZATION SETTINGS');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Starting Bid: Rs. ${startingBid.toLocaleString('en-IN')} (per keyword)`);
        doc.text(`Max Iterations: ${data.maxIterations || 25}`);
        doc.text(`Strategy: Decreasing Percentage (5% -> 1%)`);
        doc.moveDown(1);

        // Results Table Section
        doc.fontSize(16).font('Helvetica-Bold').text('RESULTS PER KEYWORD');
        doc.moveDown(0.5);

        // Table header
        const tableTop = doc.y;
        const tableLeft = 50;
        const colWidths = [100, 80, 90, 80, 90];
        const headers = ['Keyword', 'Start Bid', 'Final Bid', 'Saved', 'Status'];

        // Draw table header
        doc.fontSize(10).font('Helvetica-Bold');
        let xPos = tableLeft;
        headers.forEach((header, i) => {
            doc.text(header, xPos, tableTop, { width: colWidths[i], align: 'left' });
            xPos += colWidths[i];
        });

        doc.moveDown(0.5);
        doc.moveTo(tableLeft, doc.y).lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), doc.y).stroke();
        doc.moveDown(0.5);

        // Table rows
        let keywordsWithRank1 = 0;
        doc.font('Helvetica').fontSize(10);

        keywords.forEach(kw => {
            const finalBid = optimalBids[kw];
            const saved = finalBid ? startingBid - finalBid : 0;
            const status = finalBid ? 'Rank 1' : 'Exceeded';

            if (finalBid) keywordsWithRank1++;

            xPos = tableLeft;
            const rowY = doc.y;
            doc.text(kw, xPos, rowY, { width: colWidths[0] }); xPos += colWidths[0];
            doc.text(`Rs. ${startingBid.toLocaleString('en-IN')}`, xPos, rowY, { width: colWidths[1] }); xPos += colWidths[1];
            doc.text(finalBid ? `Rs. ${finalBid.toLocaleString('en-IN')}` : 'N/A', xPos, rowY, { width: colWidths[2] }); xPos += colWidths[2];
            doc.text(saved > 0 ? `Rs. ${saved.toLocaleString('en-IN')}` : '-', xPos, rowY, { width: colWidths[3] }); xPos += colWidths[3];
            doc.text(status, xPos, rowY, { width: colWidths[4] });
            doc.moveDown(0.5);
        });

        doc.moveDown(1);

        // Savings Summary Section
        const avgSavings = keywordsWithRank1 > 0 ? ((totalSavings / (startingBid * keywordsWithRank1)) * 100).toFixed(1) : 0;

        doc.fontSize(16).font('Helvetica-Bold').text('SAVINGS SUMMARY');
        doc.moveDown(0.5);

        // Savings box
        doc.rect(50, doc.y, 200, 80).stroke();
        const boxTop = doc.y + 10;
        doc.fontSize(11).font('Helvetica');
        doc.text(`Total Keywords: ${keywords.length}`, 60, boxTop);
        doc.text(`Keywords with Rank 1: ${keywordsWithRank1}`, 60, boxTop + 18);
        doc.fontSize(14).font('Helvetica-Bold').fillColor('green');
        doc.text(`Total Saved: Rs. ${totalSavings.toLocaleString('en-IN')}`, 60, boxTop + 40);
        doc.fontSize(11).font('Helvetica').fillColor('black');
        doc.text(`Average Savings: ${avgSavings}%`, 60, boxTop + 58);

        doc.y = boxTop + 90;
        doc.moveDown(1);

        // Optimization History Section (if space allows)
        if (doc.y < 500) {
            doc.fontSize(16).font('Helvetica-Bold').text('OPTIMIZATION HISTORY');
            doc.moveDown(0.5);
            doc.fontSize(9).font('Helvetica');

            // Show condensed history
            const maxRows = Math.min(history.length, 10);
            for (let i = 0; i < maxRows; i++) {
                const iter = history[i];
                let rowText = `Iter ${iter.iteration}: `;
                keywords.forEach(kw => {
                    const kwData = iter.keywords[kw];
                    if (kwData) {
                        rowText += `${kw}=Rs.${kwData.bid}(R${kwData.rank}) `;
                    }
                });
                doc.text(rowText);
            }
            if (history.length > 10) {
                doc.text(`... and ${history.length - 10} more iterations`);
            }
        }

        // Footer
        doc.moveDown(2);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica-Bold').text('OPTIMIZATION COMPLETE', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(`Total Iterations: ${iterations}`, { align: 'center' });

        // Finalize PDF
        doc.end();

        return filepath;
    }
}

module.exports = ReportGenerator;
