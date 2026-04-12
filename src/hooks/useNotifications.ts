import { useState, useEffect, useCallback } from 'react'
import NotificationService, { Notification } from '../services/notification.service'

// Dérive l'URL WebSocket
// - Si VITE_API_URL est vide (mode proxy Vite), utilise le host courant → Vite proxy vers localhost:3000/ws
// - Sinon, construit directement l'URL ws(s)://
const WS_URL = (() => {
  const apiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined
  if (!apiUrl) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/ws`
  }
  return apiUrl.replace(/\/+$/, '').replace(/^http/, 'ws') + '/ws'
})()

type Listener = (notif: Notification) => void

// Singleton module-level : une seule connexion partagée entre tous les composants
let wsInstance: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<Listener>()

function connect(): void {
  if (wsInstance && wsInstance.readyState <= WebSocket.OPEN) return

  wsInstance = new WebSocket(WS_URL)

  wsInstance.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'notification') {
        listeners.forEach((fn) => fn(msg.data as Notification))
      }
    } catch { /* noop */ }
  })

  wsInstance.addEventListener('close', () => {
    wsInstance = null
    // Reconnexion automatique après 5s
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(connect, 5_000)
  })

  wsInstance.addEventListener('error', () => {
    wsInstance?.close()
  })
}

function subscribe(fn: Listener): () => void {
  if (listeners.size === 0) connect()
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentUnread, setRecentUnread] = useState<Notification[]>([])
  const [popoverLoaded, setPopoverLoaded] = useState(false)

  // Charge le compteur initial depuis l'API REST
  useEffect(() => {
    NotificationService.getUnreadCount()
      .then((r) => setUnreadCount(r.data.count))
      .catch(() => {})
  }, [])

  // S'abonne aux notifications temps réel
  useEffect(() => {
    const unsub = subscribe((notif) => {
      setUnreadCount((c) => c + 1)
      // Ajoute en tête si le popover est ouvert
      setRecentUnread((prev) => (prev.length > 0 ? [notif, ...prev] : prev))
    })
    return unsub
  }, [])

  // Chargement des non lues (appelé à l'ouverture du popover)
  const loadUnread = useCallback(() => {
    setPopoverLoaded(false)
    NotificationService.getAll(true)
      .then((r) => {
        setRecentUnread(r.data)
        setPopoverLoaded(true)
      })
      .catch(() => setPopoverLoaded(true))
  }, [])

  const markRead = useCallback(async (id: number) => {
    await NotificationService.markRead(id).catch(() => {})
    setRecentUnread((prev) => prev.filter((n) => n.id !== id))
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await NotificationService.markAllRead().catch(() => {})
    setRecentUnread([])
    setUnreadCount(0)
  }, [])

  return { unreadCount, recentUnread, popoverLoaded, loadUnread, markRead, markAllRead }
}
