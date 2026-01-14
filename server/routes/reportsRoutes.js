const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, '../../automation/bid-optimizer/reports');

/**
 * GET /api/reports
 * List all reports in the reports directory
 */
router.get('/', (req, res) => {
    try {
        // Create reports directory if it doesn't exist
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
            return res.json({ reports: [] });
        }

        const files = fs.readdirSync(reportsDir);

        const reports = files
            .filter(file => file.endsWith('.pdf') || file.endsWith('.txt'))
            .map(file => {
                const filepath = path.join(reportsDir, file);
                const stats = fs.statSync(filepath);

                // Parse date from filename if possible (format: report_YYYY-MM-DD_HH-MM-SS.pdf)
                let createdDate = stats.mtime;
                const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/);
                if (dateMatch) {
                    const dateStr = dateMatch[1];
                    const timeStr = dateMatch[2].replace(/-/g, ':');
                    createdDate = new Date(`${dateStr}T${timeStr}`);
                }

                return {
                    name: file,
                    size: stats.size,
                    sizeFormatted: formatFileSize(stats.size),
                    createdAt: createdDate,
                    type: file.endsWith('.pdf') ? 'pdf' : 'txt',
                    path: `/api/reports/download/${encodeURIComponent(file)}`
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Most recent first

        res.json({ reports });
    } catch (error) {
        console.error('Error listing reports:', error);
        res.status(500).json({ error: 'Failed to list reports' });
    }
});

/**
 * GET /api/reports/download/:filename
 * Download a specific report file
 */
router.get('/download/:filename', (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        const filepath = path.join(reportsDir, filename);

        // Security check - prevent path traversal
        if (!filepath.startsWith(reportsDir)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const contentType = filename.endsWith('.pdf')
            ? 'application/pdf'
            : 'text/plain';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

        const fileStream = fs.createReadStream(filepath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading report:', error);
        res.status(500).json({ error: 'Failed to download report' });
    }
});

/**
 * DELETE /api/reports/:filename
 * Delete a specific report file
 */
router.delete('/:filename', (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        const filepath = path.join(reportsDir, filename);

        // Security check - prevent path traversal
        if (!filepath.startsWith(reportsDir)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Report not found' });
        }

        fs.unlinkSync(filepath);
        res.json({ success: true, message: 'Report deleted' });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ error: 'Failed to delete report' });
    }
});

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;
