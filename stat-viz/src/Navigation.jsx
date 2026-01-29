import React from 'react';

const Navigation = ({ currentView, setCurrentView }) => {
  const views = [
    { id: 'timeseries', name: 'Time Series Decomposition' },
    { id: 'brownian', name: 'Brownian Motion' },
    { id: 'regression', name: 'Regression Diagnostics' }
  ];

  return (
    <nav style={{ 
      background: '#2563eb', 
      padding: '20px',
      marginBottom: '0'
    }}>
      <h2 style={{ color: 'white', margin: '0 0 15px 0' }}>
        Statistical Methods Visualizer
      </h2>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {views.map(view => (
          <button
            key={view.id}
            onClick={() => setCurrentView(view.id)}
            style={{
              padding: '10px 20px',
              background: currentView === view.id ? 'white' : 'transparent',
              color: currentView === view.id ? '#2563eb' : 'white',
              border: '2px solid white',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {view.name}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;