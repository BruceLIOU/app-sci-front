import http from '../utils/http-common'

class TenantDataService {
  getAll() { return http.get('/tenants') }
  get(id: number) { return http.get(`/tenants/${id}`) }
  create(data: FormData) { return http.post('/tenants', data) }
  update(id: number, data: FormData) { return http.put(`/tenants/${id}`, data) }
  delete(id: number) { return http.delete(`/tenants/${id}`) }
}

export default new TenantDataService()
