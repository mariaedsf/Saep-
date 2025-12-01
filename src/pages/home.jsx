import { useEffect, useState } from 'react';
import { Wrench, Package, LogOut, User, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';

function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stockAlerts, setStockAlerts] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    total_produtos: 0,
    produtos_em_estoque: 0,
    produtos_criticos: 0,
    alertas_nao_lidos: 0,
    ultimos_alertas: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alerts, dashboard] = await Promise.all([
          apiService.getStockAlerts(),
          apiService.getDashboardData()
        ]);
        
        setStockAlerts(alerts);
        setDashboardData(dashboard);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleManageProducts = () => {
    navigate('/productManagement');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getAlertColor = (tipo) => {
    switch (tipo) {
      case 'critico':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'atencao':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  const getAlertIcon = (tipo) => {
    switch (tipo) {
      case 'critico':
        return 'text-red-500';
      case 'atencao':
        return 'text-orange-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getAlertMessage = (produto) => {
    if (produto.quantidade === 0) {
      return 'ESGOTADO';
    }
    return `ESTOQUE BAIXO: ${produto.quantidade} unidades (mínimo: ${produto.estoque_minimo})`;
  };

  const criticalAlerts = stockAlerts.filter(alert => alert.tipo_alerta === 'critico');
  const hasCriticalAlerts = criticalAlerts.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Wrench className="h-8 w-8 text-white" />
                <h1 className="text-2xl font-bold text-white">ToolManager</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-blue-100">
                  <User className="h-5 w-5" />
                  <span className="text-sm">Olá, {user?.first_name || user?.username || 'Usuário'}!</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm">Sair</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card de Boas-vindas e Alertas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Bem-vindo ao ToolManager! 🛠️
                </h2>
                <p className="text-gray-600 text-lg">
                  Sistema de Gerenciamento de Ferramentas
                </p>
              </div>

              {/* Alertas de Estoque */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    Alertas de Estoque
                  </h3>
                  <span className="text-sm text-gray-500">
                    {dashboardData.alertas_nao_lidos} alerta(s)
                  </span>
                </div>

                {hasCriticalAlerts && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span className="font-semibold text-red-800">
                        Atenção! {criticalAlerts.length} produto(s) com estoque crítico
                      </span>
                    </div>
                  </div>
                )}

                {dashboardData.alertas_nao_lidos > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.ultimos_alertas.map((alert) => (
                      <div
                        key={alert.id}
                        className={`border rounded-lg p-4 ${getAlertColor(alert.tipo_alerta)}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className={`h-5 w-5 ${getAlertIcon(alert.tipo_alerta)}`} />
                            <div>
                              <div className="font-semibold">{alert.produto_nome}</div>
                              <div className="text-sm opacity-90">
                                {getAlertMessage(alert)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={handleManageProducts}
                            className="flex items-center space-x-1 text-sm font-medium opacity-80 hover:opacity-100 transition-opacity"
                          >
                            <span>Gerenciar</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center justify-center space-x-2 text-green-700">
                        <Package className="h-6 w-6" />
                        <span className="font-semibold">Estoque em dia!</span>
                      </div>
                      <p className="text-green-600 text-sm mt-2">
                        Todos os produtos estão com estoque adequado.
                      </p>
                    </div>
                  </div>
                )}

                {/* Resumo de Estoque */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{dashboardData.total_produtos}</div>
                    <div className="text-sm text-gray-600">Produtos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{dashboardData.produtos_em_estoque}</div>
                    <div className="text-sm text-gray-600">Em estoque</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{dashboardData.produtos_criticos}</div>
                    <div className="text-sm text-gray-600">Críticos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Ações Rápidas */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
              Ações Rápidas
            </h3>
            
            <div className="space-y-4">
              {/* Botão Gerenciar Produtos */}
              <button
                onClick={handleManageProducts}
                className="w-full flex items-center justify-center space-x-3 py-4 px-6 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Package className="h-6 w-6" />
                <span>Gerenciar Produtos</span>
              </button>

              {/* Outras ações futuras */}
              <button
                className="w-full flex items-center justify-center space-x-3 py-4 px-6 border border-gray-300 rounded-lg shadow-sm text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled
              >
                <Wrench className="h-6 w-6 text-gray-400" />
                <span className="text-gray-400">Relatórios (Em breve)</span>
              </button>

              <button
                className="w-full flex items-center justify-center space-x-3 py-4 px-6 border border-gray-300 rounded-lg shadow-sm text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled
              >
                <User className="h-6 w-6 text-gray-400" />
                <span className="text-gray-400">Usuários (Em breve)</span>
              </button>
            </div>

            {/* Informações do Sistema */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Informações do Sistema</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Versão: 2.1.0</div>
                <div>Último acesso: Hoje</div>
                <div>Status: Online</div>
                <div>Usuário: {user?.first_name} {user?.last_name}</div>
                <div>Empresa: {user?.empresa || 'Não informada'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            © 2024 ToolManager. Todos os direitos reservados. • Suporte: suporte@toolmanager.com
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;