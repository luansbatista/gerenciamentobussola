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
  Download, 
  Eye,
  Search,
  Filter,
  Upload,
  Calendar,
  File,
  Users,
  Activity,
  Shield
} from 'lucide-react'
import { 
  getAllPdfs, 
  getPdfById, 
  createPdf, 
  updatePdf, 
  deletePdf, 
  permanentlyDeletePdf,
  getPdfStats,
  type DisciplinePdf,
  type CreatePdfData,
  type UpdatePdfData
} from '@/app/actions/pdfs'
import { subjectsData } from '@/lib/subjects-data'
import { useToast } from '@/hooks/use-toast'

export function AdminPdfsPage() {
  const { toast } = useToast()
  const [pdfs, setPdfs] = useState<DisciplinePdf[]>([])
  const [filteredPdfs, setFilteredPdfs] = useState<DisciplinePdf[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDiscipline, setSelectedDiscipline] = useState('all')
  const [stats, setStats] = useState<any>(null)
  
  // Estados para modais
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPdf, setEditingPdf] = useState<DisciplinePdf | null>(null)
  const [deletingPdf, setDeletingPdf] = useState<DisciplinePdf | null>(null)
  
  // Estados para formulários
  const [formData, setFormData] = useState<CreatePdfData>({
    title: '',
    description: '',
    discipline: '',
    subject: '',
    file_name: '',
    file_url: '',
    file_size: 0
  })

  useEffect(() => {
    fetchPdfs()
    fetchStats()
  }, [])

  const fetchPdfs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await getAllPdfs()
      setPdfs(data)
      setFilteredPdfs(data)
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os PDFs",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await getPdfStats()
      setStats(data)
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
  }

  useEffect(() => {
    let filtered = [...pdfs]

    if (selectedDiscipline !== 'all') {
      filtered = filtered.filter(pdf => pdf.discipline === selectedDiscipline)
    }

    if (searchTerm) {
      filtered = filtered.filter(pdf => 
        pdf.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pdf.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pdf.discipline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pdf.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPdfs(filtered)
  }, [pdfs, searchTerm, selectedDiscipline])

  const handleCreatePdf = async () => {
    try {
      if (!formData.title || !formData.discipline || !formData.file_name || !formData.file_url) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        })
        return
      }

      await createPdf(formData)
      
      toast({
        title: "PDF criado",
        description: "PDF criado com sucesso",
      })
      
      setShowCreateModal(false)
      resetForm()
      fetchPdfs()
      fetchStats()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleUpdatePdf = async () => {
    try {
      if (!editingPdf) return

      const updateData: UpdatePdfData = {
        id: editingPdf.id,
        title: formData.title || undefined,
        description: formData.description || undefined,
        discipline: formData.discipline || undefined,
        subject: formData.subject || undefined,
        file_name: formData.file_name || undefined,
        file_url: formData.file_url || undefined,
        file_size: formData.file_size || undefined
      }

      await updatePdf(updateData)
      
      toast({
        title: "PDF atualizado",
        description: "PDF atualizado com sucesso",
      })
      
      setShowEditModal(false)
      setEditingPdf(null)
      resetForm()
      fetchPdfs()
      fetchStats()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleDeletePdf = async (pdf: DisciplinePdf, permanent = false) => {
    try {
      if (permanent) {
        await permanentlyDeletePdf(pdf.id)
        toast({
          title: "PDF excluído",
          description: "PDF excluído permanentemente",
        })
      } else {
        await deletePdf(pdf.id)
        toast({
          title: "PDF desativado",
          description: "PDF desativado com sucesso",
        })
      }
      
      setDeletingPdf(null)
      fetchPdfs()
      fetchStats()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleEdit = (pdf: DisciplinePdf) => {
    setEditingPdf(pdf)
    setFormData({
      title: pdf.title,
      description: pdf.description || '',
      discipline: pdf.discipline,
      subject: pdf.subject || '',
      file_name: pdf.file_name,
      file_url: pdf.file_url,
      file_size: pdf.file_size || 0
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
      file_size: 0
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
        <Button onClick={fetchPdfs} variant="outline">
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
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar PDFs</h1>
          <p className="text-gray-600">Gerencie os materiais de estudo das disciplinas</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={fetchPdfs} variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar PDF
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo PDF</DialogTitle>
                <DialogDescription>
                  Preencha as informações do novo material de estudo
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    placeholder="Título do PDF"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
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
                    placeholder="Assunto específico"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome do arquivo *</label>
                  <Input
                    placeholder="nome_do_arquivo.pdf"
                    value={formData.file_name}
                    onChange={(e) => setFormData({...formData, file_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">URL do arquivo *</label>
                  <Input
                    placeholder="https://example.com/arquivo.pdf"
                    value={formData.file_url}
                    onChange={(e) => setFormData({...formData, file_url: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tamanho (bytes)</label>
                  <Input
                    type="number"
                    placeholder="2048576"
                    value={formData.file_size}
                    onChange={(e) => setFormData({...formData, file_size: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    placeholder="Descrição detalhada do material"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePdf}>
                  Criar PDF
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de PDFs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                materiais cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                disponíveis para usuários
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inativos</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.inactive}</div>
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
              <div className="text-2xl font-bold">{Object.keys(stats.byDiscipline).length}</div>
              <p className="text-xs text-muted-foreground">
                com materiais ativos
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

      {/* Lista de PDFs */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar PDFs</CardTitle>
          <CardDescription>
            {filteredPdfs.length} PDF{filteredPdfs.length !== 1 ? 's' : ''} encontrado{filteredPdfs.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPdfs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum PDF encontrado</h3>
              <p className="text-gray-600">
                {searchTerm || selectedDiscipline !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Ainda não há PDFs cadastrados'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPdfs.map((pdf) => (
                <Card key={pdf.id} className={`${!pdf.is_active ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{pdf.title}</h3>
                              {!pdf.is_active && (
                                <Badge variant="secondary">Inativo</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {pdf.description || 'Sem descrição'}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                                <File className="h-3 w-3" />
                <span>{formatFileSize(pdf.file_size)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(pdf.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="outline">{pdf.discipline}</Badge>
                        {pdf.subject && (
                          <Badge variant="secondary">{pdf.subject}</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => window.open(pdf.file_url, '_blank')} 
                          variant="outline" 
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                        <Button 
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = pdf.file_url
                            link.download = pdf.file_name
                            link.click()
                          }} 
                          variant="outline" 
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Baixar
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => handleEdit(pdf)} 
                          variant="outline" 
                          size="sm"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => setDeletingPdf(pdf)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja {pdf.is_active ? 'desativar' : 'excluir permanentemente'} o PDF "{pdf.title}"?
                                {pdf.is_active && ' O PDF ficará inacessível para os usuários.'}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeletePdf(pdf, !pdf.is_active)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {pdf.is_active ? 'Desativar' : 'Excluir Permanentemente'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar PDF</DialogTitle>
            <DialogDescription>
              Atualize as informações do material de estudo
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título *</label>
              <Input
                placeholder="Título do PDF"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
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
                placeholder="Assunto específico"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do arquivo *</label>
              <Input
                placeholder="nome_do_arquivo.pdf"
                value={formData.file_name}
                onChange={(e) => setFormData({...formData, file_name: e.target.value})}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">URL do arquivo *</label>
              <Input
                placeholder="https://example.com/arquivo.pdf"
                value={formData.file_url}
                onChange={(e) => setFormData({...formData, file_url: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tamanho (bytes)</label>
              <Input
                type="number"
                placeholder="2048576"
                value={formData.file_size}
                onChange={(e) => setFormData({...formData, file_size: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Descrição detalhada do material"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePdf}>
              Atualizar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
