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
  <CTableRow className="app-table-empty-row">
    <CTableDataCell colSpan={colSpan} className="text-center text-muted py-5">
      {message}
    </CTableDataCell>
  </CTableRow>
)

export default TableEmptyRow
