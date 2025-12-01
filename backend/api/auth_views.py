# api/auth_views.py
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Usuario
from .serializers import UsuarioSerializer
import json

class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = UsuarioSerializer
    
    def post(self, request, *args, **kwargs):
        # Handle JSON data
        if request.content_type == 'application/json':
            try:
                data = json.loads(request.body)
                email = data.get('email')
                password = data.get('password')
            except json.JSONDecodeError:
                return Response(
                    {'error': 'JSON inválido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            email = request.data.get('email')
            password = request.data.get('password')
        
        print(f"Login attempt with email: {email}")
        
        if not email or not password:
            return Response(
                {'error': 'Email e senha são obrigatórios'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Busca o usuário pelo email
            user = Usuario.objects.get(email=email)
            print(f"User found: {user.username} - {user.email}")
            print(f"User active: {user.is_active}")
            
            # Verifica a senha MANUALMENTE (evita problemas com authenticate)
            if user.check_password(password) and user.is_active:
                print("Password is correct and user is active")
                
                # Gera os tokens JWT diretamente
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UsuarioSerializer(user).data
                })
            else:
                print(f"Password correct: {user.check_password(password)}")
                print(f"User active: {user.is_active}")
                return Response(
                    {'error': 'Credenciais inválidas'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
        except Usuario.DoesNotExist:
            print(f"User with email {email} not found")
            return Response(
                {'error': 'Credenciais inválidas'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response(
                {'error': 'Erro interno do servidor'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )