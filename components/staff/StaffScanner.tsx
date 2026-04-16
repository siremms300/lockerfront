// components/staff/StaffScanner.tsx
'use client'

import { useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { toast } from 'react-hot-toast'

export function StaffScanner() {
  const [scanning, setScanning] = useState(false)
  
  const handleScan = async (detectedCodes: Array<{ rawValue?: string }>) => {
    if (!detectedCodes?.length) return

    const data = detectedCodes[0]?.rawValue
    if (!data) return

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
        <Scanner onScan={handleScan} />
      ) : (
        <button onClick={() => setScanning(true)}>
          Scan Customer QR
        </button>
      )}
    </div>
  )
}