import http from '../utils/http-common'

class DocumentDataService {
  getAll(params?: { entity_type?: string; entity_id?: number }) {
    const query = new URLSearchParams()
    if (params?.entity_type) query.append('entity_type', params.entity_type)
    if (params?.entity_id != null) query.append('entity_id', String(params.entity_id))
    const qs = query.toString()
    return http.get(`/documents${qs ? `?${qs}` : ''}`)
  }
  get(id: number) { return http.get(`/documents/${id}`) }
  create(data: FormData) { return http.post('/documents', data) }
  delete(id: number) { return http.delete(`/documents/${id}`) }
  downloadUrl(id: number): string {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    return `${base}/api/documents/${id}/download`
  }
}

export default new DocumentDataService()
