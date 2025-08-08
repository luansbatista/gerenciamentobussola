"use client"

import { useState } from 'react'
import { useAuth } from './auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/cliente'
import { subjectsData } from '@/lib/subjects-data'
import { CalendarIcon, Clock, BookOpen, BarChart3, Upload, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { importStudySessions } from '@/app/actions/import'
import { updateSubjectProgress } from '@/app/actions/review' // Importa o novo action
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'

export function StudyFormEnhanced() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loadingForm, setLoadingForm] = useState(false)
  const [loadingImport, setLoadingImport] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    discipline: '',
    subject: '',
    questions_total: '',
    correct_answers: '',
    study_time: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingForm(true)

    try {
      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }
      if (!selectedSubjectId) {
        throw new Error('Selecione uma disciplina')
      }
      if (selectedTopics.length === 0) {
        throw new Error('Selecione ao menos um assunto')
      }
      
      const supabase = createClient()
      
      const questionsTotal = parseInt(formData.questions_total)
      const correctAnswers = parseInt(formData.correct_answers)
      const studyTimeMinutes = parseInt(formData.study_time)
      
      const wrongAnswers = questionsTotal - correctAnswers
      const accuracy = questionsTotal > 0 ? (correctAnswers / questionsTotal) * 100 : 0
      const avgTimePerQuestion = questionsTotal > 0 ? studyTimeMinutes / questionsTotal : 0

      const subjectCombined = selectedTopics.join(', ')

      const sessionData = {
        user_id: user.id,
        date: formData.date,
        discipline: formData.discipline,
        subject: subjectCombined,
        questions_total: questionsTotal,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        accuracy_percentage: accuracy,
        study_time_minutes: studyTimeMinutes,
        avg_time_per_question: avgTimePerQuestion,
      }

      const { error } = await supabase
        .from('study_sessions')
        .insert(sessionData)

      if (error) {
        throw error
      }

      // --- TEMPORARIAMENTE DESABILITADO: Atualizar o progresso de revisão ---
      // if (user?.id) {
      //   console.log('🔄 Atualizando progresso de revisão...')
      //   const progressUpdateResult = await updateSubjectProgress(
      //     user.id,
      //     formData.discipline,
      //     formData.subject,
      //     formData.date // Usar a data da sessão para o last_study_date
      //   )
      //   if (!progressUpdateResult.success) {
      //     console.warn('⚠️ Falha ao atualizar progresso de revisão:', progressUpdateResult.message)
      //     // Não impede o registro da sessão, mas loga o aviso
      //   } else {
      //     console.log('✅ Progresso de revisão atualizado!')
      //   }
      // }
      // --- FIM TEMPORARIAMENTE DESABILITADO ---

      toast({
        title: "Sessão de estudo registrada!",
        description: `${formData.discipline} - ${subjectCombined} foi registrado com sucesso.`,
      })

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        discipline: '',
        subject: '',
        questions_total: '',
        correct_answers: '',
        study_time: '',
      })
      setSelectedSubjectId('')
      setSelectedTopics([])
    } catch (error: any) {
      toast({
        title: "Erro ao registrar sessão",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingForm(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDisciplineChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId)
    setSelectedTopics([])
    const subject = subjectsData.find(s => s.id === subjectId)
    if (subject) {
      handleInputChange('discipline', subject.name)
      handleInputChange('subject', '')
    }
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoadingImport(true)
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)

        const result = await importStudySessions(json)

        if (result.success) {
          toast({
            title: "Importação concluída!",
            description: result.message,
            action: <Upload className="text-green-500" />,
          })
          if (result.errorDetails && result.errorDetails.length > 0) {
            toast({
              title: "Avisos na importação",
              description: `Algumas linhas tiveram erros: ${result.errorDetails.map(e => `Linha ${e.row}: ${e.error}`).join('; ')}`,
              variant: "destructive",
              duration: 9000,
            })
          }
        } else {
          toast({
            title: "Erro na importação",
            description: result.message,
            variant: "destructive",
            duration: 9000,
          })
          if (result.errorDetails && result.errorDetails.length > 0) {
            toast({
              title: "Detalhes do Erro",
              description: result.errorDetails.map(e => `Linha ${e.row}: ${e.error}`).join('; '),
              variant: "destructive",
              duration: 9000,
            })
          }
        }
      } catch (error: any) {
        toast({
          title: "Erro ao processar arquivo",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoadingImport(false)
        event.target.value = ''
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const selectedDisciplineData = subjectsData.find(s => s.id === selectedSubjectId)
  const questionsTotal = parseInt(formData.questions_total) || 0
  const correctAnswers = parseInt(formData.correct_answers) || 0
  const wrongAnswers = Math.max(0, questionsTotal - correctAnswers)
  const accuracy = questionsTotal > 0 ? ((correctAnswers / questionsTotal) * 100).toFixed(1) : '0'

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            Lançamento de Informações - PMBA
          </CardTitle>
          <div className="relative">
            <Input
              id="import-excel"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileImport}
              className="hidden"
              disabled={loadingImport}
            />
            <Label htmlFor="import-excel" className="cursor-pointer">
              <Button
                asChild
                variant="outline"
                className="flex items-center gap-2"
                disabled={loadingImport}
              >
                <span>
                  {loadingImport ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Importar Excel
                    </>
                  )}
                </span>
              </Button>
            </Label>
          </div>
        </div>
        <CardDescription>
          Registre seus estudos para o concurso de Soldado da Polícia Militar da Bahia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discipline">Disciplina</Label>
              <Select value={selectedSubjectId} onValueChange={handleDisciplineChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {subjectsData.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        {subject.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedDisciplineData && (
            <div className="space-y-2">
              <Label>Assuntos (selecione múltiplos)</Label>
              <div className="rounded-lg border p-3">
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-2">
                    {selectedDisciplineData.topics.map((topic) => {
                      const checked = selectedTopics.includes(topic.name)
                      return (
                        <label key={topic.id} className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(val) => {
                              const isChecked = Boolean(val)
                              setSelectedTopics((prev) =>
                                isChecked
                                  ? Array.from(new Set([...prev, topic.name]))
                                  : prev.filter((t) => t !== topic.name)
                              )
                            }}
                          />
                          <span className="text-sm text-gray-800">{topic.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </ScrollArea>
                <div className="text-xs text-gray-500 mt-2">{selectedTopics.length} assunto(s) selecionado(s)</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="questions_total">Qtd de Questões</Label>
              <Input
                id="questions_total"
                type="number"
                min="0"
                value={formData.questions_total}
                onChange={(e) => handleInputChange('questions_total', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correct_answers">Acertos</Label>
              <Input
                id="correct_answers"
                type="number"
                min="0"
                max={questionsTotal}
                value={formData.correct_answers}
                onChange={(e) => handleInputChange('correct_answers', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Erros</Label>
              <Input
                type="number"
                value={wrongAnswers}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="study_time">Tempo Estudado (min)</Label>
            <Input
              id="study_time"
              type="number"
              min="1"
              value={formData.study_time}
              onChange={(e) => handleInputChange('study_time', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Cálculos automáticos */}
        {questionsTotal > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Cálculos Automáticos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600 text-sm">% de Assertividade:</span>
                </div>
                <span className="font-bold text-green-600 text-2xl">{accuracy}%</span>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-600 text-sm">Tempo Médio por Questão:</span>
                </div>
                <span className="font-bold text-purple-600 text-2xl">
                  {formData.study_time && questionsTotal > 0 
                    ? (parseInt(formData.study_time) / questionsTotal).toFixed(1) 
                    : '0'} min
                </span>
              </div>
            </div>
          </div>
        )}

          <Button type="submit" className="w-full" disabled={loadingForm}>
            {loadingForm ? "Registrando..." : "Registrar Sessão de Estudo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
