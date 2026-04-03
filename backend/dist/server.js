"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
//basic middleware setup
app.use((0, cors_1.default)());
app.use(express_1.default.json());
//store all deals from CSV
let allDeals = [];
//load CSV once when server starts
function loadTheCSVFile() {
    const filePath = path_1.default.join(__dirname, '../data/deals.csv');
    fs_1.default.createReadStream(filePath)
        .pipe((0, csv_parser_1.default)())
        .on('data', (row) => {
        // push each row into array
        allDeals.push({
            deal_id: row.deal_id,
            created_date: row.created_date,
            closed_date: row.closed_date || null,
            stage: row.stage,
            deal_value: parseFloat(row.deal_value),
            region: row.region,
            source: row.source
        });
    })
        .on('end', () => {
        console.log('CSV file loaded successfully. Total deals =', allDeals.length);
    });
}
loadTheCSVFile();
//check if deal is closed in Q1 or Q2
function isClosedInQ1OrQ2(deal) {
    if (!deal.closed_date)
        return false;
    const year = deal.closed_date.substring(0, 4);
    const month = parseInt(deal.closed_date.substring(5, 7));
    return year === '2025' && month <= 6;
}
//check if deal belongs to Q3 pipeline (open deals)
function isOpenInQ3(deal) {
    if (deal.closed_date)
        return false;
    const year = deal.created_date.substring(0, 4);
    const month = parseInt(deal.created_date.substring(5, 7));
    return year === '2025' && month >= 7 && month <= 9;
}
//calculate baseline metrics from Q1 & Q2
function getBaseMetrics() {
    let wonCount = 0;
    let lostCount = 0;
    let totalValue = 0;
    let totalCycleDays = 0;
    let cycleCount = 0;
    for (let i = 0; i < allDeals.length; i++) {
        const deal = allDeals[i];
        if (isClosedInQ1OrQ2(deal)) {
            if (deal.stage === 'Closed Won') {
                wonCount++;
                totalValue += deal.deal_value;
                // calculate sales cycle in days
                const created = new Date(deal.created_date);
                const closed = new Date(deal.closed_date);
                const days = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
                totalCycleDays += (days > 0 ? days : 1);
                cycleCount++;
            }
            else if (deal.stage === 'Closed Lost') {
                lostCount++;
            }
        }
    }
    //fallback values if no data available
    const baseConversion = (wonCount + lostCount) > 0 ? wonCount / (wonCount + lostCount) : 0.5;
    const baseDealSize = wonCount > 0 ? totalValue / wonCount : 15000;
    const baseSalesCycle = cycleCount > 0 ? totalCycleDays / cycleCount : 30;
    return { baseConversion, baseDealSize, baseSalesCycle };
}
//endpoint to fetch baseline metrics
app.get('/api/metrics', (req, res) => {
    const { baseConversion, baseDealSize, baseSalesCycle } = getBaseMetrics();
    res.json({
        conversionRate: baseConversion,
        avgDealSize: baseDealSize,
        avgSalesCycle: baseSalesCycle
    });
});
//map expected revenue into 13 weekly buckets
function calculateWeeklyRevenue(q3Deals, conversionRate, sizeMultiplier, cycleShift, baseCycleDays) {
    const weeklyRevenue = new Array(13).fill(0);
    const q3Start = new Date('2025-07-01');
    for (let i = 0; i < q3Deals.length; i++) {
        const deal = q3Deals[i];
        //expected deal value after applying changes
        const expectedValue = deal.deal_value * conversionRate * sizeMultiplier;
        const createdDate = new Date(deal.created_date);
        //adjust close date using sales cycle
        const expectedCloseDate = new Date(createdDate);
        expectedCloseDate.setDate(expectedCloseDate.getDate() + baseCycleDays + cycleShift);
        //calculate week index
        const diffDays = Math.floor((expectedCloseDate.getTime() - q3Start.getTime()) / (1000 * 60 * 60 * 24));
        let weekIndex = Math.floor(diffDays / 7);
        //keep within range 0–12
        if (weekIndex < 0)
            weekIndex = 0;
        if (weekIndex > 12)
            weekIndex = 12;
        weeklyRevenue[weekIndex] += expectedValue;
    }
    //convert to cumulative revenue
    let runningTotal = 0;
    const cumulativeWeekly = weeklyRevenue.map((value) => {
        runningTotal += value;
        return Math.round(runningTotal);
    });
    return {
        weekly_revenue: cumulativeWeekly,
        total_revenue: Math.round(runningTotal)
    };
}
//simulation endpoint
app.post('/api/simulate', (req, res) => {
    const conversionChange = req.body.conversionChange || 0;
    const dealSizeChange = req.body.dealSizeChange || 0;
    const salesCycleChange = req.body.salesCycleChange || 0;
    //filter Q3 open deals
    let q3PipelineDeals = [];
    for (let i = 0; i < allDeals.length; i++) {
        if (isOpenInQ3(allDeals[i])) {
            q3PipelineDeals.push(allDeals[i]);
        }
    }
    const { baseConversion, baseDealSize, baseSalesCycle } = getBaseMetrics();
    //baseline scenario (no changes)
    const baselineResult = calculateWeeklyRevenue(q3PipelineDeals, baseConversion, 1, 0, baseSalesCycle);
    //apply user changes
    const newConversion = baseConversion * (1 + conversionChange / 100);
    const newSizeMultiplier = 1 + dealSizeChange / 100;
    const scenarioResult = calculateWeeklyRevenue(q3PipelineDeals, newConversion, newSizeMultiplier, salesCycleChange, baseSalesCycle);
    //calculate impact
    const absoluteImpact = scenarioResult.total_revenue - baselineResult.total_revenue;
    const percentageImpact = baselineResult.total_revenue > 0
        ? Math.round((absoluteImpact / baselineResult.total_revenue) * 100 * 10) / 10
        : 0;
    //simple explanation of changes
    const driversList = [];
    if (conversionChange !== 0) {
        driversList.push(conversionChange > 0 ? "Increase in conversion rate" : "Decrease in conversion rate");
    }
    if (dealSizeChange !== 0) {
        driversList.push(dealSizeChange > 0 ? "Increase in average deal size" : "Decrease in average deal size");
    }
    if (salesCycleChange !== 0) {
        driversList.push(salesCycleChange < 0 ? "Decrease in sales cycle" : "Increase in sales cycle");
    }
    if (driversList.length === 0) {
        driversList.push("No changes applied");
    }
    console.log('Simulation completed successfully');
    res.json({
        baseline: baselineResult,
        scenario: scenarioResult,
        impact: {
            absolute: Math.round(absoluteImpact),
            percentage: percentageImpact
        },
        drivers: driversList
    });
});
//start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log('Backend is running on port ' + PORT);
});
