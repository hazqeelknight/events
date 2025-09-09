import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  Event,
  Cancel,
  CheckCircle,
  Schedule,
  People,
  Sync,
  SyncProblem,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { PageHeader, LoadingSpinner } from '@/components/core';
import { useBookingAnalytics } from '../hooks';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography color="text.secondary" gutterBottom variant="overline">
                {title}
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                backgroundColor: color,
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {React.cloneElement(icon as React.ReactElement, { 
                sx: { color: 'white', fontSize: 24 } 
              })}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState(30);

  // Hooks
  const { data: analytics, isLoading, error } = useBookingAnalytics(timeRange);

  if (error) {
    return (
      <Alert severity="error">
        Failed to load analytics data. Please try again later.
      </Alert>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (!analytics) {
    return (
      <Alert severity="info">
        No analytics data available.
      </Alert>
    );
  }

  const totalBookings = analytics.total_bookings;
  const completionRate = totalBookings > 0 ? (analytics.completed_bookings / totalBookings * 100).toFixed(1) : 0;
  const cancellationRate = totalBookings > 0 ? (analytics.cancelled_bookings / totalBookings * 100).toFixed(1) : 0;
  const noShowRate = totalBookings > 0 ? (analytics.no_show_bookings / totalBookings * 100).toFixed(1) : 0;
  const calendarSyncSuccessRate = totalBookings > 0 ? (analytics.calendar_sync_success / totalBookings * 100).toFixed(1) : 0;

  return (
    <Box>
      <PageHeader
        title="Analytics"
        subtitle="Insights into your booking performance"
        actions={
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(Number(e.target.value))}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
              <MenuItem value={365}>Last year</MenuItem>
            </Select>
          </FormControl>
        }
      />

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bookings"
            value={analytics.total_bookings}
            icon={<Event />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Confirmed"
            value={analytics.confirmed_bookings}
            icon={<CheckCircle />}
            color="success.main"
            subtitle={`${((analytics.confirmed_bookings / Math.max(totalBookings, 1)) * 100).toFixed(1)}% of total`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={analytics.completed_bookings}
            icon={<Schedule />}
            color="info.main"
            subtitle={`${completionRate}% completion rate`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Cancelled"
            value={analytics.cancelled_bookings}
            icon={<Cancel />}
            color="error.main"
            subtitle={`${cancellationRate}% cancellation rate`}
          />
        </Grid>
      </Grid>

      {/* Calendar Sync Health */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Calendar Sync Health
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Sync sx={{ mr: 2, color: 'success.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2">Successful Syncs</Typography>
                  <Typography variant="h6">{analytics.calendar_sync_success}</Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Number(calendarSyncSuccessRate)}
                color="success"
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">
                {calendarSyncSuccessRate}% success rate
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SyncProblem sx={{ mr: 2, color: 'error.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2">Failed Syncs</Typography>
                  <Typography variant="h6">{analytics.calendar_sync_failed}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 2, color: 'warning.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2">Pending Syncs</Typography>
                  <Typography variant="h6">{analytics.calendar_sync_pending}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Bookings by Event Type */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bookings by Event Type
              </Typography>
              {analytics.bookings_by_event_type.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Event Type</TableCell>
                        <TableCell align="right">Bookings</TableCell>
                        <TableCell align="right">%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.bookings_by_event_type.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.event_type__name}</TableCell>
                          <TableCell align="right">{item.count}</TableCell>
                          <TableCell align="right">
                            {((item.count / Math.max(totalBookings, 1)) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cancellations by Actor */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cancellations by Actor
              </Typography>
              {analytics.cancellations_by_actor.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cancelled By</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.cancellations_by_actor.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ textTransform: 'capitalize' }}>
                            {item.cancelled_by || 'Unknown'}
                          </TableCell>
                          <TableCell align="right">{item.count}</TableCell>
                          <TableCell align="right">
                            {((item.count / Math.max(analytics.cancelled_bookings, 1)) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No cancellations in this period
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Group Event Statistics */}
      {analytics.group_event_stats.total_group_bookings > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Group Event Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <People sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Group Bookings
                    </Typography>
                    <Typography variant="h6">
                      {analytics.group_event_stats.total_group_bookings}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ mr: 2, color: 'success.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Average Attendees
                    </Typography>
                    <Typography variant="h6">
                      {analytics.group_event_stats.average_attendees.toFixed(1)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Analytics;