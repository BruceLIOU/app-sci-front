import http from '../utils/http-common'

class AuthService {
  requestLogin(email: string) { return http.post('/auth/request-login', { email }) }
  me() { return http.get('/auth/me') }
  logout() { return http.post('/auth/logout') }
  updatePreferences(data: FormData) { return http.put('/auth/preferences', data) }
  updateProfile(data: FormData) { return http.put('/auth/profile', data) }
  uploadAvatar(data: FormData) { return http.post('/auth/avatar', data) }
}

export default new AuthService()
