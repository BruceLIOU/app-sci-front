import React from 'react'
import { CButton, CButtonGroup, CBadge, CFormSelect, CTooltip } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilViewModule, cilList, cilViewColumn, cilFilterX } from '@coreui/icons'

// ─── Types exportés ────────────────────────────────────────────────────────────

export type ViewMode = 'vignette' | 'list' | 'grid'

export interface FilterConfig {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder: string
  width?: number
}

interface ViewControlBarProps {
  // Mode d'affichage (optionnel — non rendu si supportedModes est absent ou vide)
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  supportedModes?: ViewMode[]
  // Grille personnalisée (optionnel — visible uniquement si viewMode === 'grid')
  gridCols?: number
  onGridColsChange?: (cols: number) => void
  // Filtres
  filters?: FilterConfig[]
  hasActiveFilter?: boolean
  onResetFilters?: () => void
  // Compteur
  totalCount: number
  filteredCount?: number
  itemLabel?: string       // singulier, ex : "bien"
  itemLabelPlural?: string // pluriel, ex : "baux" (défaut : itemLabel + "s")
}

// ─── Icône grille colonnes ─────────────────────────────────────────────────────

const GridColIcon = ({ cols }: { cols: number }) => {
  const gap = 2
  const total = 28
  const colW = (total - gap * (cols - 1)) / cols
  return (
    <svg width={total} height={18} viewBox={`0 0 ${total} 18`} fill="currentColor">
      {Array.from({ length: cols }).map((_, i) => (
        <rect key={i} x={i * (colW + gap)} y={0} width={colW} height={18} rx={2} />
      ))}
    </svg>
  )
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const modeIcons: Record<ViewMode, any> = {
  vignette: cilViewModule,
  list: cilList,
  grid: cilViewColumn,
}

const modeTooltips: Record<ViewMode, string> = {
  vignette: 'Vignettes',
  list: 'Liste',
  grid: 'Grille personnalisée',
}

// ─── Composant ────────────────────────────────────────────────────────────────

const ViewControlBar: React.FC<ViewControlBarProps> = ({
  viewMode,
  onViewModeChange,
  supportedModes,
  gridCols,
  onGridColsChange,
  filters = [],
  hasActiveFilter = false,
  onResetFilters,
  totalCount,
  filteredCount,
  itemLabel = 'élément',
  itemLabelPlural,
}) => {
  const pluralLabel = itemLabelPlural ?? `${itemLabel}s`
  const showModes = (supportedModes?.length ?? 0) > 0 && !!onViewModeChange
  const showGridCols = viewMode === 'grid' && gridCols != null && !!onGridColsChange
  const showFilters = filters.length > 0
  const showSeparator = showModes && showFilters

  return (
    <div className="d-flex align-items-center flex-wrap gap-2 py-3 border-top border-bottom mb-4">
      {/* Boutons de mode d'affichage */}
      {showModes && (
        <CButtonGroup>
          {supportedModes!.map((mode) => (
            <CTooltip key={mode} content={modeTooltips[mode]}>
              <CButton
                color={viewMode === mode ? 'primary' : 'light'}
                onClick={() => onViewModeChange!(mode)}
              >
                <CIcon icon={modeIcons[mode]} />
              </CButton>
            </CTooltip>
          ))}
        </CButtonGroup>
      )}

      {/* Sélecteur de colonnes (mode grille) */}
      {showGridCols && (
        <CButtonGroup>
          {[1, 2, 3, 4].map((n) => (
            <CTooltip key={n} content={`${n} colonne${n > 1 ? 's' : ''}`}>
              <CButton
                color={gridCols === n ? 'primary' : 'light'}
                size="sm"
                onClick={() => onGridColsChange!(n)}
              >
                <GridColIcon cols={n} />
              </CButton>
            </CTooltip>
          ))}
        </CButtonGroup>
      )}

      {showSeparator && <div className="vr mx-1" />}

      {/* Filtres */}
      {filters.map((f, i) => (
        <CFormSelect
          key={i}
          size="sm"
          style={{ width: f.width ?? 160 }}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
        >
          <option value="">{f.placeholder}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </CFormSelect>
      ))}

      {/* Bouton reset + badge */}
      {hasActiveFilter && onResetFilters && filteredCount != null && (
        <CTooltip content="Réinitialiser les filtres">
          <CButton color="light" size="sm" onClick={onResetFilters}>
            <CIcon icon={cilFilterX} className="me-1" />
            <CBadge color="danger" shape="rounded-pill">
              {filteredCount}/{totalCount}
            </CBadge>
          </CButton>
        </CTooltip>
      )}

      {/* Compteur */}
      {!hasActiveFilter && (
        <small className="text-medium-emphasis ms-1">
          {totalCount} {totalCount > 1 ? pluralLabel : itemLabel}
        </small>
      )}
    </div>
  )
}

export default ViewControlBar
