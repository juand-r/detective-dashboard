import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

function StoriesList() {
  const { dataset } = useParams();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch(`/api/${dataset}/stories`);
        if (!response.ok) throw new Error('Failed to fetch stories');
        const data = await response.json();
        setStories(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (dataset) {
      fetchStories();
    }
  }, [dataset]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const response = await fetch(`/api/${dataset}/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const displayedStories = searchResults || stories;

  // Get dataset display info
  const getDatasetInfo = (datasetId) => {
    const datasets = {
      'bmds': {
        name: 'BMDS Dataset',
        description: 'Explore and analyze detective stories and their solutions. These are the "solvable" stories from the BMDS dataset (https://github.com/ahmmnd/BMDS)'
      },
      'true-detective': {
        name: 'True Detective Dataset', 
        description: 'Real detective cases and investigations with forensic evidence'
      },
      'musr': {
        name: 'MuSR Dataset',
        description: 'Murder Mystery Stories for Reading comprehension'
      },
      'csi': {
        name: 'CSI Corpus',
        description: 'Crime Scene Investigation cases with forensic analysis'
      }
    };
    return datasets[datasetId] || { name: 'Unknown Dataset', description: 'Dataset information not available' };
  };

  const datasetInfo = getDatasetInfo(dataset);

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return (
      <div>
        <header className="header">
          <div className="container">
            <h1>{datasetInfo.name}</h1>
            <p>{datasetInfo.description}</p>
          </div>
        </header>
        <div className="container">
          <div className="loading">Loading stories...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <header className="header">
          <div className="container">
            <h1>{datasetInfo.name}</h1>
            <p>{datasetInfo.description}</p>
          </div>
        </header>
        <div className="container">
          <div className="error">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    border: '1px solid white',
                    color: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  ← Back to Datasets
                </button>
                <h1 style={{ margin: 0 }}>{datasetInfo.name}</h1>
              </div>
              <p>{datasetInfo.description}</p>
            </div>
            <Link 
              to={`/${dataset}/stats`}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#667eea',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}
            >
              Story Stats
            </Link>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-container">
            <input
              type="text"
              placeholder="Search stories, authors, titles, or plot summaries..."
              className="search-bar"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" style={{ display: 'none' }}>Search</button>
          </form>
          
          <div className="filters">
            <span>
              {searchResults ? `Found ${displayedStories.length} matching stories` : `Showing ${displayedStories.length} stories`}
            </span>
          </div>
        </div>

        <div className="stories-grid">
          {displayedStories.map(story => (
            <Link 
              key={story.id} 
              to={`/${dataset}/story/${story.id}`} 
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="story-card">
                <h3 className="story-title">{(() => {
                  const baseTitle = story.storyTitle;
                  const pubDate = story.publicationDate;
                  return pubDate ? `${baseTitle} (${pubDate})` : baseTitle;
                })()}</h3>
                <div className="story-author">by {story.author}</div>
                
                <div className="story-meta">
                  <span>Code: {story.storyCode}</span>
                  <span>{formatNumber(story.textLength)} characters</span>
                </div>

                <div className="story-summary">
                  {story.plotSummary || 'No plot summary available.'}
                </div>

                <div className="story-tags">
                  <span className={`tag ${story.isSolvable ? 'solvable' : 'unsolvable'}`}>
                    {story.isSolvable ? 'Solvable' : 'Unsolvable'}
                  </span>
                  <span className="tag">Model: {story.model}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

                  {displayedStories.length === 0 && (
          <div className="loading">
            No stories found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesList; 