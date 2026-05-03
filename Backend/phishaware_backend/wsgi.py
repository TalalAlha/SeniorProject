"""
wsgi.py — WSGI entry point for the PhishAware backend.

Exposes the WSGI callable as ``application`` so that synchronous WSGI servers
(Gunicorn, uWSGI) can serve the Django application in production.
Set DJANGO_SETTINGS_MODULE before importing if a non-default settings file is needed.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'phishaware_backend.settings')

application = get_wsgi_application()
