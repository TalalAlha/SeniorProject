"""
asgi.py — ASGI entry point for the PhishAware backend.

Exposes the ASGI callable as ``application`` so that async-capable servers
(Uvicorn, Daphne) can serve the Django application.
The project currently uses synchronous views only; ASGI is provided for
future WebSocket or async view support.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'phishaware_backend.settings')

application = get_asgi_application()
