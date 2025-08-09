"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Shield, Zap, Video, Users, BookOpen, Brain } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Links de checkout: pode sobrescrever por env na Netlify
const DEFAULT_ANNUAL = 'https://pay.cakto.com.br/34garho'
const DEFAULT_MONTHLY = 'https://pay.cakto.com.br/3ztk42f_506879'
const MONTHLY_URL = process.env.NEXT_PUBLIC_CHECKOUT_MONTHLY_URL || DEFAULT_MONTHLY
const ANNUAL_URL = process.env.NEXT_PUBLIC_CHECKOUT_ANNUAL_URL || DEFAULT_ANNUAL

export function SalesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Lado esquerdo - Marca e Benefícios */}
        <div className="text-white space-y-6">
          <div className="flex items-center gap-3">
            <Image src="/images/bussola-da-aprovacao-logo.png" alt="Bússola da Aprovação" width={64} height={64} className="rounded" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">Bússola da Aprovação</h1>
              <p className="text-blue-200">A plataforma completa para sua aprovação na PMBA</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-white/10 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 text-blue-200 mb-1"><Video className="h-5 w-5" /> Aulas ao vivo semanais</div>
              <p className="text-sm text-blue-100">Calendário contínuo com foco no edital, gravações disponíveis.</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 text-blue-200 mb-1"><Users className="h-5 w-5" /> Mentoria de início</div>
              <p className="text-sm text-blue-100">Passo a passo para montar seu plano de estudos e rotina.</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 text-blue-200 mb-1"><BookOpen className="h-5 w-5" /> PDFs por disciplina</div>
              <p className="text-sm text-blue-100">Materiais organizados, atualizados e prontos para download.</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 text-blue-200 mb-1"><Brain className="h-5 w-5" /> Questões e Simulados</div>
              <p className="text-sm text-blue-100">Banco de questões, simulados, revisões, flashcards e pomodoro.</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/preview" className="inline-block">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-md">Conhecer a plataforma</Button>
            </Link>
          </div>
        </div>

        {/* Lado direito - Planos */}
        <div className="space-y-5">
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Plano Mensal <Shield className="h-5 w-5 text-blue-600" /></CardTitle>
              <CardDescription>Acesso completo por 30 dias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-slate-900">R$ 39,99 <span className="text-base font-medium text-slate-500">/ mês</span></div>
              <ul className="text-sm text-slate-600 space-y-1">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Acesso total à plataforma</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Aulas ao vivo semanais</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Mentoria de início</li>
              </ul>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <a href={MONTHLY_URL} target="_blank" rel="noopener noreferrer">Assinar Mensal</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Plano Anual <Zap className="h-5 w-5 text-emerald-600" /></CardTitle>
              <CardDescription>Melhor custo-benefício</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-slate-900">R$ 299,99 <span className="text-base font-medium text-slate-500">/ ano</span></div>
              <ul className="text-sm text-slate-600 space-y-1">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Tudo do plano mensal</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Economia significativa</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Prioridade em suporte</li>
              </ul>
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                <a href={ANNUAL_URL} target="_blank" rel="noopener noreferrer">Assinar Anual</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
