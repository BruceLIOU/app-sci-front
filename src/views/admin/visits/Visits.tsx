import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, SlotInfo, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  CRow, CCol, CCard, CCardBody, CCardHeader,
  CButton, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CForm, CFormInput, CFormLabel, CFormSelect, CFormTextarea,
  CAlert, CBadge, CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilCheckCircle, cilXCircle, cilPlus, cilTrash } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import VisitDataService from '../../../services/visit.service'
import PropertyDataService from '../../../services/property.service'
import TenantDataService from '../../../services/tenant.service'

const locales = { fr }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

const messages = {
  allDay: 'Journée',
  previous: '‹',
  next: '›',
  today: "Aujourd'hui",
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
  agenda: 'Agenda',
  date: 'Date',
  time: 'Heure',
  event: 'Visite',
  noEventsInRange: 'Aucune visite sur cette période.',
  showMore: (total: number) => `+ ${total} de plus`,
}

const typeColor: Record<string, string> = { visite: '#3b82f6', rdv: '#8b5cf6', autre: '#6b7280' }
const statusColor: Record<string, string> = { scheduled: 'primary', completed: 'success', cancelled: 'danger' }
const statusLabel: Record<string, string> = { scheduled: 'Planifiée', completed: 'Effectuée', cancelled: 'Annulée' }
const typeLabel: Record<string, string> = { visite: 'Visite', rdv: 'RDV', autre: 'Autre' }

const emptyForm = {
  title: '',
  description: '',
  property_id: '',
  tenant_id: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  date: '',
  time: '10:00',
  duration: '60',
  type: 'visite',
  status: 'scheduled',
  notes: '',
}

interface CalEvent {
  id: number
  title: string
  start: Date
  end: Date
  resource: any
}

const Visits: React.FC = () => {
  const navigate = useNavigate()

  const [events, setEvents] = useState<CalEvent[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [googleConnected, setGoogleConnected] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'danger' | 'info'; message: string } | null>(null)

  const [modalVisible, setModalVisible] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())

  // ─── Chargement initial ───────────────────────────────────────────────────

  const fetchVisits = useCallback(async () => {
    try {
      const { data } = await VisitDataService.getAll()
      setEvents(
        data.map((v: any) => {
          const [hh, mm] = v.time.split(':').map(Number)
          const start = new Date(`${v.date}T${v.time}:00`)
          const end = new Date(start.getTime() + v.duration * 60_000)
          return { id: v.id, title: v.title, start, end, resource: v }
        }),
      )
    } catch {
      setAlert({ type: 'danger', message: 'Impossible de charger les visites.' })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchGoogleStatus = useCallback(async () => {
    try {
      const { data } = await VisitDataService.getGoogleStatus()
      setGoogleConnected(data.connected)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchVisits()
    fetchGoogleStatus()
    PropertyDataService.getAll().then((r) => setProperties(r.data)).catch(() => {})
    TenantDataService.getAll().then((r) => setTenants(r.data)).catch(() => {})
  }, [fetchVisits, fetchGoogleStatus])

  // ─── Gestion paramètre OAuth callback ────────────────────────────────────

  // ─── Formulaire ──────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: value }
      // Auto-remplissage locataire selon bien sélectionné
      if (name === 'property_id' && value) {
        const lease = tenants.find((t: any) => String(t.property_id) === value)
        if (lease) updated.tenant_id = String(lease.id)
      }
      return updated
    })
  }

  const openCreate = (slot?: SlotInfo) => {
    const d = slot ? format(slot.start, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    const t = slot && view !== 'month' ? format(slot.start, 'HH:mm') : '10:00'
    setEditing(null)
    setForm({ ...emptyForm, date: d, time: t })
    setModalVisible(true)
  }

  const openEdit = (event: CalEvent) => {
    const v = event.resource
    setEditing(v)
    setForm({
      title: v.title || '',
      description: v.description || '',
      property_id: String(v.property_id || ''),
      tenant_id: String(v.tenant_id || ''),
      contact_name: v.contact_name || '',
      contact_email: v.contact_email || '',
      contact_phone: v.contact_phone || '',
      date: v.date || '',
      time: v.time || '10:00',
      duration: String(v.duration || 60),
      type: v.type || 'visite',
      status: v.status || 'scheduled',
      notes: v.notes || '',
    })
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.property_id || !form.date) {
      setAlert({ type: 'danger', message: 'Titre, bien et date sont obligatoires.' })
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (editing) {
        await VisitDataService.update(editing.id, fd)
      } else {
        await VisitDataService.create(fd)
      }
      setModalVisible(false)
      await fetchVisits()
    } catch {
      setAlert({ type: 'danger', message: 'Erreur lors de la sauvegarde.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editing) return
    try {
      await VisitDataService.delete(editing.id)
      setDeleteModal(false)
      setModalVisible(false)
      await fetchVisits()
    } catch {
      setAlert({ type: 'danger', message: 'Erreur lors de la suppression.' })
    }
  }

  // ─── Style des événements ─────────────────────────────────────────────────

  const eventStyleGetter = (event: CalEvent) => {
    const color = typeColor[event.resource?.type] || '#6b7280'
    const opacity = event.resource?.status === 'cancelled' ? 0.45 : 1
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        opacity,
        borderRadius: '6px',
        color: '#fff',
        fontSize: '0.8rem',
        padding: '2px 6px',
      },
    }
  }

  const filteredTenants = form.property_id
    ? tenants.filter((t: any) => String(t.property_id) === form.property_id)
    : tenants

  return (
    <>
      {/* Alerte */}
      {alert && (
        <CAlert color={alert.type} dismissible onClose={() => setAlert(null)} className="mb-3">
          {alert.message}
        </CAlert>
      )}

      <CRow className="mb-3 align-items-center">
        <CCol>
          <h4 className="mb-0">
            <CIcon icon={cilCalendar} className="me-2" />
            Calendrier des visites
          </h4>
        </CCol>
        <CCol xs="auto" className="d-flex gap-2 align-items-center">
          <CButton color="primary" size="sm" onClick={() => openCreate()}>
            <CIcon icon={cilPlus} className="me-1" />
            Nouvelle visite
          </CButton>
        </CCol>
      </CRow>

      <CCard>
        <CCardBody style={{ minHeight: 600 }}>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: 500 }}>
              <CSpinner />
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              culture="fr"
              messages={messages}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              style={{ height: 620 }}
              eventPropGetter={eventStyleGetter}
              selectable
              onSelectSlot={openCreate}
              onSelectEvent={openEdit}
              popup
              startAccessor="start"
              endAccessor="end"
            />
          )}
        </CCardBody>
      </CCard>

      {/* ─── Modal création / édition ─── */}
      <CModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        size="lg"
        alignment="center"
        scrollable
      >
        <CModalHeader>
          <CModalTitle>{editing ? 'Modifier la visite' : 'Nouvelle visite'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol md={8}>
                <CFormLabel>Titre *</CFormLabel>
                <CFormInput name="title" value={form.title} onChange={handleChange} placeholder="Ex : Visite T3 - M. Dupont" />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Type</CFormLabel>
                <CFormSelect name="type" value={form.type} onChange={handleChange}>
                  <option value="visite">Visite</option>
                  <option value="rdv">Rendez-vous</option>
                  <option value="autre">Autre</option>
                </CFormSelect>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={4}>
                <CFormLabel>Date *</CFormLabel>
                <CFormInput type="date" name="date" value={form.date} onChange={handleChange} />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Heure</CFormLabel>
                <CFormInput type="time" name="time" value={form.time} onChange={handleChange} />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Durée (min)</CFormLabel>
                <CFormInput type="number" name="duration" value={form.duration} onChange={handleChange} min={15} step={15} />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Bien *</CFormLabel>
                <CFormSelect name="property_id" value={form.property_id} onChange={handleChange}>
                  <option value="">-- Sélectionner un bien --</option>
                  {properties.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.address}, {p.city}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel>Locataire (optionnel)</CFormLabel>
                <CFormSelect name="tenant_id" value={form.tenant_id} onChange={handleChange}>
                  <option value="">-- Aucun --</option>
                  {filteredTenants.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.civility} {t.firstname} {t.lastname}</option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={4}>
                <CFormLabel>Nom du contact</CFormLabel>
                <CFormInput name="contact_name" value={form.contact_name} onChange={handleChange} placeholder="Nom Prénom" />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Email du contact</CFormLabel>
                <CFormInput type="email" name="contact_email" value={form.contact_email} onChange={handleChange} placeholder="email@exemple.fr" />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Téléphone</CFormLabel>
                <CFormInput name="contact_phone" value={form.contact_phone} onChange={handleChange} placeholder="06 00 00 00 00" />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={editing ? 6 : 12}>
                <CFormLabel>Description</CFormLabel>
                <CFormTextarea name="description" value={form.description} onChange={handleChange} rows={2} />
              </CCol>
              {editing && (
                <CCol md={6}>
                  <CFormLabel>Statut</CFormLabel>
                  <CFormSelect name="status" value={form.status} onChange={handleChange}>
                    <option value="scheduled">Planifiée</option>
                    <option value="completed">Effectuée</option>
                    <option value="cancelled">Annulée</option>
                  </CFormSelect>
                </CCol>
              )}
            </CRow>

            <div className="mb-2">
              <CFormLabel>Notes internes</CFormLabel>
              <CFormTextarea name="notes" value={form.notes} onChange={handleChange} rows={2} />
            </div>

            {googleConnected && (
              <CAlert color="info" className="mt-3 py-2 small mb-0">
                <CIcon icon={cilCalendar} className="me-1" />
                Cette visite sera automatiquement synchronisée avec votre Google Calendar.
              </CAlert>
            )}
          </CForm>
        </CModalBody>
        <CModalFooter className="d-flex justify-content-between">
          <div>
            {editing && (
              <CButton color="danger" variant="outline" size="sm" onClick={() => setDeleteModal(true)}>
                <CIcon icon={cilTrash} className="me-1" />
                Supprimer
              </CButton>
            )}
          </div>
          <div className="d-flex gap-2">
            <CButton color="secondary" variant="outline" onClick={() => setModalVisible(false)}>
              Annuler
            </CButton>
            <CButton color="primary" onClick={handleSave} disabled={saving}>
              {saving ? <CSpinner size="sm" className="me-1" /> : null}
              {editing ? 'Enregistrer' : 'Créer la visite'}
            </CButton>
          </div>
        </CModalFooter>
      </CModal>

      {/* ─── Modal suppression ─── */}
      <CModal visible={deleteModal} onClose={() => setDeleteModal(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>Confirmer la suppression</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Supprimer la visite <strong>{editing?.title}</strong> ?
          {googleConnected && editing?.google_event_id && (
            <CAlert color="warning" className="mt-2 py-2 small mb-0">
              L'événement sera également supprimé de votre Google Calendar.
            </CAlert>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setDeleteModal(false)}>Annuler</CButton>
          <CButton color="danger" onClick={handleDelete}>Supprimer</CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Visits
