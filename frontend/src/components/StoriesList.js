import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const StoriesList = () => {
  const [stories, setStories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [solvableFilter, setSolvableFilter] = useState('all');

  useEffect(() => {
    fetchStories();
    fetchAuthors();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories');
      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }
      const data = await response.json();
      setStories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthors = async () => {
    try {
      const response = await fetch('/api/authors');
      if (!response.ok) {
        throw new Error('Failed to fetch authors');
      }
      const data = await response.json();
      setAuthors(data);
    } catch (err) {
      console.error('Error fetching authors:', err);
    }
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = !searchTerm || 
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.storyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.plotSummary.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAuthor = !selectedAuthor || story.author === selectedAuthor;

    const matchesSolvable = solvableFilter === 'all' || 
      (solvableFilter === 'solvable' && story.isSolvable) ||
      (solvableFilter === 'unsolvable' && !story.isSolvable);

    return matchesSearch && matchesAuthor && matchesSolvable;
  });

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return (
      <div>
        <header className="header">
          <div className="container">
            <h1>Detective Solutions Dashboard</h1>
            <p>Explore and analyze detective stories and their solutions. These are the "solvable" stories from the BMDS dataset (https://github.com/ahmmnd/BMDS)</p>
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
            <h1>Detective Solutions Dashboard</h1>
            <p>Explore and analyze detective stories and their solutions. These are the "solvable" stories from the BMDS dataset (https://github.com/ahmmnd/BMDS)</p>
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
              <h1>Detective Solutions Dashboard</h1>
              <p>Explore and analyze detective stories and their solutions. These are the "solvable" stories from the BMDS dataset (https://github.com/ahmmnd/BMDS)</p>
            </div>
            <Link 
              to="/stats"
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
          <input
            type="text"
            placeholder="Search stories, authors, titles, or plot summaries..."
            className="search-bar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="filters">
            <label>
              <span>Author: </span>
              <select
                className="filter-select"
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
              >
                <option value="">All Authors</option>
                {authors.map(author => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Solvable: </span>
              <select
                className="filter-select"
                value={solvableFilter}
                onChange={(e) => setSolvableFilter(e.target.value)}
              >
                <option value="all">All Stories</option>
                <option value="solvable">Solvable</option>
                <option value="unsolvable">Unsolvable</option>
              </select>
            </label>

            <span>
              Showing {filteredStories.length} of {stories.length} stories
            </span>
          </div>
        </div>

        <div className="stories-grid">
          {filteredStories.map(story => (
            <Link 
              key={story.id} 
              to={`/story/${story.id}`} 
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

        {filteredStories.length === 0 && (
          <div className="loading">
            No stories found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesList; 