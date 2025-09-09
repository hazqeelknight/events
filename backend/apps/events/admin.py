@@ .. @@
 from django.contrib import admin
 from django.utils.html import format_html
+from django.utils import timezone
 from .models import EventType, Booking, Attendee, WaitlistEntry, CustomQuestion, BookingAuditLog