import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Package, AlertTriangle, TrendingUp, CheckCircle, BarChart3, PieChart as PieChartIcon } from 'lucide-react'

const STATUS_CONFIG = {
  critico: {
    label: 'Crítico',
    color: '#ef4444',
    bgColor: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
    iconColor: 'text-red-600'
  },
  baixo: {
    label: 'Baixo',
    color: '#f97316',
    bgColor: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: TrendingUp,
    iconColor: 'text-orange-600'
  },
  atencao: {
    label: 'Atenção',
    color: '#eab308',
    bgColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Package,
    iconColor: 'text-yellow-600'
  },
  ok: {
    label: 'Ok',
    color: '#22c55e',
    bgColor: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  }
}

export default function AnaliseEstoque({ produtos }) {
  const dadosAnalise = useMemo(() => {
    if (!produtos || produtos.length === 0) {
      return {
        dadosGraficoBarras: [],
        dadosGraficoPizza: [],
        produtosCriticos: [],
        produtosBaixoEstoque: [],
        resumoGeral: {
          totalProdutos: 0,
          totalDisponivel: 0,
          totalACaminho: 0,
          totalEstoque: 0
        }
      }
    }

    // Dados para gráfico de barras - Top 10 produtos com menor estoque
    const produtosOrdenados = [...produtos]
      .sort((a, b) => (a.disponivel || 0) - (b.disponivel || 0))
      .slice(0, 10)

    const dadosGraficoBarras = produtosOrdenados.map(produto => ({
      nome: produto.descricao?.substring(0, 20) + (produto.descricao?.length > 20 ? '...' : ''),
      disponivel: produto.disponivel || 0,
      aCaminho: produto.a_caminho || 0,
      codigo: produto.codigo
    }))

    // Dados para gráfico de pizza - Distribuição por status
    const statusCount = produtos.reduce((acc, produto) => {
      const status = produto.status || 'ok'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    const dadosGraficoPizza = Object.entries(statusCount).map(([status, count]) => ({
      name: STATUS_CONFIG[status]?.label || status,
      value: count,
      color: STATUS_CONFIG[status]?.color || '#6b7280'
    }))

    // Produtos críticos
    const produtosCriticos = produtos
      .filter(produto => produto.status === 'critico')
      .sort((a, b) => (a.disponivel || 0) - (b.disponivel || 0))

    // Produtos com baixo estoque
    const produtosBaixoEstoque = produtos
      .filter(produto => produto.status === 'baixo')
      .sort((a, b) => (a.disponivel || 0) - (b.disponivel || 0))

    // Resumo geral
    const resumoGeral = produtos.reduce((acc, produto) => ({
      totalProdutos: acc.totalProdutos + 1,
      totalDisponivel: acc.totalDisponivel + (produto.disponivel || 0),
      totalACaminho: acc.totalACaminho + (produto.a_caminho || 0),
      totalEstoque: acc.totalEstoque + (produto.estoque_total || 0)
    }), {
      totalProdutos: 0,
      totalDisponivel: 0,
      totalACaminho: 0,
      totalEstoque: 0
    })

    return {
      dadosGraficoBarras,
      dadosGraficoPizza,
      produtosCriticos,
      produtosBaixoEstoque,
      resumoGeral
    }
  }, [produtos])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey === 'disponivel' ? 'Disponível' : 'A Caminho'}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                <p className="text-2xl font-bold">{dadosAnalise.resumoGeral.totalProdutos}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Disponível</p>
                <p className="text-2xl font-bold">{dadosAnalise.resumoGeral.totalDisponivel}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total A Caminho</p>
                <p className="text-2xl font-bold">{dadosAnalise.resumoGeral.totalACaminho}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estoque Total</p>
                <p className="text-2xl font-bold">{dadosAnalise.resumoGeral.totalEstoque}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top 10 - Produtos com Menor Estoque
            </CardTitle>
            <CardDescription>
              Produtos ordenados por quantidade disponível (menor para maior)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosAnalise.dadosGraficoBarras} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="nome" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="disponivel" fill="#3b82f6" name="Disponível" />
                  <Bar dataKey="aCaminho" fill="#10b981" name="A Caminho" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Distribuição por Status
            </CardTitle>
            <CardDescription>
              Proporção de produtos por categoria de estoque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosAnalise.dadosGraficoPizza}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosAnalise.dadosGraficoPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabelas de Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos Críticos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Produtos Críticos
            </CardTitle>
            <CardDescription>
              Produtos que precisam de atenção imediata ({dadosAnalise.produtosCriticos.length} itens)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dadosAnalise.produtosCriticos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum produto em situação crítica</p>
            ) : (
              <div className="space-y-3">
                {dadosAnalise.produtosCriticos.slice(0, 5).map((produto) => (
                  <div key={produto.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{produto.descricao}</p>
                      <p className="text-xs text-gray-600">Código: {produto.codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-700">{produto.disponivel}</p>
                      <p className="text-xs text-gray-600">disponível</p>
                    </div>
                  </div>
                ))}
                {dadosAnalise.produtosCriticos.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{dadosAnalise.produtosCriticos.length - 5} produtos críticos adicionais
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Produtos com Baixo Estoque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Baixo Estoque
            </CardTitle>
            <CardDescription>
              Produtos com estoque baixo que merecem atenção ({dadosAnalise.produtosBaixoEstoque.length} itens)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dadosAnalise.produtosBaixoEstoque.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum produto com baixo estoque</p>
            ) : (
              <div className="space-y-3">
                {dadosAnalise.produtosBaixoEstoque.slice(0, 5).map((produto) => (
                  <div key={produto.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{produto.descricao}</p>
                      <p className="text-xs text-gray-600">Código: {produto.codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-700">{produto.disponivel}</p>
                      <p className="text-xs text-gray-600">disponível</p>
                    </div>
                  </div>
                ))}
                {dadosAnalise.produtosBaixoEstoque.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{dadosAnalise.produtosBaixoEstoque.length - 5} produtos com baixo estoque adicionais
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

