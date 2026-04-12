import http from '../utils/http-common'

class UserDataService {
  getAll() { return http.get('/users') }
  invite(data: FormData) { return http.post('/users', data) }
  resendInvite(id: number) { return http.post(`/users/${id}/resend`) }
  updateRole(id: number, data: FormData) { return http.patch(`/users/${id}/role`, data) }
  delete(id: number) { return http.delete(`/users/${id}`) }
  activate(token: string) { return http.get(`/auth/activate?token=${encodeURIComponent(token)}`) }
}

export default new UserDataService()
