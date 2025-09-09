import React from 'react';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Link,
  Alert,
} from '@mui/material';
import {
  Schedule,
  People,
  LocationOn,
  Business,
  Language,
  ArrowForward,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/core';
import { formatDuration } from '@/utils/formatters';
import { usePublicOrganizer } from '../hooks';

const PublicOrganizerPage: React.FC = () => {
  const { organizerSlug } = useParams<{ organizerSlug: string }>();
  const navigate = useNavigate();

  // Hooks
  const { data: organizer, isLoading, error } = usePublicOrganizer(organizerSlug || '');

  if (isLoading) {
    return <LoadingSpinner message="Loading organizer profile..." />;
  }

  if (error || !organizer) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">
          Organizer not found or profile is not public.
        </Alert>
      </Container>
    );
  }

  const handleEventTypeClick = (eventSlug: string) => {
    navigate(`/${organizerSlug}/${eventSlug}`);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Organizer Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Avatar
            src={organizer.profile_picture}
            sx={{
              width: 120,
              height: 120,
              mx: 'auto',
              mb: 3,
              fontSize: '3rem',
              bgcolor: organizer.brand_color || 'primary.main',
            }}
            onClick={() => navigate(`/${organizerSlug}`)}
          >
            {organizer.display_name.charAt(0)}
          </Avatar>
          
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            {organizer.display_name}
          </Typography>
          
          {organizer.company && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Business sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                {organizer.company}
              </Typography>
            </Box>
          )}
          
          {organizer.bio && (
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
              {organizer.bio}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<Schedule />}
              label={`Timezone: ${organizer.timezone}`}
              variant="outlined"
            />
            {organizer.website && (
              <Chip
                icon={<Language />}
                label="Website"
                variant="outlined"
                component={Link}
                href={organizer.website}
                target="_blank"
                clickable
              />
            )}
          </Box>
        </Box>

        {/* Event Types */}
        <Box>
          <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
            Book a meeting
          </Typography>
          
          {organizer.event_types.length > 0 ? (
            <Grid container spacing={3}>
              {organizer.event_types.map((eventType) => (
                <Grid item xs={12} md={6} key={eventType.event_type_slug}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card 
                      sx={{ 
                        height: '100%', 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 4,
                        }
                      }}
                      onClick={() => handleEventTypeClick(eventType.event_type_slug)}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" component="h3" gutterBottom>
                            {eventType.name}
                          </Typography>
                          <ArrowForward sx={{ color: 'text.secondary' }} />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                          {eventType.description || 'No description provided'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Schedule sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {formatDuration(eventType.duration)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <People sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {eventType.max_attendees === 1 
                              ? '1-on-1 meeting' 
                              : `Group meeting (up to ${eventType.max_attendees} people)`
                            }
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <LocationOn sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {eventType.location_type === 'video_call' && 'Video call'}
                            {eventType.location_type === 'phone_call' && 'Phone call'}
                            {eventType.location_type === 'in_person' && 'In person'}
                            {eventType.location_type === 'custom' && 'Custom location'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {eventType.is_group_event && (
                            <Chip label="Group Event" size="small" variant="outlined" />
                          )}
                        </Box>
                        
                        <Button
                          fullWidth
                          variant="contained"
                          sx={{ 
                            mt: 2,
                            bgcolor: organizer.brand_color || 'primary.main',
                            '&:hover': {
                              bgcolor: organizer.brand_color || 'primary.dark',
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventTypeClick(eventType.event_type_slug);
                          }}
                        >
                          Select Time
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" gutterBottom>
                No available meeting types
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This organizer hasn't set up any public meeting types yet.
              </Typography>
            </Box>
          )}
        </Box>
      </motion.div>
    </Container>
  );
};

export default PublicOrganizerPage;