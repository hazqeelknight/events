"""
Signal handlers for the users module.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Profile


@receiver(post_save, sender=Profile)
def handle_profile_timezone_change(sender, instance, **kwargs):
    """Handle timezone changes in user profile."""
    if kwargs.get('update_fields') and 'timezone_name' in kwargs['update_fields']:
        # Timezone changed, invalidate availability cache
        from apps.events.utils import invalidate_availability_cache
        invalidate_availability_cache(instance.user)
    elif not kwargs.get('update_fields'):
        # Full save, check if timezone changed
        try:
            old_instance = Profile.objects.get(pk=instance.pk)
            if old_instance.timezone_name != instance.timezone_name:
                from apps.events.utils import invalidate_availability_cache
                invalidate_availability_cache(instance.user)
        except Profile.DoesNotExist:
            pass