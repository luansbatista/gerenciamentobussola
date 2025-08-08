"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Calendar,
  File,
  Users,
  Activity,
  Shield,
  Clock,
  Target
} from 'lucide-react'
import { subjectsData } from '@/lib/subjects-data'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/cliente'

// Tipos para simulados
interface Simulation {
  id: string
  title: string
  description: string | null
  discipline: string
  subject: string | null
  file_name: string
  file_url: string
  file_size: number | null
  created_at: string
  updated_at: string
  created_by: string | null
  is_active: boolean
  duration_minutes?: number
  total_questions?: number
}

interface CreateSimulationData {
  title: string
  description?: string
  discipline: string
  subject?: string
  file_name: string
  file_url: string
  file_size?: number
  duration_minutes?: number
  total_questions?: number
}

export function AdminSimulationsPage() {
  const { toast } = useToast()
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [filteredSimulations, setFilteredSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDiscipline, setSelectedDiscipline] = useState('all')
  const [stats, setStats] = useState<any>(null)
  
  // Estados para modais
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSimulation, setEditingSimulation] = useState<Simulation | null>(null)
  const [deletingSimulation, setDeletingSimulation] = useState<Simulation | null>(null)
  
  // Estados para formulários
  const [formData, setFormData] = useState<CreateSimulationData>({
    title: '',
    description: '',
    discipline: '',
    subject: '',
    file_name: '',
    file_url: '',
    file_size: 0,
    duration_minutes: 0,
    total_questions: 0
  })

  useEffect(() => {
    fetchSimulations()
    fetchStats()
  }, [])

  const fetchSimulations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Buscar simulados do banco de dados
      const { data: simulations, error } = await createClient()
        .from('simulations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      setSimulations(simulations || [])
      setFilteredSimulations(simulations || [])
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os simulados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data: simulations, error } = await createClient()
        .from('simulations')
        .select('*')

      if (error) {
        console.error('Erro ao buscar estatísticas:', error)
        return
      }

      const total = simulations?.length || 0
      const active = simulations?.filter(s => s.is_active).length || 0
      const inactive = total - active

      // Agrupar por disciplina
      const byDiscipline = simulations?.reduce((acc, sim) => {
        acc[sim.discipline] = (acc[sim.discipline] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      setStats({
        total,
        active,
        inactive,
        byDiscipline
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
  }

  useEffect(() => {
    let filtered = [...simulations]

    if (searchTerm) {
      filtered = filtered.filter(simulation => 
        simulation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        simulation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        simulation.discipline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        simulation.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedDiscipline && selectedDiscipline !== 'all') {
      filtered = filtered.filter(simulation => simulation.discipline === selectedDiscipline)
    }

    setFilteredSimulations(filtered)
  }, [simulations, searchTerm, selectedDiscipline])

  const handleCreateSimulation = async () => {
    try {
      if (!formData.title || !formData.discipline || !formData.file_name || !formData.file_url) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        })
        return
      }

      const { data, error } = await createClient()
        .from('simulations')
        .insert([{
          title: formData.title,
          description: formData.description || '',
          discipline: formData.discipline,
          subject: formData.subject || '',
          file_name: formData.file_name,
          file_url: formData.file_url,
          file_size: formData.file_size || 0,
          duration_minutes: formData.duration_minutes || 0,
          total_questions: formData.total_questions || 0,
          is_active: true
        }])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }
      
      toast({
        title: "Sucesso",
        description: "Simulado criado com sucesso!",
      })
      
      setShowCreateModal(false)
      resetForm()
      fetchSimulations()
      fetchStats()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar simulado",
        variant: "destructive"
      })
    }
  }

  const handleUpdateSimulation = async () => {
    try {
      if (!editingSimulation) return

      if (!formData.title || !formData.discipline || !formData.file_name || !formData.file_url) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        })
        return
      }

      const { error } = await createClient()
        .from('simulations')
        .update({
          title: formData.title,
          description: formData.description || '',
          discipline: formData.discipline,
          subject: formData.subject || '',
          file_name: formData.file_name,
          file_url: formData.file_url,
          file_size: formData.file_size || 0,
          duration_minutes: formData.duration_minutes || 0,
          total_questions: formData.total_questions || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSimulation.id)

      if (error) {
        throw new Error(error.message)
      }
      
      toast({
        title: "Sucesso",
        description: "Simulado atualizado com sucesso!",
      })
      
      setShowEditModal(false)
      setEditingSimulation(null)
      resetForm()
      fetchSimulations()
      fetchStats()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar simulado",
        variant: "destructive"
      })
    }
  }

  const handleDeleteSimulation = async (simulation: Simulation, permanent = false) => {
    try {
      const { error } = await createClient()
        .from('simulations')
        .delete()
        .eq('id', simulation.id)

      if (error) {
        throw new Error(error.message)
      }
      
      toast({
        title: "Sucesso",
        description: "Simulado excluído com sucesso!",
      })
      
      setDeletingSimulation(null)
      fetchSimulations()
      fetchStats()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir simulado",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (simulation: Simulation) => {
    setEditingSimulation(simulation)
    setFormData({
      title: simulation.title,
      description: simulation.description || '',
      discipline: simulation.discipline,
      subject: simulation.subject || '',
      file_name: simulation.file_name,
      file_url: simulation.file_url,
      file_size: simulation.file_size || 0,
      duration_minutes: simulation.duration_minutes || 0,
      total_questions: simulation.total_questions || 0
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discipline: '',
      subject: '',
      file_name: '',
      file_url: '',
      file_size: 0,
      duration_minutes: 0,
      total_questions: 0
    })
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}min`
    }
    return `${mins}min`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchSimulations} variant="outline">
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Simulados</h1>
          <p className="text-gray-600">Adicione, edite e gerencie simulados do sistema</p>
        </div>
        
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Simulado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Simulado</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo simulado
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Título do simulado"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Disciplina *</label>
                <Select value={formData.discipline} onValueChange={(value) => setFormData({...formData, discipline: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectsData.map(subject => (
                      <SelectItem key={subject.name} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assunto</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="Assunto específico"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Duração (minutos)</label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 0})}
                  placeholder="60"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Número de Questões</label>
                <Input
                  type="number"
                  value={formData.total_questions}
                  onChange={(e) => setFormData({...formData, total_questions: parseInt(e.target.value) || 0})}
                  placeholder="20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tamanho do Arquivo (bytes)</label>
                <Input
                  type="number"
                  value={formData.file_size}
                  onChange={(e) => setFormData({...formData, file_size: parseInt(e.target.value) || 0})}
                  placeholder="1024000"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Nome do Arquivo *</label>
                <Input
                  value={formData.file_name}
                  onChange={(e) => setFormData({...formData, file_name: e.target.value})}
                  placeholder="simulado-portugues.pdf"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">URL do Arquivo *</label>
                <Input
                  value={formData.file_url}
                  onChange={(e) => setFormData({...formData, file_url: e.target.value})}
                  placeholder="https://example.com/simulado.pdf"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrição detalhada do simulado"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateSimulation}>
                Criar Simulado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Simulados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                simulados no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Simulados Ativos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                disponíveis para download
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Simulados Inativos</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">
                arquivados temporariamente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byDiscipline || {}).length}</div>
              <p className="text-xs text-muted-foreground">
                com simulados disponíveis
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Disciplina</label>
              <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as disciplinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as disciplinas</SelectItem>
                  {subjectsData.map(subject => (
                    <SelectItem key={subject.name} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título, descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Simulados */}
      <Card>
        <CardHeader>
          <CardTitle>Simulados ({filteredSimulations.length})</CardTitle>
          <CardDescription>
            Gerencie todos os simulados do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSimulations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum simulado encontrado</h3>
              <p className="text-gray-600">
                {searchTerm || selectedDiscipline !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Ainda não há simulados no sistema'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSimulations.map((simulation) => (
                <Card key={simulation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-base">{simulation.title}</CardTitle>
                          <Badge variant={simulation.is_active ? "default" : "secondary"}>
                            {simulation.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {simulation.description || 'Sem descrição'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleEdit(simulation)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingSimulation(simulation)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o simulado "{simulation.title}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSimulation(simulation, true)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir Permanentemente
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Arquivo:</span>
                        <span>{simulation.file_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Criado:</span>
                        <span>{formatDate(simulation.created_at)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Duração:</span>
                        <span>{formatDuration(simulation.duration_minutes)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Questões:</span>
                        <span>{simulation.total_questions || 0}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Disciplina:</span>
                        <span>{simulation.discipline}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Tamanho:</span>
                        <span>{formatFileSize(simulation.file_size)}</span>
                      </div>
                      
                      {simulation.subject && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Assunto:</span>
                          <span>{simulation.subject}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">URL:</span>
                        <a 
                          href={simulation.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          Ver arquivo
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Simulado</DialogTitle>
            <DialogDescription>
              Atualize os dados do simulado
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Título do simulado"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Disciplina *</label>
              <Select value={formData.discipline} onValueChange={(value) => setFormData({...formData, discipline: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {subjectsData.map(subject => (
                    <SelectItem key={subject.name} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assunto</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="Assunto específico"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duração (minutos)</label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 0})}
                placeholder="60"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Número de Questões</label>
              <Input
                type="number"
                value={formData.total_questions}
                onChange={(e) => setFormData({...formData, total_questions: parseInt(e.target.value) || 0})}
                placeholder="20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tamanho do Arquivo (bytes)</label>
              <Input
                type="number"
                value={formData.file_size}
                onChange={(e) => setFormData({...formData, file_size: parseInt(e.target.value) || 0})}
                placeholder="1024000"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Nome do Arquivo *</label>
              <Input
                value={formData.file_name}
                onChange={(e) => setFormData({...formData, file_name: e.target.value})}
                placeholder="simulado-portugues.pdf"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">URL do Arquivo *</label>
              <Input
                value={formData.file_url}
                onChange={(e) => setFormData({...formData, file_url: e.target.value})}
                placeholder="https://example.com/simulado.pdf"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrição detalhada do simulado"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateSimulation}>
              Atualizar Simulado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
