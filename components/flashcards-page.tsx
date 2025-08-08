"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, PlusCircle, Repeat, CalendarDays, Loader2 } from 'lucide-react'
import { FlashcardForm } from './flashcard-form'
import { FlashcardViewer } from './flashcard-viewer'
import { getAllFlashcards, getFlashcardsForReview } from '@/app/actions/flashcards'
import { useAuth } from './auth-provider'

interface Flashcard {
  id: string
  next_review_date: string
}

export function FlashcardsPage() {
  const { user } = useAuth()
  const [flashcardsDue, setFlashcardsDue] = useState<Flashcard[]>([])
  const [upcomingFlashcards, setUpcomingFlashcards] = useState<Flashcard[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (user) {
      fetchFlashcardStats()
    }
  }, [user])

  const fetchFlashcardStats = async () => {
    setLoadingStats(true)
    try {
      const allCards = await getAllFlashcards()
      const dueCards = await getFlashcardsForReview()

      const today = new Date().toISOString().split('T')[0]
      const upcoming = allCards.filter(card => card.next_review_date > today)

      setFlashcardsDue(dueCards)
      setUpcomingFlashcards(upcoming)
    } catch (error) {
      console.error('Error fetching flashcard stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="bg-purple-600 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            Gerenciador de Flashcards
          </CardTitle>
          <CardDescription>
            Crie e revise seus flashcards para memorização eficaz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Carregando estatísticas...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Flashcards para Revisar</div>
                  <div className="text-2xl font-bold text-blue-600">{flashcardsDue.length}</div>
                </div>
                <Repeat className="h-8 w-8 text-blue-400" />
              </div>
              <div className="bg-green-50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Próximas Revisões</div>
                  <div className="text-2xl font-bold text-green-600">{upcomingFlashcards.length}</div>
                </div>
                <CalendarDays className="h-8 w-8 text-green-400" />
              </div>
            </div>
          )}

          <Tabs defaultValue="review" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="review" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                <Repeat className="h-4 w-4 mr-2" />
                Revisar Flashcards
              </TabsTrigger>
              <TabsTrigger value="create" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                <PlusCircle className="h-4 w-4 mr-2" />
                Criar Flashcard
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="review">
              <FlashcardViewer />
            </TabsContent>
            
            <TabsContent value="create">
              <FlashcardForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
