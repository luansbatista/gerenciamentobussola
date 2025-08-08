"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  BookOpen,
  Calendar,
  File,
  Eye
} from 'lucide-react'
import { getDisciplinePdfs, getAvailableDisciplines, type DisciplinePdf } from '@/app/actions/pdfs'
import { subjectsData } from '@/lib/subjects-data'
import { useToast } from '@/hooks/use-toast'

export function PdfsPage() {
  const { toast } = useToast()
  const [pdfs, setPdfs] = useState<DisciplinePdf[]>([])
  const [filteredPdfs, setFilteredPdfs] = useState<DisciplinePdf[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDiscipline, setSelectedDiscipline] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [availableDisciplines, setAvailableDisciplines] = useState<string[]>([])

  useEffect(() => {
    fetchAvailableDisciplines()
  }, [])

  useEffect(() => {
    if (selectedDiscipline) {
      fetchPdfs()
    } else {
      setPdfs([])
      setFilteredPdfs([])
    }
  }, [selectedDiscipline])

  const fetchPdfs = async () => {
    if (!selectedDiscipline) {
      setPdfs([])
      setFilteredPdfs([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const data = await getDisciplinePdfs(selectedDiscipline)
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

  const fetchAvailableDisciplines = async () => {
    try {
      const disciplines = await getAvailableDisciplines()
      setAvailableDisciplines(disciplines)
    } catch (error) {
      console.error('Erro ao buscar disciplinas:', error)
      // Fallback para disciplinas do subjectsData
      const fallbackDisciplines = subjectsData.map(subject => subject.name)
      setAvailableDisciplines(fallbackDisciplines)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = [...pdfs]

    if (searchTerm) {
      filtered = filtered.filter(pdf => 
        pdf.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pdf.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pdf.discipline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pdf.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPdfs(filtered)
  }, [pdfs, searchTerm])

  const handleDownload = (pdf: DisciplinePdf) => {
    try {
      const link = document.createElement('a')
      link.href = pdf.file_url
      link.download = pdf.file_name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download iniciado",
        description: `Baixando ${pdf.title}`,
      })
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o arquivo",
        variant: "destructive"
      })
    }
  }

  const handleView = (pdf: DisciplinePdf) => {
    try {
      window.open(pdf.file_url, '_blank')
      
      toast({
        title: "Visualizando PDF",
        description: `Abrindo ${pdf.title}`,
      })
    } catch (error) {
      toast({
        title: "Erro ao visualizar",
        description: "Não foi possível abrir o PDF",
        variant: "destructive"
      })
    }
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
          <h1 className="text-2xl font-bold text-gray-900">PDFs das Disciplinas</h1>
          <p className="text-gray-600">Acesse materiais de estudo organizados por disciplina</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={fetchPdfs} variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

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
              <label className="text-sm font-medium">Disciplina *</label>
              <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma disciplina para ver os PDFs" />
                </SelectTrigger>
                <SelectContent>
                  {availableDisciplines.map(discipline => (
                    <SelectItem key={discipline} value={discipline}>
                      {discipline}
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

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de PDFs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPdfs.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedDiscipline || 'Selecione uma disciplina'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableDisciplines.length}</div>
            <p className="text-xs text-muted-foreground">
              com materiais disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamanho Total</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(filteredPdfs.reduce((sum, pdf) => sum + (pdf.file_size || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              de materiais para download
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de PDFs */}
      {!selectedDiscipline ? (
        <Card>
          <CardHeader>
            <CardTitle>Selecione uma Disciplina</CardTitle>
            <CardDescription>
              Escolha uma disciplina para ver os PDFs disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma disciplina selecionada</h3>
              <p className="text-gray-600 mb-4">
                Selecione uma disciplina no filtro acima para ver os PDFs disponíveis
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {availableDisciplines.slice(0, 6).map(discipline => (
                  <button
                    key={discipline}
                    onClick={() => setSelectedDiscipline(discipline)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                  >
                    <h4 className="font-medium text-gray-900">{discipline}</h4>
                    <p className="text-sm text-gray-600">Clique para ver PDFs</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Materiais Disponíveis</CardTitle>
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
                  {searchTerm 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Ainda não há materiais disponíveis para esta disciplina'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPdfs.map((pdf) => (
                  <Card key={pdf.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base line-clamp-2">{pdf.title}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-1">
                            {pdf.description || 'Sem descrição'}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="ml-2 flex-shrink-0">
                          {pdf.discipline}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Informações do arquivo */}
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <File className="h-3 w-3" />
                            <span>{formatFileSize(pdf.file_size)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(pdf.created_at)}</span>
                          </div>
                        </div>

                        {/* Assunto */}
                        {pdf.subject && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Assunto:</span> {pdf.subject}
                          </div>
                        )}

                        {/* Botões de ação */}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            onClick={() => handleView(pdf)} 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                          <Button 
                            onClick={() => handleDownload(pdf)} 
                            size="sm"
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Baixar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
