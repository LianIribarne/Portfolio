from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from django.core.mail import send_mail, BadHeaderError
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.core.cache import cache
from django.conf import settings
import json, re, logging, time

logger = logging.getLogger('contact')

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

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
    
    ip = get_client_ip(request)
    key = f"contact_rate_{ip}"
    last_time = cache.get(key)

    now = time.time()
    cooldown = 5 * 60
    time_await = now - last_time if last_time else cooldown + 1

    if time_await < cooldown:
        remaining = cooldown - time_await
        minutes_left = int(remaining // 60)
        seconds_left = int(remaining % 60)
        return JsonResponse({'error': {
            'en': f'Please wait {minutes_left} minute{"s" if minutes_left != 1 else ""} and {seconds_left} second{"s" if seconds_left != 1 else ""} before sending another message',
            'es': f'Por favor, espere {minutes_left} minuto{"s" if seconds_left != 1 else ""} y {seconds_left} segundo{"s" if seconds_left != 1 else ""} antes de enviar otro mensaje'
        }}, status=429)

    cache.set(key, now, timeout=cooldown)

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
            'en': 'An error occurred while sending the message. Please try again later.',
            'es': 'Ocurrió un error al enviar el mensaje. Por favor, inténtalo de nuevo más tarde.'
        }}, status=500)

    return JsonResponse({'state': 'Sent'}, status=200)
