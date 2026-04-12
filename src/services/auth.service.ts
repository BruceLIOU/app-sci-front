import http from '../utils/http-common'

class AuthService {
  getGoogleUrl() { return http.get('/auth/google/url') }
  me() { return http.get('/auth/me') }
  logout() { return http.post('/auth/logout') }
  updatePreferences(data: FormData) { return http.put('/auth/preferences', data) }
  updateProfile(data: FormData) { return http.put('/auth/profile', data) }
}

export default new AuthService()
