import React, { useState } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Collapse from '@mui/material/Collapse';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

/**
 * Component for displaying a repository file tree structure
 * @param {Object} props - Component props
 * @param {Object} props.fileTree - The file tree structure
 * @param {Function} props.onFileSelect - Callback when a file is selected
 * @param {string} props.selectedFile - Currently selected file path
 */
const RepoFileTree = ({ fileTree, onFileSelect, selectedFile }) => {
  const [open, setOpen] = useState({});

  // Toggle folder open/closed state
  const handleToggle = (path) => {
    setOpen((prevOpen) => ({
      ...prevOpen,
      [path]: !prevOpen[path],
    }));
  };

  // Recursive function to render file tree
  const renderTree = (node, path = '') => {
    // If node is a string, it's a file
    if (typeof node === 'string') {
      const isSelected = selectedFile === path;
      return (
        <ListItem 
          key={path} 
          disablePadding
          sx={{ pl: path.split('/').length - 1 }}
        >
          <ListItemButton 
            onClick={() => onFileSelect(path)}
            selected={isSelected}
            dense
          >
            <ListItemIcon>
              <InsertDriveFileIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary={path.split('/').pop()} 
              primaryTypographyProps={{ 
                variant: 'body2',
                sx: { fontWeight: isSelected ? 'bold' : 'normal' } 
              }}
            />
          </ListItemButton>
        </ListItem>
      );
    }

    // If node is an object, it's a directory
    const dirPath = path ? path : '/';
    const isOpen = open[dirPath] || false;
    const dirName = path.split('/').pop() || 'Root';

    return (
      <React.Fragment key={dirPath}>
        <ListItem 
          disablePadding
          sx={{ pl: Math.max(0, dirPath.split('/').length - 1) }}
        >
          <ListItemButton onClick={() => handleToggle(dirPath)} dense>
            <ListItemIcon>
              {isOpen ? <FolderOpenIcon fontSize="small" /> : <FolderIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText 
              primary={dirName} 
              primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
            />
            {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </ListItemButton>
        </ListItem>
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {Object.entries(node).map(([key, value]) => {
              const newPath = path ? `${path}/${key}` : key;
              return renderTree(value, newPath);
            })}
          </List>
        </Collapse>
      </React.Fragment>
    );
  };

  if (!fileTree || Object.keys(fileTree).length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          No files available
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
      <Paper elevation={0} sx={{ bgcolor: 'background.paper' }}>
        <List
          dense
          component="nav"
          aria-labelledby="repo-file-tree"
        >
          {renderTree(fileTree)}
        </List>
      </Paper>
    </Box>
  );
};

export default RepoFileTree;