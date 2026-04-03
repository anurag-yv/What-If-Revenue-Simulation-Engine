
//React hooks for state, lifecycle, and debouncing
import { useState, useEffect, useRef } from 'react';

//Chart component for rendering line graph
import { Line } from 'react-chartjs-2';

//Import required Chart.js modules
import {
  Chart as ChartJS,
  CategoryScale,   // X-axis categories
  LinearScale,     // Y-axis scale
  PointElement,    // Data points
  LineElement,     // Line graph
  Title,
  Tooltip,
  Legend
} from 'chart.js';

//Register all chart components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {

  // Slider state values (user inputs)
  const [convChange, setConvChange] = useState(10);   // Conversion rate %
  const [dealChange, setDealChange] = useState(15);   // Deal size %
  const [cycleChange, setCycleChange] = useState(-5); // Sales cycle change (days)

  //API response data
  const [result, setResult] = useState<any>(null);

  //Loading state for button
  const [isLoading, setIsLoading] = useState(false);

  //Last updated timestamp
  const [lastUpdated, setLastUpdated] = useState<string>('');

  //Ref used for debounce (prevents too many API calls)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  //Function to call backend simulation API
  const runSimulation = async () => {
    setIsLoading(true);

    //API request to backend
    const res = await fetch('http://localhost:5000/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },

      //Sending slider values to backend
      body: JSON.stringify({
        conversionChange: convChange,
        dealSizeChange: dealChange,
        salesCycleChange: cycleChange
      })
    });

    //Parse response
    const data = await res.json();

    //Store result in state
    setResult(data);

    //Stop loading
    setIsLoading(false);

    //Save last update time
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  //Debounce effect → runs simulation after user stops moving sliders
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    //Wait 600ms before calling API
    debounceRef.current = setTimeout(() => {
      runSimulation();
    }, 600);

    //Cleanup timeout on re-render
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [convChange, dealChange, cycleChange]);

  //Data for chart visualization
  const myChartData = {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13'],
    datasets: [
      {
        label: 'Baseline', // Original revenue
        data: result?.baseline?.weekly_revenue || [],
        borderColor: '#e57a16',
        backgroundColor: 'rgba(44, 122, 110, 0.1)',
        tension: 0.3,
        borderWidth: 2
      },
      {
        label: 'My Scenario', // User-adjusted revenue
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

      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', color: '#cf8d30' }}>
          What-If Revenue Simulation Engine
        </h1>
        <p style={{ color: '#cf8d30' }}>
          Based on Q1 & Q2 data → predict Q3 revenue
        </p>
      </div>

      {/* Simulation Controls Card */}
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

        {/* Sliders Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

          {/* Conversion Rate Slider */}
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

          {/* Deal Size Slider */}
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

          {/* Sales Cycle Slider */}
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

        {/* Manual Run Button */}
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
        
        {/* Last Updated Time */}
        {lastUpdated && (
          <p style={{ textAlign: 'center', marginTop: '10px', color: '#dcc553', fontSize: '12px' }}>
            Last updated: {lastUpdated}
          </p>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

          {/* Chart Card */}
          <div style={{ flex: 2, minWidth: '400px', backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>
              Weekly Revenue Comparison
            </h3>
            <Line data={myChartData} />
          </div>

          {/* Insights Card */}
          <div style={{ flex: 1, minWidth: '250px', backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3>Insights</h3>
            
            {/* Revenue Summary */}
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

            {/* Impact Section */}
            <div style={{ marginTop: '20px' }}>
              <span>Impact</span>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c7a6e' }}>
                +₹{result.impact.absolute.toLocaleString()} ({result.impact.percentage}%)
              </div>
            </div>

            {/* Key Drivers List */}
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

      {/* Footer */}
      <p style={{ textAlign: 'center', marginTop: '40px', color: '#aaa', fontSize: '12px' }}>
        Built for SkyGeni
      </p>
    </div>
  );
}

export default App;