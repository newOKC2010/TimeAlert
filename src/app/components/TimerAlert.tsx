'use client'

import { useState, useEffect, useRef } from 'react'

const TIME_OPTIONS = [
  { label: '5 วิ',    seconds: 5 },
  { label: '10 วิ',   seconds: 10 },
  { label: '5 นาที',  seconds: 5 * 60 },
  { label: '10 นาที', seconds: 10 * 60 },
  { label: '20 นาที', seconds: 20 * 60 },
  { label: '30 นาที', seconds: 30 * 60 },
]

function playAlert() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.25)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.5)
    gain.gain.setValueAtTime(0.5, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)
    osc.start()
    osc.stop(ctx.currentTime + 1.5)
  } catch (e) {
    console.error('Audio error:', e)
  }
}

type Status = 'idle' | 'running' | 'paused' | 'done'

const STATUS_LABEL: Record<Status, string> = {
  idle: 'พร้อมใช้งาน',
  running: 'กำลังนับถอยหลัง...',
  paused: 'หยุดชั่วคราว',
  done: 'ครบกำหนดแล้ว!',
}

const STATUS_COLOR: Record<Status, string> = {
  idle: 'text-slate-400',
  running: 'text-indigo-400',
  paused: 'text-amber-400',
  done: 'text-rose-400',
}

export default function TimerAlert() {
  const [selected, setSelected] = useState(TIME_OPTIONS[0].seconds)  // เก็บเป็น seconds
  const [remaining, setRemaining] = useState(TIME_OPTIONS[0].seconds)
  const [status, setStatus] = useState<Status>('idle')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // รีเซ็ตเมื่อเปลี่ยนเวลา
  useEffect(() => {
    clearTimer()
    setStatus('idle')
    setRemaining(selected)
  }, [selected])

  // เริ่ม/หยุด interval ตาม status
  useEffect(() => {
    if (status !== 'running') {
      clearTimer()
      return
    }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 1))
    }, 1000)
    return clearTimer
  }, [status])

  // ตรวจสอบเมื่อครบกำหนด
  useEffect(() => {
    if (remaining === 0 && status === 'running') {
      clearTimer()
      setStatus('done')
      playAlert()
    }
  }, [remaining, status])

  const handleStart = () => {
    if (status === 'idle' || status === 'paused') setStatus('running')
  }
  const handleStop = () => {
    if (status === 'running') setStatus('paused')
  }
  const handleReset = () => {
    clearTimer()
    setStatus('idle')
    setRemaining(selected)
  }

  // คำนวณวงกลม progress
  const total = selected
  const progress = ((total - remaining) / total) * 100
  const r = 88
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - progress / 100)
  const ringColor =
    status === 'done' ? '#f43f5e' : status === 'running' ? '#6366f1' : '#475569'

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div
        className={`bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center gap-7
          ${status === 'done' ? 'ring-2 ring-rose-500/50' : ''}`}
      >
        <h1 className="text-white text-2xl font-bold">⏱ แจ้งเตือนตามเวลา</h1>

        {/* เลือกเวลา */}
        <div className="flex gap-2 flex-wrap justify-center">
          {TIME_OPTIONS.map(opt => (
            <button
              key={opt.seconds}
              onClick={() => setSelected(opt.seconds)}
              disabled={status === 'running'}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors
                ${selected === opt.seconds
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* วงกลม countdown */}
        <div className={`relative flex items-center justify-center ${status === 'done' ? 'animate-pulse' : ''}`}>
          <svg width="210" height="210" className="-rotate-90">
            <circle cx="105" cy="105" r={r} fill="none" stroke="#1e293b" strokeWidth="14" />
            <circle
              cx="105"
              cy="105"
              r={r}
              fill="none"
              stroke={ringColor}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute flex flex-col items-center gap-1">
            <span className="text-5xl font-mono font-bold text-white tabular-nums">
              {mm}:{ss}
            </span>
            <span className={`text-sm font-medium ${STATUS_COLOR[status]}`}>
              {STATUS_LABEL[status]}
            </span>
          </div>
        </div>

        {/* ปุ่มควบคุม */}
        <div className="flex gap-3 w-full">
          <button
            onClick={handleStart}
            disabled={status === 'running' || status === 'done'}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            เริ่ม
          </button>
          <button
            onClick={handleStop}
            disabled={status !== 'running'}
            className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            หยุด
          </button>
          <button
            onClick={handleReset}
            className="flex-1 py-3 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-bold transition-colors"
          >
            รีเซ็ต
          </button>
        </div>
      </div>
    </div>
  )
}
