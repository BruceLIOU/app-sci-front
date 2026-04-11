import React, { useState, useEffect } from 'react'
import { CModal, CModalHeader, CModalTitle, CModalBody } from '@coreui/react'
import EditForms from '../forms/EditForms'
import ViewForms from '../forms/ViewForms'
import DeleteForms from '../forms/DeleteForms'
import CreateForms from '../forms/CreateForms'

interface ModalsProps {
  entities: string
  type: string | null
  modalVisible: boolean
  setModalVisible: (v: boolean) => void
  data: any[]
}

const Modals = ({ entities, type, modalVisible, setModalVisible, data }: ModalsProps) => {
  const [dataModal, setDataModal] = useState<{ title?: string; component?: React.ReactNode; size?: string }>({})

  useEffect(() => {
    switch (type) {
      case 'view':
        setDataModal({ title: 'Visualisation', size: 'xl', component: <ViewForms entities={entities} data={data} setModalVisible={setModalVisible} /> })
        break
      case 'create':
        setDataModal({ title: 'Création', size: 'xl', component: <CreateForms entities={entities} data={data} setModalVisible={setModalVisible} /> })
        break
      case 'edit':
        setDataModal({ title: 'Modification', size: 'xl', component: <EditForms entities={entities} data={data} setModalVisible={setModalVisible} /> })
        break
      case 'delete':
        setDataModal({ title: 'Suppression', size: 'lg', component: <DeleteForms entities={entities} data={data} setModalVisible={setModalVisible} /> })
        break
      default:
        break
    }
  }, [entities, type])

  return (
    <CModal size={dataModal.size as any} alignment="center" visible={modalVisible} onClose={() => setModalVisible(false)}>
      <CModalHeader><CModalTitle>{dataModal.title}</CModalTitle></CModalHeader>
      <CModalBody>{dataModal.component}</CModalBody>
    </CModal>
  )
}

export default Modals
