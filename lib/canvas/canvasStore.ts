import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'

type GenerationStatus = 'idle' | 'loading' | 'done' | 'error'

interface CanvasState {
  nodes: Node[]
  edges: Edge[]
  generatedHTML: string
  status: GenerationStatus
  error: string | null
  previewMode: 'laptop' | 'phone'
  
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void
  setGeneratedHTML: (html: string) => void
  setStatus: (status: GenerationStatus) => void
  setError: (error: string | null) => void
  setPreviewMode: (mode: 'laptop' | 'phone') => void
  addNode: (node: Node) => void
  updateNode: (id: string, data: any) => void
  deleteNode: (id: string) => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: [],
  edges: [],
  generatedHTML: '',
  status: 'idle',
  error: null,
  previewMode: 'laptop',
  
  setNodes: (nodes) => set((state) => ({ 
    nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes 
  })),
  
  setEdges: (edges) => set((state) => ({ 
    edges: typeof edges === 'function' ? edges(state.edges) : edges 
  })),
  
  setGeneratedHTML: (html) => set({ generatedHTML: html }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setPreviewMode: (mode) => set({ previewMode: mode }),
  
  addNode: (node) => set((state) => ({ 
    nodes: [...state.nodes, node] 
  })),
  
  updateNode: (id, data) => set((state) => ({
    nodes: state.nodes.map(node => 
      node.id === id ? { ...node, data: { ...node.data, ...data } } : node
    )
  })),
  
  deleteNode: (id) => set((state) => ({
    nodes: state.nodes.filter(node => node.id !== id),
    edges: state.edges.filter(edge => edge.source !== id && edge.target !== id)
  }))
}))
