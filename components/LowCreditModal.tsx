// Low Credit Warning Modal
import { AlertCircle, X } from 'lucide-react'

interface LowCreditModalProps {
    isOpen: boolean
    onClose: () => void
    currentCredits: number
    requiredCredits: number
}

export function LowCreditModal({ isOpen, onClose, currentCredits, requiredCredits }: LowCreditModalProps) {
    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 99998,
                    animation: 'fadeIn 0.2s ease'
                }}
            />

            {/* Modal */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#fff',
                borderRadius: 24,
                padding: '32px 28px',
                maxWidth: 440,
                width: '90%',
                zIndex: 99999,
                boxShadow: '0 24px 72px rgba(0,0,0,0.3)',
                animation: 'slideUp 0.3s ease'
            }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: 'rgba(0,0,0,0.05)',
                        border: 'none',
                        borderRadius: 8,
                        padding: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <X size={18} />
                </button>

                {/* Icon */}
                <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 20px'
                }}>
                    <AlertCircle size={32} color="#fff" />
                </div>

                {/* Title */}
                <h2 style={{
                    margin: '0 0 12px',
                    fontSize: 24,
                    fontWeight: 900,
                    textAlign: 'center',
                    color: '#1f2937'
                }}>
                    Not Enough Credits
                </h2>

                {/* Message */}
                <p style={{
                    margin: '0 0 24px',
                    fontSize: 15,
                    lineHeight: 1.6,
                    textAlign: 'center',
                    color: '#6b7280'
                }}>
                    You need <strong>{requiredCredits} credits</strong> for this action, but you only have <strong>{currentCredits} credits</strong> remaining.
                </p>

                {/* Credits Display */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.15))',
                    border: '2px solid rgba(245,158,11,0.3)',
                    borderRadius: 12,
                    padding: '16px 20px',
                    marginBottom: 24,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>Current Balance</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b' }}>{currentCredits} ●</div>
                    </div>
                    <div style={{ fontSize: 40, opacity: 0.3 }}>💰</div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={onClose}
                        className="btn-outline"
                        style={{
                            flex: 1,
                            padding: '12px 20px',
                            fontSize: 15,
                            fontWeight: 800
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            // TODO: Navigate to buy credits page
                            onClose()
                            alert('Buy credits feature coming soon!')
                        }}
                        className="btn-cta"
                        style={{
                            flex: 1,
                            padding: '12px 20px',
                            fontSize: 15,
                            fontWeight: 800
                        }}
                    >
                        Buy Credits
                    </button>
                </div>
            </div>

            <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
        </>
    )
}
