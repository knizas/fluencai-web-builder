import React, { memo, useRef } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react'
import { useCanvasStore } from '@/lib/canvas/canvasStore'

export const ImageNode = memo(({ id, data }: NodeProps) => {
    const { updateNode, deleteNode } = useCanvasStore()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = () => {
                updateNode(id, { imageUrl: reader.result, imageFile: file })
            }
            reader.readAsDataURL(file)
        }
    }

    return (
        <div className="image-node glass" style={{
            width: 280,
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
                    <ImageIcon size={16} color="var(--brand-accent)" />
                    <span style={{ fontWeight: 900, fontSize: 14 }}>Image Inspiration</span>
                </div>
                <button
                    onClick={() => deleteNode(id)}
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
                {data.imageUrl ? (
                    <div style={{ position: 'relative' }}>
                        <img
                            src={data.imageUrl}
                            alt="Uploaded preview"
                            style={{
                                width: '100%',
                                height: 160,
                                objectFit: 'cover',
                                borderRadius: 12,
                                border: '1px solid var(--line-grey)'
                            }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                                background: 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                padding: '6px 10px',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                            }}
                        >
                            <Upload size={12} /> Change
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: '100%',
                            height: 160,
                            border: '2px dashed var(--line-grey)',
                            borderRadius: 12,
                            background: 'rgba(124,108,240,0.04)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            color: 'var(--ink-soft)'
                        }}
                    >
                        <ImageIcon size={24} color="var(--brand-accent)" />
                        <span style={{ fontSize: 13, fontWeight: 700 }}>Upload Image</span>
                    </button>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
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

ImageNode.displayName = 'ImageNode'
