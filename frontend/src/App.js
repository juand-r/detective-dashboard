import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DatasetLanding from './components/DatasetLanding';
import StoriesList from './components/StoriesList';
import StoryDetail from './components/StoryDetail';
import StoryStats from './components/StoryStats';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<DatasetLanding />} />
          <Route path="/:dataset" element={<StoriesList />} />
          <Route path="/:dataset/story/:id" element={<StoryDetail />} />
          <Route path="/:dataset/stats" element={<StoryStats />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 