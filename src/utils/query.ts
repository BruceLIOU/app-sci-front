const findProperty = (id: number, properties: any[]): string => {
  const p = properties.find((property) => property.id === id)
  if (!p) return 'Bien inconnu'
  return `${p.type} de ${p.area} m² à ${p.city}`
}

export default findProperty
