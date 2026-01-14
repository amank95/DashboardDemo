import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreateCampaign from './components/CreateCampaign';
import BidOptimizerForm from './components/BidOptimizerForm';
import ReportsPage from './components/ReportsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CreateCampaign />} />
        <Route path="/bid-optimizer" element={<BidOptimizerForm />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </Router>
  );
}

export default App;





