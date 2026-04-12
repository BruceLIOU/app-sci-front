import React, { useState, useEffect, useMemo } from 'react'
import PaymentDataService from '../../../services/payment.service'
import TenantDataService from '../../../services/tenant.service'
import PropertyDataService from '../../../services/property.service'
import ViewControlBar from '../../../components/ViewControlBar'
import ActionButtons from '../../../components/ActionButtons'
import CrudModal from '../../../components/CrudModal'
import DeleteModal from '../../../components/DeleteModal'
import EntityTableCard from '../../../components/EntityTableCard'
import StatCard from '../../../components/StatCard'
import TableEmptyRow from '../../../components/TableEmptyRow'
import useEntityCrud from '../../../hooks/useEntityCrud'
import {
  CCol, CRow, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CBadge, CFormInput, CFormSelect,
} from '@coreui/react'

const statusLabel: Record<string, string> = { paid: 'Payé', pending: 'En attente', late: 'En retard' }
const statusColor: Record<string, string> = { paid: 'success', pending: 'warning', late: 'danger' }

const emptyForm = { tenant_id: '', property_id: '', amount: '', month: '', due_date: '', paid_date: '', status: 'pending' }

const Payments = () => {
  const [tenants, setTenants] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())

  const {
    items: payments,
    modalVisible, setModalVisible,
    deleteModal, setDeleteModal,
    editing, toDelete,
    form: formData,
    handleChange, openCreate, openEdit, openDelete,
    handleSubmit, handleDelete,
  } = useEntityCrud({
    service: PaymentDataService,
    emptyForm,
    toForm: (p) => ({ tenant_id: p.tenant_id || '', property_id: p.property_id || '', amount: p.amount || '', month: p.month || '', due_date: p.due_date || '', paid_date: p.paid_date || '', status: p.status || 'pending' }),
  })

  useEffect(() => {
    TenantDataService.getAll().then((res) => setTenants(res.data)).catch(console.error)
    PropertyDataService.getAll().then((res) => setProperties(res.data)).catch(console.error)
  }, [])

  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  const totalPending = payments.filter((p) => p.status !== 'paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

  const availableYears = useMemo(() => {
    const years = new Set(payments.map((p) => p.due_date?.slice(0, 4)).filter(Boolean))
    return Array.from(years as Set<string>).sort().reverse()
  }, [payments])

  const filteredPayments = payments
    .filter((p) => !filterStatus || p.status === filterStatus)
    .filter((p) => !filterYear || p.due_date?.startsWith(filterYear))

  return (
    <>
      <CRow className="mb-4 text-center">
        <StatCard value={`${totalPaid.toFixed(2)} €`} label="Loyers perçus" color="success" />
        <StatCard value={`${totalPending.toFixed(2)} €`} label="En attente / En retard" color="warning" />
        <StatCard value={payments.length} label="Total des paiements" color="info" />
      </CRow>

      <EntityTableCard title="Paiements" onAdd={openCreate}>
        <ViewControlBar
          filters={[
            { value: filterYear, onChange: setFilterYear, options: availableYears.map((y) => ({ value: y, label: y })), placeholder: 'Toutes les années', width: 140 },
            { value: filterStatus, onChange: setFilterStatus, options: Object.entries(statusLabel).map(([v, l]) => ({ value: v, label: l })), placeholder: 'Tous les statuts', width: 160 },
          ]}
          hasActiveFilter={filterStatus !== '' || filterYear !== new Date().getFullYear().toString()}
          onResetFilters={() => { setFilterStatus(''); setFilterYear(new Date().getFullYear().toString()) }}
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
              <TableEmptyRow colSpan={7} message="Aucun paiement enregistré" />
            ) : filteredPayments.map((payment) => (
              <CTableRow key={payment.id}>
                <CTableDataCell>{payment.month || '-'}</CTableDataCell>
                <CTableDataCell>{payment.Tenant ? `${payment.Tenant.civility || ''} ${payment.Tenant.firstname} ${payment.Tenant.lastname}` : '-'}</CTableDataCell>
                <CTableDataCell>{payment.Property ? `${payment.Property.type} - ${payment.Property.city}` : '-'}</CTableDataCell>
                <CTableDataCell>{parseFloat(payment.amount || 0).toFixed(2)} €</CTableDataCell>
                <CTableDataCell>{payment.due_date || '-'}</CTableDataCell>
                <CTableDataCell><CBadge color={statusColor[payment.status] || 'secondary'}>{statusLabel[payment.status] || payment.status}</CBadge></CTableDataCell>
                <CTableDataCell className="text-end">
                  <ActionButtons onEdit={() => openEdit(payment)} onDelete={() => openDelete(payment)} />
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </EntityTableCard>

      <CrudModal
        visible={modalVisible}
        editing={editing}
        addTitle="Ajouter un paiement"
        editTitle="Modifier le paiement"
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
      >
        <CCol md={6}><CFormSelect label="Locataire" name="tenant_id" value={formData.tenant_id} onChange={handleChange}><option value="">-- Sélectionner --</option>{tenants.map((t) => <option key={t.id} value={t.id}>{`${t.civility || ''} ${t.firstname} ${t.lastname}`}</option>)}</CFormSelect></CCol>
        <CCol md={6}><CFormSelect label="Bien" name="property_id" value={formData.property_id} onChange={handleChange}><option value="">-- Sélectionner --</option>{properties.map((p) => <option key={p.id} value={p.id}>{`${p.type} - ${p.address}, ${p.city}`}</option>)}</CFormSelect></CCol>
        <CCol md={4}><CFormInput type="text" name="month" label="Mois (ex: Janvier 2024)" value={formData.month} onChange={handleChange} required /></CCol>
        <CCol md={4}><CFormInput type="number" name="amount" label="Montant (€)" value={formData.amount} onChange={handleChange} required /></CCol>
        <CCol md={4}><CFormSelect label="Statut" name="status" value={formData.status} onChange={handleChange}><option value="pending">En attente</option><option value="paid">Payé</option><option value="late">En retard</option></CFormSelect></CCol>
        <CCol md={6}><CFormInput type="date" name="due_date" label="Date d'échéance" value={formData.due_date} onChange={handleChange} /></CCol>
        <CCol md={6}><CFormInput type="date" name="paid_date" label="Date de paiement" value={formData.paid_date} onChange={handleChange} /></CCol>
      </CrudModal>

      <DeleteModal
        visible={deleteModal}
        itemLabel={toDelete?.month}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </>
  )
}

export default Payments
