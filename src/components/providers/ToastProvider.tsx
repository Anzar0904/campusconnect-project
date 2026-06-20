'use client'
import { Toaster } from 'react-hot-toast'

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'rgba(34,42,61,0.97)',
          color: '#dae2fd',
          border: '1px solid rgba(195,192,255,0.15)',
          backdropFilter: 'blur(20px)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        },
        success: { iconTheme: { primary: '#86efac', secondary: '#003640' } },
        error:   { iconTheme: { primary: '#ffb4ab', secondary: '#690005' } },
      }}
    />
  )
}
