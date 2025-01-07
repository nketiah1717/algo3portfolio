import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

export const calculateMetrics = (returns) => {
  const totalGrossPnl = returns.reduce((acc, curr) => acc + curr, 0);
  const dailyMeanPnl = totalGrossPnl / returns.length;
  const dailyStdDev = Math.sqrt(
    returns.map((r) => Math.pow(r - dailyMeanPnl, 2)).reduce((a, b) => a + b, 0) / returns.length
  );
  const sharpeRatio = (dailyMeanPnl / dailyStdDev) * Math.sqrt(252);

  // Calculate cumulative returns
  const cumulativeReturns = returns.reduce((acc, curr) => {
    acc.push((acc[acc.length - 1] || 0) + curr);
    return acc;
  }, []);

  // Calculate max drawdown
  let peak = -Infinity;
  let maxDrawdown = 0;

  cumulativeReturns.forEach((value) => {
    peak = Math.max(peak, value); // Update peak
    maxDrawdown = Math.min(maxDrawdown, value - peak); // Calculate drawdown from peak
  });

  return {
    grossPnl: (totalGrossPnl * 100).toFixed(2) + '%',
    dailyMeanPnl: (dailyMeanPnl * 100).toFixed(2) + '%',
    dailyStdDev: (dailyStdDev * 100).toFixed(2) + '%',
    sharpeRatio: sharpeRatio.toFixed(2),
    maxRunUp: (Math.max(...cumulativeReturns) * 100).toFixed(2) + '%',
    maxDrawdown: (maxDrawdown * 100).toFixed(2) + '%',
  };
};

export const aggregatePnL = (data, interval) => {
  const groupedPnL = [];
  for (let i = 0; i < data.length; i += interval) {
    const chunk = data.slice(i, i + interval);
    const aggregated = chunk.reduce((acc, curr) => acc + curr, 0);
    groupedPnL.push(aggregated);
  }
  return groupedPnL;
};

export const aggregatePnLByMonth = (returns, dates) => {
  const monthlyPnL = [];
  const monthlyLabels = [];
  let currentMonth = new Date(dates[0]).getMonth();
  let currentYear = new Date(dates[0]).getFullYear();
  let monthlySum = 0;

  for (let i = 0; i < returns.length; i++) {
    const date = new Date(dates[i]);
    if (date.getMonth() !== currentMonth || date.getFullYear() !== currentYear) {
      // Push the sum and label for the previous month
      monthlyPnL.push(monthlySum);
      monthlyLabels.push(`${currentMonth + 1}/1/${currentYear}`);
      // Update month and year
      currentMonth = date.getMonth();
      currentYear = date.getFullYear();
      monthlySum = 0; // Reset sum for new month
    }
    monthlySum += returns[i];
  }

  // Push the final month's PnL and label
  monthlyPnL.push(monthlySum);
  monthlyLabels.push(dates[dates.length - 1]); // Ensure the last date is included

  return { monthlyPnL, monthlyLabels };
};




const TradingResults = () => {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/assets/files/results.csv');
      const reader = response.body.getReader();
      const result = await reader.read();
      const decoder = new TextDecoder('utf-8');
      const csv = decoder.decode(result.value);

      Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        complete: (parsedData) => {
          const returns = parsedData.data.map((row) => parseFloat(row['Daily return'].replace('%', '')) / 100);
          const computedMetrics = calculateMetrics(returns);
          setMetrics(computedMetrics);
        },
      });
    };

    fetchData();
  }, []);

  return null; // No UI rendering
};

export default TradingResults;
