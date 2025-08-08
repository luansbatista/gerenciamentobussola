"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { subjectsData } from '@/lib/subjects-data'
import { PlusCircle, Loader2, FileUp } from 'lucide-react'
import { createQuestion, importQuestions, bulkInsertQuestions } from '@/app/actions/questions'
import { Textarea } from '@/components/ui/textarea'
import * as XLSX from 'xlsx'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AdminQuestionForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingImport, setLoadingImport] = useState(false)
  const [loadingJsonImport, setLoadingJsonImport] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [convLoading, setConvLoading] = useState(false)
  const [convHeaders, setConvHeaders] = useState<string[]>([])
  const [convRows, setConvRows] = useState<any[]>([])
  type ConvMap = {
    discipline?: string
    subject?: string
    question_text?: string
    correct?: string
    optionsMode: 'single' | 'columns'
    optionsSingle?: string
    optionsColumns: string[]
  }
  const [convMap, setConvMap] = useState<ConvMap>({ optionsMode: 'single', optionsColumns: [] })
  const [selectedDisciplineId, setSelectedDisciplineId] = useState('')
  const [formData, setFormData] = useState({
    discipline: '',
    subject: '',
    question_text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    optionE: '',
    correctOption: '',
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

    const options = [formData.optionA, formData.optionB]
    if (formData.optionC) options.push(formData.optionC)
    if (formData.optionD) options.push(formData.optionD)
    if (formData.optionE) options.push(formData.optionE)

    const correctOptionMap: { [key: string]: number } = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4 }
    const correct_option_index = correctOptionMap[formData.correctOption.toUpperCase()]

    if (correct_option_index === undefined || correct_option_index >= options.length) {
      toast({
        title: "Erro de validação",
        description: "Opção correta inválida ou fora do alcance das opções fornecidas.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const result = await createQuestion({
        discipline: formData.discipline,
        subject: formData.subject,
        question_text: formData.question_text,
        options: options,
        correct_option_index: correct_option_index,
      })

      if (result.success) {
        toast({
          title: "Questão criada!",
          description: result.message,
        })
        // Reset form
        setFormData({
          discipline: '',
          subject: '',
          question_text: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          optionE: '',
          correctOption: '',
        })
        setSelectedDisciplineId('')
      } else {
        toast({
          title: "Erro ao criar questão",
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

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoadingImport(true)
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const fileData = e.target?.result as ArrayBuffer
        const result = await importQuestions(fileData)

        if (result.success) {
          toast({
            title: "Importação concluída!",
            description: result.message,
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

  const selectedDisciplineData = subjectsData.find(s => s.id === selectedDisciplineId)

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="bg-orange-600 p-2 rounded-lg">
              <PlusCircle className="h-5 w-5 text-white" />
            </div>
            Gerenciar Banco de Questões
          </CardTitle>
          <div className="relative">
            <Input
              id="import-questions-excel"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileImport}
              className="hidden"
              disabled={loadingImport}
            />
            <Label htmlFor="import-questions-excel" className="cursor-pointer">
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
                      <FileUp className="h-4 w-4" />
                      Importar Excel
                    </>
                  )}
                </span>
              </Button>
            </Label>
          </div>
        </div>
        <CardDescription>
          Adicione questões manualmente ou importe via planilha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Conversor de Planilha -> JSON */}
        <div className="space-y-4 mb-8">
          <h3 className="text-sm font-semibold">Converter Planilha → JSON</h3>
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  setConvLoading(true)
                  const data = await file.arrayBuffer()
                  const wb = XLSX.read(data, { type: 'array' })
                  const ws = wb.Sheets[wb.SheetNames[0]]
                  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[]
                  const headers = rows.length > 0 ? Object.keys(rows[0]) : []
                  setConvHeaders(headers)
                  setConvRows(rows)
                  const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
                  const find = (...cands: string[]) => headers.find(h => cands.some(c => norm(h).includes(c)))
                  setConvMap({
                    optionsMode: 'single',
                    discipline: find('disciplina', 'materia'),
                    subject: find('assunto', 'topico', 'tema'),
                    question_text: find('questao', 'pergunta', 'enunciado'),
                    correct: find('correta', 'gabarito', 'resposta'),
                    optionsSingle: find('opcoes', 'alternativas', 'respostas'),
                    optionsColumns: headers.filter(h => /^(a|b|c|d|e)(\)|\.|\s|:)?$/i.test(norm(h))),
                  })
                } finally {
                  setConvLoading(false)
                }
              }}
            />
            {convLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
          </div>

          {convHeaders.length > 0 && (
            <div className="rounded-md border p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Coluna Disciplina</Label>
                  <Select value={convMap.discipline || ''} onValueChange={(v) => setConvMap(m => ({ ...m, discipline: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {convHeaders.map(h => (<SelectItem key={h} value={h}>{h}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Coluna Assunto</Label>
                  <Select value={convMap.subject || ''} onValueChange={(v) => setConvMap(m => ({ ...m, subject: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {convHeaders.map(h => (<SelectItem key={h} value={h}>{h}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Coluna Enunciado</Label>
                  <Select value={convMap.question_text || ''} onValueChange={(v) => setConvMap(m => ({ ...m, question_text: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {convHeaders.map(h => (<SelectItem key={h} value={h}>{h}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Coluna Gabarito</Label>
                  <Select value={convMap.correct || ''} onValueChange={(v) => setConvMap(m => ({ ...m, correct: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {convHeaders.map(h => (<SelectItem key={h} value={h}>{h}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Alternativas</Label>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="optionsMode" checked={convMap.optionsMode === 'single'} onChange={() => setConvMap(m => ({ ...m, optionsMode: 'single' }))} />
                    Coluna única (separada por | ; / ou quebras de linha)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="optionsMode" checked={convMap.optionsMode === 'columns'} onChange={() => setConvMap(m => ({ ...m, optionsMode: 'columns' }))} />
                    Colunas separadas (A, B, C, D, E)
                  </label>
                </div>

                {convMap.optionsMode === 'single' ? (
                  <div>
                    <Label>Coluna de Opções</Label>
                    <Select value={convMap.optionsSingle || ''} onValueChange={(v) => setConvMap(m => ({ ...m, optionsSingle: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {convHeaders.map(h => (<SelectItem key={h} value={h}>{h}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label>Selecione as colunas de alternativas (na ordem)</Label>
                    <ScrollArea className="h-28">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-2">
                        {convHeaders.map(h => (
                          <label key={h} className="flex items-center gap-2">
                            <Checkbox
                              checked={convMap.optionsColumns.includes(h)}
                              onCheckedChange={(val) => {
                                const isChecked = Boolean(val)
                                setConvMap(m => ({
                                  ...m,
                                  optionsColumns: isChecked ? Array.from(new Set([...m.optionsColumns, h])) : m.optionsColumns.filter(x => x !== h)
                                }))
                              }}
                            />
                            <span className="text-sm">{h}</span>
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const norm = (s: any) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
                    const items: any[] = []
                    let invalid = 0
                    for (const row of convRows) {
                      const discipline = String(row[convMap.discipline || ''] || '').trim()
                      const subject = String(row[convMap.subject || ''] || '').trim()
                      const question_text = String(row[convMap.question_text || ''] || '').trim()
                      const correct = String(row[convMap.correct || ''] || '').trim()
                      let options: string[] = []
                      if (convMap.optionsMode === 'single') {
                        const raw = String(row[convMap.optionsSingle || ''] || '')
                        options = raw.split(/\r?\n|\||;|\//).map(s => s.trim()).filter(Boolean)
                      } else {
                        options = (convMap.optionsColumns || []).map(h => String(row[h] || '').trim()).filter(Boolean)
                      }
                      if (!discipline || !subject || !question_text || options.length < 2 || !correct) { invalid++; continue }
                      let correct_index = -1
                      const num = parseInt(correct, 10)
                      if (!Number.isNaN(num)) correct_index = num - 1
                      if (correct_index < 0) {
                        const letter = correct.replace(/[^a-z]/gi, '').toUpperCase()
                        if (/^[A-Z]$/.test(letter)) correct_index = letter.charCodeAt(0) - 'A'.charCodeAt(0)
                      }
                      if (correct_index < 0) {
                        const idx = options.findIndex(o => norm(o) === norm(correct))
                        correct_index = idx
                      }
                      if (correct_index < 0 || correct_index >= options.length) { invalid++; continue }
                      items.push({ discipline, subject, question_text, options, correct_option_index: correct_index })
                    }
                    const jsonOut = JSON.stringify(items, null, 2)
                    setJsonText(jsonOut)
                    const msg = `Gerado JSON com ${items.length} questões${invalid ? `; ${invalid} linhas inválidas` : ''}`
                    window.setTimeout(() => { navigator.clipboard?.writeText(jsonOut).catch(() => {}) }, 0)
                    toast({ title: 'Conversão concluída', description: msg })
                  }}
                  disabled={convRows.length === 0 || !convMap.discipline || !convMap.subject || !convMap.question_text || !convMap.correct || (convMap.optionsMode === 'single' ? !convMap.optionsSingle : (convMap.optionsColumns.length < 2))}
                >
                  Gerar JSON (copia para área de transferência)
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Importar via JSON */}
        <div className="space-y-3 mb-8">
          <Label>Importar via JSON (alternativa)</Label>
          <Textarea
            placeholder='Cole aqui um array JSON no formato: [{"discipline":"...","subject":"...","question_text":"...","options":["A","B","C","D"],"correct_option_index":0}]'
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="min-h-32"
          />
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  setLoadingJsonImport(true)
                  const parsed = JSON.parse(jsonText)
                  const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : []
                  if (!Array.isArray(items) || items.length === 0) {
                    toast({ title: 'JSON inválido', description: 'Forneça um array de questões válido.', variant: 'destructive' })
                    return
                  }
                  const res = await bulkInsertQuestions(items as any)
                  if (res.success) {
                    toast({ title: 'Importação via JSON concluída', description: res.message })
                    setJsonText('')
                  } else {
                    toast({ title: 'Erro na importação via JSON', description: res.message, variant: 'destructive' })
                  }
                } catch (err: any) {
                  toast({ title: 'JSON inválido', description: err.message, variant: 'destructive' })
                } finally {
                  setLoadingJsonImport(false)
                }
              }}
              disabled={loadingJsonImport || !jsonText.trim()}
            >
              {loadingJsonImport ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando JSON...
                </>
              ) : (
                'Importar via JSON'
              )}
            </Button>
          </div>
        </div>

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
            <Label htmlFor="question_text">Texto da Questão</Label>
            <Input
              id="question_text"
              type="text"
              value={formData.question_text}
              onChange={(e) => handleInputChange('question_text', e.target.value)}
              placeholder="Digite o texto da questão"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="optionA">Opção A</Label>
              <Input id="optionA" value={formData.optionA} onChange={(e) => handleInputChange('optionA', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="optionB">Opção B</Label>
              <Input id="optionB" value={formData.optionB} onChange={(e) => handleInputChange('optionB', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="optionC">Opção C</Label>
              <Input id="optionC" value={formData.optionC} onChange={(e) => handleInputChange('optionC', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="optionD">Opção D</Label>
              <Input id="optionD" value={formData.optionD} onChange={(e) => handleInputChange('optionD', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="optionE">Opção E</Label>
              <Input id="optionE" value={formData.optionE} onChange={(e) => handleInputChange('optionE', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correctOption">Opção Correta</Label>
              <Select value={formData.correctOption} onValueChange={(value) => handleInputChange('correctOption', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a correta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                  <SelectItem value="E">E</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando Questão...
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Questão
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
