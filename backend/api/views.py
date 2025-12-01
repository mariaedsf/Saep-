from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Usuario, Produto, MovimentacaoEstoque, AlertaEstoque
from .serializers import *

class ProdutoViewSet(viewsets.ModelViewSet):
    # queryset = Produto.objects.filter(ativo=True)
    queryset = Produto.objects.all() 
    serializer_class = ProdutoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por busca
        search_term = self.request.query_params.get('search', None)
        if search_term:
            queryset = queryset.filter(
                Q(nome__icontains=search_term) |
                Q(descricao__icontains=search_term)
            )
        
        return queryset.select_related('criado_por')
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)

class MovimentacaoEstoqueViewSet(viewsets.ModelViewSet):
    queryset = MovimentacaoEstoque.objects.all()
    serializer_class = MovimentacaoEstoqueSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class AlertaEstoqueViewSet(viewsets.ModelViewSet):
    queryset = AlertaEstoque.objects.filter(lido=False)
    serializer_class = AlertaEstoqueSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def marcar_como_lido(self, request, pk=None):
        alerta = self.get_object()
        alerta.lido = True
        alerta.save()
        return Response({'status': 'Alerta marcado como lido'})

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        total_produtos = Produto.objects.filter(ativo=True).count()
        produtos_em_estoque = Produto.objects.filter(
            ativo=True, 
            status_estoque='disponivel'
        ).count()
        produtos_criticos = Produto.objects.filter(
            ativo=True
        ).filter(
            Q(status_estoque='critico') | Q(status_estoque='esgotado')
        ).count()
        alertas_nao_lidos = AlertaEstoque.objects.filter(lido=False).count()
        ultimos_alertas = AlertaEstoque.objects.filter(lido=False).order_by('-data_criacao')[:5]
        
        serializer = DashboardSerializer({
            'total_produtos': total_produtos,
            'produtos_em_estoque': produtos_em_estoque,
            'produtos_criticos': produtos_criticos,
            'alertas_nao_lidos': alertas_nao_lidos,
            'ultimos_alertas': ultimos_alertas
        })
        
        return Response(serializer.data)