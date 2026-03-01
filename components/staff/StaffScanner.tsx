// components/staff/StaffScanner.tsx
'use client'

import { useState } from 'react'
import { QrScanner } from '@yudiel/react-qr-scanner'
import { toast } from 'react-hot-toast'

export function StaffScanner() {
  const [scanning, setScanning] = useState(false)
  
  const handleScan = async (data: string) => {
    try {
      // Parse QR data (contains tracking number and PIN)
      const { trackingNumber, pin } = JSON.parse(data)
      
      // Verify with backend
      const response = await fetch('/api/staff/verify-pickup', {
        method: 'POST',
        body: JSON.stringify({ trackingNumber, pin })
      })
      
      if (response.ok) {
        toast.success('Customer verified! Open compartment?')
        // Trigger locker open (manual for now, but structure for future)
      }
    } catch (error) {
      toast.error('Invalid QR code')
    }
  }
  
  return (
    <div>
      {scanning ? (
        <QrScanner onDecode={handleScan} />
      ) : (
        <button onClick={() => setScanning(true)}>
          Scan Customer QR
        </button>
      )}
    </div>
  )
}