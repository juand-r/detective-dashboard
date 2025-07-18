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

// API endpoint to get all detective solution metadata
app.get('/api/stories', (req, res) => {
  try {
    const files = fs.readdirSync(DETECTIVE_SOLUTIONS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const stories = jsonFiles.map(file => {
      const filePath = path.join(DETECTIVE_SOLUTIONS_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      return {
        id: data.metadata.event_name,
        title: data.metadata.event_description,
        author: data.original_metadata?.author_name || 'Unknown',
        storyCode: data.original_metadata?.story_code || data.metadata.event_name,
        storyTitle: data.original_metadata?.story_title || 'Unknown',
        plotSummary: data.original_metadata?.plot_summary || '',
        textLength: data.metadata.story_length,
        isSolvable: data.original_metadata?.is_solvable || true,
        model: data.metadata.model
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
      
      return {
        id: data.metadata.event_name,
        title: data.metadata.event_description,
        author: data.original_metadata?.author_name || 'Unknown',
        storyCode: data.original_metadata?.story_code || data.metadata.event_name,
        storyTitle: data.original_metadata?.story_title || 'Unknown',
        plotSummary: data.original_metadata?.plot_summary || '',
        textLength: data.metadata.story_length,
        isSolvable: data.original_metadata?.is_solvable || true,
        model: data.metadata.model,
        fullData: data
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
      const author = data.original_metadata?.author_name || 'Unknown';
      authors.add(author);
    });
    
    res.json(Array.from(authors).sort());
  } catch (error) {
    console.error('Error reading authors:', error);
    res.status(500).json({ error: 'Failed to read authors' });
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
