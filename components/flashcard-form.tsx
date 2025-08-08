"use client"

import { useState } from 'react'
import { useAuth } from './auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { BookOpen, PlusCircle, Loader2 } from 'lucide-react'
import { subjectsData } from '@/lib/subjects-data'
import { createFlashcard } from '@/app/actions/flashcards'

export function FlashcardForm() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedDisciplineId, setSelectedDisciplineId] = useState('')
  const [formData, setFormData] = useState({
    discipline: '',
    subject: '',
    question: '',
    answer: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDisciplineChange = (subjectId: string) => {
    setSelectedDisciplineId(subjectId)
    const subject = subjectsData.find(s => s.id === subjectId)
    if (subject) {
      handleInputChange('discipline', subject.name)
      handleInputChange('subject', '') // Reset subject when discipline changes
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar flashcards.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const result = await createFlashcard(
        formData.discipline,
        formData.subject,
        formData.question,
        formData.answer
      )

      if (result.success) {
        toast({
          title: "Flashcard criado!",
          description: result.message,
        })
        // Reset form
        setFormData({
          discipline: '',
          subject: '',
          question: '',
          answer: '',
        })
        setSelectedDisciplineId('')
      } else {
        toast({
          title: "Erro ao criar flashcard",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro inesperado",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedDisciplineData = subjectsData.find(s => s.id === selectedDisciplineId)

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="bg-green-600 p-2 rounded-lg">
            <PlusCircle className="h-5 w-5 text-white" />
          </div>
          Criar Novo Flashcard
        </CardTitle>
        <CardDescription>
          Adicione perguntas e respostas para seus estudos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discipline">Disciplina</Label>
              <Select value={selectedDisciplineId} onValueChange={handleDisciplineChange}>
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

            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Select 
                value={formData.subject} 
                onValueChange={(value) => handleInputChange('subject', value)}
                disabled={!selectedDisciplineData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o assunto" />
                </SelectTrigger>
                <SelectContent>
                  {selectedDisciplineData?.topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.name}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Pergunta</Label>
            <Input
              id="question"
              type="text"
              value={formData.question}
              onChange={(e) => handleInputChange('question', e.target.value)}
              placeholder="Ex: Qual o conceito de flagrante delito?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">Resposta</Label>
            <Input
              id="answer"
              type="text"
              value={formData.answer}
              onChange={(e) => handleInputChange('answer', e.target.value)}
              placeholder="Ex: É a situação em que o indivíduo é surpreendido cometendo o crime."
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Criar Flashcard
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
