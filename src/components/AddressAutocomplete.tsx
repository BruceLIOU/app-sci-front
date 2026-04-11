import React, { useState, useEffect, useRef, useCallback } from 'react'
import { CFormInput, CFormLabel } from '@coreui/react'

interface AddressSuggestion {
  label: string
  name: string
  postcode: string
  city: string
  latitude: number
  longitude: number
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (data: { address: string; zipcode: string; city: string; latitude: string; longitude: string }) => void
  label?: string
  required?: boolean
}

const AddressAutocomplete = ({ value, onChange, onSelect, label = 'Adresse', required }: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const userActive = useRef(false)

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=6&autocomplete=1`,
      )
      const data = await res.json()
      const items: AddressSuggestion[] = (data.features || []).map((f: any) => ({
        label: f.properties.label,
        name: f.properties.name,
        postcode: f.properties.postcode,
        city: f.properties.city,
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
      }))
      setSuggestions(items)
      setOpen(items.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!userActive.current) return
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => fetchSuggestions(value), 300)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [value, fetchSuggestions])

  // Fermer la liste si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
  }

  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.name)
    onSelect({
      address: suggestion.name,
      zipcode: suggestion.postcode,
      city: suggestion.city,
      latitude: String(suggestion.latitude),
      longitude: String(suggestion.longitude),
    })
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {label && <CFormLabel>{label}{loading && <span className="ms-2 spinner-border spinner-border-sm text-secondary" role="status" />}</CFormLabel>}
      <CFormInput
        type="text"
        value={value}
        required={required}
        autoComplete="off"
        onChange={(e) => { userActive.current = true; onChange(e.target.value) }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Ex : 12 rue de la Paix, Paris"
      />
      {open && suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            zIndex: 1050,
            top: '100%',
            left: 0,
            right: 0,
            margin: 0,
            padding: 0,
            listStyle: 'none',
            backgroundColor: 'var(--cui-body-bg, #fff)',
            border: '1px solid var(--cui-border-color, #ccc)',
            borderRadius: '0 0 4px 4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(s)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--cui-border-color, #eee)' : 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cui-tertiary-bg, #f8f9fa)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AddressAutocomplete
