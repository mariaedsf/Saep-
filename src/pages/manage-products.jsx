import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  Package,
  LogOut,
  User,
  Search,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import apiService from "../services/apiService";
import { toast } from "react-toastify";

function ProductManagement() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    quantidade: 0,
    estoque_minimo: 0,
    preco: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsData = await apiService.getProducts();

        const productsWithFixedPrices = productsData.map((product) => ({
          ...product,
          preco:
            typeof product.preco === "string"
              ? parseFloat(product.preco)
              : product.preco,
        }));

        setProducts(productsWithFixedPrices);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar produtos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.descricao || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        // Garante que os valores numéricos sejam números
        quantidade: Number(product.quantidade),
        estoque_minimo: Number(product.estoque_minimo),
        preco: Number(product.preco) || 0,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nome: "",
        descricao: "",
        quantidade: 0,
        estoque_minimo: 0,
        preco: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações básicas - REMOVIDA a validação de categoria obrigatória
    if (
      !formData.nome ||
      formData.quantidade < 0 ||
      formData.estoque_minimo < 0
    ) {
      toast.error(
        "Por favor, preencha o nome do produto e os valores de estoque corretamente."
      );
      return;
    }

    try {
      // Prepara os dados para enviar
      const productData = {
        nome: formData.nome,
        descricao: formData.descricao,
        quantidade: parseInt(formData.quantidade),
        estoque_minimo: parseInt(formData.estoque_minimo),
        preco: parseFloat(formData.preco) || 0,
      };

      console.log("📦 Enviando dados do produto:", productData);

      if (editingProduct) {
        // Atualizar produto existente
        const updatedProduct = await apiService.updateProduct(
          editingProduct.id,
          productData
        );
        setProducts(
          products.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...updatedProduct,
                  preco:
                    typeof updatedProduct.preco === "string"
                      ? parseFloat(updatedProduct.preco)
                      : updatedProduct.preco,
                }
              : p
          )
        );
        toast.success("Produto atualizado com sucesso!");
      } else {
        // Adicionar novo produto
        const newProduct = await apiService.createProduct(productData);
        // Garante que o preço seja número
        const productWithFixedPrice = {
          ...newProduct,
          preco:
            typeof newProduct.preco === "string"
              ? parseFloat(newProduct.preco)
              : newProduct.preco,
        };
        setProducts([...products, productWithFixedPrice]);
        toast.success("Produto cadastrado com sucesso!");
      }

      handleCloseModal();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.error("Erro ao salvar produto: " + error.message);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await apiService.deleteProduct(productId);
        setProducts(products.filter((p) => p.id !== productId));
        toast.success("Produto excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
        toast.error("Erro ao excluir produto: " + error.message);
      }
    }
  };

  const handleBackToHome = () => {
    navigate("/home");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getStockStatus = (quantidade, estoque_minimo) => {
    if (quantidade === 0) return "text-red-600 bg-red-50";
    if (quantidade <= estoque_minimo) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
  };

  // Função segura para formatar preço
  const formatPrice = (price) => {
    if (price === null || price === undefined) return "0.00";
    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(numericPrice) ? "0.00" : numericPrice.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToHome}
                  className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Voltar</span>
                </button>
                <div className="flex items-center space-x-3">
                  <Wrench className="h-8 w-8 text-white" />
                  <h1 className="text-2xl font-bold text-white">ToolManager</h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-blue-100">
                  <User className="h-5 w-5" />
                  <span className="text-sm">
                    {user?.first_name} {user?.last_name}
                  </span>
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
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Gerenciamento de Produtos
            </h2>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center space-x-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Novo Produto</span>
            </button>
          </div>

          {/* Barra de Pesquisa */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Buscar por nome ou descrição..."
              />
            </div>
          </div>

          {/* Tabela de Produtos */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque Mínimo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.nome}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.descricao}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.quantidade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.estoque_minimo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {formatPrice(product.preco)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatus(
                          product.quantidade,
                          product.estoque_minimo
                        )}`}
                      >
                        {product.quantidade === 0
                          ? "Sem Estoque"
                          : product.quantidade <= product.estoque_minimo
                          ? "Estoque Baixo"
                          : "Em Estoque"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhum produto encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? "Tente ajustar sua busca"
                  : "Comece adicionando um novo produto"}
              </p>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            © 2024 ToolManager. Todos os direitos reservados. • Suporte:
            suporte@toolmanager.com
          </p>
        </div>
      </div>

      {/* Modal para Adicionar/Editar Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-2xl">
              <h3 className="text-lg font-bold text-white">
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  rows="3"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    name="quantidade"
                    value={formData.quantidade}
                    onChange={handleInputChange}
                    min="0"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque Mínimo *
                  </label>
                  <input
                    type="number"
                    name="estoque_minimo"
                    value={formData.estoque_minimo}
                    onChange={handleInputChange}
                    min="0"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço (R$) - Opcional
                </label>
                <input
                  type="number"
                  name="preco"
                  value={formData.preco}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {editingProduct ? "Atualizar" : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductManagement;
