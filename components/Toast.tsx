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
                        background: toast.type === 'success' ? '#d1fae5' :
                            toast.type === 'error' ? '#fee2e2' :
                                '#dbeafe',
                        color: toast.type === 'success' ? '#065f46' :
                            toast.type === 'error' ? '#991b1b' :
                                '#1e40af',
                        padding: '10px 14px',
                        borderRadius: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        border: toast.type === 'success' ? '1px solid #a7f3d0' :
                            toast.type === 'error' ? '1px solid #fecaca' :
                                '1px solid #bfdbfe',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        minWidth: 260,
                        maxWidth: 320,
                        animation: 'slideIn 0.3s ease',
                        fontSize: 13,
                        fontWeight: 600
                    }}
                >
                    {toast.type === 'success' && <CheckCircle size={16} strokeWidth={2.5} />}
                    {toast.type === 'error' && <AlertCircle size={16} strokeWidth={2.5} />}
                    <span style={{ flex: 1 }}>{toast.message}</span>
                    <button
                        onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            borderRadius: 6,
                            padding: 4,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 0.6
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                    >
                        <X size={14} />
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
