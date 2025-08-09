"use client"

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { getSubscriptionByEmail, activateSubscriptionByEmail, deactivateSubscriptionByEmail, listSubscriptions } from '@/app/actions/subscriptions'

export function AdminSubscriptionsPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ email: string; is_subscribed: boolean; plan: string | null } | null>(null)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<{ id: string; email: string; name: string | null; is_subscribed: boolean; plan: string | null; created_at: string }[]>([])
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 10

  const fetchList = async () => {
    try {
      const { rows, total } = await listSubscriptions({ search, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      setRows(rows)
      setTotal(total)
    } catch (e: any) {
      toast({ title: 'Erro ao listar usuários', description: e.message, variant: 'destructive' })
    }
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleSearchList = async () => {
    setPage(0)
    await fetchList()
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      const data = await getSubscriptionByEmail(email)
      if (!data) {
        toast({ title: 'Usuário não encontrado', description: 'Verifique o email informado', variant: 'destructive' })
        setResult(null)
        return
      }
      setResult(data)
    } catch (e: any) {
      toast({ title: 'Erro ao buscar', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async () => {
    setLoading(true)
    try {
      await activateSubscriptionByEmail(email, plan)
      toast({ title: 'Assinatura ativada', description: `Plano ${plan === 'monthly' ? 'Mensal' : 'Anual'} aplicado` })
      await handleSearch()
      await fetchList()
    } catch (e: any) {
      toast({ title: 'Erro ao ativar', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async () => {
    setLoading(true)
    try {
      await deactivateSubscriptionByEmail(email)
      toast({ title: 'Assinatura desativada', description: 'O usuário não possui mais acesso' })
      await handleSearch()
      await fetchList()
    } catch (e: any) {
      toast({ title: 'Erro ao desativar', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Assinaturas</CardTitle>
          <CardDescription>Ative ou desative a assinatura de um usuário pelo email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do usuário</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@email.com" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={plan} onValueChange={(v: any) => setPlan(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal (R$ 39,99)</SelectItem>
                  <SelectItem value="annual">Anual (R$ 299,99)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={loading} className="flex-1">Buscar</Button>
              <Button onClick={handleActivate} disabled={loading || !email} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Ativar</Button>
              <Button onClick={handleDeactivate} disabled={loading || !email} variant="destructive" className="flex-1">Desativar</Button>
            </div>
          </div>

          {result && (
            <div className="mt-4 text-sm text-slate-700">
              <div><strong>Email:</strong> {result.email}</div>
              <div><strong>Status:</strong> {result.is_subscribed ? 'Ativo' : 'Inativo'}</div>
              <div><strong>Plano:</strong> {result.plan ?? '-'}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários cadastrados</CardTitle>
          <CardDescription>Busca por email/nome e paginação simples</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por email ou nome" />
            <Button onClick={handleSearchList}>Buscar</Button>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">Nome</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Plano</th>
                  <th className="px-3 py-2 text-left">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.name ?? '-'}</td>
                    <td className="px-3 py-2">{r.email}</td>
                    <td className="px-3 py-2">{r.is_subscribed ? 'Ativo' : 'Inativo'}</td>
                    <td className="px-3 py-2">{r.plan ?? '-'}</td>
                    <td className="px-3 py-2">{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-500" colSpan={5}>Nenhum usuário encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">Total: {total}</div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Anterior</Button>
              <div className="text-sm">Página {page + 1} de {totalPages}</div>
              <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
