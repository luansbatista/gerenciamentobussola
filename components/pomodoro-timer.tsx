"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Pause, RotateCcw, Coffee, BookOpen } from 'lucide-react'

type TimerMode = 'work' | 'shortBreak' | 'longBreak'

interface PomodoroSettings {
  workTime: number
  shortBreakTime: number
  longBreakTime: number
  longBreakInterval: number
}

export function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('work')
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [currentSubject, setCurrentSubject] = useState('')
  
  const [settings, setSettings] = useState<PomodoroSettings>({
    workTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    longBreakInterval: 4
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const subjects = [
    'Direito Constitucional',
    'Direito Administrativo', 
    'Direito Penal',
    'Direito Processual Penal',
    'Português',
    'Matemática',
    'Raciocínio Lógico',
    'Legislação Especial',
    'Criminologia',
    'Informática',
    'Atualidades'
  ]

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleTimerComplete()
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  const handleTimerComplete = () => {
    setIsRunning(false)
    
    if (mode === 'work') {
      setCompletedPomodoros(prev => prev + 1)
      const newCount = completedPomodoros + 1
      
      if (newCount % settings.longBreakInterval === 0) {
        setMode('longBreak')
        setTimeLeft(settings.longBreakTime * 60)
      } else {
        setMode('shortBreak')
        setTimeLeft(settings.shortBreakTime * 60)
      }
    } else {
      setMode('work')
      setTimeLeft(settings.workTime * 60)
    }

    // Play notification sound (you can add actual sound here)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${mode === 'work' ? 'Trabalho' : 'Pausa'} concluído!`, {
        body: mode === 'work' ? 'Hora da pausa!' : 'Hora de voltar ao trabalho!',
        icon: '/favicon.ico'
      })
    }
  }

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setMode('work')
    setTimeLeft(settings.workTime * 60)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    const totalTime = mode === 'work' 
      ? settings.workTime * 60 
      : mode === 'shortBreak' 
        ? settings.shortBreakTime * 60 
        : settings.longBreakTime * 60
    
    return ((totalTime - timeLeft) / totalTime) * 100
  }

  const getModeInfo = () => {
    switch (mode) {
      case 'work':
        return {
          title: 'Sessão de Estudo',
          icon: <BookOpen className="h-6 w-6" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        }
      case 'shortBreak':
        return {
          title: 'Pausa Curta',
          icon: <Coffee className="h-6 w-6" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        }
      case 'longBreak':
        return {
          title: 'Pausa Longa',
          icon: <Coffee className="h-6 w-6" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        }
    }
  }

  const modeInfo = getModeInfo()

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Main Timer */}
      <Card className={`${modeInfo.bgColor} border-2`}>
        <CardHeader className="text-center">
          <CardTitle className={`flex items-center justify-center gap-2 ${modeInfo.color}`}>
            {modeInfo.icon}
            {modeInfo.title}
          </CardTitle>
          <CardDescription>
            Pomodoro #{completedPomodoros + 1}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-6xl font-mono font-bold text-gray-900">
            {formatTime(timeLeft)}
          </div>
          
          <Progress value={getProgress()} className="h-3" />
          
          {mode === 'work' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Matéria atual:
              </label>
              <Select value={currentSubject} onValueChange={setCurrentSubject}>
                <SelectTrigger className="max-w-xs mx-auto">
                  <SelectValue placeholder="Selecione a matéria" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex justify-center gap-4">
            <Button
              onClick={toggleTimer}
              size="lg"
              className={`${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isRunning ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Iniciar
                </>
              )}
            </Button>
            
            <Button onClick={resetTimer} variant="outline" size="lg">
              <RotateCcw className="h-5 w-5 mr-2" />
              Reiniciar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{completedPomodoros}</div>
            <div className="text-sm text-gray-600">Pomodoros Hoje</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((completedPomodoros * settings.workTime) / 60)}h
            </div>
            <div className="text-sm text-gray-600">Tempo Estudado</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.floor(completedPomodoros / settings.longBreakInterval)}
            </div>
            <div className="text-sm text-gray-600">Ciclos Completos</div>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Pomodoro</CardTitle>
          <CardDescription>
            Personalize os tempos de acordo com sua preferência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tempo de Trabalho (min)</label>
              <Select 
                value={settings.workTime.toString()} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, workTime: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="20">20 minutos</SelectItem>
                  <SelectItem value="25">25 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Pausa Curta (min)</label>
              <Select 
                value={settings.shortBreakTime.toString()} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, shortBreakTime: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 minutos</SelectItem>
                  <SelectItem value="5">5 minutos</SelectItem>
                  <SelectItem value="10">10 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Pausa Longa (min)</label>
              <Select 
                value={settings.longBreakTime.toString()} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, longBreakTime: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="20">20 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Intervalo para Pausa Longa</label>
              <Select 
                value={settings.longBreakInterval.toString()} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, longBreakInterval: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">A cada 3 pomodoros</SelectItem>
                  <SelectItem value="4">A cada 4 pomodoros</SelectItem>
                  <SelectItem value="5">A cada 5 pomodoros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
