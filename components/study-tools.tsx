"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { FlashcardsPage } from './flashcards-page'
import { ReviewPage } from './review-page'
import { PomodoroTimer } from './pomodoro-timer'
import { Brain, Repeat, Timer } from 'lucide-react'
import { useState } from 'react'

export function StudyToolsPage() {
  const [tab, setTab] = useState<'flashcards' | 'review' | 'pomodoro'>('review')

  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3">
            <TabsTrigger value="review" className="flex items-center gap-2">
              <Repeat className="h-4 w-4" /> Revisões
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="flex items-center gap-2">
              <Brain className="h-4 w-4" /> Flashcards
            </TabsTrigger>
            <TabsTrigger value="pomodoro" className="flex items-center gap-2">
              <Timer className="h-4 w-4" /> Pomodoro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="review">
            <ReviewPage />
          </TabsContent>

          <TabsContent value="flashcards">
            <FlashcardsPage />
          </TabsContent>

          <TabsContent value="pomodoro">
            <PomodoroTimer />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
