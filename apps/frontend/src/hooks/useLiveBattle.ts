import { useState, useEffect, useRef } from 'react'

interface LiveBattleData {
  votesA: number
  votesB: number
  percentA: number
  percentB: number
  totalVotes: number
  timeRemaining: number
  status: string
  winnerId: string | null
}

export function useLiveBattle(sessionId: string | null) {
  const [data, setData] = useState<LiveBattleData | null>(null)
  const [connected, setConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!sessionId) return

    const es = new EventSource(`/api/battle/sessions/${sessionId}/live`)
    esRef.current = es

    es.onopen = () => setConnected(true)
    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data) as LiveBattleData
        setData(parsed)
      } catch {
        // ignore parse errors
      }
    }
    es.onerror = () => {
      setConnected(false)
      es.close()
      // Retry after 5s
      setTimeout(() => {
        if (esRef.current === es) {
          const retry = new EventSource(`/api/battle/sessions/${sessionId}/live`)
          esRef.current = retry
          retry.onopen = () => setConnected(true)
          retry.onmessage = es.onmessage
          retry.onerror = es.onerror
        }
      }, 5000)
    }

    return () => {
      es.close()
      esRef.current = null
    }
  }, [sessionId])

  return { data, connected }
}
