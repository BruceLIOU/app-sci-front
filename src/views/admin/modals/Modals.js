/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

import { CModal, CModalHeader, CModalTitle, CModalBody } from '@coreui/react'

import EditForms from '../forms/EditForms'
import ViewForms from '../forms/ViewForms'
import DeleteForms from '../forms/DeleteForms'
import CreateForms from '../forms/CreateForms'

const Modals = ({ entities, type, modalVisible, setModalVisible, data }) => {
  const [dataModal, setDataModal] = useState({})

  useEffect(() => {
    switch (type) {
      case 'view':
        setDataModal({
          title: 'Visualisation',
          component: (
            <ViewForms
              entities={entities === 'tenants' ? 'tenants' : 'properties'}
              data={data}
              setModalVisible={setModalVisible}
            />
          ),
          size: 'xl',
        })
        break
      case 'create':
        setDataModal({
          title: 'Création',
          component: (
            <CreateForms
              entities={entities === 'tenants' ? 'tenants' : 'properties'}
              data={data}
              setModalVisible={setModalVisible}
            />
          ),
          size: 'xl',
        })
        break
      case 'edit':
        setDataModal({
          title: 'Modification',
          component: (
            <EditForms
              entities={entities === 'tenants' ? 'tenants' : 'properties'}
              data={data}
              setModalVisible={setModalVisible}
            />
          ),
          size: 'xl',
        })
        break
      case 'delete':
        setDataModal({
          title: 'Suppresion',
          component: (
            <DeleteForms
              entities={entities === 'tenants' ? 'tenants' : 'properties'}
              data={data}
              setModalVisible={setModalVisible}
            />
          ),
          size: 'lg',
        })
        break
      default:
        break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities, type])

  return (
    <CModal
      size={dataModal.size}
      alignment="center"
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
    >
      <CModalHeader>
        <CModalTitle>{dataModal.title}</CModalTitle>
      </CModalHeader>
      <CModalBody>{dataModal.component}</CModalBody>
    </CModal>
  )
}
Modals.propTypes = {
  entities: PropTypes.any,
  type: PropTypes.any,
  modalVisible: PropTypes.any,
  setModalVisible: PropTypes.any,
  data: PropTypes.any,
}

export default Modals
