import http from '../utils/http-common'

class VisitDataService {
  getAll() { return http.get('/visits') }
  get(id: number) { return http.get(`/visits/${id}`) }
  create(data: FormData) { return http.post('/visits', data, { headers: { 'Content-Type': 'multipart/form-data' } }) }
  update(id: number, data: FormData) { return http.put(`/visits/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }) }
  delete(id: number) { return http.delete(`/visits/${id}`) }

  getGoogleStatus() { return http.get('/visits/google/status') }
  getGoogleAuthUrl() { return http.get('/visits/google/url') }
  testGoogleConnection() { return http.get<{ connected: boolean; message: string }>('/visits/google/test') }
  disconnectGoogle() { return http.delete('/visits/google/disconnect') }
}

export default new VisitDataService()
