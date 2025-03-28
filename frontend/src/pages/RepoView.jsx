import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GitHubIcon from '@mui/icons-material/GitHub';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`repo-tabpanel-${index}`}
      aria-labelledby={`repo-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const RepoView = () => {
  const { repoUrl } = useParams();
  const navigate = useNavigate();
  const decodedRepoUrl = decodeURIComponent(repoUrl);
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repoInfo, setRepoInfo] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileSummary, setFileSummary] = useState(null);
  const [fileSummaryLoading, setFileSummaryLoading] = useState(false);
  const [dependencies, setDependencies] = useState(null);
  const [dependenciesLoading, setDependenciesLoading] = useState(false);

  // Fetch repository information on component mount
  useEffect(() => {
    const fetchRepoInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get access token from session storage if available
        const accessToken = sessionStorage.getItem('github_access_token');
        
        const response = await axios.post('/api/repo/info', {
          repo_url: decodedRepoUrl,
          access_token: accessToken
        });
        
        setRepoInfo(response.data);
      } catch (err) {
        console.error('Error fetching repository info:', err);
        setError(err.response?.data?.detail || 'Failed to fetch repository information');
      } finally {
        setLoading(false);
      }
    };

    fetchRepoInfo();
  }, [decodedRepoUrl]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Load dependencies when switching to the Dependencies tab
    if (newValue === 3 && !dependencies && !dependenciesLoading) {
      fetchDependencies();
    }
  };

  // Handle query submission
  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    try {
      setQueryLoading(true);
      setQueryError(null);
      
      // Add user query to chat history
      const newMessage = { role: 'user', content: query };
      setChatHistory(prev => [...prev, newMessage]);
      
      // Get access token from session storage if available
      const accessToken = sessionStorage.getItem('github_access_token');
      
      const response = await axios.post('/api/repo/query', {
        repo_url: decodedRepoUrl,
        query: query,
        access_token: accessToken
      });
      
      // Add AI response to chat history
      const aiMessage = { role: 'ai', content: response.data.response };
      setChatHistory(prev => [...prev, aiMessage]);
      
      setQueryResult(response.data);
      setQuery(''); // Clear input field
    } catch (err) {
      console.error('Error querying repository:', err);
      setQueryError(err.response?.data?.detail || 'Failed to process query');
      
      // Add error message to chat history
      const errorMessage = { 
        role: 'system', 
        content: `Error: ${err.response?.data?.detail || 'Failed to process query'}` 
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setQueryLoading(false);
    }
  };

  // Handle file selection for summarization
  const handleFileSelect = async (filePath) => {
    setSelectedFile(filePath);
    await fetchFileSummary(filePath);
  };

  // Fetch file summary
  const fetchFileSummary = async (filePath) => {
    try {
      setFileSummaryLoading(true);
      
      // Get access token from session storage if available
      const accessToken = sessionStorage.getItem('github_access_token');
      
      const response = await axios.post('/api/repo/file/summarize', {
        repo_url: decodedRepoUrl,
        file_path: filePath,
        access_token: accessToken
      });
      
      setFileSummary(response.data);
    } catch (err) {
      console.error('Error fetching file summary:', err);
      setFileSummary({ error: err.response?.data?.detail || 'Failed to summarize file' });
    } finally {
      setFileSummaryLoading(false);
    }
  };

  // Fetch repository dependencies
  const fetchDependencies = async () => {
    try {
      setDependenciesLoading(true);
      
      // Get access token from session storage if available
      const accessToken = sessionStorage.getItem('github_access_token');
      
      const response = await axios.post('/api/repo/dependencies', {
        repo_url: decodedRepoUrl,
        access_token: accessToken
      });
      
      setDependencies(response.data);
    } catch (err) {
      console.error('Error fetching dependencies:', err);
      setDependencies({ error: err.response?.data?.detail || 'Failed to analyze dependencies' });
    } finally {
      setDependenciesLoading(false);
    }
  };

  // Render file structure recursively
  const renderFileStructure = (structure) => {
    if (!structure) return null;
    
    const files = Object.entries(structure);
    
    return (
      <List dense>
        {files.map(([path, info]) => (
          <ListItem 
            key={path} 
            button 
            onClick={() => handleFileSelect(path)}
            selected={selectedFile === path}
          >
            <ListItemIcon>
              {info.type === 'directory' ? <FolderIcon /> : <InsertDriveFileIcon />}
            </ListItemIcon>
            <ListItemText primary={path} />
          </ListItem>
        ))}
      </List>
    );
  };

  // Render chat messages
  const renderChatMessages = () => {
    return chatHistory.map((message, index) => {
      const isUser = message.role === 'user';
      const isSystem = message.role === 'system';
      
      return (
        <Box 
          key={index} 
          className={`chat-message ${isUser ? 'user-message' : isSystem ? 'system-message' : 'ai-message'}`}
          sx={{
            ml: isUser ? 'auto' : 0,
            mr: !isUser ? 'auto' : 0,
            maxWidth: '80%',
            backgroundColor: isUser ? '#e3f2fd' : isSystem ? '#ffebee' : '#f5f5f5',
            borderRadius: 2,
            p: 2,
            mb: 2,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {isUser ? 'You' : isSystem ? 'System' : 'AI Assistant'}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={atomDark}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </Box>
        </Box>
      );
    });
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading repository information...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/')}>
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <GitHubIcon sx={{ mr: 1 }} />
            <Typography variant="h4" component="h1">
              {decodedRepoUrl.split('/').slice(-2).join('/')}
            </Typography>
          </Box>
          
          {repoInfo?.summary && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                {repoInfo.summary}
              </Typography>
            </Box>
          )}
        </Paper>

        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="repository tabs">
              <Tab label="Chat" icon={<ChatIcon />} iconPosition="start" />
              <Tab label="Files" icon={<DescriptionIcon />} iconPosition="start" />
              <Tab label="Code" icon={<CodeIcon />} iconPosition="start" />
              <Tab label="Dependencies" icon={<GitHubIcon />} iconPosition="start" />
            </Tabs>
          </Box>
          
          {/* Chat Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Ask questions about this repository
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                You can ask about code structure, functionality, dependencies, or anything else related to this repository.
              </Typography>
              
              <Box sx={{ mt: 4, mb: 2 }}>
                {chatHistory.length > 0 ? (
                  renderChatMessages()
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ChatIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Start a conversation with this repository
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <form onSubmit={handleQuerySubmit}>
                <Box sx={{ display: 'flex', mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Ask a question"
                    variant="outlined"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={queryLoading}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={queryLoading || !query.trim()}
                    endIcon={queryLoading ? <CircularProgress size={20} /> : <SendIcon />}
                    sx={{ ml: 1 }}
                  >
                    Send
                  </Button>
                </Box>
              </form>
              
              {queryError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {queryError}
                </Alert>
              )}
            </Box>
          </TabPanel>
          
          {/* Files Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              <Box sx={{ flex: 1, maxHeight: '70vh', overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  Repository Structure
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {repoInfo?.structure && renderFileStructure(repoInfo.structure)}
                </Paper>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>
                  File Summary
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, minHeight: '200px' }}>
                  {selectedFile ? (
                    fileSummaryLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : fileSummary?.error ? (
                      <Alert severity="error">{fileSummary.error}</Alert>
                    ) : (
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {selectedFile}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {fileSummary?.summary || 'No summary available'}
                        </ReactMarkdown>
                      </Box>
                    )
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                      <Typography variant="body2" color="text.secondary">
                        Select a file to view its summary
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            </Box>
          </TabPanel>
          
          {/* Code Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Code Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Select files from the Files tab to analyze code or ask specific questions in the Chat tab.
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Code Structure</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">
                    Use the chat to ask questions about the code structure, such as "What are the main components?" or "How is the project organized?"
                  </Typography>
                </AccordionDetails>
              </Accordion>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Code Explanation</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">
                    Ask questions like "Explain how [specific function] works" or "What does this code do?" in the chat tab.
                  </Typography>
                </AccordionDetails>
              </Accordion>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Bug Detection</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">
                    Ask "Are there any potential bugs in this code?" or "How can I improve this function?" to get suggestions.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Box>
          </TabPanel>
          
          {/* Dependencies Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Dependencies Analysis
            </Typography>
            
            {dependenciesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Analyzing dependencies...
                </Typography>
              </Box>
            ) : dependencies?.error ? (
              <Alert severity="error">{dependencies.error}</Alert>
            ) : dependencies ? (
              <Box>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Dependency Explanation
                  </Typography>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {dependencies.explanation || 'No explanation available'}
                  </ReactMarkdown>
                </Paper>
                
                {Object.entries(dependencies.dependencies || {}).map(([type, deps]) => (
                  <Accordion key={type}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>{type} Dependencies</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {typeof deps === 'string' ? (
                        <Typography>{deps}</Typography>
                      ) : (
                        <List dense>
                          {Object.entries(deps).map(([name, version]) => (
                            <ListItem key={name}>
                              <ListItemText 
                                primary={name} 
                                secondary={`Version: ${version}`} 
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No dependency information available for this repository.
              </Typography>
            )}
          </TabPanel>
        </Box>
      </Box>
    </Container>
  );
};

export default RepoView;