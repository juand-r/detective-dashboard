import React from 'react';
import { Link } from 'react-router-dom';

function DatasetLanding() {
  const datasets = [
    {
      id: 'bmds',
      name: 'BMDS Dataset',
      description: 'Benchmark for Mystery & Detective Stories - "solvable" stories with structured solutions',
      githubUrl: 'https://github.com/ahmmnd/BMDS',
      color: '#3b82f6' // blue
    },
    {
      id: 'true-detective',
      name: 'True Detective Dataset',
      description: 'Short mystery puzzles from the True Detective dataset (https://github.com/TartuNLP/true-detective )',
      githubUrl: '#', // placeholder
      color: '#10b981' // green
    },
    {
      id: 'musr',
      name: 'MuSR Dataset',
      description: 'Murder Mystery Stories for Reading comprehension',
      githubUrl: '#', // placeholder
      color: '#f59e0b' // amber
    },
    {
      id: 'csi',
      name: 'CSI Corpus',
      description: 'Crime Scene Investigation cases with forensic analysis',
      githubUrl: '#', // placeholder
      color: '#ef4444' // red
    }
  ];

  return (
    <div>
      <header className="header">
        <div className="container" style={{ textAlign: 'center' }}>
          <h1>Detective Solutions Dashboard</h1>
          <p>Explore and analyze detective stories from multiple datasets</p>
        </div>
      </header>

      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {datasets.map(dataset => (
            <Link
              key={dataset.id}
              to={`/${dataset.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '2rem',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  backgroundColor: dataset.color,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}>
                    {dataset.name.charAt(0)}
                  </span>
                </div>
                <h3 style={{
                  color: '#1f2937',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  {dataset.name}
                </h3>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {dataset.description}
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '1rem'
              }}>
                <span style={{
                  color: dataset.color,
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Explore Stories →
                </span>
                {dataset.githubUrl !== '#' && (
                  <a
                    href={dataset.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#6b7280',
                      fontSize: '0.75rem',
                      textDecoration: 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    GitHub
                  </a>
                )}
              </div>
            </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DatasetLanding; 