import React, { useState, useEffect } from 'react'
import PaymentDataService from '../../../services/payment.service'
import TenantDataService from '../../../services/tenant.service'
import PropertyDataService from '../../../services/property.service'
import ViewControlBar from '../../../components/ViewControlBar'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CBadge, CButton, CModal, CModalHeader,
  CModalTitle, CModalBody, CForm, CFormInput, CFormSelect, CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPen, cilTrash } from '@coreui/icons'

const statusLabel: Record<string, string> = { paid: 'Payé', pending: 'En attente', late: 'En retard' }
const statusColor: Record<string, string> = { paid: 'success', pending: 'warning', late: 'danger' }

const emptyForm = { tenant_id: '', property_id: '', amount: '', month: '', due_date: '', paid_date: '', status: 'pending' }

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [deleteModal, setDeleteModal] = useState(false)
  const [toDelete, setToDelete] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState('')

  const fetchPayments = async () => {
    try { const res = await PaymentDataService.getAll(); setPayments(res.data) }
    catch (err: any) { console.log(err.message) }
  }

  useEffect(() => {
    fetchPayments()
    TenantDataService.getAll().then((res) => setTenants(res.data)).catch(console.error)
    PropertyDataService.getAll().then((res) => setProperties(res.data)).catch(console.error)
  }, [])

  const handleOpenCreate = () => { setEditingPayment(null); setFormData(emptyForm); setModalVisible(true) }
  const handleOpenEdit = (payment: any) => {
    setEditingPayment(payment)
    setFormData({ tenant_id: payment.tenant_id || '', property_id: payment.property_id || '', amount: payment.amount || '', month: payment.month || '', due_date: payment.due_date || '', paid_date: payment.paid_date || '', status: payment.status || 'pending' })
    setModalVisible(true)
  }

  const handleChange = (e: React.ChangeEvent<any>) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v))
    try {
      if (editingPayment) await PaymentDataService.update(editingPayment.id, fd)
      else await PaymentDataService.create(fd)
      setModalVisible(false); fetchPayments()
    } catch (err) { console.log(err) }
  }

  const handleDelete = async () => {
    try { await PaymentDataService.delete(toDelete.id); setDeleteModal(false); fetchPayments() }
    catch (err) { console.log(err) }
  }

  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  const totalPending = payments.filter((p) => p.status !== 'paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

  const filteredPayments = filterStatus ? payments.filter((p) => p.status === filterStatus) : payments

  return (
    <>
      <CRow className="mb-4">
        <CCol sm={4}><CCard className="text-white bg-success mb-3"><CCardBody><div className="fs-4 fw-semibold">{totalPaid.toFixed(2)} €</div><div>Loyers perçus</div></CCardBody></CCard></CCol>
        <CCol sm={4}><CCard className="text-white bg-warning mb-3"><CCardBody><div className="fs-4 fw-semibold">{totalPending.toFixed(2)} €</div><div>En attente / En retard</div></CCardBody></CCard></CCol>
        <CCol sm={4}><CCard className="text-white bg-info mb-3"><CCardBody><div className="fs-4 fw-semibold">{payments.length}</div><div>Total des paiements</div></CCardBody></CCard></CCol>
      </CRow>

      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Paiements</strong>
          <CButton color="primary" size="sm" onClick={handleOpenCreate}><CIcon icon={cilPlus} className="me-1" />Ajouter</CButton>
        </CCardHeader>
        <CCardBody>
          <ViewControlBar
            filters={[
              {
                value: filterStatus,
                onChange: setFilterStatus,
                options: Object.entries(statusLabel).map(([v, l]) => ({ value: v, label: l })),
                placeholder: 'Tous les statuts',
                width: 160,
              },
            ]}
            hasActiveFilter={filterStatus !== ''}
            onResetFilters={() => setFilterStatus('')}
            totalCount={payments.length}
            filteredCount={filteredPayments.length}
            itemLabel="paiement"
          />
          <CTable align="middle" hover responsive bordered>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Mois</CTableHeaderCell><CTableHeaderCell>Locataire</CTableHeaderCell>
                <CTableHeaderCell>Bien</CTableHeaderCell><CTableHeaderCell>Montant</CTableHeaderCell>
                <CTableHeaderCell>Échéance</CTableHeaderCell><CTableHeaderCell>Statut</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filteredPayments.length === 0 ? (
                <CTableRow><CTableDataCell colSpan={7} className="text-center text-muted">Aucun paiement enregistré</CTableDataCell></CTableRow>
              ) : filteredPayments.map((payment) => (
                <CTableRow key={payment.id}>
                  <CTableDataCell>{payment.month || '-'}</CTableDataCell>
                  <CTableDataCell>{payment.Tenant ? `${payment.Tenant.civility || ''} ${payment.Tenant.firstname} ${payment.Tenant.lastname}` : '-'}</CTableDataCell>
                  <CTableDataCell>{payment.Property ? `${payment.Property.type} - ${payment.Property.city}` : '-'}</CTableDataCell>
                  <CTableDataCell>{parseFloat(payment.amount || 0).toFixed(2)} €</CTableDataCell>
                  <CTableDataCell>{payment.due_date || '-'}</CTableDataCell>
                  <CTableDataCell><CBadge color={statusColor[payment.status] || 'secondary'}>{statusLabel[payment.status] || payment.status}</CBadge></CTableDataCell>
                  <CTableDataCell className="text-end">
                    <CTooltip content="Modifier"><CButton color="light" size="sm" className="me-1" onClick={() => handleOpenEdit(payment)}><CIcon icon={cilPen} /></CButton></CTooltip>
                    <CTooltip content="Supprimer"><CButton color="light" size="sm" onClick={() => { setToDelete(payment); setDeleteModal(true) }}><CIcon icon={cilTrash} /></CButton></CTooltip>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CModal size="lg" alignment="center" visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader><CModalTitle>{editingPayment ? 'Modifier le paiement' : 'Ajouter un paiement'}</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm className="row g-3" onSubmit={handleSubmit}>
            <CCol md={6}><CFormSelect label="Locataire" name="tenant_id" value={formData.tenant_id} onChange={handleChange}><option value="">-- Sélectionner --</option>{tenants.map((t) => <option key={t.id} value={t.id}>{`${t.civility || ''} ${t.firstname} ${t.lastname}`}</option>)}</CFormSelect></CCol>
            <CCol md={6}><CFormSelect label="Bien" name="property_id" value={formData.property_id} onChange={handleChange}><option value="">-- Sélectionner --</option>{properties.map((p) => <option key={p.id} value={p.id}>{`${p.type} - ${p.address}, ${p.city}`}</option>)}</CFormSelect></CCol>
            <CCol md={4}><CFormInput type="text" name="month" label="Mois (ex: Janvier 2024)" value={formData.month} onChange={handleChange} required /></CCol>
            <CCol md={4}><CFormInput type="number" name="amount" label="Montant (€)" value={formData.amount} onChange={handleChange} required /></CCol>
            <CCol md={4}><CFormSelect label="Statut" name="status" value={formData.status} onChange={handleChange}><option value="pending">En attente</option><option value="paid">Payé</option><option value="late">En retard</option></CFormSelect></CCol>
            <CCol md={6}><CFormInput type="date" name="due_date" label="Date d'échéance" value={formData.due_date} onChange={handleChange} /></CCol>
            <CCol md={6}><CFormInput type="date" name="paid_date" label="Date de paiement" value={formData.paid_date} onChange={handleChange} /></CCol>
            <hr />
            <CCol md={12} className="d-flex gap-2 justify-content-end">
              <CButton color="secondary" onClick={() => setModalVisible(false)}>Annuler</CButton>
              <CButton color="primary" type="submit">{editingPayment ? 'Modifier' : 'Ajouter'}</CButton>
            </CCol>
          </CForm>
        </CModalBody>
      </CModal>

      <CModal alignment="center" visible={deleteModal} onClose={() => setDeleteModal(false)}>
        <CModalHeader><CModalTitle>Suppression</CModalTitle></CModalHeader>
        <CModalBody>
          <p>Êtes-vous sûr de vouloir supprimer le paiement <strong>{toDelete?.month}</strong> ?</p>
          <div className="d-flex gap-2 justify-content-end">
            <CButton color="secondary" onClick={() => setDeleteModal(false)}>Annuler</CButton>
            <CButton color="danger" onClick={handleDelete}>Supprimer</CButton>
          </div>
        </CModalBody>
      </CModal>
    </>
  )
}

export default Payments
