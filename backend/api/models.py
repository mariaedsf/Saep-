from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from decimal import Decimal

class Usuario(AbstractUser):
    empresa = models.CharField(max_length=255, blank=True, null=True, verbose_name="Empresa")
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização")
    
    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"
        constraints = [
            models.UniqueConstraint(fields=['email'], name='unique_usuario_email')
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    # Add related_name to avoid conflicts with Django's User model
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='usuario_set',
        blank=True,
        verbose_name='groups'
    )
    
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='usuario_set',
        blank=True,
        verbose_name='user permissions'
    )


class Produto(models.Model):
    STATUS_ESTOQUE_CHOICES = [
        ('disponivel', 'Disponível'),
        ('baixo', 'Estoque Baixo'),
        ('critico', 'Estoque Crítico'),
        ('esgotado', 'Esgotado'),
    ]
    
    nome = models.CharField(max_length=255, verbose_name="Nome do Produto")
    descricao = models.TextField(blank=True, null=True, verbose_name="Descrição")
    quantidade = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Quantidade em Estoque"
    )
    estoque_minimo = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Estoque Mínimo"
    )
    # PREÇO TAMBÉM NÃO É EXIGIDO PELO SAEP, MAS DEIXEI COMO OPCIONAL
    preco = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        blank=True,     # Permite em branco
        null=True,      # Permite nulo
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Preço (R$) - Opcional"
    )
    status_estoque = models.CharField(
        max_length=20,
        choices=STATUS_ESTOQUE_CHOICES,
        default='disponivel',
        verbose_name="Status do Estoque"
    )
    ativo = models.BooleanField(default=True, verbose_name="Ativo")
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização")
    criado_por = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        related_name='produtos_criados',
        verbose_name="Criado por"
    )
    
    class Meta:
        verbose_name = "Produto"
        verbose_name_plural = "Produtos"
        ordering = ['nome']
        indexes = [
            models.Index(fields=['nome']),
            models.Index(fields=['status_estoque']),
        ]
    
    def __str__(self):
        return self.nome
    
    def save(self, *args, **kwargs):
        # Atualiza automaticamente o status do estoque
        if self.quantidade == 0:
            self.status_estoque = 'esgotado'
        elif self.quantidade <= self.estoque_minimo:
            self.status_estoque = 'critico'
        elif self.quantidade <= (self.estoque_minimo * 2):
            self.status_estoque = 'baixo'
        else:
            self.status_estoque = 'disponivel'
        
        super().save(*args, **kwargs)
    
    @property
    def precisa_reposicao(self):
        """Verifica se o produto precisa de reposição"""
        return self.quantidade <= self.estoque_minimo

class MovimentacaoEstoque(models.Model):
    TIPO_MOVIMENTACAO_CHOICES = [
        ('entrada', 'Entrada'),
        ('saida', 'Saída'),
    ]
    
    produto = models.ForeignKey(
        Produto,
        on_delete=models.PROTECT,
        related_name='movimentacoes',
        verbose_name="Produto"
    )
    tipo_movimentacao = models.CharField(
        max_length=10,
        choices=TIPO_MOVIMENTACAO_CHOICES,
        verbose_name="Tipo de Movimentação"
    )
    quantidade = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="Quantidade"
    )
    data_movimentacao = models.DateTimeField(auto_now_add=True, verbose_name="Data da Movimentação")
    observacao = models.TextField(blank=True, null=True, verbose_name="Observação")
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        related_name='movimentacoes',
        verbose_name="Usuário Responsável"
    )
    
    class Meta:
        verbose_name = "Movimentação de Estoque"
        verbose_name_plural = "Movimentações de Estoque"
        ordering = ['-data_movimentacao']
    
    def __str__(self):
        return f"{self.tipo_movimentacao.upper()} - {self.produto.nome} - {self.quantidade} unidades"
    
    def save(self, *args, **kwargs):
        # Atualiza o estoque do produto baseado na movimentação
        if self.tipo_movimentacao == 'entrada':
            self.produto.quantidade += self.quantidade
        elif self.tipo_movimentacao == 'saida':
            if self.produto.quantidade >= self.quantidade:
                self.produto.quantidade -= self.quantidade
            else:
                raise ValueError("Quantidade em estoque insuficiente para saída")
        
        self.produto.save()
        super().save(*args, **kwargs)

class AlertaEstoque(models.Model):
    TIPO_ALERTA_CHOICES = [
        ('critico', 'Crítico'),
        ('atencao', 'Atenção'),
        ('info', 'Informação'),
    ]
    
    produto = models.ForeignKey(
        Produto,
        on_delete=models.CASCADE,
        related_name='alertas',
        verbose_name="Produto"
    )
    tipo_alerta = models.CharField(
        max_length=10,
        choices=TIPO_ALERTA_CHOICES,
        verbose_name="Tipo de Alerta"
    )
    mensagem = models.TextField(verbose_name="Mensagem do Alerta")
    lido = models.BooleanField(default=False, verbose_name="Lido")
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Atualização")
    
    class Meta:
        verbose_name = "Alerta de Estoque"
        verbose_name_plural = "Alertas de Estoque"
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"{self.tipo_alerta.upper()} - {self.produto.nome}"