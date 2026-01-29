import React, { useState, useMemo } from 'react';
import { ScatterChart, Scatter, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Label } from 'recharts';

// Sample datasets for regression
const DATASETS = {
  linear: {
    name: "Linear Relationship",
    description: "Perfect linear relationship with normal errors",
    generator: (noise, outliers) => {
      const points = [];
      const beta0 = 5, beta1 = 2;
      for (let i = 0; i < 100; i++) {
        const x = i / 10;
        const epsilon = (Math.random() - 0.5) * noise;
        let y = beta0 + beta1 * x + epsilon;
        
        // Add outliers
        if (outliers && i % 25 === 0 && i > 0) {
          y += (Math.random() > 0.5 ? 1 : -1) * noise * 5;
        }
        
        points.push({ x, y });
      }
      return points;
    }
  },
  quadratic: {
    name: "Quadratic Relationship",
    description: "Non-linear relationship - linear model will show pattern in residuals",
    generator: (noise) => {
      const points = [];
      for (let i = 0; i < 100; i++) {
        const x = (i - 50) / 10;
        const epsilon = (Math.random() - 0.5) * noise;
        const y = 10 + 2 * x + 0.5 * x * x + epsilon;
        points.push({ x, y });
      }
      return points;
    }
  },
  heteroscedastic: {
    name: "Heteroscedasticity",
    description: "Variance increases with X - violates constant variance assumption",
    generator: (noise) => {
      const points = [];
      const beta0 = 5, beta1 = 2;
      for (let i = 0; i < 100; i++) {
        const x = i / 10;
        const epsilon = (Math.random() - 0.5) * noise * (x / 3); // Variance increases with x
        const y = beta0 + beta1 * x + epsilon;
        points.push({ x, y });
      }
      return points;
    }
  }
};

const RegressionDiagnostics = () => {
  const [selectedDataset, setSelectedDataset] = useState('linear');
  const [noiseLevel, setNoiseLevel] = useState(3);
  const [addOutliers, setAddOutliers] = useState(false);

  // Generate data
  const rawData = useMemo(() => {
    if (selectedDataset === 'linear') {
      return DATASETS.linear.generator(noiseLevel, addOutliers);
    } else if (selectedDataset === 'quadratic') {
      return DATASETS.quadratic.generator(noiseLevel);
    } else {
      return DATASETS.heteroscedastic.generator(noiseLevel);
    }
  }, [selectedDataset, noiseLevel, addOutliers]);

  // Fit linear regression
  const regression = useMemo(() => {
    const n = rawData.length;
    const sumX = rawData.reduce((sum, d) => sum + d.x, 0);
    const sumY = rawData.reduce((sum, d) => sum + d.y, 0);
    const sumXY = rawData.reduce((sum, d) => sum + d.x * d.y, 0);
    const sumXX = rawData.reduce((sum, d) => sum + d.x * d.x, 0);
    
    const beta1 = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const beta0 = (sumY - beta1 * sumX) / n;
    
    // Calculate fitted values and residuals
    const dataWithFit = rawData.map(d => {
      const fitted = beta0 + beta1 * d.x;
      const residual = d.y - fitted;
      return { ...d, fitted, residual };
    });
    
    // Calculate R-squared
    const yMean = sumY / n;
    const sst = rawData.reduce((sum, d) => sum + Math.pow(d.y - yMean, 2), 0);
    const sse = dataWithFit.reduce((sum, d) => sum + Math.pow(d.residual, 2), 0);
    const rsquared = 1 - (sse / sst);
    
    // Calculate standardized residuals
    const residualMean = dataWithFit.reduce((sum, d) => sum + d.residual, 0) / n;
    const residualVar = dataWithFit.reduce((sum, d) => sum + Math.pow(d.residual - residualMean, 2), 0) / (n - 2);
    const residualSD = Math.sqrt(residualVar);
    
    const dataWithStandardized = dataWithFit.map((d, i) => ({
      ...d,
      standardizedResidual: d.residual / residualSD,
      index: i
    }));
    
    // Regression line points
    const minX = Math.min(...rawData.map(d => d.x));
    const maxX = Math.max(...rawData.map(d => d.x));
    const regressionLine = [
      { x: minX, y: beta0 + beta1 * minX },
      { x: maxX, y: beta0 + beta1 * maxX }
    ];
    
    return {
      beta0,
      beta1,
      rsquared,
      data: dataWithStandardized,
      regressionLine,
      residualSD
    };
  }, [rawData]);

  // QQ plot data
  const qqData = useMemo(() => {
    const residuals = [...regression.data].map(d => d.standardizedResidual).sort((a, b) => a - b);
    const n = residuals.length;
    
    return residuals.map((residual, i) => {
      // Theoretical quantiles from standard normal
      const p = (i + 0.5) / n;
      const theoretical = Math.sqrt(2) * inverseErf(2 * p - 1);
      
      return {
        theoretical,
        sample: residual
      };
    });
  }, [regression]);

  // Inverse error function approximation for QQ plot
  function inverseErf(x) {
    const a = 0.147;
    const b = 2 / (Math.PI * a) + Math.log(1 - x * x) / 2;
    const sqrt1 = Math.sqrt(b * b - Math.log(1 - x * x) / a);
    const sqrt2 = Math.sqrt(sqrt1 - b);
    return Math.sign(x) * sqrt2;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ color: '#333', marginBottom: '10px' }}>Regression Diagnostics</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Visualize regression model fit and check assumptions: linearity, homoscedasticity, normality, and independence.
      </p>

      {/* Dataset Selection & Controls */}
      <div style={{ marginBottom: '30px', background: '#f0f9ff', padding: '20px', borderRadius: '8px', border: '2px solid #bae6fd' }}>
        <div style={{ marginBottom: '20px' }}>
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

        {selectedDataset === 'linear' && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Noise Level: {noiseLevel.toFixed(1)}
              </label>
              <input 
                type="range" 
                min="0.5" 
                max="10" 
                step="0.5" 
                value={noiseLevel}
                onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={addOutliers}
                  onChange={(e) => setAddOutliers(e.target.checked)}
                  style={{ marginRight: '8px', width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: 'bold' }}>Add Outliers</span>
              </label>
            </div>
          </>
        )}

        {(selectedDataset === 'quadratic' || selectedDataset === 'heteroscedastic') && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Noise Level: {noiseLevel.toFixed(1)}
            </label>
            <input 
              type="range" 
              min="0.5" 
              max="10" 
              step="0.5" 
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        )}
      </div>

      {/* Model Summary */}
      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '2px solid #e2e8f0' }}>
        <h3 style={{ marginTop: 0 }}>Model Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div style={{ background: 'white', padding: '15px', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>Intercept (β₀)</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
              {regression.beta0.toFixed(3)}
            </div>
          </div>
          <div style={{ background: 'white', padding: '15px', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>Slope (β₁)</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
              {regression.beta1.toFixed(3)}
            </div>
          </div>
          <div style={{ background: 'white', padding: '15px', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>R²</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
              {regression.rsquared.toFixed(3)}
            </div>
          </div>
        </div>
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#475569' }}>
          <strong>Regression equation:</strong> y = {regression.beta0.toFixed(3)} + {regression.beta1.toFixed(3)}x
        </div>
      </div>

      {/* Main Plots Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        
        {/* Scatter plot with regression line */}
        <div>
          <h3>Fitted Regression Line</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Data points with fitted linear model
          </p>
          <ScatterChart width={550} height={350}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="X"
              label={{ value: 'X', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Y"
              label={{ value: 'Y', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Data" data={regression.data} fill="#2563eb" />
            <Scatter name="Regression Line" data={regression.regressionLine} fill="#ef4444" line={{ stroke: '#ef4444', strokeWidth: 2 }} shape="circle" />
          </ScatterChart>
        </div>

        {/* Residual plot */}
        <div>
          <h3>Residual vs Fitted</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Check for non-linearity and heteroscedasticity
          </p>
          <ScatterChart width={550} height={350}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="fitted" 
              name="Fitted"
              label={{ value: 'Fitted Values', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="number" 
              dataKey="residual" 
              name="Residual"
              label={{ value: 'Residuals', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            <Scatter name="Residuals" data={regression.data} fill="#10b981" />
          </ScatterChart>
          <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '5px', marginTop: '10px', fontSize: '13px' }}>
            <strong>Look for:</strong> Random scatter around zero (good). Patterns indicate model problems.
          </div>
        </div>

        {/* QQ plot */}
        <div>
          <h3>Normal Q-Q Plot</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Check if residuals are normally distributed
          </p>
          <ScatterChart width={550} height={350}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="theoretical" 
              name="Theoretical"
              label={{ value: 'Theoretical Quantiles', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="number" 
              dataKey="sample" 
              name="Sample"
              label={{ value: 'Sample Quantiles', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Q-Q Points" data={qqData} fill="#f59e0b" />
            {/* Reference line y=x */}
            <Scatter 
              name="Reference Line" 
              data={[
                { theoretical: -3, sample: -3 },
                { theoretical: 3, sample: 3 }
              ]} 
              line={{ stroke: '#ef4444', strokeWidth: 2 }} 
              shape="none"
            />
          </ScatterChart>
          <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '5px', marginTop: '10px', fontSize: '13px' }}>
            <strong>Look for:</strong> Points along the diagonal line indicate normality. Deviations suggest non-normal residuals.
          </div>
        </div>

        {/* Scale-Location plot */}
        <div>
          <h3>Scale-Location Plot</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Check for homoscedasticity (constant variance)
          </p>
          <ScatterChart width={550} height={350}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="fitted" 
              name="Fitted"
              label={{ value: 'Fitted Values', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="number" 
              dataKey="sqrtAbsResidual" 
              name="√|Std Residual|"
              label={{ value: '√|Standardized Residuals|', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter 
              name="√|Std Residual|" 
              data={regression.data.map(d => ({
                ...d,
                sqrtAbsResidual: Math.sqrt(Math.abs(d.standardizedResidual))
              }))} 
              fill="#8b5cf6" 
            />
          </ScatterChart>
          <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '5px', marginTop: '10px', fontSize: '13px' }}>
            <strong>Look for:</strong> Horizontal band with constant spread. Funnel shape indicates heteroscedasticity.
          </div>
        </div>
      </div>

      {/* Residual Analysis */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Residual Analysis</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Histogram of residuals */}
          <div>
            <h4>Residual Distribution</h4>
            <LineChart width={550} height={250} data={(() => {
              const residuals = regression.data.map(d => d.standardizedResidual).sort((a, b) => a - b);
              const bins = 15;
              const min = Math.min(...residuals);
              const max = Math.max(...residuals);
              const binWidth = (max - min) / bins;
              
              const histogram = Array(bins).fill(0).map((_, i) => ({
                bin: min + i * binWidth + binWidth / 2,
                count: 0
              }));
              
              residuals.forEach(r => {
                const binIndex = Math.min(Math.floor((r - min) / binWidth), bins - 1);
                histogram[binIndex].count++;
              });
              
              return histogram;
            })()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" label={{ value: 'Standardized Residuals', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </div>

          {/* Residuals vs Index (time order) */}
          <div>
            <h4>Residuals vs Order</h4>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
              Check for autocorrelation in residuals
            </p>
            <LineChart width={550} height={250} data={regression.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" label={{ value: 'Observation Order', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Residuals', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="residual" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </div>
        </div>
      </div>

      {/* Educational Section */}
      <div style={{ background: '#e0f2fe', padding: '20px', borderRadius: '8px' }}>
        <h4 style={{ marginTop: 0 }}>About Regression Diagnostics</h4>
        <p style={{ margin: '10px 0', lineHeight: '1.6' }}>
          Regression diagnostics help verify the assumptions of linear regression: linearity, independence, 
          homoscedasticity (constant variance), and normality of residuals. Violations of these assumptions 
          can lead to biased estimates and invalid inference.
        </p>
        <p style={{ margin: '10px 0', lineHeight: '1.6' }}>
          <strong>Key Diagnostic Plots:</strong>
        </p>
        <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
          <li><strong>Residual vs Fitted:</strong> Detects non-linearity and heteroscedasticity</li>
          <li><strong>Q-Q Plot:</strong> Checks normality of residuals</li>
          <li><strong>Scale-Location:</strong> Confirms constant variance assumption</li>
          <li><strong>Residuals vs Order:</strong> Identifies autocorrelation</li>
        </ul>
        <p style={{ margin: '10px 0', lineHeight: '1.6' }}>
          <strong>Applications:</strong> Model validation, assumption checking, outlier detection, and model improvement in econometrics, biostatistics, and predictive modeling.
        </p>
        <a 
          href="https://github.com/aartigaraye/SpotifyStreams" 
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
          View My Regression Research →
        </a>
      </div>
    </div>
  );
};

export default RegressionDiagnostics;