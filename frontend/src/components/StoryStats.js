import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

function StoryStats() {
  const { dataset } = useParams();
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    // Base columns (ID is always visible, not toggleable)
    storyTitle: true,
    solveRate: dataset === 'true-detective',
    storyLengthWords: true,
    // True-detective specific columns
    suspects: dataset === 'true-detective',
    culprit: dataset === 'true-detective',
    o3GoldCulprits: true,
    o3GoldAccomplices: dataset !== 'true-detective', // Hide for true-detective
    // Oracle columns
    oracleCulpritGuess: true,
    oracleAccompliceGuess: dataset !== 'true-detective', // Hide for true-detective
    oracleCulpritGptCorrect: true, // GPT evaluation of Oracle culprit correctness
    culpritCorrect: true,
    accompliceCorrect: dataset !== 'true-detective', // Hide for true-detective
    preRevealWords: true,
    // Concat+prompt columns
    concatCulpritGuess: true, // Put back for true-detective
    concatAccompliceGuess: dataset !== 'true-detective', // Hide for true-detective
    concatCulpritCorrect: true,
    concatAccompliceCorrect: dataset !== 'true-detective', // Hide for true-detective
    concatPreRevealWords: true
  });


  const dropdownOptions = [
    'Yes',
    'No', 
    'Hallucinated First Name',
    'Missing First Name',
    'Wrong Alias',
    'Mixed up main suspect and accomplice',
    'Missing one or more people',
    'At least one person is correct, but some are wrong (and not accomplices)'
  ];

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/${dataset}/stats`);
        if (!response.ok) throw new Error('Failed to fetch stats data');
        const data = await response.json();
        setStatsData(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (dataset) {
      fetchStatsData();
    }
  }, [dataset]);

  const saveAnnotation = async (storyId, field, value) => {
    try {
      const response = await fetch(`/api/${dataset}/annotations/${storyId}`, {
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

  const toggleGroupColumns = (groupKey) => {
    const group = columnGroups[groupKey];
    const allVisible = group.columns.every(col => visibleColumns[col]);
    
    setVisibleColumns(prev => {
      const updated = { ...prev };
      group.columns.forEach(col => {
        updated[col] = !allVisible;
      });
      return updated;
    });
  };

  const exportToCSV = () => {
    // Always include storyId as first column, then get other headers in display order
    const orderedHeaders = ['storyId'];
    Object.entries(columnGroups).forEach(([groupKey, group]) => {
      group.columns.forEach(columnKey => {
        if (visibleColumns[columnKey]) {
          orderedHeaders.push(columnKey);
        }
      });
    });

    // Create aggregate row data
    const aggregateRow = {};
    orderedHeaders.forEach(columnKey => {
      if (columnKey === 'storyId') {
        aggregateRow[columnKey] = 'Avg.';
      } else if (columnKey === 'storyLengthWords' || columnKey === 'preRevealWords' || columnKey === 'concatPreRevealWords') {
        const values = statsData.map(story => parseInt(story[columnKey]) || 0).filter(val => val > 0);
        const avg = values.length > 0 ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length) : 0;
        aggregateRow[columnKey] = avg;
      } else if (columnKey === 'storyTitle') {
        aggregateRow[columnKey] = `${statsData.length} stories`;
      } else {
        aggregateRow[columnKey] = '—'; // Em dash for non-applicable fields
      }
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
      ),
      // Add aggregate row
      orderedHeaders.map(header => {
        let value = aggregateRow[header] || '';
        
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
      columns: dataset === 'true-detective' 
        ? ['storyTitle', 'solveRate', 'storyLengthWords', 'suspects', 'culprit', 'o3GoldCulprits']
        : ['storyTitle', 'storyLengthWords', 'o3GoldCulprits', 'o3GoldAccomplices']
    },
    oracle: {
      title: 'Oracle (Full Story)',
      color: '#f0fdf4', // light green  
      columns: dataset === 'true-detective' 
        ? ['oracleCulpritGuess', 'oracleCulpritGptCorrect', 'culpritCorrect', 'preRevealWords']
        : ['oracleCulpritGuess', 'oracleAccompliceGuess', 'oracleCulpritGptCorrect', 'culpritCorrect', 'accompliceCorrect', 'preRevealWords']
    },
    concat: {
      title: 'Concat+Prompt', 
      color: '#fefce8', // light yellow
      columns: dataset === 'true-detective'
        ? ['concatCulpritGuess', 'concatCulpritCorrect', 'concatPreRevealWords']
        : ['concatCulpritGuess', 'concatAccompliceGuess', 'concatCulpritCorrect', 'concatAccompliceCorrect', 'concatPreRevealWords']
    }
  };

  const columnLabels = {
    storyId: 'ID',
    storyTitle: 'Story Title',
    solveRate: 'Solve Rate',
    storyLengthWords: 'Words',
    suspects: 'Suspects',
    culprit: 'Culprit',
    o3GoldCulprits: 'o3 Gold Culprits',
    o3GoldAccomplices: 'o3 Gold Accomplices',
    oracleCulpritGuess: 'Oracle Culprit Guess',
    oracleAccompliceGuess: 'Oracle Accomplice Guess',
    oracleCulpritGptCorrect: 'Culprit Correct?',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <button
                  onClick={() => navigate(`/${dataset}`)}
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
                  ← Back to Stories
                </button>
                <h1 style={{ margin: 0 }}>Story Statistics</h1>
              </div>
              <p>Comprehensive analysis table for all detective stories</p>
            </div>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              All Datasets
            </button>
          </div>
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
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', marginRight: '0.5rem' }}>{group.title}</h4>
                  {(groupKey === 'oracle' || groupKey === 'concat') && (
                    <button
                      onClick={() => toggleGroupColumns(groupKey)}
                      style={{
                        background: 'none',
                        border: '1px solid #6b7280',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}
                      title={group.columns.every(col => visibleColumns[col]) ? 'Hide all columns' : 'Show all columns'}
                    >
                      {group.columns.every(col => visibleColumns[col]) ? '✓' : '○'}
                    </button>
                  )}
                </div>
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
                {/* Always show Story ID column first */}
                <th key="storyId" style={{
                  padding: '0.75rem 0.5rem',
                  backgroundColor: '#f0f9ff',
                  borderBottom: '2px solid #d1d5db',
                  borderRight: '1px solid #d1d5db',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  left: 0,
                  zIndex: 20,
                  minWidth: '60px'
                }}>
                  {columnLabels.storyId}
                </th>
                
                {/* Then show other visible columns */}
                {Object.entries(columnGroups).map(([groupKey, group]) => 
                  group.columns.filter(col => visibleColumns[col]).map((columnKey, index) => {
                    const visibleColumnsInGroup = group.columns.filter(col => visibleColumns[col]);
                    const isLastColumnInGroup = index === visibleColumnsInGroup.length - 1;
                    const isLastGroup = groupKey === 'concat';
                    
                    return (
                      <th key={columnKey} style={{
                        padding: '0.75rem 0.5rem',
                        backgroundColor: columnKey === 'storyTitle' ? '#f0f9ff' : group.color,
                        borderBottom: '2px solid #d1d5db',
                        borderRight: isLastGroup ? 'none' : 
                                   isLastColumnInGroup ? '3px solid #6b7280' : '1px solid #d1d5db',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        position: columnKey === 'storyTitle' ? 'sticky' : 'static',
                        left: columnKey === 'storyTitle' ? '60px' : 'auto',
                        zIndex: columnKey === 'storyTitle' ? 20 : 'auto',
                        minWidth: columnKey === 'storyTitle' ? '200px' : 
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
                  {/* Always show Story ID column first */}
                  <td key="storyId" style={{
                    padding: '0.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    borderRight: '1px solid #e5e7eb',
                    verticalAlign: 'top',
                    fontSize: '0.75rem',
                    position: 'sticky',
                    left: 0,
                    zIndex: 15,
                    backgroundColor: '#f0f9ff'
                  }}>
                                      <div style={{ textAlign: 'left' }}>
                    <Link 
                      to={`/${dataset}/story/${story.storyId}`}
                      style={{ 
                        color: '#1f2937',
                        textDecoration: 'none',
                        fontWeight: '500'
                      }}
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                      >
                        {story.storyId}
                      </Link>
                    </div>
                  </td>

                  {/* Then show other visible columns */}
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
                          position: columnKey === 'storyTitle' ? 'sticky' : 'static',
                          left: columnKey === 'storyTitle' ? '60px' : 'auto',
                          zIndex: columnKey === 'storyTitle' ? 15 : 'auto',
                          backgroundColor: columnKey === 'storyTitle' ? '#f0f9ff' : 
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
                              to={`/${dataset}/story/${story.storyId}`}
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
                                        columnKey === 'suspects' ? '260px' :
                                        columnKey.includes('Words') || columnKey.includes('words') ? '80px' :
                                        columnKey.includes('Guess') ? '150px' : '120px', 
                              wordWrap: 'break-word',
                              whiteSpace: columnKey.includes('Culprits') || columnKey.includes('Accomplices') || columnKey === 'suspects' ? 'pre-wrap' : 'normal',
                              textAlign: columnKey.includes('Words') || columnKey.includes('words') ? 'right' : 'left'
                            }}>
                              {columnKey === 'suspects' && story[columnKey] ? 
                                story[columnKey].replace(/; \(/g, '\n(') : 
                                story[columnKey]
                              }
                            </div>
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
              
              {/* Aggregate Statistics Row */}
              <tr style={{ backgroundColor: '#fef3c7' }}>
                {/* Always show Story ID column first with "Avg." */}
                <td key="storyId" style={{
                  padding: '0.5rem',
                  borderTop: '3px solid #d97706',
                  borderBottom: '1px solid #e5e7eb',
                  borderRight: '1px solid #e5e7eb',
                  verticalAlign: 'top',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  position: 'sticky',
                  left: 0,
                  zIndex: 15,
                  backgroundColor: '#fde68a'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    Avg.
                  </div>
                </td>

                {/* Then show other visible columns */}
                {Object.entries(columnGroups).map(([groupKey, group]) => 
                  group.columns.filter(col => visibleColumns[col]).map((columnKey, index) => {
                    const visibleColumnsInGroup = group.columns.filter(col => visibleColumns[col]);
                    const isLastColumnInGroup = index === visibleColumnsInGroup.length - 1;
                    const isLastGroup = groupKey === 'concat';
                    
                    // Calculate aggregate values
                    let displayValue = '';
                    if (columnKey === 'storyLengthWords' || columnKey === 'preRevealWords' || columnKey === 'concatPreRevealWords') {
                      const values = statsData.map(story => parseInt(story[columnKey]) || 0).filter(val => val > 0);
                      const avg = values.length > 0 ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length) : 0;
                      displayValue = avg.toLocaleString();
                    } else if (columnKey === 'storyTitle') {
                      displayValue = `${statsData.length} stories`;
                    } else {
                      displayValue = '—'; // Em dash for non-applicable fields
                    }
                    
                    return (
                      <td key={columnKey} style={{
                        padding: '0.5rem',
                        borderTop: '3px solid #d97706', // Thick top border to separate from data
                        borderBottom: '1px solid #e5e7eb',
                        borderRight: isLastGroup ? 'none' : 
                                   isLastColumnInGroup ? '3px solid #6b7280' : '1px solid #e5e7eb',
                        verticalAlign: 'top',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        position: columnKey === 'storyTitle' ? 'sticky' : 'static',
                        left: columnKey === 'storyTitle' ? '60px' : 'auto',
                        zIndex: columnKey === 'storyTitle' ? 15 : 'auto',
                        backgroundColor: columnKey === 'storyTitle' ? '#fde68a' : '#fef3c7'
                      }}>
                        <div style={{ 
                          textAlign: columnKey.includes('Words') || columnKey.includes('words') ? 'right' : 'left'
                        }}>
                          {displayValue}
                        </div>
                      </td>
                    );
                  })
                )}
              </tr>

              {/* Count rows for each dropdown option */}
              {dropdownOptions.map(option => {
                return (
                  <tr key={`count-${option}`} style={{ backgroundColor: '#fef3c7' }}>
                    {/* Story ID column with count/fraction label */}
                    <td style={{
                      padding: '0.5rem',
                      borderTop: '1px solid #e5e7eb',
                      borderBottom: '1px solid #e5e7eb',
                      borderRight: '1px solid #e5e7eb',
                      verticalAlign: 'top',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      position: 'sticky',
                      left: 0,
                      zIndex: 15,
                      backgroundColor: '#fde68a'
                    }}>
                      <div style={{ textAlign: 'left' }}>
                        {dataset === 'true-detective' && (option === 'Yes' || option === 'No') ? 
                          `Fraction ${option}` : `Count: ${option}`}
                      </div>
                    </td>

                    {/* Show counts in appropriate columns */}
                    {Object.entries(columnGroups).map(([groupKey, group]) => 
                      group.columns.filter(col => visibleColumns[col]).map((columnKey, index) => {
                        const visibleColumnsInGroup = group.columns.filter(col => visibleColumns[col]);
                        const isLastColumnInGroup = index === visibleColumnsInGroup.length - 1;
                        const isLastGroup = groupKey === 'concat';
                        
                        // Show count/fraction for dropdown fields, empty for others
                        let displayValue = '';
                        if (['oracleCulpritGptCorrect', 'culpritCorrect', 'accompliceCorrect', 'concatCulpritCorrect', 'concatAccompliceCorrect'].includes(columnKey)) {
                          const fieldCount = statsData.filter(story => story[columnKey] === option).length;
                          
                          // For True Detective Yes/No options, show fractions; otherwise show counts
                          if (dataset === 'true-detective' && (option === 'Yes' || option === 'No')) {
                            const fraction = statsData.length > 0 ? fieldCount / statsData.length : 0;
                            displayValue = fraction.toFixed(2);
                          } else {
                            displayValue = fieldCount > 0 ? fieldCount.toString() : '0';
                          }
                        } else {
                          displayValue = '—'; // Em dash for non-applicable fields
                        }
                        
                        return (
                          <td key={columnKey} style={{
                            padding: '0.5rem',
                            borderTop: '1px solid #e5e7eb',
                            borderBottom: '1px solid #e5e7eb',
                            borderRight: isLastGroup ? 'none' : 
                                       isLastColumnInGroup ? '3px solid #6b7280' : '1px solid #e5e7eb',
                            verticalAlign: 'top',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            position: columnKey === 'storyTitle' ? 'sticky' : 'static',
                            left: columnKey === 'storyTitle' ? '60px' : 'auto',
                            zIndex: columnKey === 'storyTitle' ? 15 : 'auto',
                            backgroundColor: columnKey === 'storyTitle' ? '#fde68a' : '#fef3c7'
                          }}>
                            <div style={{ 
                              textAlign: 'center'
                            }}>
                              {displayValue}
                            </div>
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
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