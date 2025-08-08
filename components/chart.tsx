"use client"

import { useEffect, useRef } from 'react'

interface ChartProps {
  data: {
    label: string
    value: number
    color?: string
  }[]
  type: 'bar' | 'line' | 'pie'
  width?: number
  height?: number
  className?: string
}

export function Chart({ data, type, width = 400, height = 200, className = '' }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data.length) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    const maxValue = Math.max(...data.map(d => d.value))
    const padding = 40
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    if (type === 'bar') {
      const barWidth = chartWidth / data.length
      const barSpacing = 10
      const actualBarWidth = (barWidth - barSpacing) * 0.8

      data.forEach((item, index) => {
        const x = padding + index * barWidth + barWidth / 2
        const barHeight = (item.value / maxValue) * chartHeight
        const y = height - padding - barHeight

        // Draw bar
        ctx.fillStyle = item.color || '#3b82f6'
        ctx.fillRect(x - actualBarWidth / 2, y, actualBarWidth, barHeight)

        // Draw label
        ctx.fillStyle = '#374151'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(item.label, x, height - 10)

        // Draw value
        ctx.fillStyle = '#6b7280'
        ctx.font = '10px Arial'
        ctx.fillText(item.value.toString(), x, y - 5)
      })
    } else if (type === 'line') {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.beginPath()

      data.forEach((item, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth
        const y = height - padding - (item.value / maxValue) * chartHeight

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Draw points
      data.forEach((item, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth
        const y = height - padding - (item.value / maxValue) * chartHeight

        ctx.fillStyle = '#3b82f6'
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
      })
    } else if (type === 'pie') {
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(chartWidth, chartHeight) / 2

      const total = data.reduce((sum, item) => sum + item.value, 0)
      let currentAngle = 0

      data.forEach((item) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI

        ctx.fillStyle = item.color || '#3b82f6'
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
        ctx.closePath()
        ctx.fill()

        currentAngle += sliceAngle
      })
    }
  }, [data, type, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  )
}
