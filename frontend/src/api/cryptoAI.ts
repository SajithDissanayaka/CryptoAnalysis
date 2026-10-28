import { request } from './client'

export interface Source {
  title: string
  source: string | null
  document_id: number
  chunk_id: number
}
export interface AgentResult {
  status: string
  answer: string
  tools_used: string[]
  sources: Source[]
}
export interface UploadResult {
  status: string
  document_id: number
  title: string
  chunks_saved?: number
  message?: string
}
export interface ResearchDocument {
  document_id: number
  title: string
  source: string
  created_at: string
  chunks_saved: number
}

export const askCryptoAgent = (question: string, signal?: AbortSignal) =>
  request<AgentResult>(
    '/api/v1/agent/analyze',
    { method: 'POST', body: JSON.stringify({ question }), signal },
    240000,
  )
export const uploadCryptoDocument = (file: File, signal?: AbortSignal) => {
  const body = new FormData()
  body.append('file', file)
  return request<UploadResult>('/api/v1/rag/upload', { method: 'POST', body, signal }, 240000)
}
export const getDocuments = (signal?: AbortSignal) =>
  request<{ documents: ResearchDocument[] }>('/api/v1/rag/documents', { signal })
export const deleteDocument = (id: number) =>
  request<void>(`/api/v1/rag/documents/${id}`, { method: 'DELETE' })
