import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const StoryStats = () => {
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    // Base columns
    storyId: true,
    storyTitle: true,
    storyLengthWords: true,
    o3GoldCulprits: true,
    o3GoldAccomplices: true,
    // Oracle columns
    oracleCulpritGuess: true,
    oracleAccompliceGuess: true,
    culpritCorrect: true,
    accompliceCorrect: true,
    preRevealWords: true,
    // Concat+prompt columns
    concatCulpritGuess: true,
    concatAccompliceGuess: true,
    concatCulpritCorrect: true,
    concatAccompliceCorrect: true,
    concatPreRevealWords: true
  });

  const dropdownOptions = [
    'Yes',
    'No', 
    'Hallucinated First Name',
    'Missing First Name',
    'Wrong Alias',
    'Mixed up main suspect and accomplice'
  ];

  useEffect(() => {
    fetchStatsData();
  }, []);

  const fetchStatsData = async () => {
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats data');
      }
      const data = await response.json();
      setStatsData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveAnnotation = async (storyId, field, value) => {
    try {
      const response = await fetch(`/api/annotations/${storyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, value }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save annotation');
      }
      
      // Update local state
      setStatsData(prevData => 
        prevData.map(story => 
          story.storyId === storyId 
            ? { ...story, [field]: value }
            : story
        )
      );
    } catch (error) {
      console.error('Error saving annotation:', error);
    }
  };

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const exportToCSV = () => {
    // Get headers in the same order as the table display
    const orderedHeaders = [];
    Object.entries(columnGroups).forEach(([groupKey, group]) => {
      group.columns.forEach(columnKey => {
        if (visibleColumns[columnKey]) {
          orderedHeaders.push(columnKey);
        }
      });
    });

    // Create properly escaped CSV content
    const csvContent = [
      // Header row with readable labels
      orderedHeaders.map(header => columnLabels[header]).join(','),
      // Data rows with proper escaping
      ...statsData.map(row => 
        orderedHeaders.map(header => {
          let value = row[header] || '';
          
          // Convert to string and handle special cases
          value = String(value);
          
          // Clean up multi-line text - replace line breaks with spaces
          value = value.replace(/[\r\n]+/g, ' ').trim();
          
          // Escape CSV special characters
          if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story_stats.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div>
        <header className="header">
          <div className="container">
            <h1>Story Statistics</h1>
            <p>Comprehensive analysis table for all detective stories</p>
          </div>
        </header>
        <div className="container">
          <div className="loading">Loading statistics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <header className="header">
          <div className="container">
            <h1>Story Statistics</h1>
            <p>Comprehensive analysis table for all detective stories</p>
          </div>
        </header>
        <div className="container">
          <div className="error">Error: {error}</div>
        </div>
      </div>
    );
  }

  const columnGroups = {
    base: {
      title: 'Basic Information',
      color: '#f0f9ff', // light blue
      columns: ['storyId', 'storyTitle', 'storyLengthWords', 'o3GoldCulprits', 'o3GoldAccomplices']
    },
    oracle: {
      title: 'Oracle (Full Story)',
      color: '#f0fdf4', // light green  
      columns: ['oracleCulpritGuess', 'oracleAccompliceGuess', 'culpritCorrect', 'accompliceCorrect', 'preRevealWords']
    },
    concat: {
      title: 'Concat+Prompt', 
      color: '#fefce8', // light yellow
      columns: ['concatCulpritGuess', 'concatAccompliceGuess', 'concatCulpritCorrect', 'concatAccompliceCorrect', 'concatPreRevealWords']
    }
  };

  const columnLabels = {
    storyId: 'ID',
    storyTitle: 'Story Title',
    storyLengthWords: 'Words',
    o3GoldCulprits: 'o3 Gold Culprits',
    o3GoldAccomplices: 'o3 Gold Accomplices',
    oracleCulpritGuess: 'Oracle Culprit Guess',
    oracleAccompliceGuess: 'Oracle Accomplice Guess', 
    culpritCorrect: 'Culprit Correct?',
    accompliceCorrect: 'Accomplice Correct?',
    preRevealWords: 'Words Pre-Reveal',
    concatCulpritGuess: 'Concat Culprit Guess',
    concatAccompliceGuess: 'Concat Accomplice Guess',
    concatCulpritCorrect: 'Culprit Correct?',
    concatAccompliceCorrect: 'Accomplice Correct?',
    concatPreRevealWords: 'Summ Length'
  };

  return (
    <div>
      <header className="header">
        <div className="container">
          <h1>Story Statistics</h1>
          <p>Comprehensive analysis table for all detective stories</p>
          <Link to="/" className="back-button">← Back to Stories</Link>
        </div>
      </header>

      <div className="container" style={{ maxWidth: '100%', padding: '2rem' }}>
        {/* Controls */}
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <button 
            onClick={exportToCSV}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Export to CSV
          </button>

          {/* Column toggles */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {Object.entries(columnGroups).map(([groupKey, group]) => (
              <div key={groupKey} style={{ 
                padding: '1rem', 
                backgroundColor: group.color, 
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>{group.title}</h4>
                {group.columns.map(columnKey => (
                  <label key={columnKey} style={{ 
                    display: 'block', 
                    marginBottom: '0.25rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={visibleColumns[columnKey]}
                      onChange={() => toggleColumn(columnKey)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    {columnLabels[columnKey]}
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ 
          overflowX: 'auto',
          overflowY: 'auto', 
          maxHeight: '70vh',
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          backgroundColor: 'white'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '0.875rem'
          }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <tr>
                {Object.entries(columnGroups).map(([groupKey, group]) => 
                  group.columns.filter(col => visibleColumns[col]).map((columnKey, index) => {
                    const visibleColumnsInGroup = group.columns.filter(col => visibleColumns[col]);
                    const isLastColumnInGroup = index === visibleColumnsInGroup.length - 1;
                    const isLastGroup = groupKey === 'concat';
                    
                    return (
                      <th key={columnKey} style={{
                        padding: '0.75rem 0.5rem',
                        backgroundColor: columnKey === 'storyId' || columnKey === 'storyTitle' ? '#f0f9ff' : group.color,
                        borderBottom: '2px solid #d1d5db',
                        borderRight: isLastGroup ? 'none' : 
                                   isLastColumnInGroup ? '3px solid #6b7280' : '1px solid #d1d5db',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        position: columnKey === 'storyId' || columnKey === 'storyTitle' ? 'sticky' : 'static',
                        left: columnKey === 'storyId' ? 0 : 
                              columnKey === 'storyTitle' ? '60px' : 'auto',
                        zIndex: columnKey === 'storyId' || columnKey === 'storyTitle' ? 20 : 'auto',
                        minWidth: columnKey === 'storyId' ? '60px' : 
                                  columnKey === 'storyTitle' ? '200px' : 
                                  columnKey.includes('Words') || columnKey.includes('words') ? '80px' :
                                  columnKey.includes('Guess') ? '150px' : '120px'
                      }}>
                        {columnLabels[columnKey]}
                      </th>
                    );
                  })
                )}
              </tr>
            </thead>
            <tbody>
              {statsData.map((story, rowIndex) => (
                <tr key={story.storyId} style={{
                  backgroundColor: rowIndex % 2 === 0 ? '#f9fafb' : 'white'
                }}>
                  {Object.entries(columnGroups).map(([groupKey, group]) => 
                    group.columns.filter(col => visibleColumns[col]).map((columnKey, index) => {
                      const visibleColumnsInGroup = group.columns.filter(col => visibleColumns[col]);
                      const isLastColumnInGroup = index === visibleColumnsInGroup.length - 1;
                      const isLastGroup = groupKey === 'concat';
                      
                      return (
                        <td key={columnKey} style={{
                          padding: '0.5rem',
                          borderBottom: '1px solid #e5e7eb',
                          borderRight: isLastGroup ? 'none' : 
                                     isLastColumnInGroup ? '3px solid #6b7280' : '1px solid #e5e7eb',
                          verticalAlign: 'top',
                          fontSize: '0.75rem',
                          position: columnKey === 'storyId' || columnKey === 'storyTitle' ? 'sticky' : 'static',
                          left: columnKey === 'storyId' ? 0 : 
                                columnKey === 'storyTitle' ? '60px' : 'auto',
                          zIndex: columnKey === 'storyId' || columnKey === 'storyTitle' ? 15 : 'auto',
                          backgroundColor: columnKey === 'storyId' || columnKey === 'storyTitle' ? '#f0f9ff' : 
                                         (rowIndex % 2 === 0 ? '#f9fafb' : 'white')
                        }}>
                          {columnKey === 'culpritCorrect' || columnKey === 'accompliceCorrect' || 
                           columnKey === 'concatCulpritCorrect' || columnKey === 'concatAccompliceCorrect' ? (
                            <select
                              value={story[columnKey] || ''}
                              onChange={(e) => saveAnnotation(story.storyId, columnKey, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.25rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '0.75rem'
                              }}
                            >
                              <option value="">Select...</option>
                              {dropdownOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : columnKey === 'storyTitle' ? (
                            <div style={{ 
                              maxWidth: '200px', 
                              wordWrap: 'break-word'
                            }}>
                              <Link 
                                to={`/story/${story.storyId}`}
                                style={{ 
                                  color: story.correctAnnotatorGuess === 'No' ? '#dc2626' : '#1f2937',
                                  fontWeight: story.correctAnnotatorGuess === 'No' ? '600' : 'normal',
                                  textDecoration: 'none'
                                }}
                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                              >
                                {story[columnKey]}
                              </Link>
                            </div>
                          ) : (
                            <div style={{ 
                              maxWidth: columnKey === 'storyTitle' ? '200px' :
                                        columnKey.includes('Words') || columnKey.includes('words') ? '80px' :
                                        columnKey.includes('Guess') ? '150px' : '120px', 
                              wordWrap: 'break-word',
                              whiteSpace: columnKey.includes('Culprits') || columnKey.includes('Accomplices') ? 'pre-wrap' : 'normal',
                              textAlign: columnKey.includes('Words') || columnKey.includes('words') ? 'right' : 'left'
                            }}>
                              {story[columnKey]}
                            </div>
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
          Showing {statsData.length} stories
        </div>
      </div>
    </div>
  );
};

export default StoryStats; 