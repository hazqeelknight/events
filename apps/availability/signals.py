"""
Signal handlers for the availability module.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction


# Note: These models would be defined in apps.availability.models
# For now, we'll create placeholder signal handlers

@receiver(post_save, sender='availability.BlockedTime')
def handle_blocked_time_change(sender, instance, **kwargs):
    """Handle blocked time changes."""
    transaction.on_commit(lambda: _invalidate_cache_for_blocked_time(instance))


@receiver(post_delete, sender='availability.BlockedTime')
def handle_blocked_time_deletion(sender, instance, **kwargs):
    """Handle blocked time deletion."""
    transaction.on_commit(lambda: _invalidate_cache_for_blocked_time(instance))


@receiver(post_save, sender='availability.AvailabilityRule')
def handle_availability_rule_change(sender, instance, **kwargs):
    """Handle availability rule changes."""
    transaction.on_commit(lambda: _invalidate_cache_for_availability_rule(instance))


@receiver(post_delete, sender='availability.AvailabilityRule')
def handle_availability_rule_deletion(sender, instance, **kwargs):
    """Handle availability rule deletion."""
    transaction.on_commit(lambda: _invalidate_cache_for_availability_rule(instance))


def _invalidate_cache_for_blocked_time(blocked_time):
    """Invalidate cache for blocked time changes."""
    from apps.events.utils import invalidate_availability_cache
    
    # Get date range from blocked time
    start_date = getattr(blocked_time, 'start_date', None)
    end_date = getattr(blocked_time, 'end_date', None)
    organizer = getattr(blocked_time, 'organizer', None)
    
    if organizer:
        invalidate_availability_cache(organizer, start_date, end_date)


def _invalidate_cache_for_availability_rule(availability_rule):
    """Invalidate cache for availability rule changes."""
    from apps.events.utils import invalidate_availability_cache
    
    organizer = getattr(availability_rule, 'organizer', None)
    if organizer:
        # Availability rule changes affect all dates
        invalidate_availability_cache(organizer)