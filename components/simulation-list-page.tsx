"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Play, FileText, PlusCircle } from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import { getDisciplineSimulations } from '@/app/actions/simulations'
import { useAuth } from './auth-provider'
import { AdminSimulationForm } from './admin-simulation-form' // Importa o formulário de admin

interface Simulation {
  id: string
  title: string
  description: string | null
  duration_minutes: number
  total_questions: number
  is_published: boolean
  created_at: string
}

export function SimulationListPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdminForm, setShowAdminForm] = useState(false) // Estado para mostrar/esconder formulário admin

  useEffect(() => {
    fetchSimulations()
  }, [])

  const fetchSimulations = async () => {
    setLoading(true)
    try {
      const data = await getDisciplineSimulations()
      setSimulations(data)
    } catch (error: any) {
      toast({
        title: "Erro ao carregar simulados",
        description: error.message,
        variant: "destructive",
      })
      // silencioso em UI
    } finally {
      setLoading(false)
    }
  }

  const handleStartSimulation = (simulationId: string) => {
    // TODO: Implementar a lógica para iniciar o simulado
    // Isso provavelmente envolverá navegar para uma nova rota como /simulado/[id]
    toast({
      title: "Iniciar Simulado",
      description: `Lógica para iniciar o simulado ${simulationId} será implementada.`,
    })
    // silencioso em UI
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando simulados...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              Simulados PMBA
            </CardTitle>
            {user?.is_admin && (
              <Button onClick={() => setShowAdminForm(!showAdminForm)} variant="outline" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                {showAdminForm ? "Esconder Formulário" : "Criar Simulado"}
              </Button>
            )}
          </div>
          <CardDescription>
            Prepare-se para a prova com simulados completos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user?.is_admin && showAdminForm && (
            <div className="mb-8">
              <AdminSimulationForm />
            </div>
          )}

          {simulations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhum simulado disponível no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {simulations.map((sim) => (
                <Card key={sim.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{sim.title}</CardTitle>
                    <CardDescription>{sim.description || 'Sem descrição.'}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="space-y-2 text-sm text-gray-700 mb-4">
                      <p><strong>Duração:</strong> {sim.duration_minutes} minutos</p>
                      <p><strong>Questões:</strong> {sim.total_questions}</p>
                    </div>
                    <Button onClick={() => handleStartSimulation(sim.id)} className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar Simulado
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
