from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from .serializers import UsuarioRegistrationSerializer
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

class RegisterView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = UsuarioRegistrationSerializer
    
    def post(self, request, *args, **kwargs):
        logger.info(f"Recebendo requisição de registro: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            try:
                logger.info("Tentando salvar o usuário")
                user = serializer.save()
                logger.info(f"Usuário salvo com sucesso: {user}")
                
                response_data = {
                    'message': 'Usuário criado com sucesso',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'empresa': user.empresa
                    }
                }
                logger.info(f"Resposta enviada: {response_data}")
                return Response(response_data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"Erro ao salvar usuário: {e}")
                return Response({'error': 'Erro ao criar usuário'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            logger.error(f"Erros do serializer: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)