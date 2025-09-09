@@ .. @@
 from celery import shared_task
 from django.core.mail import send_mail
 from django.conf import settings
 from django.utils import timezone
 from django.db import transaction
+from django.db import models
+from datetime import timedelta
 from .models import Booking, WaitlistEntry, EventTypeAvailabilityCache
 from .utils import create_booking_audit_log, invalidate_availability_cache
 import logging