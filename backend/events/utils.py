"""
Utility functions for the events module.
"""
import logging
from datetime import datetime, timedelta, date
from typing import Dict, List, Any, Optional, Tuple
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction
from django.conf import settings
from .models import (
    EventType, Booking, EventTypeAvailabilityCache, 
    RecurringEventException, BookingAuditLog
)

logger = logging.getLogger(__name__)


class SlotUnavailableError(Exception):
    """Raised when a requested time slot is not available for booking."""
    pass


def validate_timezone_for_booking(timezone_name: str) -> Tuple[bool, Optional[str]]:
    """
    Validate if a timezone is valid for booking purposes.
    
    Args:
        timezone_name: The timezone name to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        import pytz
        pytz.timezone(timezone_name)
        return True, None
    except Exception:
        return False, f"Invalid timezone: {timezone_name}"


def get_client_ip_from_request(request) -> Optional[str]:
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent_from_request(request) -> str:
    """Extract user agent from request."""
    return request.META.get('HTTP_USER_AGENT', '')


def create_booking_audit_log(
    booking,
    action: str,
    description: str,
    actor_type: str,
    actor_email: str = '',
    actor_name: str = '',
    ip_address: str = '',
    user_agent: str = '',
    old_values: Dict = None,
    new_values: Dict = None,
    metadata: Dict = None
):
    """Create an audit log entry for booking-related actions."""
    BookingAuditLog.objects.create(
        booking=booking,
        action=action,
        description=description,
        actor_type=actor_type,
        actor_email=actor_email,
        actor_name=actor_name,
        ip_address=ip_address,
        user_agent=user_agent,
        old_values=old_values or {},
        new_values=new_values or {},
        metadata=metadata or {}
    )


def invalidate_availability_cache(organizer, date_start=None, date_end=None):
    """
    Invalidate availability cache for an organizer.
    
    Args:
        organizer: User instance
        date_start: Optional start date for range invalidation
        date_end: Optional end date for range invalidation
    """
    cache_entries = EventTypeAvailabilityCache.objects.filter(organizer=organizer)
    
    if date_start:
        cache_entries = cache_entries.filter(date__gte=date_start)
    if date_end:
        cache_entries = cache_entries.filter(date__lte=date_end)
    
    cache_entries.update(is_dirty=True)
    logger.info(f"Invalidated {cache_entries.count()} cache entries for organizer {organizer.email}")


class AvailabilityCalculator:
    """
    Calculates available time slots for event types considering all constraints.
    """
    
    def __init__(self, organizer, event_type, timezone_name='UTC'):
        self.organizer = organizer
        self.event_type = event_type
        self.timezone_name = timezone_name
        
    def get_available_slots(
        self, 
        start_date: date, 
        end_date: date, 
        attendee_count: int = 1,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Get available time slots for the given date range.
        
        Args:
            start_date: Start date for availability search
            end_date: End date for availability search
            attendee_count: Number of attendees needed
            use_cache: Whether to use cached results
            
        Returns:
            Dictionary containing slots and metadata
        """
        start_time = timezone.now()
        
        try:
            # Check cache first if enabled
            if use_cache:
                cached_result = self._get_cached_availability(
                    start_date, end_date, attendee_count
                )
                if cached_result:
                    return cached_result
            
            # Calculate availability
            slots = self._calculate_availability(start_date, end_date, attendee_count)
            
            # Apply recurring event logic
            if self.event_type.recurrence_type != 'none':
                slots = self._apply_recurring_logic(slots, start_date, end_date)
            
            # Apply recurring event exceptions
            slots = self._apply_recurring_exceptions(slots, start_date, end_date)
            
            computation_time = int((timezone.now() - start_time).total_seconds() * 1000)
            
            result = {
                'slots': slots,
                'total_slots': len(slots),
                'cache_hit': False,
                'performance_metrics': {
                    'computation_time_ms': computation_time,
                    'cache_used': use_cache
                }
            }
            
            # Cache the result if enabled
            if use_cache:
                self._cache_availability_result(
                    start_date, end_date, attendee_count, result, computation_time
                )
            
            return result
            
        except Exception as e:
            logger.error(f"Error calculating availability: {str(e)}")
            return {
                'slots': [],
                'total_slots': 0,
                'cache_hit': False,
                'error': str(e),
                'performance_metrics': {
                    'computation_time_ms': int((timezone.now() - start_time).total_seconds() * 1000),
                    'cache_used': use_cache
                }
            }
    
    def _get_cached_availability(self, start_date, end_date, attendee_count):
        """Get cached availability if available and not expired."""
        try:
            cache_entry = EventTypeAvailabilityCache.objects.get(
                organizer=self.organizer,
                event_type=self.event_type,
                date=start_date,  # Simplified - in production might need date range support
                timezone_name=self.timezone_name,
                attendee_count=attendee_count,
                is_dirty=False,
                expires_at__gt=timezone.now()
            )
            
            return {
                'slots': cache_entry.available_slots,
                'total_slots': len(cache_entry.available_slots),
                'cache_hit': True,
                'performance_metrics': {
                    'computation_time_ms': cache_entry.computation_time_ms,
                    'cache_used': True,
                    'cached_at': cache_entry.computed_at.isoformat()
                }
            }
        except EventTypeAvailabilityCache.DoesNotExist:
            return None
    
    def _calculate_availability(self, start_date, end_date, attendee_count):
        """Core availability calculation logic."""
        slots = []
        current_date = start_date
        
        while current_date <= end_date:
            if self.event_type.can_book_on_date(current_date):
                daily_slots = self._get_daily_slots(current_date, attendee_count)
                slots.extend(daily_slots)
            current_date += timedelta(days=1)
        
        return slots
    
    def _get_daily_slots(self, date, attendee_count):
        """Get available slots for a specific date."""
        # This is a simplified implementation
        # In production, this would integrate with:
        # - Organizer's availability rules from apps.availability
        # - External calendar busy times
        # - Existing bookings
        # - Buffer times and constraints
        
        slots = []
        
        # Get organizer's working hours for this date
        # (This would integrate with apps.availability module)
        start_hour = getattr(self.organizer.profile, 'reasonable_hours_start', 9)
        end_hour = getattr(self.organizer.profile, 'reasonable_hours_end', 17)
        
        # Generate slots based on event type duration and interval
        slot_interval = self.event_type.slot_interval_minutes or 30
        current_time = timezone.datetime.combine(date, timezone.datetime.min.time().replace(hour=start_hour))
        end_time = timezone.datetime.combine(date, timezone.datetime.min.time().replace(hour=end_hour))
        
        # Make timezone-aware
        import pytz
        tz = pytz.timezone(self.timezone_name)
        current_time = tz.localize(current_time)
        end_time = tz.localize(end_time)
        
        while current_time + timedelta(minutes=self.event_type.duration) <= end_time:
            slot_end_time = current_time + timedelta(minutes=self.event_type.duration)
            
            # Check if slot is available (simplified check)
            if self._is_slot_available(current_time, slot_end_time, attendee_count):
                slots.append({
                    'start_time': current_time,
                    'end_time': slot_end_time,
                    'duration_minutes': self.event_type.duration,
                    'available_spots': self.event_type.max_attendees
                })
            
            current_time += timedelta(minutes=slot_interval)
        
        return slots
    
    def _is_slot_available(self, start_time, end_time, attendee_count):
        """Check if a specific time slot is available."""
        # Check existing bookings
        conflicting_bookings = Booking.objects.filter(
            organizer=self.organizer,
            status='confirmed',
            start_time__lt=end_time,
            end_time__gt=start_time
        )
        
        # For group events, check total capacity
        if self.event_type.is_group_event():
            total_attendees = sum(booking.attendee_count for booking in conflicting_bookings)
            return total_attendees + attendee_count <= self.event_type.max_attendees
        else:
            return not conflicting_bookings.exists()
    
    def _apply_recurring_logic(self, slots, start_date, end_date):
        """Apply recurring event logic to slots."""
        if not self.event_type.get_rrule_object():
            return slots
        
        try:
            rrule = self.event_type.get_rrule_object()
            # Apply RRULE logic to generate recurring slots
            # This is a placeholder - full implementation would use dateutil.rrule
            return slots
        except Exception as e:
            logger.error(f"Error applying recurring logic: {str(e)}")
            return slots
    
    def _apply_recurring_exceptions(self, slots, start_date, end_date):
        """Apply recurring event exceptions to slots."""
        if self.event_type.recurrence_type == 'none':
            return slots
        
        try:
            exceptions = RecurringEventException.objects.filter(
                event_type=self.event_type,
                exception_date__gte=start_date,
                exception_date__lte=end_date
            )
            
            for exception in exceptions:
                # Remove or modify slots based on exception type
                if exception.exception_type == 'cancelled':
                    slots = [slot for slot in slots 
                            if slot['start_time'].date() != exception.exception_date]
                elif exception.exception_type == 'rescheduled' and exception.new_start_time:
                    # Apply rescheduling logic
                    pass
            
            return slots
        except Exception as e:
            logger.error(f"Error applying recurring exceptions: {str(e)}")
            return slots
    
    def _cache_availability_result(self, start_date, end_date, attendee_count, result, computation_time):
        """Cache the availability calculation result."""
        try:
            cache_timeout = getattr(settings, 'AVAILABILITY_CACHE_TIMEOUT', 3600)
            expires_at = timezone.now() + timedelta(seconds=cache_timeout)
            
            EventTypeAvailabilityCache.objects.update_or_create(
                organizer=self.organizer,
                event_type=self.event_type,
                date=start_date,  # Simplified - might need range support
                timezone_name=self.timezone_name,
                attendee_count=attendee_count,
                defaults={
                    'available_slots': result['slots'],
                    'computed_at': timezone.now(),
                    'expires_at': expires_at,
                    'is_dirty': False,
                    'computation_time_ms': computation_time
                }
            )
        except Exception as e:
            logger.error(f"Error caching availability result: {str(e)}")


def get_available_time_slots(
    organizer,
    event_type,
    start_date: date,
    end_date: date,
    invitee_timezone: str = 'UTC',
    attendee_count: int = 1,
    use_cache: bool = True
) -> Dict[str, Any]:
    """
    Public interface for getting available time slots.
    
    Args:
        organizer: User instance
        event_type: EventType instance
        start_date: Start date for search
        end_date: End date for search
        invitee_timezone: Timezone for the invitee
        attendee_count: Number of attendees needed
        use_cache: Whether to use cached results
        
    Returns:
        Dictionary containing available slots and metadata
    """
    calculator = AvailabilityCalculator(organizer, event_type, invitee_timezone)
    return calculator.get_available_slots(start_date, end_date, attendee_count, use_cache)


def get_booking_by_access_token(access_token: str) -> Optional['Booking']:
    """
    Get a booking by its access token if valid.
    
    Args:
        access_token: The booking access token
        
    Returns:
        Booking instance if found and valid, None otherwise
    """
    try:
        booking = Booking.objects.get(access_token=access_token)
        if booking.is_access_token_valid():
            return booking
        return None
    except Booking.DoesNotExist:
        return None


def handle_booking_cancellation(
    booking,
    cancelled_by: str = 'invitee',
    reason: str = '',
    ip_address: str = '',
    user_agent: str = ''
) -> Tuple[bool, List[str]]:
    """
    Handle booking cancellation with proper validation and logging.
    
    Args:
        booking: Booking instance to cancel
        cancelled_by: Who cancelled the booking
        reason: Reason for cancellation
        ip_address: IP address of the actor
        user_agent: User agent of the actor
        
    Returns:
        Tuple of (success, errors)
    """
    try:
        if not booking.can_be_cancelled():
            return False, ["Booking cannot be cancelled at this time"]
        
        # Store old values for audit
        old_values = {
            'status': booking.status,
            'cancelled_at': booking.cancelled_at,
            'cancelled_by': booking.cancelled_by,
            'cancellation_reason': booking.cancellation_reason
        }
        
        # Cancel the booking
        booking.cancel(cancelled_by, reason)
        
        # Create audit log
        create_booking_audit_log(
            booking=booking,
            action='booking_cancelled',
            description=f"Booking cancelled by {cancelled_by}",
            actor_type=cancelled_by,
            actor_email=booking.invitee_email if cancelled_by == 'invitee' else booking.organizer.email,
            actor_name=booking.invitee_name if cancelled_by == 'invitee' else booking.organizer.get_full_name(),
            ip_address=ip_address,
            user_agent=user_agent,
            old_values=old_values,
            new_values={
                'status': booking.status,
                'cancelled_at': booking.cancelled_at.isoformat() if booking.cancelled_at else None,
                'cancelled_by': booking.cancelled_by,
                'cancellation_reason': booking.cancellation_reason
            },
            metadata={'reason': reason}
        )
        
        return True, []
        
    except Exception as e:
        logger.error(f"Error cancelling booking {booking.id}: {str(e)}")
        return False, [str(e)]


def handle_booking_rescheduling(
    booking,
    new_start_time: datetime,
    ip_address: str = '',
    user_agent: str = ''
) -> Tuple[bool, List[str]]:
    """
    Handle booking rescheduling with proper validation and logging.
    
    Args:
        booking: Booking instance to reschedule
        new_start_time: New start time for the booking
        ip_address: IP address of the actor
        user_agent: User agent of the actor
        
    Returns:
        Tuple of (success, errors)
    """
    try:
        if not booking.can_be_rescheduled():
            return False, ["Booking cannot be rescheduled at this time"]
        
        # Validate new time slot availability
        calculator = AvailabilityCalculator(
            booking.organizer, 
            booking.event_type, 
            booking.invitee_timezone
        )
        
        availability = calculator.get_available_slots(
            new_start_time.date(),
            new_start_time.date(),
            booking.attendee_count,
            use_cache=False
        )
        
        slot_available = any(
            slot['start_time'] == new_start_time for slot in availability['slots']
        )
        
        if not slot_available:
            return False, ["The requested time slot is not available"]
        
        # Store old values for audit
        old_values = {
            'start_time': booking.start_time.isoformat(),
            'end_time': booking.end_time.isoformat(),
            'status': booking.status
        }
        
        # Update booking
        new_end_time = new_start_time + timedelta(minutes=booking.event_type.duration)
        booking.start_time = new_start_time
        booking.end_time = new_end_time
        booking.status = 'rescheduled'
        booking.rescheduled_at = timezone.now()
        booking.save()
        
        # Create audit log
        create_booking_audit_log(
            booking=booking,
            action='booking_rescheduled',
            description=f"Booking rescheduled to {new_start_time}",
            actor_type='invitee',
            actor_email=booking.invitee_email,
            actor_name=booking.invitee_name,
            ip_address=ip_address,
            user_agent=user_agent,
            old_values=old_values,
            new_values={
                'start_time': booking.start_time.isoformat(),
                'end_time': booking.end_time.isoformat(),
                'status': booking.status,
                'rescheduled_at': booking.rescheduled_at.isoformat()
            }
        )
        
        return True, []
        
    except Exception as e:
        logger.error(f"Error rescheduling booking {booking.id}: {str(e)}")
        return False, [str(e)]