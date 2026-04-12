import http from '../utils/http-common'

export interface OwnerConfigData {
  id?: number
  owner_profile_type?: 'SCI' | 'PROFESSIONAL' | 'INDIVIDUAL'
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
  // SMTP
  smtp_host?: string
  smtp_port?: number | string
  smtp_secure?: boolean
  smtp_user?: string
  smtp_pass?: string
  smtp_from?: string
  // IMAP
  imap_host?: string
  imap_port?: number | string
  imap_tls?: boolean
  imap_user?: string
  imap_pass?: string
  matera_sender_email?: string
  matera_property_id?: number | string | null
  // Cron
  charge_cron_schedule?: string
  charge_cron_enabled?: boolean
}

class OwnerConfigDataService {
  get() { return http.get<OwnerConfigData>('/owner-config') }
  update(data: FormData) { return http.put<OwnerConfigData>('/owner-config', data) }
}

export default new OwnerConfigDataService()
