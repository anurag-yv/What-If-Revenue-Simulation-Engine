// App.tsx
import { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [convChange, setConvChange] = useState(10);
  const [dealChange, setDealChange] = useState(15);
  const [cycleChange, setCycleChange] = useState(-5);

  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSimulation = async () => {
    setIsLoading(true);
    const res = await fetch('http://localhost:5000/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversionChange: convChange,
        dealSizeChange: dealChange,
        salesCycleChange: cycleChange
      })
    });
    const data = await res.json();
    setResult(data);
    setIsLoading(false);
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSimulation();
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [convChange, dealChange, cycleChange]);

  const myChartData = {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13'],
    datasets: [
      {
        label: 'Baseline',
        data: result?.baseline?.weekly_revenue || [],
        borderColor: '#e57a16',
        backgroundColor: 'rgba(44, 122, 110, 0.1)',
        tension: 0.3,
        borderWidth: 2
      },
      {
        label: 'My Scenario',
        data: result?.scenario?.weekly_revenue || [],
        borderColor: '#1f59e2',
        backgroundColor: 'rgba(185, 95, 137, 0.1)',
        tension: 0.3,
        borderWidth: 2
      }
    ]
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', color: '#cf8d30' }}>
          What-If Revenue Simulation Engine
        </h1>
        <p style={{ color: '#cf8d30' }}>
          Based on Q1 & Q2 data → predict Q3 revenue
        </p>
      </div>

      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: '12px', 
        padding: '25px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '20px' }}>
          Simulation Controls
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div>
            <label>Conversion Rate</label>
            <input 
              type="range" 
              min="-30" 
              max="30" 
              value={convChange}
              onChange={(e) => setConvChange(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>
              {convChange >= 0 ? '+' : ''}{convChange}%
            </div>
          </div>

          <div>
            <label>Average Deal Size</label>
            <input 
              type="range" 
              min="-30" 
              max="30" 
              value={dealChange}
              onChange={(e) => setDealChange(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>
              {dealChange >= 0 ? '+' : ''}{dealChange}%
            </div>
          </div>

          <div>
            <label>Sales Cycle (days)</label>
            <input 
              type="range" 
              min="-15" 
              max="15" 
              value={cycleChange}
              onChange={(e) => setCycleChange(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>
              {cycleChange >= 0 ? '+' : ''}{cycleChange} days
            </div>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={isLoading}
          style={{
            marginTop: '30px',
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            backgroundColor: '#cf8d30',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {isLoading ? 'Updating...' : 'Run Simulation'}
        </button>
        
        {lastUpdated && (
          <p style={{ textAlign: 'center', marginTop: '10px', color: '#dcc553', fontSize: '12px' }}>
            Last updated: {lastUpdated}
          </p>
        )}
      </div>

      {result && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '400px', backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>
              Weekly Revenue Comparison
            </h3>
            <Line data={myChartData} />
          </div>

          <div style={{ flex: 1, minWidth: '250px', backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3>Insights</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <span>Baseline Revenue</span>
                <span><strong>₹{result.baseline.total_revenue.toLocaleString()}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <span>Scenario Revenue</span>
                <span><strong style={{ color: '#b95f89' }}>₹{result.scenario.total_revenue.toLocaleString()}</strong></span>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <span>Impact</span>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c7a6e' }}>
                +₹{result.impact.absolute.toLocaleString()} ({result.impact.percentage}%)
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <span>Key Drivers</span>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                {result.drivers.map((d: string, i: number) => (
                  <li key={i} style={{ marginBottom: '5px' }}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: '40px', color: '#aaa', fontSize: '12px' }}>
        Built for SkyGeni
      </p>
    </div>
  );
}

export default App;