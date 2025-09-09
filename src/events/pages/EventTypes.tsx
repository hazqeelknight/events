import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Fab,
  Alert,
} from '@mui/material';
import {
  MoreVert,
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  Schedule,
  People,
  Link as LinkIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageHeader, LoadingSpinner, Button as CustomButton } from '@/components/core';
import { formatDuration } from '@/utils/formatters';
import { useEventTypes, useDeleteEventType } from '../hooks';
import type { EventType } from '../types';

interface EventTypeCardProps {
  eventType: EventType;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewPublic: (slug: string, eventSlug: string) => void;
}

const EventTypeCard: React.FC<EventTypeCardProps> = ({ eventType, onEdit, onDelete, onViewPublic }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (isActive: boolean, isPrivate: boolean) => {
    if (!isActive) return 'error';
    if (isPrivate) return 'warning';
    return 'success';
  };

  const getStatusLabel = (isActive: boolean, isPrivate: boolean) => {
    if (!isActive) return 'Inactive';
    if (isPrivate) return 'Private';
    return 'Active';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              {eventType.name}
            </Typography>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
            {eventType.description || 'No description provided'}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip
              label={getStatusLabel(eventType.is_active, eventType.is_private)}
              color={getStatusColor(eventType.is_active, eventType.is_private) as any}
              size="small"
            />
            {eventType.is_group_event && (
              <Chip label="Group Event" size="small" variant="outlined" />
            )}
            {eventType.enable_waitlist && (
              <Chip label="Waitlist" size="small" variant="outlined" />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Schedule sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2">
              {formatDuration(eventType.duration)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <People sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2">
              {eventType.max_attendees === 1 ? '1 person' : `Up to ${eventType.max_attendees} people`}
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary">
            Created {new Date(eventType.created_at).toLocaleDateString()}
          </Typography>
        </CardContent>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { onEdit(eventType.id); handleMenuClose(); }}>
            <Edit sx={{ mr: 1 }} fontSize="small" />
            Edit
          </MenuItem>
          <MenuItem onClick={() => { onViewPublic(eventType.organizer.profile.organizer_slug, eventType.event_type_slug); handleMenuClose(); }}>
            <Visibility sx={{ mr: 1 }} fontSize="small" />
            View Public Page
          </MenuItem>
          <MenuItem onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${eventType.organizer.profile.organizer_slug}/${eventType.event_type_slug}`); handleMenuClose(); }}>
            <LinkIcon sx={{ mr: 1 }} fontSize="small" />
            Copy Link
          </MenuItem>
          <MenuItem onClick={() => { onDelete(eventType.id); handleMenuClose(); }} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        </Menu>
      </Card>
    </motion.div>
  );
};

const EventTypes: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventTypeToDelete, setEventTypeToDelete] = useState<string | null>(null);

  // Hooks
  const { data: eventTypes, isLoading, error } = useEventTypes();
  const deleteEventType = useDeleteEventType();

  // Filter event types based on search term
  const filteredEventTypes = eventTypes?.filter(eventType =>
    eventType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eventType.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (id: string) => {
    navigate(`/events/types/${id}/edit`);
  };

  const handleDelete = (id: string) => {
    setEventTypeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleViewPublic = (organizerSlug: string, eventSlug: string) => {
    window.open(`/${organizerSlug}/${eventSlug}`, '_blank');
  };

  const confirmDelete = async () => {
    if (eventTypeToDelete) {
      try {
        await deleteEventType.mutateAsync(eventTypeToDelete);
        setDeleteDialogOpen(false);
        setEventTypeToDelete(null);
      } catch (error) {
        // Error handling is done in the mutation hook
      }
    }
  };

  if (error) {
    return (
      <Alert severity="error">
        Failed to load event types. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Event Types"
        subtitle="Create and manage your meeting types"
        actions={
          <CustomButton
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/events/types/new')}
          >
            Create Event Type
          </CustomButton>
        }
      />

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search event types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Loading State */}
      {isLoading && <LoadingSpinner message="Loading event types..." />}

      {/* Event Types Grid */}
      {!isLoading && (
        <>
          {filteredEventTypes.length > 0 ? (
            <Grid container spacing={3}>
              {filteredEventTypes.map((eventType) => (
                <Grid item xs={12} sm={6} md={4} key={eventType.id}>
                  <EventTypeCard
                    eventType={eventType}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewPublic={handleViewPublic}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" gutterBottom>
                {searchTerm ? 'No event types found' : 'No event types yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Create your first event type to start accepting bookings'
                }
              </Typography>
              {!searchTerm && (
                <CustomButton
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/events/types/new')}
                >
                  Create Event Type
                </CustomButton>
              )}
            </Box>
          )}
        </>
      )}

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' },
        }}
        onClick={() => navigate('/events/types/new')}
      >
        <Add />
      </Fab>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Event Type</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this event type? This action cannot be undone.
            All associated bookings will also be affected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <CustomButton
            onClick={confirmDelete}
            color="error"
            variant="contained"
            loading={deleteEventType.isPending}
          >
            Delete
          </CustomButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventTypes;