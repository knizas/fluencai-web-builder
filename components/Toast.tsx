// Toast notification component
import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
    id: number
    message: string
    type: ToastType
}

let toastCounter = 0
let toastListeners: ((toast: Toast) => void)[] = []

export function showToast(message: string, type: ToastType = 'success') {
    const toast: Toast = {
        id: toastCounter++,
        message,
        type
    }
    toastListeners.forEach(listener => listener(toast))
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([])

    useEffect(() => {
        const listener = (toast: Toast) => {
            setToasts(prev => [...prev, toast])
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toast.id))
            }, 4000)
        }
        toastListeners.push(listener)
        return () => {
            toastListeners = toastListeners.filter(l => l !== listener)
        }
    }, [])

    return (
        <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
        }}>
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    style={{
                        background: toast.type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' :
                            toast.type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                                'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: '#fff',
                        padding: '14px 18px',
                        borderRadius: 12,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        minWidth: 300,
                        maxWidth: 400,
                        animation: 'slideIn 0.3s ease',
                        fontSize: 14,
                        fontWeight: 700
                    }}
                >
                    {toast.type === 'success' && <CheckCircle size={20} />}
                    {toast.type === 'error' && <AlertCircle size={20} />}
                    <span style={{ flex: 1 }}>{toast.message}</span>
                    <button
                        onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: 6,
                            padding: 4,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
            <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
        </div>
    )
}
