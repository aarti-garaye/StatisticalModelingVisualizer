import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const BrownianMotion = () => {
  const [numPaths, setNumPaths] = useState(5);
  const [volatility, setVolatility] = useState(1);
  const [drift, setDrift] = useState(0);
  const [steps, setSteps] = useState(100);

  const paths = useMemo(() => {
    const allPaths = [];
    
    for (let pathNum = 0; pathNum < numPaths; pathNum++) {
      let value = 0;
      for (let t = 0; t <= steps; t++) {
        if (t === 0) {
          allPaths.push({
            time: t,
            [`path${pathNum}`]: 0
          });
        } else {
          // Brownian motion: dX = drift*dt + volatility*dW
          const dW = Math.sqrt(1) * (Math.random() - 0.5) * 2; // Random shock
          value += drift * 1 + volatility * dW;
          
          if (allPaths[t]) {
            allPaths[t][`path${pathNum}`] = value;
          } else {
            allPaths.push({
              time: t,
              [`path${pathNum}`]: value
            });
          }
        }
      }
    }
    
    return allPaths;
  }, [numPaths, volatility, drift, steps]);

  const pathColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#333', marginBottom: '10px' }}>Brownian Motion Simulator</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Simulate random walks and Brownian motion paths. Used in finance (stock prices), physics (particle motion), and stochastic calculus.
      </p>

      {/* Controls */}
      <div style={{ marginBottom: '30px', background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Number of Paths: {numPaths}
          </label>
          <input 
            type="range" 
            min="1" 
            max="8" 
            step="1" 
            value={numPaths}
            onChange={(e) => setNumPaths(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Volatility (σ): {volatility.toFixed(2)}
          </label>
          <input 
            type="range" 
            min="0.1" 
            max="3" 
            step="0.1" 
            value={volatility}
            onChange={(e) => setVolatility(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <small style={{ color: '#666' }}>Higher volatility = more random fluctuation</small>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Drift (μ): {drift.toFixed(2)}
          </label>
          <input 
            type="range" 
            min="-1" 
            max="1" 
            step="0.1" 
            value={drift}
            onChange={(e) => setDrift(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <small style={{ color: '#666' }}>Positive drift = upward trend, Negative = downward trend</small>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Time Steps: {steps}
          </label>
          <input 
            type="range" 
            min="50" 
            max="500" 
            step="50" 
            value={steps}
            onChange={(e) => setSteps(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Visualization */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Simulated Paths</h3>
        <LineChart width={1000} height={400} data={paths}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            label={{ value: 'Time', position: 'insideBottom', offset: -5 }} 
          />
          <YAxis label={{ value: 'Value', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          {Array.from({ length: numPaths }, (_, i) => (
            <Line 
              key={i}
              type="monotone" 
              dataKey={`path${i}`} 
              stroke={pathColors[i % pathColors.length]} 
              strokeWidth={2} 
              dot={false}
              name={`Path ${i + 1}`}
            />
          ))}
        </LineChart>
      </div>

      {/* Educational Info */}
      <div style={{ background: '#e0f2fe', padding: '20px', borderRadius: '8px', marginTop: '30px' }}>
        <h4 style={{ marginTop: 0 }}>About Brownian Motion</h4>
        <p style={{ margin: '10px 0', lineHeight: '1.6' }}>
          Brownian motion is a fundamental stochastic process with wide-ranging applications in mathematics, 
          physics, and finance. It models random particle movement and serves as the foundation for many 
          advanced topics in probability theory and quantitative finance. I have taken multiple courses, 
          undergraduate and graduate, on Stochastic Processes and Financial Mathematics where I 
          explored Brownian motion in depth. Some of my favorite applications include modeling stock prices 
          using Geometric Brownian Motion and understanding diffusion processes in physics. I'm also taking a 
          graduate course on generative diffusion models in machine learning where Stochastic Differential Equations 
          (SDEs) based on Brownian motion are used to create cutting-edge AI models.
        </p>
        <p style={{ margin: '10px 0', lineHeight: '1.6' }}>
          <strong>Key Applications:</strong> Heat equation and diffusion processes, stock price modeling 
          (Black-Scholes options pricing), polymer physics, signal processing, and Langevin dynamics.
        </p>
        <a 
          href="https://github.com/aartigaraye/Projects/tree/main/StochasticProcesses" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: '15px',
            padding: '10px 20px',
            background: '#2563eb',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            fontWeight: 'bold'
          }}
        >
          View My Brownian Motion Research →
        </a>
      </div>
    </div>);
};

export default BrownianMotion;