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
          <h1>{(() => {
            const baseTitle = story.original_metadata?.story_annotations?.["Story Title"] || 'Unknown Title';
            const pubDate = story.original_metadata?.story_annotations?.["Date of First Publication (YYYY-MM-DD)"];
            return pubDate ? `${baseTitle} (${pubDate})` : baseTitle;
          })()}</h1>
          <p>by {(() => {
            const givenName = story.original_metadata?.author_metadata?.["Given Name(s)"] || '';
            const surname = story.original_metadata?.author_metadata?.["Surname(s)"] || '';
            const author = [givenName, surname].filter(name => name).join(' ') || 'Unknown Author';
            return author;
          })()}</p>
        </div>
      </header>

      <div className="container">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Stories
        </button>

        <div className="story-detail">
          <div className="story-detail-header">
            <h2>{(() => {
              const baseTitle = story.original_metadata?.story_annotations?.["Story Title"] || 'Unknown Title';
              const pubDate = story.original_metadata?.story_annotations?.["Date of First Publication (YYYY-MM-DD)"];
              return pubDate ? `${baseTitle} (${pubDate})` : baseTitle;
            })()}</h2>
            <p>Story Code: {story.metadata?.event_name}</p>
            {(() => {
              const detective1 = story.original_metadata?.story_annotations?.["Name of Detective #1"] || '';
              const detective2 = story.original_metadata?.story_annotations?.["Name of Detective #2"] || '';
              const detectives = [detective1, detective2].filter(name => name && name !== '_unknown').join(', ');
              return detectives ? <p>Detectives: {detectives}</p> : null;
            })()}
          </div>

          <div className="story-detail-content">
            {/* Metadata Section */}
            <div className="section-title">Story Metadata</div>
            <div className="metadata-grid">
              <div className="metadata-item">
                <div className="metadata-label">Number of victims</div>
                <div className="metadata-value">{(() => {
                  const maleVictims = parseInt(story.original_metadata?.story_annotations?.["Number of victims of gender Male"] || 0);
                  const femaleVictims = parseInt(story.original_metadata?.story_annotations?.["Number of victims of gender Female"] || 0);
                  const nonBinaryVictims = parseInt(story.original_metadata?.story_annotations?.["Number of victims of gender Non-binary"] || 0);
                  const unknownVictims = parseInt(story.original_metadata?.story_annotations?.["Number of victims of gender Unknown"] || 0);
                  return maleVictims + femaleVictims + nonBinaryVictims + unknownVictims;
                })()}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Number of culprits</div>
                <div className="metadata-value">{(() => {
                  const maleCulprits = parseInt(story.original_metadata?.story_annotations?.["Number of culprits of gender Male"] || 0);
                  const femaleCulprits = parseInt(story.original_metadata?.story_annotations?.["Number of culprits of gender Female"] || 0);
                  const nonBinaryCulprits = parseInt(story.original_metadata?.story_annotations?.["Number of culprits of gender Non-binary"] || 0);
                  const unknownCulprits = parseInt(story.original_metadata?.story_annotations?.["Number of culprits of gender Unknown"] || 0);
                  return maleCulprits + femaleCulprits + nonBinaryCulprits + unknownCulprits;
                })()}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Crimes</div>
                <div className="metadata-value">{(() => {
                  const focusCrime = story.original_metadata?.story_annotations?.["Focus on crime or quasi-crime"] || '';
                  const crimeTypes = story.original_metadata?.story_annotations?.["Types of qrimes"] || '';
                  const crimes = [focusCrime, crimeTypes].filter(crime => crime).join(', ');
                  return crimes || 'Unknown';
                })()}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Crime trajectory</div>
                <div className="metadata-value">{story.original_metadata?.story_annotations?.["Crime trajectory"] || 'Unknown'}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Motives</div>
                <div className="metadata-value">{story.original_metadata?.story_annotations?.["Motives"] || 'Unknown'}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Means (murder only)</div>
                <div className="metadata-value">{story.original_metadata?.story_annotations?.["Means (murder only)"] || 'N/A'}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Correct annotator guess?</div>
                <div className="metadata-value">{story.original_metadata?.story_annotations?.["Correct annotator guess?"] || 'Unknown'}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Types of clues</div>
                <div className="metadata-value">{story.original_metadata?.story_annotations?.["Types of clues"] || 'Unknown'}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Essential clue</div>
                <div className="metadata-value">{story.original_metadata?.story_annotations?.["Essential clue"] || 'Unknown'}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Most salient clue</div>
                <div className="metadata-value">{story.original_metadata?.story_annotations?.["Most salient clue"] || 'Unknown'}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Presence of planted or fabricated evidence</div>
                <div className="metadata-value">{story.original_metadata?.story_annotations?.["Presence of planted or fabricated evidence"] || 'None'}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Recommend?</div>
                <div className="metadata-value">{(() => {
                  const recommendToFriend = story.original_metadata?.story_annotations?.["Recommend to friend?"] || '';
                  const satisfaction = story.original_metadata?.story_annotations?.["How satisfying as detective fiction?"] || '';
                  const recommendation = [recommendToFriend, satisfaction].filter(rec => rec).join(' - ');
                  return recommendation || 'Unknown';
                })()}</div>
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
                  Solution (o3)
                </button>
                <button
                  onClick={() => setActiveTab('summary')}
                  style={{
                    padding: '1rem 2rem',
                    border: 'none',
                    background: activeTab === 'summary' ? '#667eea' : 'transparent',
                    color: activeTab === 'summary' ? 'white' : '#4a5568',
                    cursor: 'pointer',
                    borderRadius: '8px 8px 0 0',
                    fontWeight: activeTab === 'summary' ? '600' : 'normal'
                  }}
                >
                  Summary (concat-1kwords-v0)
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
                <div className="section-title">Solution (o3)</div>
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

            {activeTab === 'summary' && (
              <div>
                <div className="section-title">Summary (concat-1kwords-v0)</div>
                <div className="story-text">
                  {story.storySummary ? (
                    <div style={{ lineHeight: '1.6' }}>
                      {story.storySummary.split('\n').map((paragraph, index) => (
                        <p key={index} style={{ marginBottom: '1rem' }}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontStyle: 'italic', color: '#666' }}>
                      No summary available for this story
                    </div>
                  )}
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