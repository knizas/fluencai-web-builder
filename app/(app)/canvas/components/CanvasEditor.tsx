'use client'
import React, { useCallback, useRef, useState, useEffect } from 'react'
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    type Connection,
    type Edge,
    type Node,
    type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { PromptNode } from './PromptNode'
import { ImageNode } from './ImageNode'
import { DeviceNode } from './DeviceNode'
import { Type, Image as ImageIcon, Sparkles, Smartphone, Monitor, ArrowLeft, Save, Zap, Coins, Loader2, Check } from 'lucide-react'

const nodeTypes: NodeTypes = {
    promptNode: PromptNode,
    imageNode: ImageNode,
    deviceNode: DeviceNode,
}

interface CanvasEditorProps {
    onGenerate: (nodes: Node[], edges: Edge[]) => void
    generationStatus: 'idle' | 'loading' | 'done' | 'error'
    onSave?: (nodes: Node[], edges: Edge[]) => void
    onBack?: () => void
    saveState?: 'idle' | 'saving' | 'saved'
    initialTemplate?: string
    initialPrompt?: string
    initialNodes?: Node[]
    initialEdges?: Edge[]
    html?: string
}

export function CanvasEditor({ onGenerate, generationStatus, onSave, onBack, saveState = 'idle', initialTemplate, initialPrompt, initialNodes, initialEdges, html }: CanvasEditorProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
    const nodeIdCounter = useRef(1)
    const [deviceType, setDeviceType] = useState<'phone' | 'laptop'>('laptop')
    const initializedRef = useRef(false)

    // Initialize state
    useEffect(() => {
        if (initializedRef.current) return
        initializedRef.current = true

        // 1. If we have saved nodes, load them
        if (initialNodes && initialNodes.length > 0) {
            setNodes(initialNodes)
            if (initialEdges) setEdges(initialEdges)
            return
        }

        // 2. Default initialization (new project)
        const deviceNode: Node = {
            id: 'device-preview',
            type: 'deviceNode',
            position: { x: 600, y: 200 },
            data: { deviceType: 'laptop', htmlContent: '' },
        }

        const nodesList: Node[] = [deviceNode]

        // If template provided, load the HTML
        if (initialTemplate) {
            fetch(`/api/templates?template=${initialTemplate}`)
                .then(res => res.json())
                .then(data => {
                    if (data.html) {
                        // Update device node with HTML
                        setNodes((nds) =>
                            nds.map((node) =>
                                node.id === 'device-preview'
                                    ? { ...node, data: { ...node.data, htmlContent: data.html } }
                                    : node
                            )
                        )
                    }
                })
                .catch(err => console.error('Failed to load template:', err))
        }

        setNodes(nodesList)
    }, [initialTemplate, initialNodes, initialEdges, setNodes, setEdges])

    // Update device preview when HTML prop changes
    useEffect(() => {
        if (html) {
            updateDevicePreview(html)
        }
    }, [html])

    // Keyboard shortcuts: T = Add Text, I = Add Image
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

            if (e.key.toLowerCase() === 't') {
                e.preventDefault()
                addPromptNode(null)
            } else if (e.key.toLowerCase() === 'i') {
                e.preventDefault()
                addImageNode(null)
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [])

    // Update device type when toggled
    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === 'device-preview'
                    ? { ...node, data: { ...node.data, deviceType } }
                    : node
            )
        )
    }, [deviceType, setNodes])

    // Connect nodes
    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    )

    // Double-click to add node
    const onPaneDoubleClick = useCallback(
        (event: React.MouseEvent) => {
            if (!reactFlowInstance) return

            const bounds = reactFlowWrapper.current?.getBoundingClientRect()
            if (!bounds) return

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            })

            // Default to prompt node
            addPromptNode(position)
        },
        [reactFlowInstance]
    )

    // Add prompt node
    const addPromptNode = (position?: { x: number; y: number } | null) => {
        const newNode: Node = {
            id: `prompt-${nodeIdCounter.current++}`,
            type: 'promptNode',
            position: position || { x: Math.random() * 300 + 50, y: Math.random() * 200 + 50 },
            data: { text: '' },
        }
        setNodes((nds) => nds.concat(newNode))
    }

    // Add image node
    const addImageNode = (position?: { x: number; y: number } | null) => {
        const newNode: Node = {
            id: `image-${nodeIdCounter.current++}`,
            type: 'imageNode',
            position: position || { x: Math.random() * 300 + 350, y: Math.random() * 200 + 50 },
            data: { imageUrl: null, imageFile: null },
        }
        setNodes((nds) => nds.concat(newNode))
    }

    // Generate from nodes
    const handleGenerate = () => {
        onGenerate(nodes, edges)
    }

    // Update device preview when HTML is generated
    const updateDevicePreview = (html: string) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === 'device-preview'
                    ? { ...node, data: { ...node.data, htmlContent: html } }
                    : node
            )
        )
    }

    const hasNodes = nodes.length > 0
    const hasPromptNodes = nodes.some(n => n.type === 'promptNode' && n.data.text?.trim())

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header - Two Rows */}
            <div style={{
                borderBottom: '1px solid var(--line-grey)',
                background: 'rgba(124,108,240,0.04)'
            }}>
                {/* Row 1: Navigation & Actions */}
                <div style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderBottom: '1px solid var(--line-grey)'
                }}>
                    <div style={{ fontWeight: 900, fontSize: 14, marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Sparkles size={16} color="var(--brand-accent)" />
                        Canvas Workspace
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={() => onGenerate(nodes, edges)}
                        disabled={!hasPromptNodes || generationStatus === 'loading'}
                        className="btn-cta"
                        aria-label="Generate website from canvas nodes"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            fontSize: 13,
                            fontWeight: 800,
                            opacity: !hasPromptNodes || generationStatus === 'loading' ? 0.5 : 1
                        }}
                    >
                        <Zap size={14} />
                        Generate • 100 <Coins size={12} />
                    </button>

                    {onSave && (
                        <button
                            className={`btn-secondary ${saveState === 'saved' ? 'success' : ''}`}
                            onClick={() => onSave?.(nodes, edges)}
                            disabled={saveState === 'saving' || saveState === 'saved'}
                        >
                            {saveState === 'saving' ? <Loader2 size={16} className="spin" /> :
                                saveState === 'saved' ? <Check size={16} /> :
                                    <Save size={16} />}
                            {saveState === 'saved' ? 'Saved' : 'Save'}
                        </button>
                    )}

                    <button
                        onClick={() => {
                            const deviceNode = nodes.find(n => n.id === 'device-preview')
                            const html = deviceNode?.data?.htmlContent as string
                            if (!html) {
                                alert('No HTML to download')
                                return
                            }
                            const blob = new Blob([html], { type: 'text/html' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = 'website.html'
                            a.click()
                            URL.revokeObjectURL(url)
                        }}
                        className="btn-outline"
                        aria-label="Download HTML"
                        title="Download HTML (50 credits)"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 800
                        }}
                    >
                        Download (50 <Coins size={12} />)
                    </button>

                    {onBack && (
                        <button
                            onClick={onBack}
                            className="btn-outline"
                            aria-label="Back to home"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                fontSize: 12,
                                fontWeight: 800
                            }}
                        >
                            <ArrowLeft size={14} />
                            Back
                        </button>
                    )}
                </div>

                {/* Row 2: Tools & Preview Toggle */}
                <div style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                }}>
                    <button
                        onClick={() => addPromptNode(null)}
                        className="btn-outline"
                        aria-label="Add prompt node to canvas"
                        title="Add Text Prompt (Press T)"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 800,
                            background: '#fff',
                            border: '1.5px solid var(--brand-accent)',
                            color: 'var(--brand-accent)'
                        }}
                    >
                        <Type size={14} aria-hidden="true" /> Prompt (T)
                    </button>

                    <button
                        onClick={() => addImageNode(null)}
                        className="btn-outline"
                        aria-label="Add image node to canvas"
                        title="Add Image Inspiration (Press I)"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 800,
                            background: '#fff',
                            border: '1.5px solid var(--line-grey)',
                            color: 'var(--ink)'
                        }}
                    >
                        <ImageIcon size={14} aria-hidden="true" /> Image (I)
                    </button>

                    <div style={{ width: 1, height: 24, background: 'var(--line-grey)', margin: '0 8px' }} />

                    {/* Device Toggle */}
                    <div style={{ display: 'flex', gap: 4, background: 'rgba(124,108,240,0.08)', borderRadius: 999, padding: 4 }}>
                        <button
                            onClick={() => setDeviceType('phone')}
                            aria-label="Switch to phone preview"
                            style={{
                                padding: '6px 12px',
                                borderRadius: 999,
                                border: 'none',
                                background: deviceType === 'phone' ? 'var(--brand-accent)' : 'transparent',
                                color: deviceType === 'phone' ? '#fff' : 'var(--ink)',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Smartphone size={13} strokeWidth={2.5} />
                            <span>Phone</span>
                        </button>
                        <button
                            onClick={() => setDeviceType('laptop')}
                            aria-label="Switch to laptop preview"
                            style={{
                                padding: '6px 12px',
                                borderRadius: 999,
                                border: 'none',
                                background: deviceType === 'laptop' ? 'var(--brand-accent)' : 'transparent',
                                color: deviceType === 'laptop' ? '#fff' : 'var(--ink)',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Monitor size={13} strokeWidth={2.5} />
                            <span>Laptop</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={reactFlowWrapper}
                style={{ flex: 1, position: 'relative' }}
                onDoubleClick={onPaneDoubleClick}
            >
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    nodeTypes={nodeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                    defaultEdgeOptions={{
                        type: 'smoothstep',
                        animated: true,
                        style: {
                            stroke: 'var(--brand-accent)',
                            strokeWidth: 3,
                        },
                    }}
                    connectionLineStyle={{
                        stroke: 'var(--brand-accent)',
                        strokeWidth: 3,
                    }}
                    style={{ background: 'rgba(124,108,240,0.02)' }}
                >
                    <Background color="rgba(124,108,240,0.1)" gap={16} />
                    <Controls />
                    <MiniMap
                        nodeColor={(node) =>
                            node.type === 'promptNode' ? '#7C6CF0' : '#C0B6FF'
                        }
                        style={{
                            background: 'rgba(255,255,255,0.9)',
                            border: '1px solid var(--line-grey)',
                            borderRadius: 12
                        }}
                    />
                </ReactFlow>

                {!hasNodes && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'grid',
                        placeItems: 'center',
                        pointerEvents: 'none',
                        opacity: 0.6
                    }}>
                        <div style={{ textAlign: 'center', maxWidth: 400, padding: 20 }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
                            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8, color: 'var(--ink)' }}>
                                Start Your Canvas
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>
                                Double-click anywhere or use the buttons above to add nodes
                            </div>
                            <div style={{
                                display: 'grid',
                                gap: 8,
                                fontSize: 12,
                                textAlign: 'left',
                                background: 'rgba(124,108,240,0.08)',
                                padding: 16,
                                borderRadius: 12,
                                border: '1px solid var(--line-grey)'
                            }}>
                                <div style={{ fontWeight: 800, marginBottom: 4 }}>💡 Quick Tips:</div>
                                <div>• Add Prompt nodes to describe your website</div>
                                <div>• Upload images for inspiration or assets</div>
                                <div>• Drag from node handles to connect them</div>
                                <div>• Click Generate when ready!</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
