"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RotateCcw, ChevronLeft, ChevronRight, CheckCircle, XCircle, Smile, Meh, Frown, Trash2 } from 'lucide-react'
import { getFlashcardsForReview, markFlashcardReviewed, deleteFlashcard } from '@/app/actions/flashcards'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Flashcard {
  id: string
  user_id: string
  discipline: string
  subject: string
  question: string
  answer: string
  ease_factor: number
  repetitions: number
  current_interval: number
  next_review_date: string
  last_reviewed_at: string | null
  created_at: string
  updated_at: string
}

export function FlashcardViewer() {
  const { toast } = useToast()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [markingCardId, setMarkingCardId] = useState<string | null>(null)
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null)

  const fetchFlashcards = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getFlashcardsForReview()
      setFlashcards(data)
      setCurrentCardIndex(0) // Reset to first card when new data arrives
      setShowAnswer(false)
    } catch (error: any) {
      toast({
        title: "Erro ao carregar flashcards",
        description: error.message,
        variant: "destructive",
      })
      console.error('Error fetching flashcards:', error)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchFlashcards()
  }, [fetchFlashcards])

  const currentCard = flashcards[currentCardIndex]

  const handleFlipCard = () => {
    setShowAnswer(prev => !prev)
  }

  const handleNextCard = () => {
    setShowAnswer(false)
    setCurrentCardIndex(prev => (prev + 1) % flashcards.length)
  }

  const handlePreviousCard = () => {
    setShowAnswer(false)
    setCurrentCardIndex(prev => (prev - 1 + flashcards.length) % flashcards.length)
  }

  const handleMarkAsReviewed = async (correctnessScore: number) => {
    if (!currentCard) return

    setMarkingCardId(currentCard.id)
    try {
      const result = await markFlashcardReviewed(currentCard.id, correctnessScore)
      if (result.success) {
        toast({
          title: "Flashcard revisado!",
          description: result.message,
        })
        // Remove the reviewed card from the current list and fetch new ones if needed
        setFlashcards(prev => prev.filter(card => card.id !== currentCard.id))
        if (flashcards.length === 1) { // If this was the last card
          fetchFlashcards() // Fetch more cards
        } else {
          // Adjust index if the last card was reviewed
          if (currentCardIndex >= flashcards.length - 1 && flashcards.length > 1) {
            setCurrentCardIndex(0); // Go to the first card
          }
          setShowAnswer(false); // Hide answer for the next card
        }
      } else {
        toast({
          title: "Erro ao marcar como revisado",
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
      setMarkingCardId(null)
    }
  }

  const handleDeleteFlashcard = async (flashcardId: string) => {
    setDeletingCardId(flashcardId)
    try {
      const result = await deleteFlashcard(flashcardId)
      if (result.success) {
        toast({
          title: "Flashcard deletado!",
          description: result.message,
        })
        setFlashcards(prev => prev.filter(card => card.id !== flashcardId))
        if (flashcards.length === 1) { // If this was the last card
          fetchFlashcards() // Fetch more cards
        } else {
          if (currentCardIndex >= flashcards.length - 1 && flashcards.length > 1) {
            setCurrentCardIndex(0);
          }
          setShowAnswer(false);
        }
      } else {
        toast({
          title: "Erro ao deletar flashcard",
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
      setDeletingCardId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando flashcards...</span>
      </div>
    )
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Nenhum flashcard para revisar no momento. Crie novos flashcards ou volte mais tarde!
        <Button onClick={fetchFlashcards} variant="outline" className="mt-4 ml-2">
          <RotateCcw className="h-4 w-4 mr-2" />
          Recarregar
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="relative min-h-[300px] flex flex-col justify-between">
        <CardHeader className="pb-2">
          <CardDescription className="text-sm text-gray-500">
            {currentCard.discipline} - {currentCard.subject}
          </CardDescription>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {showAnswer ? "Resposta" : "Pergunta"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center p-6">
          <p className="text-lg text-gray-800 text-center">
            {showAnswer ? currentCard.answer : currentCard.question}
          </p>
        </CardContent>
        <div className="p-4 border-t flex justify-between items-center">
          <Button onClick={handleFlipCard} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            {showAnswer ? "Mostrar Pergunta" : "Mostrar Resposta"}
          </Button>
          <div className="text-sm text-gray-600">
            {currentCardIndex + 1} / {flashcards.length}
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza que deseja deletar?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente este flashcard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => handleDeleteFlashcard(currentCard.id)}
                  disabled={deletingCardId === currentCard.id}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deletingCardId === currentCard.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deletando...
                    </>
                  ) : (
                    'Deletar'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      {showAnswer && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Como você se saiu?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              onClick={() => handleMarkAsReviewed(0)} 
              variant="destructive" 
              className="flex flex-col h-auto py-4"
              disabled={markingCardId === currentCard.id}
            >
              <XCircle className="h-6 w-6 mb-1" />
              Esqueci
            </Button>
            <Button 
              onClick={() => handleMarkAsReviewed(3)} 
              variant="secondary" 
              className="flex flex-col h-auto py-4"
              disabled={markingCardId === currentCard.id}
            >
              <Meh className="h-6 w-6 mb-1" />
              Mais ou Menos
            </Button>
            <Button 
              onClick={() => handleMarkAsReviewed(5)} 
              className="flex flex-col h-auto py-4 bg-green-600 hover:bg-green-700"
              disabled={markingCardId === currentCard.id}
            >
              <Smile className="h-6 w-6 mb-1" />
              Perfeito
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button 
          onClick={handlePreviousCard} 
          variant="outline" 
          disabled={flashcards.length <= 1 || markingCardId === currentCard.id}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        <Button 
          onClick={handleNextCard} 
          variant="outline" 
          disabled={flashcards.length <= 1 || markingCardId === currentCard.id}
        >
          Próximo
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
