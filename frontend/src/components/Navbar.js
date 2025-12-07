// frontend/src/components/Navbar.js - WITH SEPARATED NOTIFICATIONS
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  useTheme,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Event as EventIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  Campaign as CampaignIcon,
  NewReleases as NewReleasesIcon,
} from '@mui/icons-material';
import api from '../api';

const Navbar = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('userName') || 'User';
  const userId = localStorage.getItem('userId');
  const theme = useTheme();

  const [anchorElUser, setAnchorElUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // NOTIFICATION STATES
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState(null);

  // ✅ CATEGORIZE NOTIFICATIONS
  const categorizeNotifications = (notificationsList) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const categories = {
      new: [],      // Broadcast notifications sent today (type='general')
      today: [],    // Other notifications from today
      recent: [],   // Last 7 days
      older: []     // Older than 7 days
    };

    notificationsList.forEach(notification => {
      const notifDate = new Date(notification.created_at);
      
      // Check if it's a new broadcast notification from today
      if (notification.type === 'general' && notifDate >= today) {
        categories.new.push(notification);
      }
      // Today's notifications (excluding broadcasts)
      else if (notifDate >= today) {
        categories.today.push(notification);
      }
      // This week
      else if (notifDate >= weekAgo) {
        categories.recent.push(notification);
      }
      // Older
      else {
        categories.older.push(notification);
      }
    });

    return categories;
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ FETCH NOTIFICATIONS
  const fetchNotifications = useCallback(async () => {
    if (!userId || !token) return;
    
    try {
      setNotificationLoading(true);
      setNotificationError(null);
      console.log('Fetching notifications for user:', userId);
      
      const response = await api.get(`/notifications/${userId}`);
      console.log('Notifications response:', response.data);
      
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotificationError('Failed to load notifications');
    } finally {
      setNotificationLoading(false);
    }
  }, [userId, token]);

  // ✅ FETCH UNREAD COUNT
  const fetchUnreadCount = useCallback(async () => {
    if (!userId || !token) return;
    
    try {
      console.log('Fetching unread count for user:', userId);
      const response = await api.get(`/notifications/${userId}/unread-count`);
      console.log('Unread count response:', response.data);
      
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [userId, token]);

  // ✅ MARK AS READ
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // ✅ MARK ALL AS READ
  const markAllAsRead = async () => {
    try {
      await api.put(`/notifications/${userId}/read-all`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // ✅ DELETE NOTIFICATION
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // ✅ GET NOTIFICATION ICON
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'approval':
        return <CheckCircleIcon color="success" />;
      case 'rejection':
        return <ErrorIcon color="error" />;
      case 'new_event':
        return <EventIcon color="primary" />;
      case 'admin_alert':
        return <InfoIcon color="warning" />;
      case 'general':
        return <CampaignIcon color="info" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  // ✅ FORMAT DATE
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ✅ FETCH UNREAD COUNT ON MOUNT AND POLL
  useEffect(() => {
    if (token && userId) {
      console.log('Initial fetch - Token:', !!token, 'UserId:', userId);
      fetchUnreadCount();
      
      const interval = setInterval(() => {
        console.log('Polling unread count...');
        fetchUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [token, userId, fetchUnreadCount]);

  // ✅ FETCH NOTIFICATIONS WHEN DRAWER OPENS
  useEffect(() => {
    if (notificationOpen) {
      console.log('Notification drawer opened, fetching notifications...');
      fetchNotifications();
    }
  }, [notificationOpen, fetchNotifications]);

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const navItems = [
    { label: 'Dashboard', path: role === 'student' ? '/student' : role === 'college_admin' ? '/admin' : '/super-admin', icon: <DashboardIcon /> },
    { label: 'Events', path: '/events', icon: <EventIcon /> },
  ];

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <EventIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h6" fontWeight={700}>
          EventHub
        </Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem
            button="true"
            key={item.label}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  // ✅ RENDER NOTIFICATION SECTION
  const renderNotificationSection = (title, notificationsList, icon, color) => {
    if (notificationsList.length === 0) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ 
          px: 2, 
          py: 1.5, 
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderLeft: 4,
          borderColor: color
        }}>
          {icon}
          <Typography variant="subtitle2" fontWeight={700} color={color}>
            {title}
          </Typography>
          <Chip 
            label={notificationsList.length} 
            size="small" 
            sx={{ 
              height: 20, 
              fontSize: '0.75rem',
              bgcolor: color,
              color: 'white'
            }} 
          />
        </Box>
        <List sx={{ p: 0 }}>
          {notificationsList.map((notification) => (
            <React.Fragment key={notification.id}>
              <ListItem
                sx={{
                  bgcolor: notification.read_status ? 'transparent' : 'action.hover',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.selected' },
                  py: 2,
                  px: 2,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1
                }}
                onClick={() => {
                  console.log('Notification clicked:', notification.id);
                  markAsRead(notification.id);
                }}
              >
                <ListItemIcon sx={{ mt: 0.5, minWidth: 40 }}>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: notification.read_status ? 'normal' : 'bold',
                      mb: 0.5,
                      wordBreak: 'break-word'
                    }}
                  >
                    {notification.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 0.5, wordBreak: 'break-word' }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {formatDate(notification.created_at)}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Delete clicked:', notification.id);
                    deleteNotification(notification.id);
                  }}
                  sx={{ mt: 0.5 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Box>
    );
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={scrolled ? 4 : 0}
        sx={{
          background: scrolled
            ? theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.9)'
              : 'rgba(26, 26, 46, 0.9)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          transition: 'all 0.3s ease',
          borderBottom: scrolled ? `1px solid ${theme.palette.divider}` : 'none',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* Logo - Desktop */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, mr: 4 }}>
              <EventIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Typography
                variant="h6"
                noWrap
                component={Link}
                to="/"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textDecoration: 'none',
                }}
              >
                College EventHub
              </Typography>
            </Box>

            {/* Mobile Menu Icon */}
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                onClick={handleDrawerToggle}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
            </Box>

            {/* Logo - Mobile */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1, alignItems: 'center', gap: 1 }}>
              <EventIcon sx={{ fontSize: 28, color: 'primary.main' }} />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                EventHub
              </Typography>
            </Box>

            {/* Desktop Navigation */}
            {token && (
              <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                {navItems.map((item) => (
                  <Button
                    key={item.label}
                    component={Link}
                    to={item.path}
                    startIcon={item.icon}
                    sx={{
                      color: 'text.primary',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            )}

            {/* Right Side Actions */}
            <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Dark Mode Toggle */}
              <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
                <IconButton onClick={() => setDarkMode(!darkMode)}>
                  {darkMode ? (
                    <LightModeIcon sx={{ color: '#fff' }} /> // light icon in dark mode
                  ) : (
                    <DarkModeIcon sx={{ color: '#000' }} /> // dark icon in light mode
                  )}
                </IconButton>
              </Tooltip>

              {token ? (
                <>
                  {/* ✅ NOTIFICATION BELL */}
                  <Tooltip title="Notifications">
                    <IconButton 
                      color="inherit" 
                      onClick={() => {
                        console.log('Bell clicked, unread count:', unreadCount);
                        setNotificationOpen(true);
                      }}
                    >
                      <Badge badgeContent={unreadCount} color="error">
                        <NotificationsIcon sx={{ color: darkMode ? '#fff' : '#000' }}/>
                      </Badge>
                    </IconButton>
                  </Tooltip>

                  {/* User Menu */}
                  <Tooltip title="Account">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 1 }}>
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 40,
                          height: 40,
                          fontWeight: 600,
                          border: '2px solid',
                          borderColor: 'primary.light',
                        }}
                      >
                        {getInitials(userName)}
                      </Avatar>
                    </IconButton>
                  </Tooltip>

                  <Menu
                    anchorEl={anchorElUser}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{ mt: 1 }}
                    PaperProps={{
                      sx: {
                        borderRadius: 2,
                        minWidth: 200,
                        boxShadow: '0px 8px 24px rgba(0,0,0,0.12)',
                      },
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {userName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {role?.replace('_', ' ').toUpperCase()}
                      </Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                      <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    component={Link}
                    to="/login"
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  >
                    Login
                  </Button>
                  <Button
                    component={Link}
                    to="/signup"
                    variant="contained"
                    sx={{ borderRadius: 2 }}
                  >
                    Sign Up
                  </Button>
                </Box>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>

      {/* ✅ NOTIFICATION DRAWER WITH SEPARATED SECTIONS */}
      <Drawer
        anchor="right"
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 450 } }
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1
        }}>
          <Typography variant="h6" fontWeight={700}>
            Notifications
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error" sx={{ ml: 2 }} />
            )}
          </Typography>
          <IconButton onClick={() => setNotificationOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DoneAllIcon />}
              onClick={markAllAsRead}
              size="small"
            >
              Mark all as read
            </Button>
          </Box>
        )}

        {/* Notifications List with Categories */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {notificationLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : notificationError ? (
            <Alert severity="error" sx={{ m: 2 }}>{notificationError}</Alert>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">
                No notifications yet
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                You'll be notified about new events and updates here
              </Typography>
            </Box>
          ) : (
            (() => {
              const categorized = categorizeNotifications(notifications);
              return (
                <Box>
                  {/* New Announcements Section */}
                  {renderNotificationSection(
                    'New Announcements',
                    categorized.new,
                    <NewReleasesIcon />,
                    '#ff9800'
                  )}

                  {/* Today Section */}
                  {renderNotificationSection(
                    'Today',
                    categorized.today,
                    <EventIcon />,
                    '#2196f3'
                  )}

                  {/* Recent Section */}
                  {renderNotificationSection(
                    'This Week',
                    categorized.recent,
                    <NotificationsIcon />,
                    '#9c27b0'
                  )}

                  {/* Older Section */}
                  {renderNotificationSection(
                    'Older',
                    categorized.older,
                    <NotificationsIcon />,
                    '#757575'
                  )}
                </Box>
              );
            })()
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;