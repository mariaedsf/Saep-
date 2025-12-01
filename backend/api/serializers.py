from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Usuario, Produto, MovimentacaoEstoque, AlertaEstoque
import logging

logger = logging.getLogger(__name__)

class UsuarioRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = Usuario
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name', 'empresa')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
            'empresa': {'required': False, 'allow_blank': True, 'allow_null': True}
        }
    
    def validate(self, attrs):
        logger.info(f"Validando dados: {attrs}")
        if attrs['password'] != attrs['password2']:
            logger.error("Senhas não coincidem")
            raise serializers.ValidationError({"password": "As senhas não coincidem."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = Usuario.objects.create_user(**validated_data)
        return user

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'empresa', 'data_criacao')
        read_only_fields = ('id', 'data_criacao')


class ProdutoSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_estoque_display', read_only=True)
    precisa_reposicao = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Produto
        fields = '__all__'
        read_only_fields = ('status_estoque', 'data_criacao', 'data_atualizacao', 'criado_por')

class MovimentacaoEstoqueSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)
    usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_movimentacao_display', read_only=True)
    
    class Meta:
        model = MovimentacaoEstoque
        fields = '__all__'
        read_only_fields = ('data_movimentacao', 'usuario')

class AlertaEstoqueSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)
    produto_quantidade = serializers.IntegerField(source='produto.quantidade', read_only=True)
    produto_estoque_minimo = serializers.IntegerField(source='produto.estoque_minimo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_alerta_display', read_only=True)
    
    class Meta:
        model = AlertaEstoque
        fields = '__all__'

class DashboardSerializer(serializers.Serializer):
    total_produtos = serializers.IntegerField()
    produtos_em_estoque = serializers.IntegerField()
    produtos_criticos = serializers.IntegerField()
    alertas_nao_lidos = serializers.IntegerField()
    ultimos_alertas = AlertaEstoqueSerializer(many=True)