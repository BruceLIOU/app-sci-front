import React from 'react'
import { CTableRow, CTableDataCell } from '@coreui/react'

interface TableEmptyRowProps {
  colSpan: number
  message?: string
}

const TableEmptyRow: React.FC<TableEmptyRowProps> = ({
  colSpan,
  message = 'Aucun élément enregistré',
}) => (
  <CTableRow>
    <CTableDataCell colSpan={colSpan} className="text-center text-muted">
      {message}
    </CTableDataCell>
  </CTableRow>
)

export default TableEmptyRow
