import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import GitHubIcon from '@mui/icons-material/GitHub';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import BugReportIcon from '@mui/icons-material/BugReport';
import ChatIcon from '@mui/icons-material/Chat';
import HistoryIcon from '@mui/icons-material/History';

const features = [
  {
    title: 'Repo Q&A',
    description: 'Ask questions about a GitHub repository and get answers based on code, README, and documentation.',
    icon: <GitHubIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Code Summarization',
    description: 'Generate concise summaries of files, functions, or entire repositories.',
    icon: <DescriptionIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Code Explanation',
    description: 'Break down complex code snippets into simple explanations.',
    icon: <CodeIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Interactive Chat',
    description: 'Chat with repositories in a conversational manner.',
    icon: <ChatIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Bug Detection',
    description: 'Analyze code for potential bugs and suggest fixes.',
    icon: <BugReportIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Code Evolution',
    description: 'Track how a function or file evolved over time.',
    icon: <HistoryIcon fontSize="large" color="primary" />,
  },
];

const Home = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!repoUrl) {
      setError('Please enter a GitHub repository URL');
      return;
    }
    
    // Simple GitHub URL validation
    const githubUrlPattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?\/?$/;
    if (!githubUrlPattern.test(repoUrl)) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)');
      return;
    }
    
    // Clear error if validation passes
    setError('');
    
    // Encode the URL for use in the route
    const encodedUrl = encodeURIComponent(repoUrl);
    navigate(`/repo/${encodedUrl}`);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Talk to GitHub Repositories
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Interact with code repositories using natural language powered by Gemini LLM
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 6, maxWidth: 800, mx: 'auto' }}>
          <form onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom>
              Enter a GitHub Repository URL
            </Typography>
            <TextField
              fullWidth
              label="GitHub Repository URL"
              variant="outlined"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              error={!!error}
              helperText={error}
              sx={{ mb: 2 }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large"
              startIcon={<GitHubIcon />}
            >
              Analyze Repository
            </Button>
          </form>
        </Paper>
        
        <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 8, mb: 4 }}>
          Features
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card className="repo-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h3">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default Home;