

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

let allDeals: any[] = [];

function loadTheCSVFile() {
  const filePath = path.join(__dirname, '../data/deals.csv');
  
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
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

function isClosedInQ1OrQ2(deal: any) {
  if (!deal.closed_date) return false;
  const year = deal.closed_date.substring(0, 4);
  const month = parseInt(deal.closed_date.substring(5, 7));
  return year === '2025' && month <= 6;
}

function isOpenInQ3(deal: any) {
  if (deal.closed_date) return false;
  const year = deal.created_date.substring(0, 4);
  const month = parseInt(deal.created_date.substring(5, 7));
  return year === '2025' && month >= 7 && month <= 9;
}

app.get('/api/metrics', (req, res) => {
  let totalWon = 0;
  let totalLost = 0;
  let totalDealValue = 0;
  let totalCycleDays = 0;
  let cycleCount = 0;

  for (let i = 0; i < allDeals.length; i++) {
    const deal = allDeals[i];
    
    if (isClosedInQ1OrQ2(deal)) {
      if (deal.stage === 'Closed Won') {
        totalWon = totalWon + 1;
        totalDealValue = totalDealValue + deal.deal_value;
        
        const created = new Date(deal.created_date);
        const closed = new Date(deal.closed_date);
        const days = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        totalCycleDays = totalCycleDays + (days > 0 ? days : 1);
        cycleCount = cycleCount + 1;
      } 
      else if (deal.stage === 'Closed Lost') {
        totalLost = totalLost + 1;
      }
    }
  }

  const conversionRate = totalLost + totalWon > 0 ? totalWon / (totalWon + totalLost) : 0.5;
  const avgDealSize = totalWon > 0 ? totalDealValue / totalWon : 15000;
  const avgSalesCycle = cycleCount > 0 ? totalCycleDays / cycleCount : 30;

  console.log('Metrics calculated from Q1 and Q2');

  res.json({
    conversionRate: conversionRate,
    avgDealSize: avgDealSize,
    avgSalesCycle: avgSalesCycle
  });
});

function calculateWeeklyRevenue(q3Deals: any[], conversionRate: number, sizeMultiplier: number, cycleShift: number) {
  const weeklyRevenue = [0,0,0,0,0,0,0,0,0,0,0,0,0]; // 13 weeks

  for (let i = 0; i < q3Deals.length; i++) {
    const deal = q3Deals[i];
    const expectedValue = deal.deal_value * conversionRate * sizeMultiplier;

    let weekIndex = 5;
    if (cycleShift < -3) weekIndex = 3;
    if (cycleShift > 3) weekIndex = 7;

    if (weekIndex < 0) weekIndex = 0;
    if (weekIndex > 12) weekIndex = 12;

    weeklyRevenue[weekIndex] = weeklyRevenue[weekIndex] + expectedValue;
  }

  let runningTotal = 0;
  const cumulativeWeekly = weeklyRevenue.map((value) => {
    runningTotal = runningTotal + value;
    return Math.round(runningTotal);
  });

  return {
    weekly_revenue: cumulativeWeekly,
    total_revenue: Math.round(runningTotal)
  };
}

app.post('/api/simulate', (req, res) => {
  const conversionChange = req.body.conversionChange || 0;
  const dealSizeChange = req.body.dealSizeChange || 0;
  const salesCycleChange = req.body.salesCycleChange || 0;

  
  let q3PipelineDeals = [];
  for (let i = 0; i < allDeals.length; i++) {
    if (isOpenInQ3(allDeals[i])) {
      q3PipelineDeals.push(allDeals[i]);
    }
  }

  
  let wonCount = 0;
  let lostCount = 0;
  let totalValue = 0;
  for (let i = 0; i < allDeals.length; i++) {
    const d = allDeals[i];
    if (isClosedInQ1OrQ2(d)) {
      if (d.stage === 'Closed Won') {
        wonCount = wonCount + 1;
        totalValue = totalValue + d.deal_value;
      } else if (d.stage === 'Closed Lost') {
        lostCount = lostCount + 1;
      }
    }
  }

  const baseConversion = wonCount + lostCount > 0 ? wonCount / (wonCount + lostCount) : 0.5;
  const baseDealSize = wonCount > 0 ? totalValue / wonCount : 15000;

  
  const baselineResult = calculateWeeklyRevenue(q3PipelineDeals, baseConversion, 1, 0);

  
  const newConversion = baseConversion * (1 + conversionChange / 100);
  const newSizeMultiplier = 1 + dealSizeChange / 100;
  const scenarioResult = calculateWeeklyRevenue(q3PipelineDeals, newConversion, newSizeMultiplier, salesCycleChange);

 
  const absoluteImpact = scenarioResult.total_revenue - baselineResult.total_revenue;
  const percentageImpact = baselineResult.total_revenue > 0 
    ? Math.round((absoluteImpact / baselineResult.total_revenue) * 100 * 10) / 10 
    : 0;

  const driversList = [];
  if (conversionChange !== 0) driversList.push(conversionChange > 0 ? 'Increase in conversion rate' : 'Decrease in conversion rate');
  if (dealSizeChange !== 0) driversList.push(dealSizeChange > 0 ? 'Increase in average deal size' : 'Decrease in average deal size');
  if (salesCycleChange !== 0) driversList.push('Change in sales cycle duration');

  if (driversList.length === 0) driversList.push('No changes applied');

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

const PORT = 5000;
app.listen(PORT, () => {
  console.log('Backend is running on port ' + PORT);
});