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

// Path to detective solutions directory
const DETECTIVE_SOLUTIONS_DIR = path.join(__dirname, 'data');
// Path to summaries directory
const SUMMARIES_DIR = path.join(__dirname, 'summaries-concat-1k-v0');
// Path to v2 solutions directory
const DETECTIVE_SOLUTIONS_V2_DIR = path.join(__dirname, 'detective_solutions-o3-given-reveal');
// Path to user annotations file
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
          // User annotations
          oracleCulpritGuess: storyAnnotations.oracleCulpritGuess || '',
          oracleAccompliceGuess: storyAnnotations.oracleAccompliceGuess || '',
          culpritCorrect: storyAnnotations.culpritCorrect || '',
          accompliceCorrect: storyAnnotations.accompliceCorrect || '',
          concatCulpritGuess: storyAnnotations.concatCulpritGuess || '',
          concatAccompliceGuess: storyAnnotations.concatAccompliceGuess || '',
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

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Detective solutions directory: ${DETECTIVE_SOLUTIONS_DIR}`);
}); 
