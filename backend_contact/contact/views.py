from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.core.mail import send_mail, BadHeaderError
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.conf import settings
import json, re

@ensure_csrf_cookie
def csrf_token_view(request):
    token = get_token(request)
    return JsonResponse({"csrfToken": token})

def contact_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid data'}, status=400)
        
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()

    if not all([name, email, subject, message]):
        return JsonResponse({'error': 'Mandatory data is missing'}, status=400)
    
    if re.search(r'<[^>]+>', message) or re.search(r'<[^>]+>', name) or re.search(r'<[^>]+>', subject):
        return JsonResponse({'error': 'The message must not contain HTML tags'}, status=400)
    
    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({'error': 'Invalid email'}, status=400)
    
    if len(name) > 100 or len(email) > 100 or len(subject) > 100 or len(message) > 1000:
        return JsonResponse({'error': 'Too long'}, status=400)

    body = f"Nombre: {name}\n\nEmail: {email}\n\nMensaje:\n\n{message}"

    try:
        send_mail(
            subject,
            body,
            None,
            [settings.EMAIL_RECEIVER],
            fail_silently=False
        )
    except BadHeaderError:
        return JsonResponse({'error': 'Invalid header found.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Error sending email: {str(e)}'}, status=500)

    return JsonResponse({'state': 'Sent'}, status=200)
