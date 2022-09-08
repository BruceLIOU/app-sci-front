/* eslint-disable react/no-unknown-property */
import React, { useRef, useState } from 'react'

import PropTypes from 'prop-types'

import { CToast, CToastBody, CToastClose, CToastHeader, CToaster } from '@coreui/react'

const Toasts = ({ type, data, message, toast }) => {
  console.log('Toast')
  const toaster = useRef()
  const exampleToast = (
    <CToast title="CoreUI for React.js">
      <CToastHeader closeButton>
        <svg
          className="rounded me-2"
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          focusable="false"
          role="img"
        >
          <rect width="100%" height="100%" fill="#007aff"></rect>
        </svg>
        <strong className="me-auto">{`${
          type === 'success' ? 'Félicitations' : "Une erreur s'est produite"
        }`}</strong>
        {/* <small>7 min ago</small> */}
      </CToastHeader>
      <CToastBody>{message}</CToastBody>
    </CToast>
  )

  return <CToaster ref={toaster} push={toast} placement="top-end" />
}

Toasts.propTypes = {
  type: PropTypes.any,
  data: PropTypes.any,
  message: PropTypes.any,
  toast: PropTypes.any,
}

export default Toasts
