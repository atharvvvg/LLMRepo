import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import SendIcon from '@mui/icons-material/Send';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * Component for handling user queries to the repository
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Callback when a query is submitted
 * @param {boolean} props.loading - Whether a query is currently being processed
 * @param {string} props.error - Error message if query submission failed
 */
const QueryInput = ({ onSubmit, loading, error }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSubmit(query);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Ask about this repository
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Ask questions about code, architecture, dependencies, or anything else you want to know.
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          fullWidth
          label="Your question"
          variant="outlined"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          error={!!error}
          helperText={error || ''}
          placeholder="E.g., What are the main components of this project?"
          sx={{ mb: 2 }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!query.trim() || loading}
          endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {loading ? 'Processing...' : 'Ask'}
        </Button>
      </Box>
    </Paper>
  );
};

export default QueryInput;