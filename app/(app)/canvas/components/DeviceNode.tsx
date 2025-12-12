import React, { memo, useRef, useEffect } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { MonitorSmartphone, Smartphone, Monitor } from 'lucide-react'
import { injectEditing } from './iframeEditing'

export const DeviceNode = memo(({ id, data }: NodeProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const deviceType = data.deviceType || 'laptop' // 'laptop' or 'phone'

    const isPhone = deviceType === 'phone'
    const width = isPhone ? 300 : 480
    const height = isPhone ? 560 : 340

    // Inject editing capabilities when iframe loads
    useEffect(() => {
        const iframe = iframeRef.current
        if (!iframe || !data.htmlContent) return

        const injectWhenReady = () => {
            try {
                const iframeDoc = iframe.contentDocument
                if (iframeDoc && iframeDoc.body) {
                    injectEditing(iframeDoc)
                }
            } catch (e) {
                console.error('Failed to inject editing:', e)
            }
        }

        iframe.addEventListener('load', injectWhenReady)
        // Also try immediately in case already loaded
        setTimeout(injectWhenReady, 100)

        return () => iframe.removeEventListener('load', injectWhenReady)
    }, [data.htmlContent])

    return (
        <div style={{
            position: 'relative',
            width: width,
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--brand-accent)',
            background: 'var(--glass)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 20px 60px rgba(124,108,240,0.25)',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid var(--line-grey)',
                background: 'rgba(124,108,240,0.08)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isPhone ? (
                        <Smartphone size={16} color="var(--brand-accent)" strokeWidth={2.5} />
                    ) : (
                        <Monitor size={16} color="var(--brand-accent)" strokeWidth={2.5} />
                    )}
                    <span style={{ fontWeight: 900, fontSize: 13, color: 'var(--ink)' }}>
                        {isPhone ? 'Phone Preview' : 'Laptop Preview'}
                    </span>
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 700 }}>
                    {isPhone ? '375×812' : '1280×800'}
                </div>
            </div>

            {/* Device Frame */}
            <div style={{
                width: '100%',
                height: height,
                background: isPhone ? '#1a1a1a' : '#2a2a2a',
                position: 'relative',
                overflow: 'hidden',
                padding: isPhone ? '12px 6px' : '8px 8px 16px 8px'
            }}>
                {/* MacBook Notch (laptop only) */}
                {!isPhone && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 120,
                        height: 20,
                        background: '#2a2a2a',
                        borderRadius: '0 0 12px 12px',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#444',
                            border: '1px solid #555'
                        }} />
                    </div>
                )}

                {/* Screen */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: '#fff',
                    borderRadius: isPhone ? '24px' : '8px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
                }}>
                    {data.htmlContent ? (
                        <iframe
                            key={(data.htmlContent as string)?.length || 0}
                            ref={iframeRef}
                            title={`${deviceType} -preview`}
                            srcDoc={data.htmlContent as string}
                            style={{
                                width: isPhone ? '375px' : '1280px',
                                height: isPhone ? '812px' : '800px',
                                border: 0,
                                transform: isPhone
                                    ? `scale(${(width - 12) / 375})`
                                    : `scale(${(width - 16) / 1280})`,
                                transformOrigin: 'top left'
                            }}
                        />
                    ) : (
                        <div style={{
                            height: '100%',
                            display: 'grid',
                            placeItems: 'center',
                            color: 'var(--ink-soft)',
                            fontSize: 12,
                            textAlign: 'center',
                            padding: 20
                        }}>
                            <div>
                                <MonitorSmartphone size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                                <div style={{ fontWeight: 700 }}>Connect nodes →</div>
                                <div style={{ opacity: 0.7, marginTop: 4 }}>Generate to see preview</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Handle - OUTSIDE the node */}
            <Handle
                type="target"
                position={Position.Left}
                style={{
                    width: 16,
                    height: 16,
                    background: 'var(--brand-accent)',
                    border: '3px solid #fff',
                    boxShadow: '0 2px 8px rgba(124,108,240,0.4)',
                    left: -8
                }}
            />
        </div>
    )
})

DeviceNode.displayName = 'DeviceNode'
