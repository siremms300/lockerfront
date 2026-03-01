// components/providers/realtime-provider.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

interface RealTimeContextType {
  isConnected: boolean
  connectionStatus: string
  latestUpdate: any
  emitEvent: (event: string, data: any) => void
  subscribeTo: (event: string, callback: (data: any) => void) => void
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined)

export function RealTimeProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [latestUpdate, setLatestUpdate] = useState<any>(null)

  useEffect(() => {
    // In a real app, get token from localStorage
    const token = localStorage.getItem('token') || 'demo-token'
    
    const socketInstance = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    setSocket(socketInstance)

    socketInstance.on('connect', () => {
      console.log('Connected to real-time server')
      setIsConnected(true)
      setConnectionStatus('connected')
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from real-time server')
      setIsConnected(false)
      setConnectionStatus('disconnected')
    })

    socketInstance.on('parcel-updated', (data) => {
      console.log('Parcel update received:', data)
      setLatestUpdate(data)
      
      // You could trigger a toast notification here
      if (data.status === 'picked_up') {
        // Show success notification
      }
    })

    socketInstance.on('locker-status', (data) => {
      console.log('Locker status update:', data)
    })

    socketInstance.on('metrics-update', (data) => {
      console.log('Metrics update:', data)
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const emitEvent = (event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    } else {
      console.warn('Socket not connected')
    }
  }

  const subscribeTo = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback)
    }
  }

  return (
    <RealTimeContext.Provider value={{
      isConnected,
      connectionStatus,
      latestUpdate,
      emitEvent,
      subscribeTo,
    }}>
      {children}
    </RealTimeContext.Provider>
  )
}

export const useRealTime = () => {
  const context = useContext(RealTimeContext)
  if (!context) {
    throw new Error('useRealTime must be used within RealTimeProvider')
  }
  return context
}