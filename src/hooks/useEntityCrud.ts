import { useCallback, useEffect, useState } from "react";
import type { z } from "zod";
import { toFormData } from "../utils/formData";

interface CrudService {
	// biome-ignore lint/suspicious/noExplicitAny: type retour service générique
	getAll: () => Promise<{ data: any[] }>;
	// biome-ignore lint/suspicious/noExplicitAny: type retour service générique
	create: (data: FormData) => Promise<any>;
	// biome-ignore lint/suspicious/noExplicitAny: type retour service générique
	update: (id: number, data: FormData) => Promise<any>;
	// biome-ignore lint/suspicious/noExplicitAny: type retour service générique
	delete: (id: number) => Promise<any>;
}

interface UseEntityCrudOptions<TForm> {
	service: CrudService;
	emptyForm: TForm;
	// biome-ignore lint/suspicious/noExplicitAny: item générique non typé
	toForm?: (item: any) => TForm;
	validationSchema?: z.ZodType;
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
// biome-ignore lint/suspicious/noExplicitAny: contrainte générique TForm
function useEntityCrud<TForm extends Record<string, any>>({
	service,
	emptyForm,
	toForm,
	validationSchema,
}: UseEntityCrudOptions<TForm>) {
	// biome-ignore lint/suspicious/noExplicitAny: liste d'entités non typée
	const [items, setItems] = useState<any[]>([]);
	const [modalVisible, setModalVisible] = useState(false);
	const [deleteModal, setDeleteModal] = useState(false);
	// biome-ignore lint/suspicious/noExplicitAny: entité en cours d'édition
	const [editing, setEditing] = useState<any>(null);
	// biome-ignore lint/suspicious/noExplicitAny: entité en cours de suppression
	const [toDelete, setToDelete] = useState<any>(null);
	const [form, setForm] = useState<TForm>(emptyForm);
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const mapZodIssues = (error: z.ZodError): Record<string, string> => {
		return error.issues.reduce(
			(acc, issue) => {
				const key = String(issue.path[0] ?? "_");
				if (!acc[key]) acc[key] = issue.message;
				return acc;
			},
			{} as Record<string, string>,
		);
	};

	const fetchAll = useCallback(() => {
		service
			.getAll()
			.then((r) => setItems(r.data))
			.catch(console.error);
	}, [service]);

	useEffect(() => {
		fetchAll();
	}, [fetchAll]);

	const openCreate = useCallback(() => {
		setEditing(null);
		setForm(emptyForm);
		setFormErrors({});
		setModalVisible(true);
	}, [emptyForm]);

	const openEdit = useCallback(
		// biome-ignore lint/suspicious/noExplicitAny: item générique
		(item: any) => {
			setEditing(item);
			setForm(toForm ? toForm(item) : { ...emptyForm, ...item });
			setFormErrors({});
			setModalVisible(true);
		},
		[emptyForm, toForm],
	);

	// biome-ignore lint/suspicious/noExplicitAny: item générique
	const openDelete = useCallback((item: any) => {
		setToDelete(item);
		setDeleteModal(true);
	}, []);

	const handleChange = useCallback(
		// biome-ignore lint/suspicious/noExplicitAny: ChangeEvent multi-input
		(e: React.ChangeEvent<any>) => {
			const field = e.target.name;
			if (formErrors[field]) {
				setFormErrors((prev) => ({ ...prev, [field]: "" }));
			}
			setForm((prev) => ({ ...prev, [field]: e.target.value }));
		},
		[formErrors],
	);

	const setFieldValue = useCallback(
		// biome-ignore lint/suspicious/noExplicitAny: valeur champ générique
		(field: string, value: any) => {
			if (formErrors[field]) {
				setFormErrors((prev) => ({ ...prev, [field]: "" }));
			}
			setForm((prev) => ({ ...prev, [field]: value }));
		},
		[formErrors],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: mapZodIssues défini inline
	const validateForm = useCallback(
		// biome-ignore lint/suspicious/noExplicitAny: payload de validation générique
		(payload?: Record<string, any>): boolean => {
			if (!validationSchema) return true;
			const parsed = validationSchema.safeParse(
				payload ? { ...form, ...payload } : form,
			);
			if (!parsed.success) {
				setFormErrors(mapZodIssues(parsed.error));
				return false;
			}
			setFormErrors({});
			return true;
		},
		[validationSchema, form],
	);

	const handleSubmit = useCallback(
		// biome-ignore lint/suspicious/noExplicitAny: extraData générique
		async (e: React.FormEvent, extraData?: Record<string, any>) => {
			e.preventDefault();
			if (!validateForm(extraData)) return;

			const fd = toFormData({ ...form, ...extraData });
			try {
				if (editing) await service.update(editing.id, fd);
				else await service.create(fd);
				setModalVisible(false);
				fetchAll();
				// biome-ignore lint/suspicious/noExplicitAny: err axios non typé
			} catch (err: any) {
				const apiErrors = err?.response?.data?.errors;
				if (apiErrors && typeof apiErrors === "object") {
					const nextErrors: Record<string, string> = {};
					for (const [k, v] of Object.entries(apiErrors)) {
						nextErrors[k] = Array.isArray(v) ? String(v[0]) : String(v);
					}
					setFormErrors(nextErrors);
				}
				console.error(err);
			}
		},
		[editing, form, service, fetchAll, validateForm],
	);

	const handleDelete = useCallback(async () => {
		if (!toDelete) return;
		try {
			await service.delete(toDelete.id);
			setDeleteModal(false);
			fetchAll();
		} catch (err) {
			console.error(err);
		}
	}, [toDelete, service, fetchAll]);

	return {
		items,
		modalVisible,
		setModalVisible,
		deleteModal,
		setDeleteModal,
		editing,
		toDelete,
		form,
		formErrors,
		setFormErrors,
		validateForm,
		setForm,
		handleChange,
		setFieldValue,
		openCreate,
		openEdit,
		openDelete,
		handleSubmit,
		handleDelete,
		fetchAll,
	};
}

export default useEntityCrud;
