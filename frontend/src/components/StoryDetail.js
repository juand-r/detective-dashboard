import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const StoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('story');

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await fetch(`/api/stories/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch story');
        }
        const data = await response.json();
        setStory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id]);

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatSolution = (solution) => {
    if (!solution) return 'No solution available';
    
    // Split by common delimiters to format the solution better
    const parts = solution.split(/\n\n|\n(?=[A-Z][A-Z]+:)/);
    return parts.map((part, index) => {
      const trimmed = part.trim();
      if (trimmed.startsWith('CULPRIT:') || trimmed.startsWith('SUSPECTS:') || trimmed.startsWith('REASON:')) {
        return (
          <div key={index} style={{ marginBottom: '1rem' }}>
            <strong>{trimmed}</strong>
          </div>
        );
      }
      return (
        <div key={index} style={{ marginBottom: '1rem' }}>
          {trimmed}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div>
        <header className="header">
          <div className="container">
            <h1>Detective Solutions Dashboard</h1>
            <p>Loading story...</p>
          </div>
        </header>
        <div className="container">
          <div className="loading">Loading story details...</div>
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
            <p>Error loading story</p>
          </div>
        </header>
        <div className="container">
          <div className="error">Error: {error}</div>
          <button className="back-button" onClick={() => navigate('/')}>
            Back to Stories
          </button>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div>
        <header className="header">
          <div className="container">
            <h1>Detective Solutions Dashboard</h1>
            <p>Story not found</p>
          </div>
        </header>
        <div className="container">
          <div className="error">Story not found</div>
          <button className="back-button" onClick={() => navigate('/')}>
            Back to Stories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <div className="container">
          <h1>{story.original_metadata?.story_title || 'Unknown Title'}</h1>
          <p>by {story.original_metadata?.author_name || 'Unknown Author'}</p>
        </div>
      </header>

      <div className="container">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Stories
        </button>

        <div className="story-detail">
          <div className="story-detail-header">
            <h2>{story.original_metadata?.story_title || 'Unknown Title'}</h2>
            <p>Story Code: {story.metadata?.event_name}</p>
          </div>

          <div className="story-detail-content">
            {/* Metadata Section */}
            <div className="section-title">Story Metadata</div>
            <div className="metadata-grid">
              <div className="metadata-item">
                <div className="metadata-label">Author</div>
                <div className="metadata-value">{story.original_metadata?.author_name || 'Unknown'}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Story Code</div>
                <div className="metadata-value">{story.original_metadata?.story_code || story.metadata?.event_name}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Text Length</div>
                <div className="metadata-value">{formatNumber(story.metadata?.story_length || 0)} words</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Reveal Length</div>
                <div className="metadata-value">{formatNumber(story.metadata?.reveal_length || 0)} words</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Model Used</div>
                <div className="metadata-value">{story.metadata?.model || 'Unknown'}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Solvable</div>
                <div className="metadata-value">
                  <span className={`tag ${story.original_metadata?.is_solvable ? 'solvable' : 'unsolvable'}`}>
                    {story.original_metadata?.is_solvable ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Plot Summary */}
            {story.original_metadata?.plot_summary && (
              <div>
                <div className="section-title">Plot Summary</div>
                <div className="story-summary">
                  {story.original_metadata.plot_summary}
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div style={{ marginTop: '2rem', borderBottom: '2px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setActiveTab('story')}
                  style={{
                    padding: '1rem 2rem',
                    border: 'none',
                    background: activeTab === 'story' ? '#667eea' : 'transparent',
                    color: activeTab === 'story' ? 'white' : '#4a5568',
                    cursor: 'pointer',
                    borderRadius: '8px 8px 0 0',
                    fontWeight: activeTab === 'story' ? '600' : 'normal'
                  }}
                >
                  Story Text
                </button>
                <button
                  onClick={() => setActiveTab('solution')}
                  style={{
                    padding: '1rem 2rem',
                    border: 'none',
                    background: activeTab === 'solution' ? '#667eea' : 'transparent',
                    color: activeTab === 'solution' ? 'white' : '#4a5568',
                    cursor: 'pointer',
                    borderRadius: '8px 8px 0 0',
                    fontWeight: activeTab === 'solution' ? '600' : 'normal'
                  }}
                >
                  Detective Solution
                </button>
                <button
                  onClick={() => setActiveTab('reveal')}
                  style={{
                    padding: '1rem 2rem',
                    border: 'none',
                    background: activeTab === 'reveal' ? '#667eea' : 'transparent',
                    color: activeTab === 'reveal' ? 'white' : '#4a5568',
                    cursor: 'pointer',
                    borderRadius: '8px 8px 0 0',
                    fontWeight: activeTab === 'reveal' ? '600' : 'normal'
                  }}
                >
                  Reveal Segment
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'story' && (
              <div>
                <div className="section-title">Full Story Text</div>
                <div className="story-text">
                  {story.story?.full_text || 'No story text available'}
                </div>
              </div>
            )}

            {activeTab === 'solution' && (
              <div>
                <div className="section-title">Detective Solution</div>
                <div className="solution-section">
                  <h4>AI Analysis:</h4>
                  <div style={{ marginTop: '1rem', lineHeight: '1.8' }}>
                    {formatSolution(story.detection?.solution)}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reveal' && (
              <div>
                <div className="section-title">Reveal Segment</div>
                {story.metadata?.border_sentence && (
                  <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#e2e8f0', borderRadius: '8px' }}>
                    <strong>Border sentence:</strong> "{story.metadata.border_sentence}"
                  </div>
                )}
                <div className="story-text">
                  {story.story?.reveal_segment || 'No reveal segment available'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryDetail; 