import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Search, Settings, Package, AlertTriangle, TrendingUp, CheckCircle, BarChart3, List } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AnaliseEstoque from './AnaliseEstoque'

const STATUS_CONFIG = {
  critico: {
    label: 'Crítico',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
    iconColor: 'text-red-600'
  },
  baixo: {
    label: 'Baixo',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: TrendingUp,
    iconColor: 'text-orange-600'
  },
  atencao: {
    label: 'Atenção',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Package,
    iconColor: 'text-yellow-600'
  },
  ok: {
    label: 'Ok',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  }
}

export default function Produtos() {
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [novoNivelMinimo, setNovoNivelMinimo] = useState('')
  const [dialogError, setDialogError] = useState(null)
  const [visualizacao, setVisualizacao] = useState('lista') // 'lista' ou 'analise'

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('produtos').select('*')
      if (error) throw error
      setProdutos(data || [])
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar os dados:', err)
      setError('Erro ao carregar os dados. Por favor, tente novamente.')
      setProdutos([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (produto) => {
    setProdutoEditando(produto);
    setNovoNivelMinimo(produto.nivel_minimo);
    setDialogError(null);
  };

  const handleCloseDialog = () => {
    setProdutoEditando(null);
    setNovoNivelMinimo('');
    setDialogError(null);
  };

  const atualizarNivelMinimo = async () => {
    if (!produtoEditando) return;

    setDialogError(null);

    const nivelMinimoNumerico = parseFloat(novoNivelMinimo);

    if (isNaN(nivelMinimoNumerico) || nivelMinimoNumerico < 0) {
      setDialogError('Insira um valor numérico válido e não-negativo.');
      return;
    }

    try {
      const { error } = await supabase
        .from('produtos')
        .update({ nivel_minimo: nivelMinimoNumerico })
        .eq('id', produtoEditando.id)

      if (error) throw error

      handleCloseDialog()
      carregarDados() // Recarrega os dados para refletir a mudança
    } catch (err) {
      console.error('Erro ao atualizar o nível mínimo:', err)
      setDialogError('Erro ao salvar. Verifique o valor e tente novamente.')
    }
  }

  const filteredProdutos = produtos.filter(produto => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (produto.descricao || '').toLowerCase().includes(term) ||
                          String(produto.codigo || '').toLowerCase().includes(term);
    const matchesStatus = filterStatus === 'todos' || produto.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Carregando produtos...
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-red-500">
          {error}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Gerenciar Produtos</CardTitle>
              <CardDescription>
                {filteredProdutos.length} produtos encontrados
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={visualizacao === 'lista' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVisualizacao('lista')}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
              </Button>
              <Button
                variant={visualizacao === 'analise' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVisualizacao('analise')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Análise</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {visualizacao === 'analise' ? (
            <AnaliseEstoque produtos={produtos} />
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por código ou descrição..."
                    className="w-full pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select onValueChange={setFilterStatus} value={filterStatus}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filtrar por Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    {Object.keys(STATUS_CONFIG).map(status => (
                      <SelectItem key={status} value={status}>
                        {STATUS_CONFIG[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredProdutos.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  Nenhum produto encontrado com os critérios de busca.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProdutos.map((produto) => {
                    const StatusIcon = STATUS_CONFIG[produto.status]?.icon
                    const isBelowMinimum = produto.disponivel < produto.nivel_minimo;
                    const cardStyle = isBelowMinimum
                      ? 'bg-red-50 border-red-200'
                      : 'border';

                    return (
                      <div key={produto.id} className={`p-3 sm:p-4 rounded-lg hover:shadow-md transition-shadow ${cardStyle}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 sm:gap-4 flex-1">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-base sm:text-lg">{produto.descricao}</div>
                              <div className="text-xs sm:text-sm text-gray-500">Código: {produto.codigo}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600 sm:grid-cols-4 sm:gap-6 sm:text-right">
                            <div>
                              <div className="font-medium">Disponível</div>
                              <div className="text-gray-900 font-bold text-sm sm:text-base">{produto.disponivel}</div>
                            </div>
                            <div>
                              <div className="font-medium">A Caminho</div>
                              <div className="text-gray-900 font-bold text-sm sm:text-base">{produto.a_caminho}</div>
                            </div>
                            <div>
                              <div className="font-medium">Total</div>
                              <div className="text-gray-900 font-bold text-sm sm:text-base">{produto.estoque_total}</div>
                            </div>
                            <div>
                              <div className="font-medium">Mínimo</div>
                              <div className="text-gray-900 font-bold text-sm sm:text-base">{produto.nivel_minimo}</div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-center sm:text-left pt-2 sm:pt-0">
                            <Badge className={`justify-center font-medium ${STATUS_CONFIG[produto.status]?.color}`}>
                              {StatusIcon && <StatusIcon className={`h-4 w-4 mr-1 ${STATUS_CONFIG[produto.status]?.iconColor}`} />}
                              {STATUS_CONFIG[produto.status]?.label}
                            </Badge>
                          </div>
                          <div className="flex-shrink-0 flex justify-end pt-2 sm:pt-0">
                            <Dialog onOpenChange={(open) => !open && handleCloseDialog()}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="ml-auto" onClick={() => handleOpenDialog(produto)}>
                                  <Settings className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Configurar</span>
                                </Button>
                              </DialogTrigger>
                             {produtoEditando && produtoEditando.id === produto.id && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Configurar Nível Mínimo</DialogTitle>
                                  <DialogDescription>
                                    Ajuste o nível mínimo de estoque para o produto <strong>{produtoEditando.descricao}</strong>.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="nivel-minimo">Nível Mínimo</Label>
                                    <Input
                                      id="nivel-minimo"
                                      type="number"
                                      value={novoNivelMinimo}
                                      onChange={(e) => setNovoNivelMinimo(e.target.value)}
                                      placeholder="Digite o nível mínimo"
                                    />
                                    {dialogError && <p className="text-red-500 text-sm mt-2">{dialogError}</p>}
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={handleCloseDialog}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={atualizarNivelMinimo}>
                                    Salvar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                              )}
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
