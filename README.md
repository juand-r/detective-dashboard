# Detective Solutions Dashboard

A modern web dashboard for browsing and analyzing detective stories and their AI-generated solutions.


## Features

- **Story Browser**: Browse through all detective stories with search and filtering
- **Story Details**: View full story text, metadata, and AI analysis
- **Search & Filter**: Search by title, author, or plot summary; filter by author or solvability
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, professional interface with intuitive navigation

## Architecture

- **Backend**: Node.js with Express.js serving REST API
- **Frontend**: React with React Router for single-page application
- **Data**: JSON files containing detective stories and metadata
- **Deployment**: Configured for Railway platform

## Local Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend && npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   This will start the backend server on port 3001 and the React development server on port 3000.

4. Open your browser to `http://localhost:3000`

### Building for Production

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Railway Deployment

This application is configured for easy deployment on Railway:

1. Push your code to a Git repository
2. Connect your repository to Railway
3. Railway will automatically detect the configuration and deploy

The application will be available at your Railway-provided URL.

### Environment Variables

No environment variables are required for basic operation. The application reads detective solution files from the `../detective_solutions` directory.

## API Endpoints

- `GET /api/stories` - Get all detective stories (metadata only)
- `GET /api/stories/:id` - Get specific story with full data
- `GET /api/search` - Search stories with query parameters
- `GET /api/authors` - Get list of all authors

## Data Structure

The application expects JSON files in the following structure:

```json
{
  "metadata": {
    "event_name": "Story ID",
    "event_description": "Story description",
    "model": "AI model used",
    "story_length": "Number of words",
    "reveal_length": "Number of words in reveal",
    "border_sentence": "Sentence dividing story from reveal"
  },
  "story": {
    "full_text": "Complete story text",
    "reveal_segment": "Solution/reveal text",
    "border_sentence": "Dividing sentence"
  },
  "detection": {
    "solution": "AI-generated solution and analysis"
  },
  "original_metadata": {
    "story_title": "Story title",
    "author_name": "Author name",
    "plot_summary": "Plot summary",
    "is_solvable": true/false
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is licensed under the MIT License. 
