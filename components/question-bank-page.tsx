"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, BookOpen, RefreshCw } from 'lucide-react'
import { getRandomQuestions, type QuestionFilters, getQuestionsTotalCount, generateMiniSimulation } from '@/app/actions/questions'
import { recordQuestionAnswer } from '@/app/actions/question-answers'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { subjectsData } from '@/lib/subjects-data'
import { addQuestionComment, getQuestionComments, updateQuestionComment, deleteQuestionComment, type QuestionComment } from '@/app/actions/question-comments'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Question {
id: string
discipline: string
subject: string
question_text: string
options: string[]
correct_option_index: number
}

export function QuestionBankPage() {
const { toast } = useToast()
const [questions, setQuestions] = useState<Question[]>([])
const [loading, setLoading] = useState(true)
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
const [selectedOption, setSelectedOption] = useState<number | null>(null)
const [showAnswer, setShowAnswer] = useState(false)
const [selectedDisciplineId, setSelectedDisciplineId] = useState('all-disciplines')
const [selectedSubjectName, setSelectedSubjectName] = useState('all-subjects')
const [answeredFilter, setAnsweredFilter] = useState<'all' | 'answered' | 'unanswered'>('all')
const [correctnessFilter, setCorrectnessFilter] = useState<'all' | 'correct' | 'incorrect'>('all')
const [recordingAnswer, setRecordingAnswer] = useState(false)
const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
const [commentText, setCommentText] = useState('')
const [loadingComments, setLoadingComments] = useState(false)
const [comments, setComments] = useState<QuestionComment[]>([])
const [totalCount, setTotalCount] = useState<number>(0)
const [simConfig, setSimConfig] = useState<{ [subject: string]: number }>({})
const [generatingSim, setGeneratingSim] = useState(false)
const [isSimOpen, setIsSimOpen] = useState(false)

const fetchQuestions = async () => {
  setLoading(true)
  setSelectedOption(null)
  setShowAnswer(false)
  setQuestionStartTime(Date.now())
  try {
    const disciplineFilter = selectedDisciplineId === 'all-disciplines' ? undefined : subjectsData.find(s => s.id === selectedDisciplineId)?.name;
    const subjectFilter = selectedSubjectName === 'all-subjects' ? undefined : selectedSubjectName;

    const fetchedQuestions = await getRandomQuestions(10, {
      discipline: disciplineFilter,
      subject: subjectFilter,
      answeredFilter,
      correctnessFilter,
    } as QuestionFilters);
    setQuestions(fetchedQuestions.map(q => ({
      ...q,
      id: q.id || `temp-${Date.now()}-${Math.random()}`
    })))
    setCurrentQuestionIndex(0)
    // carregar comentários da primeira questão (se houver)
    if (fetchedQuestions.length > 0) {
      await loadComments(fetchedQuestions[0].id)
    } else {
      setComments([])
    }
    if (fetchedQuestions.length === 0) {
      toast({
        title: "Nenhuma questão encontrada",
        description: "Tente ajustar os filtros ou adicione mais questões.",
        variant: "default",
      })
    }
    const count = await getQuestionsTotalCount({ discipline: disciplineFilter, subject: subjectFilter })
    setTotalCount(count)
  } catch (error: any) {
    toast({
      title: "Erro ao carregar questões",
      description: error.message,
      variant: "destructive",
    })
    console.error('Error fetching questions:', error)
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  fetchQuestions()
}, [selectedDisciplineId, selectedSubjectName, answeredFilter, correctnessFilter])

const currentQuestion = questions[currentQuestionIndex]

const handleOptionSelect = (index: number) => {
  if (!showAnswer) {
    setSelectedOption(index)
  }
}

const handleShowAnswer = async () => {
  if (selectedOption === null) return

  setRecordingAnswer(true)
  try {
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000)
    
    // Registrar a resposta
    const result = await recordQuestionAnswer(
      currentQuestion.id,
      currentQuestion.discipline,
      currentQuestion.subject,
      selectedOption,
      currentQuestion.correct_option_index,
      timeTaken
    )

    if (result.success) {
      toast({
        title: result.message,
        description: `Tempo: ${timeTaken}s`,
        variant: selectedOption === currentQuestion.correct_option_index ? "default" : "destructive",
      })
    } else {
      toast({
        title: "Erro ao registrar resposta",
        description: result.message,
        variant: "destructive",
      })
    }
  } catch (error: any) {
    console.error('Error recording answer:', error)
    toast({
      title: "Erro ao registrar resposta",
      description: error.message,
      variant: "destructive",
    })
  } finally {
    setRecordingAnswer(false)
    setShowAnswer(true)
  }
}

const handleNextQuestion = () => {
  if (currentQuestionIndex < questions.length - 1) {
    setCurrentQuestionIndex(prev => prev + 1)
    setSelectedOption(null)
    setShowAnswer(false)
    setQuestionStartTime(Date.now())
    const nextId = questions[currentQuestionIndex + 1]?.id
    if (nextId) {
      loadComments(nextId)
    } else {
      setComments([])
    }
  } else {
    toast({
      title: "Fim das questões!",
      description: "Você revisou todas as questões disponíveis com os filtros atuais. Recarregue para novas questões.",
      variant: "default",
    })
  }
}

async function loadComments(questionId: string) {
  try {
    setLoadingComments(true)
    const res = await getQuestionComments(questionId)
    if (res.success) setComments(res.comments)
  } finally {
    setLoadingComments(false)
  }
}

async function handleAddComment() {
  if (!currentQuestion) return
  const res = await addQuestionComment(currentQuestion.id, commentText)
  if (res.success) {
    setCommentText('')
    await loadComments(currentQuestion.id)
    toast({ title: 'Comentário adicionado', variant: 'default' })
  } else {
    toast({ title: 'Erro ao comentar', description: res.message, variant: 'destructive' })
  }
}

const handleDisciplineChange = (id: string) => {
  setSelectedDisciplineId(id)
  setSelectedSubjectName('all-subjects')
}

const handleSubjectChange = (name: string) => {
  setSelectedSubjectName(name)
}

const selectedDisciplineData = subjectsData.find(s => s.id === selectedDisciplineId)

if (loading) {
  return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <span className="ml-2 text-gray-600">Carregando questões...</span>
    </div>
  )
}

return (
  <div className="max-w-4xl mx-auto space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="bg-orange-600 p-2 rounded-lg">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          Banco de Questões
        </CardTitle>
        <CardDescription>
          Pratique questões de diversas disciplinas e assuntos. Suas respostas serão registradas para acompanhar seu progresso.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-3 mb-3">
          <div className="md:w-56">
            <Select value={selectedDisciplineId} onValueChange={handleDisciplineChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por Disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-disciplines">Todas as Disciplinas</SelectItem>
                {subjectsData.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:w-56">
            <Select value={selectedSubjectName} onValueChange={handleSubjectChange} disabled={!selectedDisciplineData || selectedDisciplineId === 'all-disciplines'}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por Assunto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-subjects">Todos os Assuntos</SelectItem>
                {selectedDisciplineData?.topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.name}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:w-56">
            <Select value={answeredFilter} onValueChange={(v) => setAnsweredFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Respondidas?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas (feitas e não feitas)</SelectItem>
                <SelectItem value="answered">Apenas já feitas</SelectItem>
                <SelectItem value="unanswered">Apenas não feitas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:w-56">
            <Select value={correctnessFilter} onValueChange={(v) => setCorrectnessFilter(v as any)} disabled={answeredFilter === 'unanswered'}>
              <SelectTrigger>
                <SelectValue placeholder="Acertos/Erros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos (certas e erradas)</SelectItem>
                <SelectItem value="correct">Apenas acertadas</SelectItem>
                <SelectItem value="incorrect">Apenas erradas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:flex-1" />

          <div className="flex gap-2">
            <Button onClick={fetchQuestions} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Recarregar
            </Button>
            <Button onClick={() => setIsSimOpen(true)}>
              Mini Simulado
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-600 mb-6">Total de questões disponíveis: {totalCount}</div>

        {questions.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Nenhuma questão encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="min-h-[250px]">
              <CardHeader>
                <CardDescription>
                  Questão {currentQuestionIndex + 1} de {questions.length} (no filtro)
                </CardDescription>
                <CardTitle className="text-xl font-bold">
                  {currentQuestion.question_text}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={`w-full justify-start text-left py-3 h-auto whitespace-normal ${
                      selectedOption === index ? 'border-blue-500 bg-blue-50' : ''
                    } ${
                      showAnswer && index === currentQuestion.correct_option_index
                        ? 'border-green-500 bg-green-50 font-semibold'
                        : showAnswer && selectedOption === index && selectedOption !== currentQuestion.correct_option_index
                        ? 'border-red-500 bg-red-50 font-semibold'
                        : ''
                    }`}
                    onClick={() => handleOptionSelect(index)}
                    disabled={showAnswer}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              {!showAnswer ? (
                <Button 
                  onClick={handleShowAnswer} 
                  disabled={selectedOption === null || recordingAnswer}
                  className="flex items-center gap-2"
                >
                  {recordingAnswer ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Ver Resposta'
                  )}
                </Button>
              ) : (
                <Button onClick={handleNextQuestion}>
                  Próxima Questão
                </Button>
              )}
            </div>

            {/* Comentários da Questão */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comentários</CardTitle>
                <CardDescription>Compartilhe observações ou mnemônicos sobre esta questão.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Escreva um comentário..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleAddComment} disabled={!commentText.trim()}>
                      Enviar Comentário
                    </Button>
                  </div>

                  <div className="mt-4">
                    <ScrollArea className="h-48">
                      <div className="space-y-3 pr-2">
                        {loadingComments ? (
                          <div className="text-sm text-gray-500">Carregando comentários...</div>
                        ) : comments.length === 0 ? (
                          <div className="text-sm text-gray-500">Sem comentários ainda.</div>
                        ) : (
                          comments.map((c) => (
                            <CommentItem
                              key={c.id}
                              comment={c}
                              onUpdated={async () => loadComments(currentQuestion!.id)}
                              onDeleted={async () => loadComments(currentQuestion!.id)}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Modal Mini Simulado */}
        <Dialog open={isSimOpen} onOpenChange={setIsSimOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Gerar Mini Simulado</DialogTitle>
              <DialogDescription>Defina quantas questões por assunto você deseja.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {(selectedDisciplineId === 'all-disciplines' ? subjectsData : subjectsData.filter(s => s.id === selectedDisciplineId)).map(d => (
                <div key={d.id} className="border rounded-md p-3">
                  <div className="font-medium mb-2">{d.name}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {d.topics.map(t => (
                      <div key={t.id} className="flex items-center justify-between gap-2">
                        <div className="text-sm text-gray-800">{t.name}</div>
                        <Input
                          type="number"
                          min={0}
                          className="w-24"
                          value={simConfig[t.name] || ''}
                          onChange={(e) => {
                            const v = e.target.value
                            setSimConfig(prev => ({ ...prev, [t.name]: v === '' ? 0 : Math.max(0, parseInt(v) || 0) }))
                          }}
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSimOpen(false)}>Cancelar</Button>
              <Button
                onClick={async () => {
                  try {
                    setGeneratingSim(true)
                    const disciplineFilter = selectedDisciplineId === 'all-disciplines' ? undefined : subjectsData.find(s => s.id === selectedDisciplineId)?.name
                    const reqs = Object.entries(simConfig)
                      .filter(([_, count]) => (count as number) > 0)
                      .map(([subject, count]) => ({ discipline: disciplineFilter, subject, count: Number(count) }))
                    const sim = await generateMiniSimulation(reqs as any)
                    if (!sim || sim.length === 0) {
                      toast({ title: 'Nenhuma questão encontrada', description: 'Ajuste as quantidades/assuntos e tente novamente.' })
                      return
                    }
                    setQuestions(sim as any)
                    setCurrentQuestionIndex(0)
                    setSelectedOption(null)
                    setShowAnswer(false)
                    setQuestionStartTime(Date.now())
                    setIsSimOpen(false)
                    toast({ title: 'Mini simulado gerado', description: `${sim.length} questões selecionadas.` })
                  } finally {
                    setGeneratingSim(false)
                  }
                }}
                disabled={generatingSim}
              >
                {generatingSim ? 'Gerando...' : 'Gerar Mini Simulado'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  </div>
)
}

function CommentItem({ comment, onUpdated, onDeleted }: { comment: QuestionComment; onUpdated: () => Promise<void>; onDeleted: () => Promise<void> }) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(comment.comment)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await updateQuestionComment(comment.id, text)
    setSaving(false)
    if (res.success) {
      setIsEditing(false)
      toast({ title: 'Comentário atualizado' })
      await onUpdated()
    } else {
      toast({ title: 'Erro ao atualizar', description: res.message, variant: 'destructive' })
    }
  }

  async function handleDelete() {
    if (!confirm('Excluir este comentário?')) return
    setDeleting(true)
    const res = await deleteQuestionComment(comment.id)
    setDeleting(false)
    if (res.success) {
      toast({ title: 'Comentário excluído' })
      await onDeleted()
    } else {
      toast({ title: 'Erro ao excluir', description: res.message, variant: 'destructive' })
    }
  }

  return (
    <div className="border rounded-md p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-gray-500">
          {comment.user_name ? `${comment.user_name} • ` : ''}
          {new Date(comment.created_at).toLocaleString('pt-BR')}
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>Editar</Button>
              <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting}>Excluir</Button>
            </>
          ) : (
            <>
              <Button size="sm" onClick={handleSave} disabled={saving}>Salvar</Button>
              <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setText(comment.comment) }}>Cancelar</Button>
            </>
          )}
        </div>
      </div>
      {isEditing ? (
        <Textarea value={text} onChange={(e) => setText(e.target.value)} />
      ) : (
        <div className="text-sm text-gray-800 whitespace-pre-wrap">{comment.comment}</div>
      )}
    </div>
  )
}
