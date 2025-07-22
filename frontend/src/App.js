import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StoriesList from './components/StoriesList';
import StoryDetail from './components/StoryDetail';
import StoryStats from './components/StoryStats';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<StoriesList />} />
          <Route path="/story/:id" element={<StoryDetail />} />
          <Route path="/stats" element={<StoryStats />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 