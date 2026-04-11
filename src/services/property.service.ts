import http from '../utils/http-common'

class PropertyDataService {
  getAll() { return http.get('/properties') }
  get(id: number) { return http.get(`/properties/${id}`) }
  create(data: FormData) { return http.post('/properties', data) }
  update(id: number, data: FormData) { return http.put(`/properties/${id}`, data) }
  delete(id: number) { return http.delete(`/properties/${id}`) }
  findByCity(city: string) { return http.get(`/properties?city=${city}`) }
}

export default new PropertyDataService()
