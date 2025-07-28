import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function StoryDetail() {
  const { dataset, id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({
    'crime-info': true,  // Crime Information section closed by default
    'clues-info': true,   // Clues section closed by default
    'story-solution': false, // Story Text + Solution v2 open by default
    'reveal-segment': true,  // Reveal segment closed by default
    'solution-v2': true,     // Solution v2 collapsed by default
    'concat-summary': true,  // Summary concat closed by default
    'concat-solution': true, // Summary concat solution collapsed by default
    'iterative-summary': true // Summary iterative closed by default
  });

  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await fetch(`/api/${dataset}/stories/${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error('Story not found');
        const data = await response.json();
        setStory(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (dataset && id) {
    fetchStory();
    }
  }, [dataset, id]);

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
          <button className="back-button" onClick={() => navigate(`/${dataset}`)}>
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
          <button className="back-button" onClick={() => navigate(`/${dataset}`)}>
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
                <h1 style={{ margin: 0 }}>{(() => {
                  const baseTitle = story.storyTitle || 'Unknown Title';
                  const pubDate = story.original_metadata?.story_annotations?.["Date of First Publication (YYYY-MM-DD)"];
                  return pubDate ? `${baseTitle} (${pubDate})` : baseTitle;
                })()}</h1>
              </div>
          <p>by {(() => {
                // Handle different datasets
                if (dataset === 'true-detective') {
                  return story.original_metadata?.author_name || 'Unknown Author';
                } else {
                  // BMDS dataset
            const givenName = story.original_metadata?.author_metadata?.["Given Name(s)"] || '';
            const surname = story.original_metadata?.author_metadata?.["Surname(s)"] || '';
            const author = [givenName, surname].filter(name => name).join(' ') || 'Unknown Author';
            return author;
                }
          })()}</p>
            </div>
            <button 
                                onClick={() => navigate(`/${dataset}/stats`)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Story Stats
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        <button className="back-button" onClick={() => navigate(`/${dataset}`)}>
          ← Back to Stories
        </button>

        <div className="story-detail">
          <div className="story-detail-header">
            <h2>{(() => {
              const baseTitle = story.storyTitle || 'Unknown Title';
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
            {/* Plot Summary - Only show for BMDS dataset */}
            {dataset !== 'true-detective' && (
              <div className="plot-summary" style={{ marginBottom: '1.5rem' }}>
                <div className="section-title">Plot Summary</div>
                <p>{story.original_metadata?.plot_summary || 'No plot summary available.'}</p>
              </div>
            )}

            {/* Clues & Evidence Section */}
            <div className="clues-evidence-section" style={{ marginBottom: '2rem' }}>
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
                    {dataset === 'true-detective' ? (
                      // True Detective metadata
                      <>
                        <div style={{ marginBottom: '1rem' }}>
                          <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Solve rate:</strong>
                          <span style={{ color: '#4a5568' }}>
                            {story.original_metadata?.solve_rate ? `${story.original_metadata.solve_rate}%` : 'Unknown'}
                          </span>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Number of attempts:</strong>
                          <span style={{ color: '#4a5568' }}>
                            {story.original_metadata?.attempts ? story.original_metadata.attempts.toLocaleString() : 'Unknown'}
                          </span>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Suspects:</strong>
                          <span style={{ color: '#4a5568' }}>
                            {story.original_metadata?.answer_options || 'Unknown'}
                          </span>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Culprit:</strong>
                          <span style={{ color: '#4a5568' }}>
                            {story.original_metadata?.correct_answer || 'Unknown'}
                          </span>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Source URL:</strong>
                          <span style={{ color: '#4a5568' }}>
                            {story.original_metadata?.case_url ? (
                              <a 
                                href={story.original_metadata.case_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: '#667eea', textDecoration: 'underline' }}
                              >
                                View Original Puzzle
                              </a>
                            ) : 'Unknown'}
                          </span>
                        </div>

                        <div>
                          <strong style={{ color: '#2d3748', marginRight: '0.5rem' }}>Author URL:</strong>
                          <span style={{ color: '#4a5568' }}>
                            {story.original_metadata?.author_url ? (
                              <a 
                                href={story.original_metadata.author_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: '#667eea', textDecoration: 'underline' }}
                              >
                                View Author Profile
                              </a>
                            ) : 'Unknown'}
                          </span>
                        </div>
                      </>
                    ) : (
                      // BMDS dataset metadata
                      <>
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
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Clues Collapsible Pane - Only show for BMDS dataset */}
              {dataset !== 'true-detective' && (
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
              )}
              </div>

            {/* Collapsible Sections */}
            <div style={{ marginTop: '2rem' }}>
              
              {/* Section 1: Story Text + Solution v2 */}
              <div style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div 
                  onClick={() => toggleSection('story-solution')}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#d4f4d4',
                    borderBottom: collapsedSections['story-solution'] ? 'none' : '1px solid #e2e8f0',
                    borderRadius: collapsedSections['story-solution'] ? '8px' : '8px 8px 0 0',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: '600',
                    color: '#2d3748',
                    userSelect: 'none'
                  }}
                >
                  <span>Story Text + Solution v2</span>
                  <span style={{ 
                    transform: collapsedSections['story-solution'] ? 'rotate(0deg)' : 'rotate(90deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '1.2rem'
                  }}>
                    ▶
                  </span>
                </div>
                {!collapsedSections['story-solution'] && (
                  <div style={{ padding: '1.5rem', backgroundColor: '#f0f9f0', borderRadius: '0 0 8px 8px' }}>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                      {/* Story Text Section (Left Side) */}
                      <div style={{ flex: 1 }}>
                        <div className="section-title" style={{ marginBottom: '1rem' }}>Story Text</div>
                        <div className="story-content" style={{ lineHeight: '1.8', maxHeight: '450px', overflowY: 'auto', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#ffffff' }}>
                          {story.story?.full_text ? 
                            (() => {
                              // Remove the reveal segment from the full text using border_sentence
                              let storyText = story.story.full_text;
                              if (story.story?.border_sentence) {
                                const borderIndex = storyText.indexOf(story.story.border_sentence);
                                if (borderIndex !== -1) {
                                  storyText = storyText.substring(0, borderIndex).trim();
                                }
                              }
                              return (
                                <>
                                  {storyText.split('\n').map((paragraph, index) => (
                                <p key={index} style={{ marginBottom: '1rem' }}>
                                  {paragraph}
                                </p>
                                  ))}
                                  
                                  {/* Reveal Segment dropdown inside story text area */}
                                  {story.story?.reveal_segment && (
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '1.5rem' }}>
                                      <div 
                                        onClick={() => toggleSection('reveal-segment')}
                  style={{
                                          padding: '0.75rem',
                                          backgroundColor: '#f5c2c7',
                                          borderBottom: collapsedSections['reveal-segment'] ? 'none' : '1px solid #e2e8f0',
                                          borderRadius: collapsedSections['reveal-segment'] ? '8px' : '8px 8px 0 0',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: '600',
                    color: '#2d3748',
                                          userSelect: 'none',
                                          fontSize: '0.9rem'
                  }}
                >
                                        <span>Reveal Segment</span>
                  <span style={{ 
                                          transform: collapsedSections['reveal-segment'] ? 'rotate(0deg)' : 'rotate(90deg)',
                    transition: 'transform 0.2s ease',
                                          fontSize: '1rem'
                  }}>
                    ▶
                  </span>
                </div>
                                      {!collapsedSections['reveal-segment'] && (
                                        <div style={{ 
                                          padding: '1rem',
                                          backgroundColor: '#fdf2f8',
                                          borderRadius: '0 0 8px 8px'
                                        }}>
                                          <div style={{ lineHeight: '1.8' }}>
                                            {story.story.reveal_segment.split('\n').map((paragraph, index) => (
                                              <p key={index} style={{ marginBottom: '1rem' }}>
                                                {paragraph}
                                              </p>
                                            ))}
                        </div>
                      </div>
                                      )}
                  </div>
                )}
                                </>
                              );
                            })() : 
                            'No story text available'
                          }
                        </div>
              </div>

                      {/* Solution v2 Section (Right Side) - Horizontally Collapsible */}
                      <div style={{ 
                        flex: collapsedSections['solution-v2'] ? '0 0 40px' : '1',
                        transition: 'flex 0.3s ease',
                        minWidth: collapsedSections['solution-v2'] ? '40px' : 'auto'
                      }}>
                        {/* Solution v2 as horizontally collapsible section */}
                        {(story.detection?.solution || story.solutionV2) && (
                          <div style={{ 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '8px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: collapsedSections['solution-v2'] ? 'column' : 'column'
                          }}>
                            <div 
                              onClick={() => toggleSection('solution-v2')}
                  style={{
                                padding: collapsedSections['solution-v2'] ? '1rem 0.5rem' : '1rem',
                    backgroundColor: '#f8fafc',
                                borderBottom: collapsedSections['solution-v2'] ? 'none' : '1px solid #e2e8f0',
                                borderRadius: collapsedSections['solution-v2'] ? '8px' : '8px 8px 0 0',
                    cursor: 'pointer',
                    display: 'flex',
                                justifyContent: collapsedSections['solution-v2'] ? 'center' : 'space-between',
                    alignItems: 'center',
                    fontWeight: '600',
                    color: '#2d3748',
                                userSelect: 'none',
                                writingMode: collapsedSections['solution-v2'] ? 'vertical-rl' : 'horizontal-tb',
                                textOrientation: collapsedSections['solution-v2'] ? 'mixed' : 'unset',
                                whiteSpace: 'nowrap'
                  }}
                >
                              <span style={{ fontSize: collapsedSections['solution-v2'] ? '0.9rem' : '1rem' }}>
                                {collapsedSections['solution-v2'] ? 'Sol v2' : 'Solution v2'}
                              </span>
                              {!collapsedSections['solution-v2'] && (
                  <span style={{ 
                                  transform: 'rotate(90deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '1.2rem'
                  }}>
                    ▶
                  </span>
                )}
              </div>
                            {!collapsedSections['solution-v2'] && (
                              <div style={{ 
                                padding: '1.5rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0 0 8px 8px'
                              }}>
                                <div style={{ lineHeight: '1.8', maxHeight: '400px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
                  {dataset === 'true-detective' ? (
                    // For true-detective: show the original solution (o3) content with structured parsing
                    story.detection?.solution ? (
                      <div style={{ lineHeight: '1.8' }}>
                        {(() => {
                          const parseStructuredSolution = (solutionText) => {
                            if (!solutionText || typeof solutionText !== 'string') {
                              return [];
                            }
                            
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

                          const sections = parseStructuredSolution(story.detection.solution);
                          
                          return (
                            <div>
                              {sections.map((section, index) => (
                                <div key={index} style={{ marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                  <div 
                                    onClick={() => toggleSection(`td-${index}`)}
                                    style={{
                                      padding: '1rem',
                                      backgroundColor: '#f8fafc',
                                      borderBottom: collapsedSections[`td-${index}`] ? 'none' : '1px solid #e2e8f0',
                                      borderRadius: collapsedSections[`td-${index}`] ? '8px' : '8px 8px 0 0',
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
                                      transform: collapsedSections[`td-${index}`] ? 'rotate(0deg)' : 'rotate(90deg)',
                                      transition: 'transform 0.2s ease',
                                      fontSize: '1.2rem'
                                    }}>
                                      ▶
                                    </span>
                                  </div>
                                  {!collapsedSections[`td-${index}`] && (
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
                        No solution available for this story.
                      </p>
                    )
                  ) : (
                    // For BMDS: show the structured solution v2 content
                    story.solutionV2 ? (
                      <div style={{ lineHeight: '1.8' }}>
                        {(() => {
                          const parseStructuredSolution = (solutionText) => {
                            if (!solutionText || typeof solutionText !== 'string') {
                              return [];
                            }
                            
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
                      )
                  )}
                </div>
              </div>
            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Summary 1k concat + Solution */}
              <div style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div 
                  onClick={() => toggleSection('concat-summary')}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#d4f4d4',
                    borderBottom: collapsedSections['concat-summary'] ? 'none' : '1px solid #e2e8f0',
                    borderRadius: collapsedSections['concat-summary'] ? '8px' : '8px 8px 0 0',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: '600',
                    color: '#2d3748',
                    userSelect: 'none'
                  }}
                >
                  <span>Summary 1k concat | Summary 1k concat solution</span>
                  <span style={{ 
                    transform: collapsedSections['concat-summary'] ? 'rotate(0deg)' : 'rotate(90deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '1.2rem'
                  }}>
                    ▶
                  </span>
                </div>
                {!collapsedSections['concat-summary'] && (
                  <div style={{ padding: '1.5rem', backgroundColor: '#f0f9f0', borderRadius: '0 0 8px 8px' }}>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                      <div style={{ flex: 1 }}>
                        <div className="section-title" style={{ marginBottom: '1rem' }}>Summary 1k concat</div>
                        <div style={{ lineHeight: '1.8', maxHeight: '400px', overflowY: 'auto', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#ffffff' }}>
                          {dataset === 'true-detective' ? (
                            <p style={{ fontStyle: 'italic', color: '#718096' }}>
                              No concat summary data available for true-detective dataset.
                            </p>
                          ) : (
                            // For BMDS: show the concat summary content
                            story.concatSummary ? (
                              <div style={{ lineHeight: '1.8' }}>
                                {story.concatSummary.split('\n').map((paragraph, index) => (
                                  <p key={index} style={{ marginBottom: '1rem' }}>
                                    {paragraph}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p style={{ fontStyle: 'italic', color: '#718096' }}>
                                No concat summary data available for this story.
                              </p>
                            )
                          )}
                        </div>
                      </div>
                      {/* Summary 1k concat solution Section (Right Side) - Horizontally Collapsible */}
                      <div style={{ 
                        flex: collapsedSections['concat-solution'] ? '0 0 40px' : '1',
                        transition: 'flex 0.3s ease',
                        minWidth: collapsedSections['concat-solution'] ? '40px' : 'auto'
                      }}>
                        {/* Summary 1k concat solution as horizontally collapsible section */}
                        <div style={{ 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px',
                          height: '100%',
                          display: 'flex',
                          flexDirection: collapsedSections['concat-solution'] ? 'column' : 'column'
                        }}>
                          <div 
                            onClick={() => toggleSection('concat-solution')}
                            style={{
                              padding: collapsedSections['concat-solution'] ? '1rem 0.5rem' : '1rem',
                              backgroundColor: '#f8fafc',
                              borderBottom: collapsedSections['concat-solution'] ? 'none' : '1px solid #e2e8f0',
                              borderRadius: collapsedSections['concat-solution'] ? '8px' : '8px 8px 0 0',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: collapsedSections['concat-solution'] ? 'center' : 'space-between',
                              alignItems: 'center',
                              fontWeight: '600',
                              color: '#2d3748',
                              userSelect: 'none',
                              writingMode: collapsedSections['concat-solution'] ? 'vertical-rl' : 'horizontal-tb',
                              textOrientation: collapsedSections['concat-solution'] ? 'mixed' : 'unset',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <span style={{ fontSize: collapsedSections['concat-solution'] ? '0.9rem' : '1rem' }}>
                              {collapsedSections['concat-solution'] ? 'Sol 1k' : 'Summary 1k concat solution'}
                            </span>
                            {!collapsedSections['concat-solution'] && (
                              <span style={{ 
                                transform: 'rotate(90deg)',
                                transition: 'transform 0.2s ease',
                                fontSize: '1.2rem'
                              }}>
                                ▶
                              </span>
                            )}
                          </div>
                          {!collapsedSections['concat-solution'] && (
                            <div style={{ 
                              padding: '1.5rem',
                              backgroundColor: '#ffffff',
                              borderRadius: '0 0 8px 8px'
                            }}>
                              <div style={{ lineHeight: '1.8', maxHeight: '400px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
                          {dataset === 'true-detective' ? (
                            <p style={{ fontStyle: 'italic', color: '#718096' }}>
                              No concat solution data available for true-detective dataset.
                            </p>
                          ) : (
                            // For BMDS: show the structured concat solution content  
                            story.concatSolution ? (
                              <div style={{ lineHeight: '1.8' }}>
                                {(() => {
                                  const parseStructuredSolution = (solutionText) => {
                                    if (!solutionText || typeof solutionText !== 'string') {
                                      return [];
                                    }
                                    
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

                                  const sections = parseStructuredSolution(story.concatSolution);
                                  
                                  return (
                                    <div>
                                      {sections.map((section, index) => (
                                        <div key={index} style={{ marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                          <div 
                                            onClick={() => toggleSection(`concat-${index}`)}
                                            style={{
                                              padding: '1rem',
                                              backgroundColor: '#f8fafc',
                                              borderBottom: collapsedSections[`concat-${index}`] ? 'none' : '1px solid #e2e8f0',
                                              borderRadius: collapsedSections[`concat-${index}`] ? '8px' : '8px 8px 0 0',
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
                                              transform: collapsedSections[`concat-${index}`] ? 'rotate(0deg)' : 'rotate(90deg)',
                                              transition: 'transform 0.2s ease',
                                              fontSize: '1.2rem'
                                            }}>
                                              ▶
                                            </span>
          </div>
                                          {!collapsedSections[`concat-${index}`] && (
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
                                No concat solution data available for this story.
                              </p>
                            )
                          )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Summary 1k iterative + Solution */}
              <div style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div 
                  onClick={() => toggleSection('iterative-summary')}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#d4f4d4',
                    borderBottom: collapsedSections['iterative-summary'] ? 'none' : '1px solid #e2e8f0',
                    borderRadius: collapsedSections['iterative-summary'] ? '8px' : '8px 8px 0 0',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: '600',
                    color: '#2d3748',
                    userSelect: 'none'
                  }}
                >
                  <span>Summary 1k iterative | Summary 1k iterative solution</span>
                  <span style={{ 
                    transform: collapsedSections['iterative-summary'] ? 'rotate(0deg)' : 'rotate(90deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '1.2rem'
                  }}>
                    ▶
                  </span>
                </div>
                {!collapsedSections['iterative-summary'] && (
                  <div style={{ padding: '1.5rem', backgroundColor: '#f0f9f0', borderRadius: '0 0 8px 8px' }}>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                      <div style={{ flex: 1 }}>
                        <div className="section-title" style={{ marginBottom: '1rem' }}>Summary 1k iterative</div>
                        <div style={{ lineHeight: '1.8', maxHeight: '400px', overflowY: 'auto', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#ffffff' }}>
                          {dataset === 'true-detective' ? (
                            <p style={{ fontStyle: 'italic', color: '#718096' }}>
                              No iterative summary data available for true-detective dataset.
                            </p>
                          ) : (
                            // For BMDS: show the iterative summary content
                            story.iterativeSummary ? (
                              <div style={{ lineHeight: '1.8' }}>
                                {story.iterativeSummary.split('\n').map((paragraph, index) => (
                                  <p key={index} style={{ marginBottom: '1rem' }}>
                                    {paragraph}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p style={{ fontStyle: 'italic', color: '#718096' }}>
                                No iterative summary data available for this story.
                              </p>
                            )
                          )}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="section-title" style={{ marginBottom: '1rem' }}>Summary 1k iterative solution</div>
                        <div style={{ lineHeight: '1.8', maxHeight: '400px', overflowY: 'auto', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#ffffff' }}>
                          <p>Mock content for Summary 1k iterative solution. This would contain the solution based on the iterative summary.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            


          </div>
        </div>
      </div>
    </div>
  );
}

export default StoryDetail; 
