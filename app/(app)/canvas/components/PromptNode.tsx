import React, { memo, useState } from 'react'
import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react'
import { Type, Trash2, Sparkles } from 'lucide-react'

export const PromptNode = memo(({ id, data }: NodeProps) => {
    const { setNodes } = useReactFlow()
    const [isImproving, setIsImproving] = useState(false)

    const handleTextChange = (text: string) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === id ? { ...node, data: { ...node.data, text } } : node
            )
        )
    }

    const handleDelete = () => {
        setNodes((nds) => nds.filter((node) => node.id !== id))
    }

    const handleImprovePrompt = async () => {
        const currentText = (data.text as string) || ''
        if (!currentText.trim()) return

        setIsImproving(true)
        try {
            const res = await fetch('/api/improve-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: currentText })
            })

            if (res.ok) {
                const { prompt: improved } = await res.json()
                handleTextChange(improved)
            }
        } catch (err) {
            console.error('Failed to improve prompt:', err)
        } finally {
            setIsImproving(false)
        }
    }

    return (
        <div className="prompt-node glass" style={{
            width: 300,
            borderRadius: 'var(--radius)',
            border: '2px solid var(--brand-accent)',
            background: 'var(--glass)',
            backdropFilter: 'blur(16px)',
            boxShadow: 'var(--shadow-soft)',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderBottom: '1px solid var(--line-grey)',
                background: 'rgba(124,108,240,0.08)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Type size={16} color="var(--brand-accent)" />
                    <span style={{ fontWeight: 900, fontSize: 14 }}>Prompt</span>
                </div>
                <button
                    onClick={handleDelete}
                    className="nodrag"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        opacity: 0.6
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Content */}
            <div style={{ padding: '12px 14px' }}>
                <textarea
                    className="nodrag"
                    value={(data.text as string) || ''}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Describe your website..."
                    style={{
                        width: '100%',
                        minHeight: 120,
                        resize: 'vertical',
                        border: '1px solid var(--line-grey)',
                        borderRadius: 12,
                        padding: '10px 12px',
                        fontSize: 13,
                        fontFamily: 'Inter, sans-serif',
                        background: '#fff',
                        outline: 'none'
                    }}
                />

                {/* Improve Button */}
                <button
                    onClick={handleImprovePrompt}
                    disabled={isImproving || !(data.text as string)?.trim()}
                    className="nodrag"
                    style={{
                        marginTop: 8,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        background: isImproving ? 'rgba(124,108,240,0.1)' : 'var(--brand-accent)',
                        color: isImproving ? 'var(--brand-accent)' : '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: isImproving ? 'wait' : 'pointer',
                        opacity: isImproving || !(data.text as string)?.trim() ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                        if (!isImproving && (data.text as string)?.trim()) {
                            e.currentTarget.style.transform = 'translateY(-1px)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,108,240,0.3)'
                        }
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                    }}
                >
                    <Sparkles size={14} className={isImproving ? 'spin' : ''} />
                    {isImproving ? 'Improving...' : 'Improve Prompt'}
                </button>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                style={{
                    width: 12,
                    height: 12,
                    background: 'var(--brand-accent)',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 8px rgba(124,108,240,0.4)'
                }}
            />
        </div>
    )
})

PromptNode.displayName = 'PromptNode'
