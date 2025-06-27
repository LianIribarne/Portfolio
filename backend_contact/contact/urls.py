from django.urls import path
from .views import contact_view, csrf_token_view

urlpatterns = [
    path('form/', contact_view),
    path('csrf/', csrf_token_view)
]
