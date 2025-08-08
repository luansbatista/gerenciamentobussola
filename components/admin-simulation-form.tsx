"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { PlusCircle, Loader2 } from 'lucide-react'
import { createSimulation } from '@/app/actions/simulations'

export function AdminSimulationForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discipline: '',
    file_name: '',
    file_url: '',
    duration_minutes: '',
    total_questions: '',
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createSimulation({
        title: formData.title,
        description: formData.description,
        discipline: formData.discipline || 'Português',
        file_name: formData.file_name || 'simulado.pdf',
        file_url: formData.file_url || 'https://example.com/simulado.pdf',
        duration_minutes: parseInt(formData.duration_minutes),
        total_questions: parseInt(formData.total_questions),
      })

      if (result.success) {
        toast({
          title: "Simulado criado!",
          description: result.message,
        })
        // Reset form
        setFormData({
          title: '',
          description: '',
          discipline: '',
          file_name: '',
          file_url: '',
          duration_minutes: '',
          total_questions: '',
        })
      } else {
        toast({
          title: "Erro ao criar simulado",
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

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="bg-blue-600 p-2 rounded-lg">
            <PlusCircle className="h-5 w-5 text-white" />
          </div>
          Criar Novo Simulado
        </CardTitle>
        <CardDescription>
          Defina as informações básicas do simulado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Simulado</Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ex: Simulado PMBA - Edital 2024"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Breve descrição sobre o simulado"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duração (minutos)</Label>
              <Input
                id="duration_minutes"
                type="number"
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_questions">Total de Questões</Label>
              <Input
                id="total_questions"
                type="number"
                min="1"
                value={formData.total_questions}
                onChange={(e) => handleInputChange('total_questions', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">

          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando Simulado...
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Criar Simulado
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
