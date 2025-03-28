import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import GitHubIcon from '@mui/icons-material/GitHub';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import BugReportIcon from '@mui/icons-material/BugReport';
import ChatIcon from '@mui/icons-material/Chat';
import HistoryIcon from '@mui/icons-material/History';
import Link from '@mui/material/Link';

const About = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          About LLMRepo
        </Typography>
        
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Project Overview
          </Typography>
          <Typography variant="body1" paragraph>
            LLMRepo is a tool that allows users to interact with GitHub repositories through natural language. 
            By leveraging Google's Gemini LLM, users can ask questions about code, get explanations, summaries, 
            and insights about repositories without having to manually navigate through the codebase.
          </Typography>
          <Typography variant="body1" paragraph>
            This project combines the power of large language models with GitHub's repository data to create 
            an intuitive interface for developers, researchers, and anyone interested in understanding code repositories more efficiently.
          </Typography>
        </Paper>
        
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Features
          </Typography>
          
          <Typography variant="h6" sx={{ mt: 2 }}>
            Core Features
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <GitHubIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Repo Q&A" 
                secondary="Ask questions about a GitHub repository and get answers based on code, README, and documentation"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DescriptionIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Code Summarization" 
                secondary="Generate concise summaries of files, functions, or entire repositories"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CodeIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Code Explanation" 
                secondary="Break down complex code snippets into simple explanations"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <GitHubIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Dependency Analysis" 
                secondary="Identify libraries used and explain their purpose"
              />
            </ListItem>
          </List>
          
          <Typography variant="h6" sx={{ mt: 2 }}>
            Advanced Features
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <BugReportIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Bug Detection & Fix Suggestions" 
                secondary="Analyze code for potential bugs and suggest fixes"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <ChatIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Interactive Chat Mode" 
                secondary="Chat with repositories in a conversational manner"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <HistoryIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Historical Code Evolution" 
                secondary="Track how a function or file evolved over time"
              />
            </ListItem>
          </List>
        </Paper>
        
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Technology Stack
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Frontend" 
                secondary="React.js with Material-UI for a responsive and modern user interface"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Backend" 
                secondary="Python with FastAPI for efficient API endpoints"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="LLM Integration" 
                secondary="Google's Gemini API for natural language processing and code understanding"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="GitHub Integration" 
                secondary="GitHub API and GitPython for repository access and analysis"
              />
            </ListItem>
          </List>
        </Paper>
        
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Getting Started
          </Typography>
          <Typography variant="body1" paragraph>
            To use LLMRepo, simply enter a GitHub repository URL on the home page and start exploring. 
            You can ask questions, browse files, analyze code, and more through the intuitive interface.
          </Typography>
          <Typography variant="body1">
            For developers interested in contributing to this project, check out our 
            <Link href="https://github.com/username/llmrepo" target="_blank" rel="noopener" sx={{ ml: 1 }}>
              GitHub repository
            </Link>.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default About;