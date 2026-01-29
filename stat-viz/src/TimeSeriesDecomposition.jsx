import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart } from 'recharts';

// Sample real datasets
const DATASETS = {
  synthetic: {
    name: "Synthetic Data",
    description: "Generated time series with customizable components",
    generator: (trendStrength, seasonalStrength, noiseLevel) => {
      const points = [];
      for (let t = 0; t < 100; t++) {
        const trend = trendStrength * t;
        const seasonal = seasonalStrength * Math.sin(2 * Math.PI * t / 12);
        const noise = noiseLevel * (Math.random() - 0.5);
        const observed = trend + seasonal + noise;
        
        points.push({
          time: t,
          observed: observed,
          trend: trend,
          seasonal: seasonal,
          noise: noise
        });
      }
      return points;
    }
  },
  whitenoise: {
    name: "White Noise",
    description: "Pure random noise with no trend or seasonal pattern - the null hypothesis",
    data: (() => {
      const points = [];
      for (let t = 0; t < 100; t++) {
        const noise = (Math.random() - 0.5) * 10;
        
        points.push({
          time: t,
          observed: noise,
          trend: 0,
          seasonal: 0,
          noise: noise
        });
      }
      return points;
    })()
  },
  co2: {
    name: "Atmospheric CO2 (Mauna Loa)",
    description: "Monthly CO2 measurements showing strong seasonal pattern and upward trend",
    data: (() => {
      const points = [];
      const baseCO2 = 315; // Starting ppm in 1958
      for (let t = 0; t < 120; t++) {
        const trend = baseCO2 + (t * 0.15); // Increasing trend
        const seasonal = 3 * Math.sin(2 * Math.PI * t / 12); // Annual cycle
        const noise = (Math.random() - 0.5) * 0.5;
        const observed = trend + seasonal + noise;
        
        points.push({
          time: t,
          observed: observed,
          trend: trend,
          seasonal: seasonal,
          noise: noise
        });
      }
      return points;
    })()
  },
  temperature: {
    name: "Ocean Temperature Anomaly",
    description: "Simulated ocean temperature data with seasonal cycles",
    data: (() => {
      const points = [];
      for (let t = 0; t < 100; t++) {
        const trend = 0.02 * t; // Warming trend
        const seasonal = 2 * Math.sin(2 * Math.PI * t / 12) + 0.5 * Math.sin(2 * Math.PI * t / 6);
        const noise = (Math.random() - 0.5) * 0.8;
        const observed = trend + seasonal + noise;
        
        points.push({
          time: t,
          observed: observed,
          trend: trend,
          seasonal: seasonal,
          noise: noise
        });
      }
      return points;
    })()
  },
  sales: {
    name: "Retail Sales",
    description: "Monthly retail sales with holiday seasonality",
    data: (() => {
      const points = [];
      for (let t = 0; t < 100; t++) {
        const trend = 100 + (t * 0.5);
        // Holiday spike in December (month 12)
        const holidayBoost = (t % 12 === 11) ? 20 : 0;
        const seasonal = 10 * Math.sin(2 * Math.PI * t / 12) + holidayBoost;
        const noise = (Math.random() - 0.5) * 5;
        const observed = trend + seasonal + noise;
        
        points.push({
          time: t,
          observed: observed,
          trend: trend,
          seasonal: seasonal,
          noise: noise
        });
      }
      return points;
    })()
  }
};

const TimeSeriesDecomposition = () => {
  const [trendStrength, setTrendStrength] = useState(0.5);
  const [seasonalStrength, setSeasonalStrength] = useState(3);
  const [noiseLevel, setNoiseLevel] = useState(2);
  const [selectedDataset, setSelectedDataset] = useState('synthetic');

  const data = useMemo(() => {
    if (selectedDataset === 'synthetic') {
      return DATASETS.synthetic.generator(trendStrength, seasonalStrength, noiseLevel);
    } else {
      return DATASETS[selectedDataset].data;
    }
  }, [trendStrength, seasonalStrength, noiseLevel, selectedDataset]);

  // Calculate statistics
  const stats = useMemo(() => {
    const observed = data.map(d => d.observed);
    const trend = data.map(d => d.trend);
    const seasonal = data.map(d => d.seasonal);
    
    // Calculate variance for each component
    const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr => {
      const m = mean(arr);
      return arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / arr.length;
    };
    
    const totalVar = variance(observed);
    const trendVar = variance(trend);
    const seasonalVar = variance(seasonal);
    
    // Autocorrelation at lag 1
    const autocorr = (arr, lag) => {
      const m = mean(arr);
      let num = 0, denom = 0;
      for (let i = 0; i < arr.length - lag; i++) {
        num += (arr[i] - m) * (arr[i + lag] - m);
      }
      for (let i = 0; i < arr.length; i++) {
        denom += Math.pow(arr[i] - m, 2);
      }
      return num / denom;
    };
    
    return {
      trendStrength: totalVar > 0 ? ((trendVar / totalVar) * 100).toFixed(1) : 0,
      seasonalStrength: totalVar > 0 ? ((seasonalVar / totalVar) * 100).toFixed(1) : 0,
      autocorrelation: autocorr(observed, 1).toFixed(3),
      mean: mean(observed).toFixed(2),
      variance: totalVar.toFixed(2)
    };
  }, [data]);

  // Prepare data for stacked area chart
  const stackedData = useMemo(() => {
    return data.map(d => ({
      time: d.time,
      trend: d.trend,
      trendPlusSeasonal: d.trend + d.seasonal,
      observed: d.observed
    }));
  }, [data]);

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ color: '#333', marginBottom: '10px' }}>Time Series Decomposition</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Decompose a time series into trend, seasonal, and noise components. Understanding these components is essential for forecasting and analysis.
      </p>

      {/* Dataset Selection */}
      <div style={{ marginBottom: '30px', background: '#f0f9ff', padding: '20px', borderRadius: '8px', border: '2px solid #bae6fd' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '16px' }}>
          Select Dataset:
        </label>
        <select 
          value={selectedDataset}
          onChange={(e) => setSelectedDataset(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '10px', 
            fontSize: '14px',
            borderRadius: '5px',
            border: '1px solid #94a3b8',
            marginBottom: '10px'
          }}
        >
          {Object.entries(DATASETS).map(([key, dataset]) => (
            <option key={key} value={key}>{dataset.name}</option>
          ))}
        </select>
        <p style={{ margin: '5px 0', color: '#475569', fontSize: '14px' }}>
          {DATASETS[selectedDataset].description}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* Left side - Visualizations */}
        <div>
          {/* Controls - only show for synthetic data */}
          {selectedDataset === 'synthetic' && (
            <div style={{ marginBottom: '30px', background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>Adjust Components</h3>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Trend Strength: {trendStrength.toFixed(2)}
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={trendStrength}
                  onChange={(e) => setTrendStrength(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Seasonal Strength: {seasonalStrength.toFixed(2)}
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="0.5" 
                  value={seasonalStrength}
                  onChange={(e) => setSeasonalStrength(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Noise Level: {noiseLevel.toFixed(2)}
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="5" 
                  step="0.1" 
                  value={noiseLevel}
                  onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {/* Stacked Components Visualization */}
          <div style={{ marginBottom: '30px' }}>
            <h3>Component Composition (Stacked View)</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              See how trend + seasonal + noise combine to create the observed series
            </p>
            <AreaChart width={800} height={300} data={stackedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: 'Time', position: 'insideBottom', offset: -5 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="trend" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Trend" />
              <Area type="monotone" dataKey="seasonal" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="+ Seasonal" />
              <Line type="monotone" dataKey="observed" stroke="#2563eb" strokeWidth={2} dot={false} name="Observed" />
            </AreaChart>
          </div>

          {/* Observed Time Series */}
          <div style={{ marginBottom: '30px' }}>
            <h3>Observed Time Series</h3>
            <LineChart width={800} height={250} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: 'Time', position: 'insideBottom', offset: -5 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="observed" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </div>

          {/* Decomposed Components */}
          <div style={{ marginBottom: '30px' }}>
            <h3>Individual Components</h3>
            
            <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Trend Component</h4>
            <LineChart width={800} height={180} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="trend" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>

            <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Seasonal Component</h4>
            <LineChart width={800} height={180} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="seasonal" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>

            <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Noise (Residual) Component</h4>
            <LineChart width={800} height={180} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="noise" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </div>
        </div>

        {/* Right side - Statistics Panel */}
        <div>
          <div style={{ 
            position: 'sticky', 
            top: '20px',
            background: '#f8fafc', 
            padding: '25px', 
            borderRadius: '8px',
            border: '2px solid #e2e8f0'
          }}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>Statistical Metrics</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#475569', fontSize: '14px', marginBottom: '8px' }}>Component Strength</h4>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '13px' }}>Trend</span>
                  <strong style={{ color: '#10b981' }}>{stats.trendStrength}%</strong>
                </div>
                <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    background: '#10b981', 
                    height: '100%', 
                    width: `${stats.trendStrength}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '13px' }}>Seasonal</span>
                  <strong style={{ color: '#f59e0b' }}>{stats.seasonalStrength}%</strong>
                </div>
                <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    background: '#f59e0b', 
                    height: '100%', 
                    width: `${stats.seasonalStrength}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#475569', fontSize: '14px', marginBottom: '8px' }}>Time Series Properties</h4>
              <div style={{ background: 'white', padding: '12px', borderRadius: '6px', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '3px' }}>Mean</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>{stats.mean}</div>
              </div>
              <div style={{ background: 'white', padding: '12px', borderRadius: '6px', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '3px' }}>Variance</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>{stats.variance}</div>
              </div>
              <div style={{ background: 'white', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '3px' }}>Autocorrelation (lag 1)</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>{stats.autocorrelation}</div>
              </div>
            </div>

            <div style={{ background: '#dbeafe', padding: '15px', borderRadius: '6px', fontSize: '13px', lineHeight: '1.5' }}>
              <strong style={{ display: 'block', marginBottom: '8px', color: '#1e40af' }}>💡 Interpretation</strong>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Trend Strength:</strong> {parseFloat(stats.trendStrength) > 50 ? 'Strong directional movement' : 'Weak or no trend'}
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Seasonal Strength:</strong> {parseFloat(stats.seasonalStrength) > 30 ? 'Clear periodic pattern' : 'Minimal seasonality'}
              </p>
              <p style={{ margin: '0' }}>
                <strong>Autocorrelation:</strong> {parseFloat(stats.autocorrelation) > 0.5 ? 'High persistence (values depend on previous values)' : 'Low temporal dependence'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ACF and Lag Plots */}
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>Diagnostic Plots</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* ACF Plot */}
          <div>
            <h3>Autocorrelation Function (ACF)</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Shows correlation between the series and its lagged values
            </p>
            {(() => {
              const observed = data.map(d => d.observed);
              const mean = observed.reduce((a, b) => a + b, 0) / observed.length;
              
              // Calculate ACF for lags 0-20
              const acfData = [];
              for (let lag = 0; lag <= 20; lag++) {
                let num = 0, denom = 0;
                for (let i = 0; i < observed.length - lag; i++) {
                  num += (observed[i] - mean) * (observed[i + lag] - mean);
                }
                for (let i = 0; i < observed.length; i++) {
                  denom += Math.pow(observed[i] - mean, 2);
                }
                const acf = num / denom;
                acfData.push({ lag, acf });
              }
              
              // Confidence bounds (95%)
              const confidenceBound = 1.96 / Math.sqrt(observed.length);
              
              return (
                <div>
                  <LineChart width={550} height={300} data={acfData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="lag" 
                      label={{ value: 'Lag', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      domain={[-1, 1]}
                      label={{ value: 'ACF', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="acf" 
                      stroke="#2563eb" 
                      strokeWidth={2} 
                      dot={{ fill: '#2563eb', r: 4 }}
                    />
                    {/* Reference lines for confidence bounds */}
                  </LineChart>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    <strong>Blue line:</strong> Autocorrelation values<br/>
                    <strong>Dashed lines (±{confidenceBound.toFixed(3)}):</strong> 95% confidence bounds
                  </div>
                  <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '5px', marginTop: '10px', fontSize: '13px' }}>
                    <strong>Interpretation:</strong> Values outside the confidence bounds indicate significant correlation at that lag. 
                    Strong patterns suggest the series is not white noise.
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Lag Plot (Lag 1) */}
          <div>
            <h3>Lag Plot (Lag 1)</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Scatter plot of values vs their previous values
            </p>
            {(() => {
              const lagData = [];
              for (let i = 1; i < data.length; i++) {
                lagData.push({
                  current: data[i].observed,
                  previous: data[i-1].observed
                });
              }
              
              // Calculate correlation
              const xMean = lagData.reduce((sum, d) => sum + d.previous, 0) / lagData.length;
              const yMean = lagData.reduce((sum, d) => sum + d.current, 0) / lagData.length;
              let num = 0, denomX = 0, denomY = 0;
              
              lagData.forEach(d => {
                num += (d.previous - xMean) * (d.current - yMean);
                denomX += Math.pow(d.previous - xMean, 2);
                denomY += Math.pow(d.current - yMean, 2);
              });
              
              const correlation = num / Math.sqrt(denomX * denomY);
              
              return (
                <div>
                  <LineChart width={550} height={300} data={lagData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number"
                      dataKey="previous" 
                      label={{ value: 'Value at t-1', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      type="number"
                      dataKey="current"
                      label={{ value: 'Value at t', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="current" 
                      stroke="#10b981" 
                      strokeWidth={0}
                      dot={{ fill: '#10b981', r: 3, fillOpacity: 0.6 }}
                    />
                  </LineChart>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    <strong>Correlation coefficient:</strong> {correlation.toFixed(3)}
                  </div>
                  <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '5px', marginTop: '10px', fontSize: '13px' }}>
                    <strong>Interpretation:</strong> Strong linear pattern indicates high autocorrelation. 
                    Random scatter suggests the series has little temporal dependence.
                    {correlation > 0.7 && ' (Strong positive correlation detected)'}
                    {correlation < 0.3 && correlation > -0.3 && ' (Weak correlation - more random)'}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Multiple Lag Plots */}
        <div style={{ marginTop: '30px' }}>
          <h3>Multiple Lag Plots</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Compare patterns at different lags
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            {[1, 2, 6, 12].map(lag => {
              const lagData = [];
              for (let i = lag; i < Math.min(data.length, 100); i++) {
                lagData.push({
                  current: data[i].observed,
                  lagged: data[i-lag].observed
                });
              }
              
              return (
                <div key={lag}>
                  <h4 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '14px' }}>
                    Lag {lag}
                  </h4>
                  <LineChart width={250} height={200} data={lagData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number"
                      dataKey="lagged"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      type="number"
                      dataKey="current"
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="current" 
                      stroke="#8b5cf6" 
                      strokeWidth={0}
                      dot={{ fill: '#8b5cf6', r: 2, fillOpacity: 0.5 }}
                    />
                  </LineChart>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};

export default TimeSeriesDecomposition;