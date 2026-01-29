import React, { useState } from 'react';
import Navigation from './Navigation';
import TimeSeriesDecomposition from './TimeSeriesDecomposition';
import BrownianMotion from './BrownianMotion';
import RegressionDiagnostics from './RegressionDiagnostics';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('timeseries');

  const renderView = () => {
    switch(currentView) {
      case 'timeseries':
        return <TimeSeriesDecomposition />;
      case 'brownian':
        return <BrownianMotion />;
      case 'regression':
        return <RegressionDiagnostics />;
      default:
        return <TimeSeriesDecomposition />;
    }
  };

  return (
    <div className="App">
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      {renderView()}
    </div>
  );
}

export default App;