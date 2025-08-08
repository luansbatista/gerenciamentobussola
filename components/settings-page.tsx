"use client"

import { useState, useEffect } from 'react'
import { useAuth } from './auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/cliente'
import { useToast } from '@/hooks/use-toast'
import { User, Mail, Shield, Trash2, Save, Loader2 } from 'lucide-react'
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
import * as XLSX from 'xlsx' // Importação da biblioteca XLSX
import { getAllStudySessionsForAdminExport } from '@/app/actions/admin-export' // Importação do Server Action de exportação admin
// Removido: import { uploadProfilePicture, updateProfileName } from '@/app/actions/profile'
// Removido: import Image from 'next/image'
// Removido: import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
// Removido: import { Input } from '@/components/ui/input'
// Removido: import { Label } from '@/components/ui/label'

export function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loadingReset, setLoadingReset] = useState(false)
  const [loadingAdminExport, setLoadingAdminExport] = useState(false) // Novo estado de loading para exportação admin
  // Removido: const [loadingProfileUpdate, setLoadingProfileUpdate] = useState(false)
  // Removido: const [profileName, setProfileName] = useState(user?.user_metadata?.name || user?.email || '')
  // Removido: const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)
  // Removido: const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(user?.profile_picture_url || null)

  // Removido: useEffect para preview da imagem

  const handleResetStatistics = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para redefinir as estatísticas.",
        variant: "destructive",
      })
      return
    }

    setLoadingReset(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('study_sessions')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      toast({
        title: "Estatísticas Redefinidas!",
        description: "Todas as suas sessões de estudo foram removidas.",
        action: <Shield className="text-green-500" />,
      })
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir estatísticas",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingReset(false)
    }
  }

  const handleAdminExport = async () => {
    setLoadingAdminExport(true)
    try {
      const sessions = await getAllStudySessionsForAdminExport()

      if (sessions.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há sessões de estudo registradas no sistema.",
          variant: "default",
        })
        return
      }

      const dataToExport = sessions.map(session => ({
        'Nome Usuário': session.user_name,
        'Email Usuário': session.user_email,
        Data: new Date(session.date).toLocaleDateString('pt-BR'),
        Disciplina: session.discipline,
        Assunto: session.subject,
        'Questões Totais': session.questions_total,
        Acertos: session.correct_answers,
        Erros: session.wrong_answers,
        'Assertividade (%)': session.accuracy_percentage.toFixed(1),
        'Tempo de Estudo (min)': session.study_time_minutes,
        'Tempo Médio/Questão (min)': session.avg_time_per_question.toFixed(2),
      }))

      const ws = XLSX.utils.json_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "TodosRegistrosDeEstudo")
      XLSX.writeFile(wb, "todos_registros_de_estudo.xlsx")

      toast({
        title: "Dados exportados!",
        description: "Todos os registros de estudo foram exportados para Excel.",
        action: <Save className="text-green-500" />,
      })

    } catch (error: any) {
      toast({
        title: "Erro ao exportar todos os dados",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingAdminExport(false)
    }
  }

  // Removido: handleProfilePictureChange
  // Removido: handleUpdateProfile

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            Configurações do Sistema
          </CardTitle>
          <CardDescription>
            Gerencie suas preferências e dados do aplicativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Redefinir Dados</h3>
            <p className="text-sm text-gray-600">
              Esta ação irá apagar todas as suas sessões de estudo registradas. Esta ação é irreversível.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={loadingReset}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {loadingReset ? "Redefinindo..." : "Redefinir Todas as Estatísticas"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                    <Shield className="h-5 w-5" />
                    Tem certeza?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente todas as suas sessões de estudo e removerá seus dados de nossos servidores.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetStatistics} className="bg-red-600 hover:bg-red-700">
                    Sim, redefinir dados
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Removido: Seção de Gerenciamento de Perfil */}

          {user?.is_admin && (
            <div className="space-y-2 border-t pt-6">
              <h3 className="font-semibold text-gray-900">Exportação de Dados (Admin)</h3>
              <p className="text-sm text-gray-600">
                Exporte todos os registros de estudo de todos os usuários do sistema para um arquivo Excel.
              </p>
              <Button
                onClick={handleAdminExport}
                disabled={loadingAdminExport}
                variant="outline"
                className="flex items-center gap-2"
              >
                {loadingAdminExport ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Exportar Todos os Registros
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
