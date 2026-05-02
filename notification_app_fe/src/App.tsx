import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container, Typography, Box, Tabs, Tab, Card, CardContent,
  Chip, Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Alert, Paper, CssBaseline, ThemeProvider, Button, Badge, Fade,
  IconButton, TextField, type SelectChangeEvent,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import InboxIcon from '@mui/icons-material/Inbox';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import VisibilityIcon from '@mui/icons-material/Visibility';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import theme from './theme';
import { Log, getBearerToken, setCredentials, hasCredentials } from './logger';
import { getTopNotifications, type NotificationItem } from './priorityLogic';

const ENDPOINT = "/evaluation-service/notifications";

const App: React.FC = () => {
  // Auth state
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [clientID, setClientID] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  // Notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [currentTab, setCurrentTab] = useState(0);
  const [inboxLimit, setInboxLimit] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Filters
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [filterPlacement, setFilterPlacement] = useState<string>('all');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      setCredentials({ email, name, rollNo, accessCode, clientID, clientSecret });
      // Test the credentials by fetching a token
      await getBearerToken();
      setAuthenticated(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!hasCredentials()) return;
    Log('frontend', 'info', 'component', 'Fetching notifications from Telemetry Service.');
    setLoading(true);
    setError(null);

    try {
      const token = await getBearerToken();
      const response = await fetch(ENDPOINT, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const parsedData: NotificationItem[] = Array.isArray(data) ? data : (data.data || []);
      setNotifications(parsedData);
      Log('frontend', 'info', 'state', `Fetched ${parsedData.length} notifications.`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
      Log('frontend', 'error', 'utils', `Notification fetch failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
  }, [authenticated, fetchData]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    Log('frontend', 'info', 'page', `Switched to ${newValue === 0 ? 'Priority Inbox' : 'All Notifications'}.`);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    Log('frontend', 'info', 'hook', `Filter [${filterType}] set to [${value}].`);
    if (filterType === 'event') setFilterEvent(value);
    if (filterType === 'result') setFilterResult(value);
    if (filterType === 'placement') setFilterPlacement(value);
  };

  const handleLimitChange = (event: SelectChangeEvent<number>) => {
    const newLimit = Number(event.target.value);
    setInboxLimit(newLimit);
    Log('frontend', 'info', 'state', `Priority Inbox limit changed to ${newLimit}.`);
  };

  const handleResetFilters = () => {
    setFilterEvent('all');
    setFilterResult('all');
    setFilterPlacement('all');
    setSearchTerm('');
    Log('frontend', 'info', 'hook', 'All filters reset.');
  };

  // Derived data
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      const passEvent = filterEvent === 'all' || String(notif.event) === filterEvent;
      const passResult = filterResult === 'all' || String(notif.result) === filterResult;
      const passPlacement = filterPlacement === 'all' || String(notif.placement) === filterPlacement;
      const passSearch = !searchTerm || (notif.message || '').toLowerCase().includes(searchTerm.toLowerCase());
      return passEvent && passResult && passPlacement && passSearch;
    });
  }, [notifications, filterEvent, filterResult, filterPlacement, searchTerm]);

  const priorityInboxData = useMemo(() => {
    return getTopNotifications(filteredNotifications, inboxLimit);
  }, [filteredNotifications, inboxLimit]);

  const newCount = notifications.filter(n => !n.isViewed).length;
  const uniqueEvents = Array.from(new Set(notifications.map(n => String(n.event))));
  const uniqueResults = Array.from(new Set(notifications.map(n => String(n.result))));
  const uniquePlacements = Array.from(new Set(notifications.map(n => String(n.placement))));

  const getPriorityColor = (placement: number): 'error' | 'warning' | 'info' => {
    if (placement >= 3) return 'error';
    if (placement >= 2) return 'warning';
    return 'info';
  };

  const renderNotificationCard = (notif: NotificationItem, index: number) => (
    <Fade in timeout={300 + index * 50} key={notif.id}>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box sx={{ flex: 1, mr: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
                {notif.message || `Notification #${notif.id}`}
              </Typography>
            </Box>
            <Chip
              icon={notif.isViewed ? <VisibilityIcon sx={{ fontSize: 16 }} /> : <FiberNewIcon sx={{ fontSize: 16 }} />}
              label={notif.isViewed ? 'Viewed' : 'New'}
              color={notif.isViewed ? 'default' : 'secondary'}
              size="small"
              variant={notif.isViewed ? 'outlined' : 'filled'}
              sx={{ flexShrink: 0 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
            <Chip
              icon={<KeyboardArrowUpIcon sx={{ fontSize: 16 }} />}
              label={`Placement: ${notif.placement}`}
              size="small"
              color={getPriorityColor(notif.placement)}
              variant="outlined"
            />
            <Chip label={`Result: ${notif.result}`} size="small" color="primary" variant="outlined" />
            <Chip label={`Event: ${notif.event}`} size="small" color="primary" variant="outlined" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {new Date(notif.timestamp).toLocaleString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  // ─── Login Screen ───────────────────────────────────────────
  if (!authenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}>
          <Paper sx={{ p: 4, maxWidth: 480, width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
                borderRadius: 3, p: 1.2, display: 'flex',
              }}>
                <LockOpenIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h5">Authenticate</Typography>
                <Typography variant="body2">Enter your evaluation service credentials</Typography>
              </Box>
            </Box>

            {authError && <Alert severity="error" sx={{ mb: 2 }}>{authError}</Alert>}

            <form onSubmit={handleLogin}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField size="small" label="Email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required fullWidth />
                <TextField size="small" label="Name" value={name}
                  onChange={(e) => setName(e.target.value)} required fullWidth />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField size="small" label="Roll No" value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)} required fullWidth />
                  <TextField size="small" label="Access Code" value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)} required fullWidth />
                </Box>
                <TextField size="small" label="Client ID" value={clientID}
                  onChange={(e) => setClientID(e.target.value)} required fullWidth />
                <TextField size="small" label="Client Secret" value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)} required fullWidth />
                <Button type="submit" variant="contained" size="large" fullWidth
                  disabled={authLoading} sx={{ mt: 1 }}>
                  {authLoading ? <CircularProgress size={24} color="inherit" /> : 'Connect & Authenticate'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  // ─── Main Dashboard ─────────────────────────────────────────
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(34,211,238,0.08) 100%)',
        borderBottom: '1px solid rgba(148,163,184,0.08)',
        py: { xs: 3, md: 4 }, mb: 4,
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
                borderRadius: 3, p: 1.2, display: 'flex',
              }}>
                <NotificationsActiveIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                  Notification Platform
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Priority-driven telemetry notification system
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Badge badgeContent={newCount} color="secondary">
                <Chip label={`${notifications.length} Total`} variant="outlined" size="small" />
              </Badge>
              <IconButton onClick={fetchData} color="primary" disabled={loading}>
                <RefreshIcon sx={{
                  animation: loading ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }} />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 6 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} action={
            <Button color="inherit" size="small" onClick={fetchData}>Retry</Button>
          }>
            {error}
          </Alert>
        )}

        {/* Filters Bar */}
        <Paper sx={{ p: 2.5, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterListIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontSize: '1rem' }}>Filters</Typography>
            <Box sx={{ flex: 1 }} />
            <Button size="small" onClick={handleResetFilters} sx={{ color: 'text.secondary' }}>
              Reset All
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 2 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Placement</InputLabel>
              <Select value={filterPlacement} label="Placement"
                onChange={(e) => handleFilterChange('placement', e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {uniquePlacements.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Result</InputLabel>
              <Select value={filterResult} label="Result"
                onChange={(e) => handleFilterChange('result', e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {uniqueResults.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Event</InputLabel>
              <Select value={filterEvent} label="Event"
                onChange={(e) => handleFilterChange('event', e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {uniqueEvents.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange} variant="fullWidth"
            sx={{ '& .MuiTabs-indicator': { height: 3, borderRadius: 2 } }}>
            <Tab icon={<InboxIcon />} iconPosition="start" label="Priority Inbox" />
            <Tab icon={<NotificationsActiveIcon />} iconPosition="start"
              label={`All Notifications (${filteredNotifications.length})`} />
          </Tabs>
        </Paper>

        {/* Content */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
            <CircularProgress size={48} thickness={4} />
            <Typography variant="body2" sx={{ mt: 2 }}>Fetching notifications...</Typography>
          </Box>
        ) : (
          <>
            {currentTab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5">Priority Inbox</Typography>
                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>Show Top</InputLabel>
                    <Select value={inboxLimit} label="Show Top" onChange={handleLimitChange}>
                      <MenuItem value={10}>Top 10</MenuItem>
                      <MenuItem value={15}>Top 15</MenuItem>
                      <MenuItem value={20}>Top 20</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                {priorityInboxData.length === 0 ? (
                  <Alert severity="info">No priority notifications match your current filters.</Alert>
                ) : (
                  priorityInboxData.map((n, i) => renderNotificationCard(n, i))
                )}
              </Box>
            )}

            {currentTab === 1 && (
              <Box>
                <Typography variant="h5" sx={{ mb: 3 }}>All Notifications</Typography>
                {filteredNotifications.length === 0 ? (
                  <Alert severity="info">No notifications found.</Alert>
                ) : (
                  filteredNotifications.map((n, i) => renderNotificationCard(n, i))
                )}
              </Box>
            )}
          </>
        )}
      </Container>
    </ThemeProvider>
  );
};

export default App;
