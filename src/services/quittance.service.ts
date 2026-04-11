import http from '../utils/http-common'

class QuittanceDataService {
  getAll() { return http.get('/quittances') }
  get(id: number) { return http.get(`/quittances/${id}`) }
  create(data: FormData) { return http.post('/quittances', data) }
  update(id: number, data: FormData) { return http.put(`/quittances/${id}`, data) }
  delete(id: number) { return http.delete(`/quittances/${id}`) }
}

export default new QuittanceDataService()
