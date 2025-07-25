const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app (for production)
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Dataset configuration
const DATASETS = {
  'bmds': {
    name: 'BMDS Dataset',
    description: 'Benchmark for Mystery & Detective Stories',
    detectiveSolutionsDir: path.join(__dirname, 'data/bmds/stories'),
    summariesDir: path.join(__dirname, 'data/bmds/summaries/summaries-concat-1k-v0'),
    solutionsV2Dir: path.join(__dirname, 'data/bmds/solutions/detective_solutions-o3-given-reveal')
  },
  'true-detective': {
    name: 'True Detective Dataset',
    description: 'Short mystery puzzles from the True Detective dataset (https://github.com/TartuNLP/true-detective )',
    detectiveSolutionsDir: path.join(__dirname, 'data/true-detective/solutions/detective_solutions-true-detective-without-reveal'),
    summariesDir: path.join(__dirname, 'data/true-detective/summaries'),
    solutionsV2Dir: path.join(__dirname, 'data/true-detective/v2-solutions') // Will create if needed
  }
};

// Legacy paths for backwards compatibility (pointing to BMDS for now)
const DETECTIVE_SOLUTIONS_DIR = path.join(__dirname, 'data/bmds/stories');
const SUMMARIES_DIR = path.join(__dirname, 'data/bmds/summaries/summaries-concat-1k-v0');
const DETECTIVE_SOLUTIONS_V2_DIR = path.join(__dirname, 'data/bmds/solutions/detective_solutions-o3-given-reveal');
const USER_ANNOTATIONS_FILE = path.join(__dirname, 'user_annotations.json');

// Helper function to load user annotations
function loadUserAnnotations() {
  try {
    if (fs.existsSync(USER_ANNOTATIONS_FILE)) {
      const data = fs.readFileSync(USER_ANNOTATIONS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading user annotations:', error);
  }
  return {};
}

// Helper function to save user annotations
function saveUserAnnotations(annotations) {
  try {
    fs.writeFileSync(USER_ANNOTATIONS_FILE, JSON.stringify(annotations, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving user annotations:', error);
    return false;
  }
}

// API endpoint to get all detective solution metadata
app.get('/api/stories', (req, res) => {
  try {
    const files = fs.readdirSync(DETECTIVE_SOLUTIONS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const stories = jsonFiles.map(file => {
      const filePath = path.join(DETECTIVE_SOLUTIONS_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Extract author from author_metadata
      const givenName = data.original_metadata?.author_metadata?.["Given Name(s)"] || '';
      const surname = data.original_metadata?.author_metadata?.["Surname(s)"] || '';
      const author = [givenName, surname].filter(name => name).join(' ') || 'Unknown';
      
      // Extract story title from story_annotations
      const storyTitle = data.original_metadata?.story_annotations?.["Story Title"] || 'Unknown';
      
      // Extract story code from filename (part before first underscore)
      const storyCode = data.original_metadata?.story_code || data.metadata.event_name;
      
      // Extract publication date
      const publicationDate = data.original_metadata?.story_annotations?.["Date of First Publication (YYYY-MM-DD)"] || '';
      
      // Try to read corresponding summary file
      let storySummary = null;
      try {
        const summaryFileName = `${storyCode}_latest_full_document_response.json`;
        const summaryFilePath = path.join(SUMMARIES_DIR, summaryFileName);
        if (fs.existsSync(summaryFilePath)) {
          const summaryData = JSON.parse(fs.readFileSync(summaryFilePath, 'utf8'));
          storySummary = summaryData.final_summary || null;
        }
      } catch (error) {
        console.log(`Warning: Could not read summary for ${storyCode}:`, error.message);
      }

      // Try to read corresponding v2 solution file
      let solutionV2 = null;
      try {
        const v2FileName = `${storyCode}_detective_solution.json`;
        const v2FilePath = path.join(DETECTIVE_SOLUTIONS_V2_DIR, v2FileName);
        if (fs.existsSync(v2FilePath)) {
          const v2Data = JSON.parse(fs.readFileSync(v2FilePath, 'utf8'));
          solutionV2 = v2Data.detection?.solution || null;
        }
      } catch (error) {
        console.log(`Warning: Could not read v2 solution for ${storyCode}:`, error.message);
      }
      
      return {
        id: data.metadata.event_name,
        title: data.metadata.event_description,
        author: author,
        storyCode: storyCode,
        storyTitle: storyTitle,
        plotSummary: data.original_metadata?.plot_summary || '',
        textLength: data.metadata.story_length,
        isSolvable: data.original_metadata?.is_solvable || true,
        model: data.metadata.model,
        storySummary: storySummary,
        publicationDate: publicationDate,
        solutionV2: solutionV2
      };
    });
    
    res.json(stories);
  } catch (error) {
    console.error('Error reading stories:', error);
    res.status(500).json({ error: 'Failed to read stories' });
  }
});

// API endpoint to get a specific story by ID
app.get('/api/stories/:id', (req, res) => {
  try {
    const storyId = req.params.id;
    const files = fs.readdirSync(DETECTIVE_SOLUTIONS_DIR);
    const storyFile = files.find(file => file.startsWith(storyId) && file.endsWith('.json'));
    
    if (!storyFile) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    const filePath = path.join(DETECTIVE_SOLUTIONS_DIR, storyFile);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Try to add corresponding summary data
    const storyCode = data.original_metadata?.story_code || data.metadata.event_name;
    try {
      const summaryFileName = `${storyCode}_latest_full_document_response.json`;
      const summaryFilePath = path.join(SUMMARIES_DIR, summaryFileName);
      if (fs.existsSync(summaryFilePath)) {
        const summaryData = JSON.parse(fs.readFileSync(summaryFilePath, 'utf8'));
        data.storySummary = summaryData.final_summary || null;
      }
    } catch (error) {
      console.log(`Warning: Could not read summary for ${storyCode}:`, error.message);
      data.storySummary = null;
    }

    // Try to add corresponding v2 solution data
    try {
      const v2FileName = `${storyCode}_detective_solution.json`;
      const v2FilePath = path.join(DETECTIVE_SOLUTIONS_V2_DIR, v2FileName);
      if (fs.existsSync(v2FilePath)) {
        const v2Data = JSON.parse(fs.readFileSync(v2FilePath, 'utf8'));
        data.solutionV2 = v2Data.detection?.solution || null;
      }
    } catch (error) {
      console.log(`Warning: Could not read v2 solution for ${storyCode}:`, error.message);
      data.solutionV2 = null;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error reading story:', error);
    res.status(500).json({ error: 'Failed to read story' });
  }
});

// API endpoint to search stories
app.get('/api/search', (req, res) => {
  try {
    const { q, author, solvable } = req.query;
    const files = fs.readdirSync(DETECTIVE_SOLUTIONS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    let stories = jsonFiles.map(file => {
      const filePath = path.join(DETECTIVE_SOLUTIONS_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Extract author from author_metadata
      const givenName = data.original_metadata?.author_metadata?.["Given Name(s)"] || '';
      const surname = data.original_metadata?.author_metadata?.["Surname(s)"] || '';
      const author = [givenName, surname].filter(name => name).join(' ') || 'Unknown';
      
      // Extract story title from story_annotations
      const storyTitle = data.original_metadata?.story_annotations?.["Story Title"] || 'Unknown';
      
      // Extract story code from filename (part before first underscore)
      const storyCode = data.original_metadata?.story_code || data.metadata.event_name;
      
      // Extract publication date
      const publicationDate = data.original_metadata?.story_annotations?.["Date of First Publication (YYYY-MM-DD)"] || '';
      
      // Try to read corresponding summary file
      let storySummary = null;
      try {
        const summaryFileName = `${storyCode}_latest_full_document_response.json`;
        const summaryFilePath = path.join(SUMMARIES_DIR, summaryFileName);
        if (fs.existsSync(summaryFilePath)) {
          const summaryData = JSON.parse(fs.readFileSync(summaryFilePath, 'utf8'));
          storySummary = summaryData.final_summary || null;
        }
      } catch (error) {
        console.log(`Warning: Could not read summary for ${storyCode}:`, error.message);
      }

      // Try to read corresponding v2 solution file
      let solutionV2 = null;
      try {
        const v2FileName = `${storyCode}_detective_solution.json`;
        const v2FilePath = path.join(DETECTIVE_SOLUTIONS_V2_DIR, v2FileName);
        if (fs.existsSync(v2FilePath)) {
          const v2Data = JSON.parse(fs.readFileSync(v2FilePath, 'utf8'));
          solutionV2 = v2Data.detection?.solution || null;
        }
      } catch (error) {
        console.log(`Warning: Could not read v2 solution for ${storyCode}:`, error.message);
      }
      
      return {
        id: data.metadata.event_name,
        title: data.metadata.event_description,
        author: author,
        storyCode: storyCode,
        storyTitle: storyTitle,
        plotSummary: data.original_metadata?.plot_summary || '',
        textLength: data.metadata.story_length,
        isSolvable: data.original_metadata?.is_solvable || true,
        model: data.metadata.model,
        storySummary: storySummary,
        fullData: data,
        publicationDate: publicationDate,
        solutionV2: solutionV2
      };
    });
    
    // Apply filters
    if (q) {
      const searchTerm = q.toLowerCase();
      stories = stories.filter(story => 
        story.title.toLowerCase().includes(searchTerm) ||
        story.author.toLowerCase().includes(searchTerm) ||
        story.storyTitle.toLowerCase().includes(searchTerm) ||
        story.plotSummary.toLowerCase().includes(searchTerm)
      );
    }
    
    if (author) {
      stories = stories.filter(story => 
        story.author.toLowerCase() === author.toLowerCase()
      );
    }
    
    if (solvable !== undefined) {
      const isSolvable = solvable === 'true';
      stories = stories.filter(story => story.isSolvable === isSolvable);
    }
    
    // Remove fullData before sending response
    const responseStories = stories.map(({ fullData, ...story }) => story);
    
    res.json(responseStories);
  } catch (error) {
    console.error('Error searching stories:', error);
    res.status(500).json({ error: 'Failed to search stories' });
  }
});

// API endpoint to get authors list
app.get('/api/authors', (req, res) => {
  try {
    const files = fs.readdirSync(DETECTIVE_SOLUTIONS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const authors = new Set();
    
    jsonFiles.forEach(file => {
      const filePath = path.join(DETECTIVE_SOLUTIONS_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Extract author from author_metadata
      const givenName = data.original_metadata?.author_metadata?.["Given Name(s)"] || '';
      const surname = data.original_metadata?.author_metadata?.["Surname(s)"] || '';
      const author = [givenName, surname].filter(name => name).join(' ') || 'Unknown';
      
      authors.add(author);
    });
    
    res.json(Array.from(authors).sort());
  } catch (error) {
    console.error('Error reading authors:', error);
    res.status(500).json({ error: 'Failed to read authors' });
  }
});

// API endpoint for stats table data
app.get('/api/stats', (req, res) => {
  try {
    const userAnnotations = loadUserAnnotations();
    const statsData = [];
    
    // Read all detective solution files
    const files = fs.readdirSync(DETECTIVE_SOLUTIONS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('_detective_solution.json'));

    jsonFiles.forEach(filename => {
      try {
        const filePath = path.join(DETECTIVE_SOLUTIONS_DIR, filename);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Extract basic info
        const storyId = data.metadata.event_name;
        const storyTitle = data.original_metadata?.story_annotations?.["Story Title"] || 'Unknown';
        const publicationDate = data.original_metadata?.story_annotations?.["Date of First Publication (YYYY-MM-DD)"] || '';
        const displayTitle = publicationDate ? `${storyTitle} (${publicationDate})` : storyTitle;
        
        const correctAnnotatorGuess = data.original_metadata?.story_annotations?.["Correct annotator guess?"] || 'Unknown';
        
        // Convert character length to words (rough estimate)
        const storyLengthWords = Math.round((data.metadata.story_length || 0) / 5); // ~5 chars per word
        
        // Parse Solution v2 for culprits and accomplices
        let o3GoldCulprits = '';
        let o3GoldAccomplices = '';
        
        try {
          const v2FileName = `${storyId}_detective_solution.json`;
          const v2FilePath = path.join(DETECTIVE_SOLUTIONS_V2_DIR, v2FileName);
          if (fs.existsSync(v2FilePath)) {
            const v2Data = JSON.parse(fs.readFileSync(v2FilePath, 'utf8'));
            const solutionText = v2Data.detection?.solution || '';
            
            // Extract MAIN CULPRIT(S) and ACCOMPLICE(S)
            const culpritMatch = solutionText.match(/<MAIN CULPRIT\(S\)>(.*?)<\/MAIN CULPRIT\(S\)>/s);
            const accompliceMatch = solutionText.match(/<ACCOMPLICE\(S\)>(.*?)<\/ACCOMPLICE\(S\)>/s);
            
            o3GoldCulprits = culpritMatch ? culpritMatch[1].trim() : '';
            o3GoldAccomplices = accompliceMatch ? accompliceMatch[1].trim() : '';
          }
        } catch (error) {
          console.log(`Warning: Could not parse v2 solution for ${storyId}:`, error.message);
        }

        // Parse without-reveal solution for oracle guesses
        let oracleCulpritGuess = '';
        let oracleAccompliceGuess = '';
        
        try {
          const withoutRevealDir = path.join(__dirname, 'data/bmds/solutions/detective_solutions-o3-without-reveal');
          const withoutRevealFileName = `${storyId}_detective_solution.json`;
          const withoutRevealFilePath = path.join(withoutRevealDir, withoutRevealFileName);
          if (fs.existsSync(withoutRevealFilePath)) {
            const withoutRevealData = JSON.parse(fs.readFileSync(withoutRevealFilePath, 'utf8'));
            const withoutRevealSolutionText = withoutRevealData.detection?.solution || '';
            
            // Extract MAIN CULPRIT(S) and ACCOMPLICE(S) from without-reveal
            const withoutRevealCulpritMatch = withoutRevealSolutionText.match(/<MAIN CULPRIT\(S\)>(.*?)<\/MAIN CULPRIT\(S\)>/s);
            const withoutRevealAccompliceMatch = withoutRevealSolutionText.match(/<ACCOMPLICE\(S\)>(.*?)<\/ACCOMPLICE\(S\)>/s);
            
            oracleCulpritGuess = withoutRevealCulpritMatch ? withoutRevealCulpritMatch[1].trim() : '';
            oracleAccompliceGuess = withoutRevealAccompliceMatch ? withoutRevealAccompliceMatch[1].trim() : '';
          }
        } catch (error) {
          console.log(`Warning: Could not parse without-reveal solution for ${storyId}:`, error.message);
        }

        // Parse custom-bmds solution for concat guesses
        let concatCulpritGuess = '';
        let concatAccompliceGuess = '';
        
        try {
          const customBmdsDir = path.join(__dirname, 'data/bmds/solutions/detective_solutions-custom-bmds-600-900-words-v2');
          const customBmdsFileName = `${storyId}_detective_solution.json`;
          const customBmdsFilePath = path.join(customBmdsDir, customBmdsFileName);
          if (fs.existsSync(customBmdsFilePath)) {
            const customBmdsData = JSON.parse(fs.readFileSync(customBmdsFilePath, 'utf8'));
            const customBmdsSolutionText = customBmdsData.detection?.solution || '';
            
            // Extract MAIN CULPRIT(S) and ACCOMPLICE(S) from custom-bmds
            const customBmdsCulpritMatch = customBmdsSolutionText.match(/<MAIN CULPRIT\(S\)>(.*?)<\/MAIN CULPRIT\(S\)>/s);
            const customBmdsAccompliceMatch = customBmdsSolutionText.match(/<ACCOMPLICE\(S\)>(.*?)<\/ACCOMPLICE\(S\)>/s);
            
            concatCulpritGuess = customBmdsCulpritMatch ? customBmdsCulpritMatch[1].trim() : '';
            concatAccompliceGuess = customBmdsAccompliceMatch ? customBmdsAccompliceMatch[1].trim() : '';
          }
        } catch (error) {
          console.log(`Warning: Could not parse custom-bmds solution for ${storyId}:`, error.message);
        }
        
        // Calculate pre-reveal word count
        let preRevealWords = 0;
        try {
          const fullText = data.story?.full_text || '';
          const borderSentence = data.metadata?.border_sentence || '';
          if (borderSentence && fullText.includes(borderSentence)) {
            const preRevealText = fullText.split(borderSentence)[0];
            preRevealWords = preRevealText.split(' ').length;
          } else {
            preRevealWords = storyLengthWords; // If no border sentence, use full length
          }
        } catch (error) {
          preRevealWords = storyLengthWords;
        }
        
        // Get user annotations for this story
        const storyAnnotations = userAnnotations[storyId] || {};
        
        statsData.push({
          storyId,
          storyTitle: displayTitle,
          correctAnnotatorGuess,
          storyLengthWords,
          o3GoldCulprits,
          o3GoldAccomplices,
          preRevealWords,
          // Oracle guesses from without-reveal files
          oracleCulpritGuess: oracleCulpritGuess,
          oracleAccompliceGuess: oracleAccompliceGuess,
          culpritCorrect: storyAnnotations.culpritCorrect || '',
          accompliceCorrect: storyAnnotations.accompliceCorrect || '',
          concatCulpritGuess: concatCulpritGuess,
          concatAccompliceGuess: concatAccompliceGuess,
          concatCulpritCorrect: storyAnnotations.concatCulpritCorrect || '',
          concatAccompliceCorrect: storyAnnotations.concatAccompliceCorrect || '',
          concatPreRevealWords: storyAnnotations.concatPreRevealWords || preRevealWords
        });
      } catch (error) {
        console.error(`Error processing ${filename}:`, error);
      }
    });
    
    res.json(statsData);
  } catch (error) {
    console.error('Error generating stats data:', error);
    res.status(500).json({ error: 'Failed to generate stats data' });
  }
});

// API endpoint to save user annotation
app.post('/api/annotations/:storyId', (req, res) => {
  try {
    const { storyId } = req.params;
    const { field, value } = req.body;
    
    const userAnnotations = loadUserAnnotations();
    
    if (!userAnnotations[storyId]) {
      userAnnotations[storyId] = {};
    }
    
    userAnnotations[storyId][field] = value;
    
    if (saveUserAnnotations(userAnnotations)) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to save annotation' });
    }
  } catch (error) {
    console.error('Error saving annotation:', error);
    res.status(500).json({ error: 'Failed to save annotation' });
  }
});

// API endpoint to get user annotations
app.get('/api/annotations', (req, res) => {
  try {
    const userAnnotations = loadUserAnnotations();
    res.json(userAnnotations);
  } catch (error) {
    console.error('Error loading annotations:', error);
    res.status(500).json({ error: 'Failed to load annotations' });
  }
});

// === DATASET-SPECIFIC ROUTES ===

// Middleware to validate dataset
function validateDataset(req, res, next) {
  const { dataset } = req.params;
  if (!DATASETS[dataset]) {
    return res.status(404).json({ error: `Dataset '${dataset}' not found` });
  }
  req.datasetConfig = DATASETS[dataset];
  next();
}

// Dataset-specific routes
app.get('/api/:dataset/stories', validateDataset, (req, res) => {
  try {
    const { dataset } = req.params;
    const { detectiveSolutionsDir, summariesDir, solutionsV2Dir } = req.datasetConfig;
    
    const files = fs.readdirSync(detectiveSolutionsDir);
    const stories = [];

    files.forEach(filename => {
      if (filename.endsWith('.json')) {
        try {
          const filePath = path.join(detectiveSolutionsDir, filename);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          // Extract story code from filename
          const storyCode = filename.replace('_detective_solution.json', '');
          
          // Extract publication date
          const publicationDate = data.original_metadata?.story_annotations?.["Date of First Publication (YYYY-MM-DD)"] || '';
          
          // Try to read corresponding summary file
          let summary = null;
          let storySummary = null;
          try {
            const summaryFileName = `${storyCode}_latest_full_document_response.json`;
            const summaryFilePath = path.join(summariesDir, summaryFileName);
            if (fs.existsSync(summaryFilePath)) {
              const summaryData = JSON.parse(fs.readFileSync(summaryFilePath, 'utf8'));
              summary = summaryData;
              storySummary = summaryData.final_summary || null;
            }
          } catch (error) {
            console.log(`Warning: Could not read summary for ${storyCode}:`, error.message);
          }
          
              // Try to read corresponding v2 solution file
    let solutionV2 = null;
    try {
      const v2FileName = `${storyCode}_detective_solution.json`;
      const v2FilePath = path.join(solutionsV2Dir, v2FileName);
      if (fs.existsSync(v2FilePath)) {
        const v2Data = JSON.parse(fs.readFileSync(v2FilePath, 'utf8'));
        solutionV2 = v2Data.detection?.solution || null;
      }
    } catch (error) {
      console.log(`Warning: Could not read v2 solution for ${storyCode}:`, error.message);
    }

          const story = {
            id: storyCode,
            storyTitle: dataset === 'true-detective' 
              ? (data.metadata?.event_name || filename)
              : (data.original_metadata?.story_annotations?.["Story Title"] || filename),
            author: (() => {
              if (dataset === 'true-detective') {
                return data.original_metadata?.author_name || 'Unknown Author';
              } else {
                // BMDS dataset
                const givenName = data.original_metadata?.author_metadata?.["Given Name(s)"] || '';
                const surname = data.original_metadata?.author_metadata?.["Surname(s)"] || '';
                return [givenName, surname].filter(name => name).join(' ') || 'Unknown Author';
              }
            })(),
            storyCode: storyCode,
            textLength: data.metadata?.story_length || 0,
            plotSummary: data.original_metadata?.plot_summary || 'No plot summary available',
            isSolvable: data.original_metadata?.story_annotations?.["Solvable?"] === "Yes",
            model: data.metadata?.model || 'Unknown',
            publicationDate: publicationDate,
            summary: summary,
            storySummary: storySummary,
            solutionV2: solutionV2
          };

          stories.push(story);
        } catch (error) {
          console.error(`Error processing file ${filename}:`, error);
        }
      }
    });

    res.json(stories);
  } catch (error) {
    console.error('Error reading detective solutions:', error);
    res.status(500).json({ error: 'Failed to read detective solutions' });
  }
});

app.get('/api/:dataset/stories/:id', validateDataset, (req, res) => {
  try {
    const { dataset, id } = req.params;
    const { detectiveSolutionsDir, summariesDir, solutionsV2Dir } = req.datasetConfig;
    
    const filename = `${id}_detective_solution.json`;
    const filePath = path.join(detectiveSolutionsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Extract publication date
    const publicationDate = data.original_metadata?.story_annotations?.["Date of First Publication (YYYY-MM-DD)"] || '';
    
    // Try to read corresponding summary file
    let summary = null;
    let storySummary = null;
    try {
      const summaryFileName = `${id}_latest_full_document_response.json`;
      const summaryFilePath = path.join(summariesDir, summaryFileName);
      if (fs.existsSync(summaryFilePath)) {
        const summaryData = JSON.parse(fs.readFileSync(summaryFilePath, 'utf8'));
        summary = summaryData;
        storySummary = summaryData.final_summary || null;
      }
    } catch (error) {
      console.log(`Warning: Could not read summary for ${id}:`, error.message);
    }
    
    // Try to read corresponding v2 solution file
    let solutionV2 = null;
    try {
      const v2FileName = `${id}_detective_solution.json`;
      const v2FilePath = path.join(solutionsV2Dir, v2FileName);
      if (fs.existsSync(v2FilePath)) {
        const v2Data = JSON.parse(fs.readFileSync(v2FilePath, 'utf8'));
        solutionV2 = v2Data.detection?.solution || null;
      }
    } catch (error) {
      console.log(`Warning: Could not read v2 solution for ${id}:`, error.message);
    }

    const response = {
      ...data,
      id: id,
      storyTitle: dataset === 'true-detective' 
        ? (data.metadata?.event_name || id)
        : (data.original_metadata?.story_annotations?.["Story Title"] || id),
      publicationDate: publicationDate,
      summary: summary,
      storySummary: storySummary,
      solutionV2: solutionV2
    };

    res.json(response);
  } catch (error) {
    console.error('Error reading detective solution:', error);
    res.status(500).json({ error: 'Failed to read detective solution' });
  }
});

app.get('/api/:dataset/search', validateDataset, (req, res) => {
  try {
    const { dataset } = req.params;
    const { detectiveSolutionsDir, summariesDir, solutionsV2Dir } = req.datasetConfig;
    const query = req.query.q?.toLowerCase() || '';
    
    if (!query) {
      return res.json([]);
    }

    const files = fs.readdirSync(detectiveSolutionsDir);
    const results = [];

    files.forEach(filename => {
      if (filename.endsWith('.json')) {
        try {
          const filePath = path.join(detectiveSolutionsDir, filename);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          const storyCode = filename.replace('_detective_solution.json', '');
          const storyTitle = dataset === 'true-detective' 
            ? (data.metadata?.event_name || filename)
            : (data.original_metadata?.story_annotations?.["Story Title"] || filename);
          const author = (() => {
            if (dataset === 'true-detective') {
              return data.original_metadata?.author_name || 'Unknown Author';
            } else {
              // BMDS dataset
              const givenName = data.original_metadata?.author_metadata?.["Given Name(s)"] || '';
              const surname = data.original_metadata?.author_metadata?.["Surname(s)"] || '';
              return [givenName, surname].filter(name => name).join(' ') || 'Unknown Author';
            }
          })();
          const plotSummary = data.original_metadata?.plot_summary || '';
          const publicationDate = data.original_metadata?.story_annotations?.["Date of First Publication (YYYY-MM-DD)"] || '';
          
          // Check if any field matches the query
          const matches = [
            storyTitle,
            author,
            plotSummary,
            storyCode
          ].some(field => field.toLowerCase().includes(query));

          if (matches) {
            // Try to read corresponding summary and v2 solution files
            let summary = null;
            let storySummary = null;
            let solutionV2 = null;
            
            try {
              const summaryFileName = `${storyCode}_latest_full_document_response.json`;
              const summaryFilePath = path.join(summariesDir, summaryFileName);
              if (fs.existsSync(summaryFilePath)) {
                const summaryData = JSON.parse(fs.readFileSync(summaryFilePath, 'utf8'));
                summary = summaryData;
                storySummary = summaryData.final_summary || null;
              }
            } catch (error) {
              console.log(`Warning: Could not read summary for ${storyCode}:`, error.message);
            }
            
            try {
              const v2FileName = `${storyCode}_detective_solution.json`;
              const v2FilePath = path.join(solutionsV2Dir, v2FileName);
              if (fs.existsSync(v2FilePath)) {
                const v2Data = JSON.parse(fs.readFileSync(v2FilePath, 'utf8'));
                solutionV2 = v2Data.detection?.solution || null;
              }
            } catch (error) {
              console.log(`Warning: Could not read v2 solution for ${storyCode}:`, error.message);
            }

            results.push({
              id: storyCode,
              storyTitle: storyTitle,
              author: author,
              storyCode: storyCode,
              textLength: data.metadata?.story_length || 0,
              plotSummary: plotSummary,
              isSolvable: data.original_metadata?.story_annotations?.["Solvable?"] === "Yes",
              model: data.metadata?.model || 'Unknown',
              publicationDate: publicationDate,
              summary: summary,
              storySummary: storySummary,
              solutionV2: solutionV2
            });
          }
        } catch (error) {
          console.error(`Error processing file ${filename}:`, error);
        }
      }
    });

    res.json(results);
  } catch (error) {
    console.error('Error searching stories:', error);
    res.status(500).json({ error: 'Failed to search stories' });
  }
});

app.get('/api/:dataset/stats', validateDataset, (req, res) => {
  try {
    const { dataset } = req.params;
    const { detectiveSolutionsDir, summariesDir, solutionsV2Dir } = req.datasetConfig;
    
    const files = fs.readdirSync(detectiveSolutionsDir);
    const stats = [];
    const userAnnotations = loadUserAnnotations();

    files.forEach(filename => {
      if (filename.endsWith('.json')) {
        try {
          const filePath = path.join(detectiveSolutionsDir, filename);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          const storyCode = filename.replace('_detective_solution.json', '');
          
          // Try to read solution file for o3 gold data
          let o3GoldCulprits = '';
          let o3GoldAccomplices = '';
          try {
            if (dataset === 'true-detective') {
              // For true-detective: read from detective_solutions-true-detective-with-reveal
              const trueDetectiveDir = path.join(__dirname, 'data/true-detective/solutions/detective_solutions-true-detective-with-reveal');
              const trueDetectiveFileName = `${storyCode}_detective_solution.json`;
              const trueDetectiveFilePath = path.join(trueDetectiveDir, trueDetectiveFileName);
              
              if (fs.existsSync(trueDetectiveFilePath)) {
                const trueDetectiveData = JSON.parse(fs.readFileSync(trueDetectiveFilePath, 'utf8'));
                const solutionText = trueDetectiveData.detection?.solution;
                
                // Parse culprit from the structured response (true-detective uses <CULPRIT> tags)
                if (typeof solutionText === 'string') {
                  const culpritMatch = solutionText.match(/<CULPRIT>(.*?)<\/CULPRIT>/s);
                  o3GoldCulprits = culpritMatch ? culpritMatch[1].trim() : '';
                  // True-detective doesn't typically have accomplices in this format
                  o3GoldAccomplices = '';
                }
              }
            } else {
              // For BMDS: use the existing v2 solution logic
              const v2FileName = `${storyCode}_detective_solution.json`;
              const v2FilePath = path.join(solutionsV2Dir, v2FileName);
              if (fs.existsSync(v2FilePath)) {
                const v2Data = JSON.parse(fs.readFileSync(v2FilePath, 'utf8'));
                const solutionText = v2Data.detection?.solution;
                
                // Parse culprits and accomplices from the structured response
                if (typeof solutionText === 'string') {
                  const culpritMatch = solutionText.match(/<MAIN CULPRIT\(S\)>(.*?)<\/MAIN CULPRIT\(S\)>/s);
                  const accompliceMatch = solutionText.match(/<ACCOMPLICE\(S\)>(.*?)<\/ACCOMPLICE\(S\)>/s);
                  
                  o3GoldCulprits = culpritMatch ? culpritMatch[1].trim() : '';
                  o3GoldAccomplices = accompliceMatch ? accompliceMatch[1].trim() : '';
                }
              }
            }
          } catch (error) {
            console.log(`Warning: Could not read solution for ${storyCode}:`, error.message);
          }

          // Try to read without-reveal solution file for oracle data
          let oracleCulpritGuess = '';
          let oracleAccompliceGuess = '';
          try {
            if (dataset === 'true-detective') {
              // For true-detective: read from detective_solutions-true-detective-without-reveal
              const trueDetectiveWithoutRevealDir = path.join(__dirname, 'data/true-detective/solutions/detective_solutions-true-detective-without-reveal');
              const trueDetectiveWithoutRevealFileName = `${storyCode}_detective_solution.json`;
              const trueDetectiveWithoutRevealFilePath = path.join(trueDetectiveWithoutRevealDir, trueDetectiveWithoutRevealFileName);
              
              if (fs.existsSync(trueDetectiveWithoutRevealFilePath)) {
                const trueDetectiveWithoutRevealData = JSON.parse(fs.readFileSync(trueDetectiveWithoutRevealFilePath, 'utf8'));
                const solutionText = trueDetectiveWithoutRevealData.detection?.solution;
                
                // Parse culprit from the structured response with fallback parsing
                if (typeof solutionText === 'string') {
                  // First try XML format: <MAIN CULPRIT(S)>content</MAIN CULPRIT(S)>
                  let culpritMatch = solutionText.match(/<MAIN\s+CULPRIT\(S\)>(.*?)<\/MAIN\s+CULPRIT\(S\)>/s);
                  
                  if (culpritMatch) {
                    oracleCulpritGuess = culpritMatch[1].trim();
                  } else {
                    // Fallback to plain text format: MAIN CULPRIT(S)\ncontent
                    const plainMatch = solutionText.match(/MAIN\s+CULPRIT\(S\)\s*\n(.*?)(?:\n\n[A-Z]|\n[A-Z][A-Z\s]*\(S\)|$)/s);
                    oracleCulpritGuess = plainMatch ? plainMatch[1].trim() : '';
                  }
                  // True-detective doesn't typically have accomplices in this format
                  oracleAccompliceGuess = '';
                }
              }
            } else {
              // For BMDS: use the existing without-reveal solution logic
              const withoutRevealDir = path.join(__dirname, 'data/bmds/solutions/detective_solutions-o3-without-reveal');
              const withoutRevealFileName = `${storyCode}_detective_solution.json`;
              const withoutRevealFilePath = path.join(withoutRevealDir, withoutRevealFileName);
              if (fs.existsSync(withoutRevealFilePath)) {
                const withoutRevealData = JSON.parse(fs.readFileSync(withoutRevealFilePath, 'utf8'));
                const withoutRevealSolutionText = withoutRevealData.detection?.solution;
                
                // Parse culprits and accomplices from the structured response
                if (typeof withoutRevealSolutionText === 'string') {
                  const withoutRevealCulpritMatch = withoutRevealSolutionText.match(/<MAIN CULPRIT\(S\)>(.*?)<\/MAIN CULPRIT\(S\)>/s);
                  const withoutRevealAccompliceMatch = withoutRevealSolutionText.match(/<ACCOMPLICE\(S\)>(.*?)<\/ACCOMPLICE\(S\)>/s);
                  
                  oracleCulpritGuess = withoutRevealCulpritMatch ? withoutRevealCulpritMatch[1].trim() : '';
                  oracleAccompliceGuess = withoutRevealAccompliceMatch ? withoutRevealAccompliceMatch[1].trim() : '';
                }
              }
            }
          } catch (error) {
            console.log(`Warning: Could not read without-reveal solution for ${storyCode}:`, error.message);
          }

          // Try to read solution file for concat data
          let concatCulpritGuess = '';
          let concatAccompliceGuess = '';
          try {
            if (dataset === 'true-detective') {
              // For true-detective: leave concat columns blank
              concatCulpritGuess = '';
              concatAccompliceGuess = '';
            } else {
              // For BMDS: use the existing custom-bmds solution logic
              const customBmdsDir = path.join(__dirname, 'data/bmds/solutions/detective_solutions-custom-bmds-600-900-words-v2');
              const customBmdsFileName = `${storyCode}_detective_solution.json`;
              const customBmdsFilePath = path.join(customBmdsDir, customBmdsFileName);
              if (fs.existsSync(customBmdsFilePath)) {
                const customBmdsData = JSON.parse(fs.readFileSync(customBmdsFilePath, 'utf8'));
                const customBmdsSolutionText = customBmdsData.detection?.solution;
                
                // Parse culprits and accomplices from the structured response
                if (typeof customBmdsSolutionText === 'string') {
                  const customBmdsCulpritMatch = customBmdsSolutionText.match(/<MAIN CULPRIT\(S\)>(.*?)<\/MAIN CULPRIT\(S\)>/s);
                  const customBmdsAccompliceMatch = customBmdsSolutionText.match(/<ACCOMPLICE\(S\)>(.*?)<\/ACCOMPLICE\(S\)>/s);
                  
                  concatCulpritGuess = customBmdsCulpritMatch ? customBmdsCulpritMatch[1].trim() : '';
                  concatAccompliceGuess = customBmdsAccompliceMatch ? customBmdsAccompliceMatch[1].trim() : '';
                }
              }
            }
          } catch (error) {
            console.log(`Warning: Could not read solution for ${storyCode}:`, error.message);
          }
          
          // Try to read summary file for additional data
          let summaryData = null;
          try {
            const summaryFileName = `${storyCode}_latest_full_document_response.json`;
            const summaryFilePath = path.join(summariesDir, summaryFileName);
            if (fs.existsSync(summaryFilePath)) {
              summaryData = JSON.parse(fs.readFileSync(summaryFilePath, 'utf8'));
            }
          } catch (error) {
            console.log(`Warning: Could not read summary for ${storyCode}:`, error.message);
          }

          // Calculate story length
          const fullText = data.story?.full_text || '';
          const storyLengthWords = fullText ? fullText.split(/\s+/).length : 0;
          
          // Calculate pre-reveal words
          const revealText = data.story?.reveal_segment || '';
          const preRevealWords = storyLengthWords - (revealText ? revealText.split(/\s+/).length : 0);

          const storyAnnotations = userAnnotations[storyCode] || {};

          const statEntry = {
            storyId: storyCode,
            storyTitle: dataset === 'true-detective' 
              ? (data.metadata?.event_name || storyCode)
              : (data.original_metadata?.story_annotations?.["Story Title"] || storyCode),
            storyLengthWords: storyLengthWords,
            // Add true-detective specific fields
            ...(dataset === 'true-detective' && {
              solveRate: (() => {
                const rate = data.original_metadata?.solve_rate;
                const attempts = data.original_metadata?.attempts;
                if (rate !== undefined && attempts !== undefined) {
                  return `${rate}% (${attempts.toLocaleString()})`;
                }
                return 'Unknown';
              })(),
              suspects: data.original_metadata?.answer_options || '',
              culprit: data.original_metadata?.correct_answer || ''
            }),
            o3GoldCulprits: o3GoldCulprits,
            o3GoldAccomplices: o3GoldAccomplices,
            // Oracle data from without-reveal files
            oracleCulpritGuess: oracleCulpritGuess,
            oracleAccompliceGuess: oracleAccompliceGuess,
            culpritCorrect: storyAnnotations.culpritCorrect || '',
            accompliceCorrect: storyAnnotations.accompliceCorrect || '',
            preRevealWords: preRevealWords,
            // Concat+prompt data from custom-bmds files
            concatCulpritGuess: concatCulpritGuess,
            concatAccompliceGuess: concatAccompliceGuess,
            concatCulpritCorrect: storyAnnotations.concatCulpritCorrect || '',
            concatAccompliceCorrect: storyAnnotations.concatAccompliceCorrect || '',
            concatPreRevealWords: preRevealWords, // Same as preRevealWords for now
            // Additional metadata
            correctAnnotatorGuess: data.original_metadata?.story_annotations?.["Correct annotator guess"] || '',
            // GPT evaluation of culprit correctness
            oracleCulpritGptCorrect: data.detection?.['correct?'] || ''
          };

          stats.push(statEntry);
        } catch (error) {
          console.error(`Error processing file ${filename}:`, error);
        }
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Error generating stats:', error);
    res.status(500).json({ error: 'Failed to generate stats' });
  }
});

app.post('/api/:dataset/annotations/:storyId', validateDataset, (req, res) => {
  try {
    const { dataset, storyId } = req.params;
    const { field, value } = req.body;
    
    const userAnnotations = loadUserAnnotations();
    
    if (!userAnnotations[storyId]) {
      userAnnotations[storyId] = {};
    }
    
    userAnnotations[storyId][field] = value;
    
    if (saveUserAnnotations(userAnnotations)) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to save annotation' });
    }
  } catch (error) {
    console.error('Error saving annotation:', error);
    res.status(500).json({ error: 'Failed to save annotation' });
  }
});

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Detective solutions directory: ${DETECTIVE_SOLUTIONS_DIR}`);
}); 
