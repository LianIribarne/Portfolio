from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from django.core.mail import send_mail, BadHeaderError
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.conf import settings
import json, re, logging

logger = logging.getLogger('contact')

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
        return JsonResponse({'error': {
            'en': 'Invalid data',
            'es': 'Datos no válidos'
        }}, status=400)
    
    honeypot = data.get('website', '').strip()
    if honeypot:
        return JsonResponse({'error': {
            'en': 'Bot detected',
            'es': 'Bot detectado'
        }}, status=400)

    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()

    if not all([name, email, subject, message]):
        return JsonResponse({'error': {
            'en': 'Mandatory data is missing',
            'es': 'Faltan datos obligatorios'
        }}, status=400)
    
    if re.search(r'<[^>]+>', message) or re.search(r'<[^>]+>', name) or re.search(r'<[^>]+>', subject):
        return JsonResponse({'error': {
            'en': 'The message must not contain HTML tags',
            'es': 'El mensaje no debe contener etiquetas HTML'
        }}, status=400)
    
    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({'error': {
            'en': 'Invalid email',
            'es': 'Correo electrónico no válido'
        }}, status=400)
    
    if len(name) > 100 or len(email) > 100 or len(subject) > 100 or len(message) > 1000:
        return JsonResponse({'error': {
            'en': 'Too long',
            'es': 'Demasiado largo'
        }}, status=400)

    body = (
        f"📧 Nuevo mensaje del formulario\n"
        f"{'-'*40}\n"
        f"👤 Nombre: {name}\n"
        f"📨 Email: {email}\n"
        f"📝 Asunto: {subject}\n"
        f"{'-'*40}\n"
        f"💬 Mensaje:\n{message}\n"
        f"{'-'*40}\n"
    )

    try:
        send_mail(
            subject,
            body,
            None,
            [settings.EMAIL_RECEIVER],
            fail_silently=False
        )
    except BadHeaderError:
        return JsonResponse({'error': {
            'en': 'Invalid header found',
            'es': 'Encabezado no válido encontrado'
        }}, status=400)
    except Exception as e:
        logger.error(f"[Email error] {str(e)} from IP {request.META.get('REMOTE_ADDR')}")
        return JsonResponse({'error': {
            'en': f'Error sending email: {str(e)}',
            'es': f'Error al enviar el correo electrónico: {str(e)}'
        }}, status=500)

    return JsonResponse({'state': 'Sent'}, status=200)
