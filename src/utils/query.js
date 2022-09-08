import properties from './../data/data-properties.json'

const findProperty = (id) => {
  const propertyValue = properties.find((property) => property.id === id)
  return `${propertyValue.type} de ${propertyValue.area} m² à ${propertyValue.city}`
}

export default findProperty
