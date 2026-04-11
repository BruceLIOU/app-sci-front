/**
 * Convertit un objet en FormData.
 * Les valeurs null/undefined sont ignorées.
 */
export const toFormData = (obj: Record<string, any>): FormData => {
  const fd = new FormData()
  Object.entries(obj).forEach(([k, v]) => {
    if (v != null) fd.append(k, String(v))
  })
  return fd
}
