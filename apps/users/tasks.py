"""
Celery tasks for user account management.
"""
from celery import shared_task
from django.utils import timezone
from django.db import transaction
import logging

logger = logging.getLogger(__name__)


@shared_task
def process_account_deletion(user_id):
    """
    Process user account deletion in the background.
    
    This task handles the heavy lifting of cascading deletes and cleanup
    operations that could timeout in a synchronous web request.
    
    Args:
        user_id: ID of the user to delete
    """
    try:
        from .models import User
        
        user = User.objects.get(id=user_id, account_status='pending_deletion')
        
        with transaction.atomic():
            # Log the deletion
            logger.info(f"Processing account deletion for user {user.email}")
            
            # Perform the actual deletion
            # Django's CASCADE will handle related objects
            user.delete()
            
            logger.info(f"Successfully deleted user account {user_id}")
            
        return f"Successfully deleted user account {user_id}"
        
    except User.DoesNotExist:
        logger.warning(f"User {user_id} not found or not marked for deletion")
        return f"User {user_id} not found or not marked for deletion"
        
    except Exception as e:
        logger.error(f"Error deleting user account {user_id}: {str(e)}")
        # Don't re-raise to avoid infinite retries
        return f"Error deleting user account {user_id}: {str(e)}"


@shared_task
def cleanup_pending_deletions():
    """
    Clean up users that have been marked for deletion but not processed.
    
    This task runs periodically to ensure no accounts are stuck in
    pending_deletion status.
    """
    try:
        from .models import User
        from datetime import timedelta
        
        # Find users marked for deletion more than 24 hours ago
        cutoff_time = timezone.now() - timedelta(hours=24)
        
        pending_users = User.objects.filter(
            account_status='pending_deletion',
            updated_at__lt=cutoff_time
        )
        
        count = 0
        for user in pending_users:
            try:
                process_account_deletion.delay(user.id)
                count += 1
            except Exception as e:
                logger.error(f"Error queuing deletion for user {user.id}: {str(e)}")
        
        logger.info(f"Queued {count} pending account deletions for processing")
        return f"Queued {count} pending account deletions for processing"
        
    except Exception as e:
        logger.error(f"Error in cleanup_pending_deletions: {str(e)}")
        return f"Error in cleanup_pending_deletions: {str(e)}"