import React from 'react'
import { CFormInput, CFormSelect } from '@coreui/react'
import RequiredLabel from './RequiredLabel'

type InputProps = Omit<React.ComponentProps<typeof CFormInput>, 'label' | 'invalid' | 'feedbackInvalid'> & {
  label: string
  required?: boolean
  error?: string
}

type SelectProps = Omit<React.ComponentProps<typeof CFormSelect>, 'label' | 'invalid' | 'feedbackInvalid'> & {
  label: string
  required?: boolean
  error?: string
}

export const FormInputField: React.FC<InputProps> = ({ label, required = false, error, ...props }) => (
  <CFormInput
    {...props}
    required={required}
    label={<RequiredLabel text={label} required={required} />}
    invalid={Boolean(error)}
    feedbackInvalid={error}
  />
)

export const FormSelectField: React.FC<SelectProps> = ({ label, required = false, error, children, ...props }) => (
  <CFormSelect
    {...props}
    required={required}
    label={<RequiredLabel text={label} required={required} />}
    invalid={Boolean(error)}
    feedbackInvalid={error}
  >
    {children}
  </CFormSelect>
)
