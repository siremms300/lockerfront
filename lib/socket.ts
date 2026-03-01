// /lib/socket.ts
import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Function[]> = new Map()

  connect(token: string) {
    if (this.socket?.connected) return

    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    this.setupListeners()
  }

  private setupListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id)
      this.emit('authenticate', localStorage.getItem('token'))
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    this.socket.on('parcel-updated', (data) => {
      this.trigger('parcel-updated', data)
    })

    this.socket.on('locker-availability', (data) => {
      this.trigger('locker-availability', data)
    })

    this.socket.on('bulk-job-progress', (data) => {
      this.trigger('bulk-job-progress', data)
    })

    this.socket.on('bulk-job-complete', (data) => {
      this.trigger('bulk-job-complete', data)
    })
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data)
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)?.push(callback)
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private trigger(event: string, data: any) {
    const callbacks = this.listeners.get(event)
    callbacks?.forEach(callback => callback(data))
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
    this.listeners.clear()
  }

  isConnected() {
    return this.socket?.connected || false
  }
}

export const socketService = new SocketService()

// React Hook for using socket
import { useEffect } from 'react'

export const useSocket = () => {
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      socketService.connect(token)
    }

    return () => {
      socketService.disconnect()
    }
  }, [])

  return socketService
}



