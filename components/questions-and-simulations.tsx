"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { QuestionBankPage } from './question-bank-page'
import { SimulationsPage } from './simulations-page'
import { PdfsPage } from './pdfs-page'
import { FileText, HelpCircle, File } from 'lucide-react'
import { useState } from 'react'

export function QuestionsAndSimulationsPage() {
  const [tab, setTab] = useState<'questions' | 'simulations' | 'materials'>('questions')

  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3">
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" /> Banco de Questões
            </TabsTrigger>
            <TabsTrigger value="simulations" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Simulados
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <File className="h-4 w-4" /> PDFs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions">
            <QuestionBankPage />
          </TabsContent>

          <TabsContent value="simulations">
            <SimulationsPage />
          </TabsContent>

          <TabsContent value="materials">
            <PdfsPage />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
