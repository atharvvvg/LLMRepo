import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * Component for displaying code files with syntax highlighting
 * @param {Object} props - Component props
 * @param {string} props.content - The content of the file to display
 * @param {string} props.fileName - The name of the file being displayed
 * @param {boolean} props.loading - Whether the file content is loading
 * @param {string} props.error - Error message if file loading failed
 */
const CodeViewer = ({ content, fileName, loading, error }) => {
  // Determine language for syntax highlighting based on file extension
  const getLanguage = (fileName) => {
    if (!fileName) return 'text';
    
    const extension = fileName.split('.').pop().toLowerCase();
    const languageMap = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      py: 'python',
      java: 'java',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
      go: 'go',
      rb: 'ruby',
      php: 'php',
      rs: 'rust',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      sh: 'bash',
      yml: 'yaml',
      yaml: 'yaml',
      // Add more mappings as needed
    };
    
    return languageMap[extension] || 'text';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={0} sx={{ p: 2, bgcolor: '#fff3f3' }}>
        <Typography color="error" variant="body2">
          Error: {error}
        </Typography>
      </Paper>
    );
  }

  if (!content) {
    return (
      <Paper elevation={0} sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Select a file to view its content
        </Typography>
      </Paper>
    );
  }

  // For markdown files, we could use a markdown renderer instead
  const isMarkdown = fileName && fileName.toLowerCase().endsWith('.md');
  
  return (
    <Paper elevation={0} sx={{ overflow: 'auto', maxHeight: '70vh' }}>
      <Box sx={{ p: 1, bgcolor: '#282c34', color: 'white', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
        <Typography variant="body2" fontFamily="monospace">
          {fileName || 'No file selected'}
        </Typography>
      </Box>
      <SyntaxHighlighter
        language={getLanguage(fileName)}
        style={atomDark}
        customStyle={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        showLineNumbers
      >
        {content}
      </SyntaxHighlighter>
    </Paper>
  );
};

export default CodeViewer;