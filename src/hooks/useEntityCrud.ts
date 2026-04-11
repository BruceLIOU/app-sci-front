import { useState, useEffect, useCallback } from 'react'
import { toFormData } from '../utils/formData'

interface CrudService {
  getAll: () => Promise<{ data: any[] }>
  create: (data: FormData) => Promise<any>
  update: (id: number, data: FormData) => Promise<any>
  delete: (id: number) => Promise<any>
}

interface UseEntityCrudOptions<TForm> {
  service: CrudService
  emptyForm: TForm
  toForm?: (item: any) => TForm
}

/**
 * Hook générique pour la gestion CRUD d'une entité.
 *
 * Gère : liste, modal create/edit, modal suppression, soumission, suppression.
 *
 * @example
 * const {
 *   items, modalVisible, deleteModal, editing, toDelete, form,
 *   setForm, handleChange, openCreate, openEdit, openDelete,
 *   handleSubmit, handleDelete, setModalVisible, setDeleteModal,
 * } = useEntityCrud({
 *   service: ChargeDataService,
 *   emptyForm,
 *   toForm: (c) => ({ property_id: c.property_id || '', ... }),
 * })
 */
function useEntityCrud<TForm extends Record<string, any>>({
  service,
  emptyForm,
  toForm,
}: UseEntityCrudOptions<TForm>) {
  const [items, setItems] = useState<any[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [toDelete, setToDelete] = useState<any>(null)
  const [form, setForm] = useState<TForm>(emptyForm)

  const fetchAll = useCallback(() => {
    service.getAll().then((r) => setItems(r.data)).catch(console.error)
  }, [service])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openCreate = useCallback(() => {
    setEditing(null)
    setForm(emptyForm)
    setModalVisible(true)
  }, [emptyForm])

  const openEdit = useCallback((item: any) => {
    setEditing(item)
    setForm(toForm ? toForm(item) : { ...emptyForm, ...item })
    setModalVisible(true)
  }, [emptyForm, toForm])

  const openDelete = useCallback((item: any) => {
    setToDelete(item)
    setDeleteModal(true)
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<any>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent, extraData?: Record<string, any>) => {
    e.preventDefault()
    const fd = toFormData({ ...form, ...extraData })
    try {
      if (editing) await service.update(editing.id, fd)
      else await service.create(fd)
      setModalVisible(false)
      fetchAll()
    } catch (err) { console.error(err) }
  }, [editing, form, service, fetchAll])

  const handleDelete = useCallback(async () => {
    if (!toDelete) return
    try {
      await service.delete(toDelete.id)
      setDeleteModal(false)
      fetchAll()
    } catch (err) { console.error(err) }
  }, [toDelete, service, fetchAll])

  return {
    items,
    modalVisible,
    setModalVisible,
    deleteModal,
    setDeleteModal,
    editing,
    toDelete,
    form,
    setForm,
    handleChange,
    openCreate,
    openEdit,
    openDelete,
    handleSubmit,
    handleDelete,
    fetchAll,
  }
}

export default useEntityCrud
