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
