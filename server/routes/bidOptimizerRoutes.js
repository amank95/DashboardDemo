const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// Store running processes
const runningProcesses = new Map();

/**
 * POST /api/bid-optimizer/run
 * Start the bid optimizer with given configuration
 */
router.post('/run', (req, res) => {
    const {
        dryRun = false,
        generateReport = false,
        startBid,
        minBid,
        maxBid,
        keywords,
        products,
        cities,
        campaignName,
        overallBudget,
        startDate,
        endDate
    } = req.body;

    const runId = Date.now().toString();

    // Build command line arguments
    const args = [];

    if (dryRun) args.push('--dry-run');
    if (generateReport) args.push('--report');
    if (startBid) args.push(`--start-bid=${startBid}`);
    if (minBid) args.push(`--min-bid=${minBid}`);
    if (maxBid) args.push(`--max-bid=${maxBid}`);

    const scriptPath = path.join(__dirname, '../../automation/bid-optimizer/integrated.js');

    console.log(`[BidOptimizer] Starting run ${runId}`);
    console.log(`[BidOptimizer] Script: ${scriptPath}`);
    console.log(`[BidOptimizer] Args: ${args.join(' ')}`);

    const childProcess = spawn('node', [scriptPath, ...args], {
        cwd: path.join(__dirname, '../../automation/bid-optimizer'),
        env: { ...process.env, FORCE_COLOR: '0' }
    });

    // Store process info
    runningProcesses.set(runId, {
        process: childProcess,
        output: [],
        status: 'running',
        startTime: new Date()
    });

    childProcess.stdout.on('data', (data) => {
        const line = data.toString();
        const processInfo = runningProcesses.get(runId);
        if (processInfo) {
            processInfo.output.push({ type: 'stdout', text: line, time: Date.now() });
        }
    });

    childProcess.stderr.on('data', (data) => {
        const line = data.toString();
        const processInfo = runningProcesses.get(runId);
        if (processInfo) {
            processInfo.output.push({ type: 'stderr', text: line, time: Date.now() });
        }
    });

    childProcess.on('close', (code) => {
        const processInfo = runningProcesses.get(runId);
        if (processInfo) {
            processInfo.status = code === 0 ? 'completed' : 'failed';
            processInfo.exitCode = code;
            processInfo.endTime = new Date();
        }
        console.log(`[BidOptimizer] Run ${runId} finished with code ${code}`);
    });

    childProcess.on('error', (error) => {
        const processInfo = runningProcesses.get(runId);
        if (processInfo) {
            processInfo.status = 'error';
            processInfo.error = error.message;
        }
        console.error(`[BidOptimizer] Run ${runId} error:`, error);
    });

    res.json({
        success: true,
        runId,
        message: 'Bid optimizer started'
    });
});

/**
 * GET /api/bid-optimizer/stream/:runId
 * Server-Sent Events endpoint for live output
 */
router.get('/stream/:runId', (req, res) => {
    const { runId } = req.params;
    const processInfo = runningProcesses.get(runId);

    if (!processInfo) {
        return res.status(404).json({ error: 'Run not found' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    let lastIndex = 0;

    // Send existing output first
    processInfo.output.forEach((line, index) => {
        res.write(`data: ${JSON.stringify(line)}\n\n`);
        lastIndex = index + 1;
    });

    // Poll for new output
    const interval = setInterval(() => {
        const currentInfo = runningProcesses.get(runId);

        if (!currentInfo) {
            res.write(`data: ${JSON.stringify({ type: 'end', status: 'not_found' })}\n\n`);
            clearInterval(interval);
            res.end();
            return;
        }

        // Send any new output
        while (lastIndex < currentInfo.output.length) {
            res.write(`data: ${JSON.stringify(currentInfo.output[lastIndex])}\n\n`);
            lastIndex++;
        }

        // Check if process has ended
        if (currentInfo.status !== 'running') {
            res.write(`data: ${JSON.stringify({
                type: 'end',
                status: currentInfo.status,
                exitCode: currentInfo.exitCode
            })}\n\n`);
            clearInterval(interval);
            res.end();
        }
    }, 100);

    req.on('close', () => {
        clearInterval(interval);
    });
});

/**
 * GET /api/bid-optimizer/status/:runId
 * Get status of a specific run
 */
router.get('/status/:runId', (req, res) => {
    const { runId } = req.params;
    const processInfo = runningProcesses.get(runId);

    if (!processInfo) {
        return res.status(404).json({ error: 'Run not found' });
    }

    res.json({
        runId,
        status: processInfo.status,
        startTime: processInfo.startTime,
        endTime: processInfo.endTime,
        exitCode: processInfo.exitCode,
        outputLength: processInfo.output.length
    });
});

/**
 * POST /api/bid-optimizer/stop/:runId
 * Stop a running optimization
 */
router.post('/stop/:runId', (req, res) => {
    const { runId } = req.params;
    const processInfo = runningProcesses.get(runId);

    if (!processInfo) {
        return res.status(404).json({ error: 'Run not found' });
    }

    if (processInfo.status !== 'running') {
        return res.status(400).json({ error: 'Process is not running' });
    }

    try {
        processInfo.process.kill('SIGTERM');
        processInfo.status = 'stopped';
        res.json({ success: true, message: 'Process stopped' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to stop process' });
    }
});

/**
 * GET /api/bid-optimizer/output/:runId
 * Get all output from a run
 */
router.get('/output/:runId', (req, res) => {
    const { runId } = req.params;
    const processInfo = runningProcesses.get(runId);

    if (!processInfo) {
        return res.status(404).json({ error: 'Run not found' });
    }

    res.json({
        runId,
        status: processInfo.status,
        output: processInfo.output
    });
});

module.exports = router;
