import http from '../utils/http-common'

export interface SciConfigData {
  id?: number
  name?: string
  legal_form?: string
  siret?: string
  rcs?: string
  address?: string
  zipcode?: string
  city?: string
  iban?: string
  manager_associate_id?: number | null
  manager_civility?: string
  manager_firstname?: string
  manager_lastname?: string
  manager_email?: string
  manager_phone?: string
  google_calendar_id?: string | null
}

class SciConfigDataService {
  get() { return http.get<SciConfigData>('/sci-config') }
  update(data: FormData) { return http.put<SciConfigData>('/sci-config', data) }
}

export default new SciConfigDataService()
