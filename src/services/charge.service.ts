import http from '../utils/http-common'

class ChargeDataService {
  getAll() { return http.get('/charges') }
  get(id: number) { return http.get(`/charges/${id}`) }
  create(data: FormData) { return http.post('/charges', data) }
  update(id: number, data: FormData) { return http.put(`/charges/${id}`, data) }
  delete(id: number) { return http.delete(`/charges/${id}`) }
  syncMatera() { return http.post('/charges/sync-matera') }
}

export default new ChargeDataService()
