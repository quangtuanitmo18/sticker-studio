'use client'

import { useCallback, useState } from 'react'

/**
 * Generic undo/redo hook.
 * Stores a history stack and provides push/undo/redo/reset.
 */
export function useHistory<T>(initialState: T) {
  const [past, setPast] = useState<T[]>([])
  const [present, setPresent] = useState<T>(initialState)
  const [future, setFuture] = useState<T[]>([])

  const push = useCallback((newState: T) => {
    setPast(prev => [...prev, present])
    setPresent(newState)
    setFuture([])
  }, [present])

  const undo = useCallback(() => {
    if (past.length === 0) return
    const prev = past[past.length - 1]
    setPast(p => p.slice(0, -1))
    setFuture(f => [present, ...f])
    setPresent(prev)
  }, [past, present])

  const redo = useCallback(() => {
    if (future.length === 0) return
    const next = future[0]
    setFuture(f => f.slice(1))
    setPast(p => [...p, present])
    setPresent(next)
  }, [future, present])

  const reset = useCallback((state: T) => {
    setPast([])
    setFuture([])
    setPresent(state)
  }, [])

  return {
    state: present,
    set: push,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  }
}
