import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { EventTypeForm } from './components/EventTypeForm';
import { BookingDetails } from './components/BookingDetails';

// Placeholder components - to be implemented by the events module developer
const EventsOverview = React.lazy(() => import('./pages/EventsOverview'));
const EventTypes = React.lazy(() => import('./pages/EventTypes'));
const Bookings = React.lazy(() => import('./pages/Bookings'));
const Analytics = React.lazy(() => import('./pages/Analytics'));

const EventsRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<EventsOverview />} />
      <Route path="types/new" element={<EventTypeForm mode="create" />} />
      <Route path="types/:id/edit" element={<EventTypeForm mode="edit" />} />
      <Route path="types" element={<EventTypes />} />
      <Route path="bookings" element={<Bookings />} />
      <Route path="bookings/:id" element={<BookingDetails bookingId={window.location.pathname.split('/')[3]} />} />
      <Route path="analytics" element={<Analytics />} />
    </Routes>
  );
};

export default EventsRoutes;