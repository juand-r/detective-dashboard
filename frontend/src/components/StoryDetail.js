import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function StoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('story');
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await fetch(`/api/stories/${id}`);
        if (!response.ok) throw new Error('Story not found');
        const data = await response.json();
        setStory(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id]);

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
            {/* Plot Summary */}
            <div className="plot-summary">
              <div className="section-title">Plot Summary</div>
              <p>{story.original_metadata?.plot_summary || 'No plot summary available.'}</p>
            </div>

            {/* Clues & Evidence Section */}
            <div className="clues-evidence-section" style={{ marginBottom: '2rem' }}>
              <div className="section-title">Story Metadata</div>
              
              {/* Crime Information Collapsible Pane */}
              <div style={{ marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div 
                  onClick={() => toggleSection('crime-info')}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderBottom: collapsedSections['crime-info'] ? 'none' : '1px solid #e2e8f0',
                    borderRadius: collapsedSections['crime-info'] ? '8px' : '8px 8px 0 0',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: '600',
                    color: '#2d3748',
                    userSelect: 'none'
                  }}
                >
                  <span>Crime Information</span>
                  <span style={{ 
                    transform: collapsedSections['crime-info'] ? 'rotate(0deg)' : 'rotate(90deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '1.2rem'
                  }}>
                    ▶
                  </span>
                </div>
                {!collapsedSections['crime-info'] && (
                  <div style={{ 
                    padding: '1.5rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '0 0 8px 8px'
                  }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Number of victims:</strong>
                      <span style={{ color: '#4a5568' }}>
                        {(() => {
                          const maleVictims = parseInt(story.original_metadata?.story_annotations?.["Number of victims of gender Male"] || 0);
                          const femaleVictims = parseInt(story.original_metadata?.story_annotations?.["Number of victims of gender Female"] || 0);
                          const nonBinaryVictims = parseInt(story.original_metadata?.story_annotations?.["Number of victims of gender Non-binary"] || 0);
                          const unknownVictims = parseInt(story.original_metadata?.story_annotations?.["Number of victims of gender Unknown"] || 0);
                          return maleVictims + femaleVictims + nonBinaryVictims + unknownVictims;
                        })()}
                      </span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Number of culprits:</strong>
                      <span style={{ color: '#4a5568' }}>
                        {(() => {
                          const maleCulprits = parseInt(story.original_metadata?.story_annotations?.["Number of culprits of gender Male"] || 0);
                          const femaleCulprits = parseInt(story.original_metadata?.story_annotations?.["Number of culprits of gender Female"] || 0);
                          const nonBinaryCulprits = parseInt(story.original_metadata?.story_annotations?.["Number of culprits of gender Non-binary"] || 0);
                          const unknownCulprits = parseInt(story.original_metadata?.story_annotations?.["Number of culprits of gender Unknown"] || 0);
                          return maleCulprits + femaleCulprits + nonBinaryCulprits + unknownCulprits;
                        })()}
                      </span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Crimes:</strong>
                      <span style={{ color: '#4a5568' }}>
                        {(() => {
                          const focusCrime = story.original_metadata?.story_annotations?.["Focus on crime or quasi-crime"] || '';
                          const crimeTypes = story.original_metadata?.story_annotations?.["Types of qrimes"] || '';
                          const crimes = [focusCrime, crimeTypes].filter(crime => crime).join(', ');
                          return crimes || 'Unknown';
                        })()}
                      </span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Crime trajectory:</strong>
                      <span style={{ color: '#4a5568' }}>
                        {story.original_metadata?.story_annotations?.["Crime trajectory"] || 'Unknown'}
                      </span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Motives:</strong>
                      <span style={{ color: '#4a5568' }}>
                        {story.original_metadata?.story_annotations?.["Motives"] || 'Unknown'}
                      </span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Means (murder only):</strong>
                      <span style={{ color: '#4a5568' }}>
                        {story.original_metadata?.story_annotations?.["Means (murder only)"] || 'N/A'}
                      </span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Correct annotator guess?</strong>
                      <span style={{ color: '#4a5568' }}>
                        {story.original_metadata?.story_annotations?.["Correct annotator guess?"] || 'Unknown'}
                      </span>
                    </div>

                    <div>
                      <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Recommend?</strong>
                      <span style={{ color: '#4a5568' }}>
                        {(() => {
                          const recommend = story.original_metadata?.story_annotations?.["Recommend to friend?"] || '';
                          const satisfying = story.original_metadata?.story_annotations?.["How satisfying as detective fiction?"] || '';
                          const combined = [recommend, satisfying].filter(item => item).join(' - ');
                          return combined || 'Unknown';
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Clues Collapsible Pane */}
              <div style={{ marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div 
                  onClick={() => toggleSection('clues-info')}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderBottom: collapsedSections['clues-info'] ? 'none' : '1px solid #e2e8f0',
                    borderRadius: collapsedSections['clues-info'] ? '8px' : '8px 8px 0 0',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: '600',
                    color: '#2d3748',
                    userSelect: 'none'
                  }}
                >
                  <span>Clues</span>
                  <span style={{ 
                    transform: collapsedSections['clues-info'] ? 'rotate(0deg)' : 'rotate(90deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '1.2rem'
                  }}>
                    ▶
                  </span>
                </div>
                {!collapsedSections['clues-info'] && (
                  <div style={{ 
                    padding: '1.5rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '0 0 8px 8px'
                  }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Essential Clue:</strong>
                      <span style={{ color: '#4a5568' }}>
                        {story.original_metadata?.story_annotations?.["Essential clue"] || 'Not specified'}
                      </span>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Most Salient Clue:</strong>
                      <span style={{ color: '#4a5568' }}>
                        {story.original_metadata?.story_annotations?.["Most salient clue"] || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Presence of Planted or Fabricated Evidence:</strong>
                      <span style={{ color: '#4a5568' }}>
                        {story.original_metadata?.story_annotations?.["Presence of planted or fabricated evidence"] || 'None'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
                  onClick={() => setActiveTab('solutionv2')}
                  style={{
                    padding: '1rem 2rem',
                    border: 'none',
                    background: activeTab === 'solutionv2' ? '#667eea' : 'transparent',
                    color: activeTab === 'solutionv2' ? 'white' : '#4a5568',
                    cursor: 'pointer',
                    borderRadius: '8px 8px 0 0',
                    fontWeight: activeTab === 'solutionv2' ? '600' : 'normal'
                  }}
                >
                  Solution v2
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
                <div className="section-title">Story Text</div>
                <div className="story-content" style={{ lineHeight: '1.8' }}>
                  {story.story?.full_text || 'No story text available'}
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

            {activeTab === 'solution' && (
              <div>
                <div className="section-title">Solution (o3)</div>
                <div className="solution-section">
                  {story.detection?.solution ? (
                    <div style={{ lineHeight: '1.8' }}>
                      {story.detection.solution}
                    </div>
                  ) : (
                    <p style={{ fontStyle: 'italic', color: '#718096' }}>
                      No solution available for this story.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'solutionv2' && (
              <div>
                <div className="section-title">Solution v2 (o3-given-reveal)</div>
                <div className="solution-section">
                  {story.solutionV2 ? (
                    <div style={{ lineHeight: '1.8' }}>
                      {(() => {
                        const parseStructuredSolution = (solutionText) => {
                          const sections = [];
                          const tagPattern = /<([^>]+)>/g;
                          const parts = solutionText.split(tagPattern);
                          
                          let currentSection = null;
                          let currentContent = '';
                          
                          for (let i = 0; i < parts.length; i++) {
                            const part = parts[i];
                            
                            if (i % 2 === 1) { // This is a tag
                              // Skip closing tags (those that start with /)
                              if (part.startsWith('/')) {
                                continue;
                              }
                              
                              // Save previous section if it exists
                              if (currentSection) {
                                sections.push({
                                  title: currentSection,
                                  content: currentContent.trim()
                                });
                              }
                              
                              // Start new section
                              currentSection = part;
                              currentContent = '';
                            } else { // This is content
                              currentContent += part;
                            }
                          }
                          
                          // Add the last section
                          if (currentSection && currentContent.trim()) {
                            sections.push({
                              title: currentSection,
                              content: currentContent.trim()
                            });
                          }
                          
                          return sections;
                        };

                        const sections = parseStructuredSolution(story.solutionV2);
                        
                        return (
                          <div>
                            {sections.map((section, index) => (
                              <div key={index} style={{ marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                <div 
                                  onClick={() => toggleSection(`v2-${index}`)}
                                  style={{
                                    padding: '1rem',
                                    backgroundColor: '#f8fafc',
                                    borderBottom: collapsedSections[`v2-${index}`] ? 'none' : '1px solid #e2e8f0',
                                    borderRadius: collapsedSections[`v2-${index}`] ? '8px' : '8px 8px 0 0',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontWeight: '600',
                                    color: '#2d3748',
                                    userSelect: 'none'
                                  }}
                                >
                                  <span>{section.title}</span>
                                  <span style={{ 
                                    transform: collapsedSections[`v2-${index}`] ? 'rotate(0deg)' : 'rotate(90deg)',
                                    transition: 'transform 0.2s ease',
                                    fontSize: '1.2rem'
                                  }}>
                                    ▶
                                  </span>
                                </div>
                                {!collapsedSections[`v2-${index}`] && (
                                  <div style={{ 
                                    padding: '1rem',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '0 0 8px 8px'
                                  }}>
                                    <p style={{ 
                                      margin: 0,
                                      whiteSpace: 'pre-wrap',
                                      color: '#4a5568'
                                    }}>
                                      {section.content}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <p style={{ fontStyle: 'italic', color: '#718096' }}>
                      No Solution v2 data available for this story.
                    </p>
                  )}
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
}

export default StoryDetail; 