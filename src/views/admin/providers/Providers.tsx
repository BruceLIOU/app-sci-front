import { AppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import DeleteModal from "../../../components/DeleteModal";
import EntityTableCard from "../../../components/EntityTableCard";
import {
	FormInputField,
	FormSelectField,
	FormTextareaField,
} from "../../../components/FormFields";
import TableEmptyRow from "../../../components/TableEmptyRow";
import useIsAdmin from "../../../hooks/useIsAdmin";
import ProviderDataService from "../../../services/provider.service";

const SPECIALTY_OPTIONS = [
	"Plomberie",
	"Électricité",
	"Chauffage",
	"Serrurerie",
	"Peinture",
	"Nettoyage",
	"Maçonnerie",
	"Menuiserie",
	"Jardinage",
	"Autre",
];

const emptyForm = {
	name: "",
	company: "",
	specialty: "",
	phone: "",
	email: "",
	address: "",
	zipcode: "",
	city: "",
	notes: "",
};

const Providers = () => {
	const [items, setItems] = useState<any[]>([]);
	const [modalVisible, setModalVisible] = useState(false);
	const [deleteModal, setDeleteModal] = useState(false);
	const [editing, setEditing] = useState<any>(null);
	const [toDelete, setToDelete] = useState<any>(null);
	const [form, setForm] = useState<Record<string, string>>(emptyForm);
	const [submitError, setSubmitError] = useState("");
	const [filterSpecialty, setFilterSpecialty] = useState<string | undefined>();
	const isAdmin = useIsAdmin();

	const fetchAll = async () => {
		try {
			const r = await ProviderDataService.getAll();
			setItems(r.data);
		} catch (e: any) {
			console.error(e.message);
		}
	};

	useEffect(() => {
		fetchAll();
	}, []);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const openCreate = () => {
		setEditing(null);
		setForm(emptyForm);
		setSubmitError("");
		setModalVisible(true);
	};

	const openEdit = (item: any) => {
		setEditing(item);
		setForm({
			name: item.name || "",
			company: item.company || "",
			specialty: item.specialty || "",
			phone: item.phone || "",
			email: item.email || "",
			address: item.address || "",
			zipcode: item.zipcode || "",
			city: item.city || "",
			notes: item.notes || "",
		});
		setSubmitError("");
		setModalVisible(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const fd = new FormData();
		for (const [k, v] of Object.entries(form)) {
			if (v !== "" && v !== null) fd.append(k, v);
		}
		try {
			if (editing) await ProviderDataService.update(editing.id, fd);
			else await ProviderDataService.create(fd);
			setModalVisible(false);
			fetchAll();
		} catch (e: any) {
			setSubmitError(
				e?.response?.data?.message || "Erreur lors de la sauvegarde.",
			);
		}
	};

	const handleDelete = async () => {
		if (!toDelete) return;
		try {
			await ProviderDataService.delete(toDelete.id);
			setDeleteModal(false);
			fetchAll();
		} catch (e: any) {
			console.error(e.message);
		}
	};

	const filtered = filterSpecialty
		? items.filter((i) => i.specialty === filterSpecialty)
		: items;

	return (
		<>
			<div className="mb-4">
				<Card className="app-page-hero border-0">
					<CardContent className="p-0">
						<div className="app-page-kicker mb-3">Gestion du patrimoine</div>
						<h2 className="mb-2 app-display-title">Carnet prestataires</h2>
						<p className="app-page-description mb-3">
							Gérez vos artisans et prestataires de services : coordonnées,
							spécialité et notes.
						</p>
						<div className="flex flex-wrap items-center gap-2">
							<span className="app-filter-chip">
								{items.length} prestataire{items.length > 1 ? "s" : ""}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			<EntityTableCard
				title="Carnet prestataires"
				addLabel="Ajouter"
				onAdd={openCreate}
				headerActions={
					<Select
						value={filterSpecialty ?? "__all__"}
						onValueChange={(v) =>
							setFilterSpecialty(v === "__all__" ? undefined : v)
						}
					>
						<SelectTrigger className="h-8 w-44 text-sm">
							<SelectValue placeholder="Toutes les spécialités" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__all__">Toutes les spécialités</SelectItem>
							{SPECIALTY_OPTIONS.map((s) => (
								<SelectItem key={s} value={s}>
									{s}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				}
			>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nom</TableHead>
							<TableHead>Société</TableHead>
							<TableHead>Spécialité</TableHead>
							<TableHead>Téléphone</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Ville</TableHead>
							{isAdmin && <TableHead className="text-right">Actions</TableHead>}
						</TableRow>
					</TableHeader>
					<TableBody>
						{filtered.length === 0 ? (
							<TableEmptyRow
								colSpan={7}
								message="Aucun prestataire enregistré"
							/>
						) : (
							filtered.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="font-medium">{item.name}</TableCell>
									<TableCell>{item.company || "—"}</TableCell>
									<TableCell>{item.specialty || "—"}</TableCell>
									<TableCell>
										{item.phone ? (
											<a
												href={`tel:${item.phone}`}
												className="text-primary hover:underline"
											>
												{item.phone}
											</a>
										) : (
											"—"
										)}
									</TableCell>
									<TableCell>
										{item.email ? (
											<a
												href={`mailto:${item.email}`}
												className="text-primary hover:underline"
											>
												{item.email}
											</a>
										) : (
											"—"
										)}
									</TableCell>
									<TableCell>{item.city || "—"}</TableCell>
									{isAdmin && (
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => openEdit(item)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => {
													setToDelete(item);
													setDeleteModal(true);
												}}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</TableCell>
									)}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</EntityTableCard>

			<Dialog
				open={modalVisible}
				onOpenChange={(o) => !o && setModalVisible(false)}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{editing ? "Modifier le prestataire" : "Nouveau prestataire"}
						</DialogTitle>
					</DialogHeader>
					<form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
						{submitError && (
							<div className="col-span-2">
								<AppAlert color="danger">{submitError}</AppAlert>
							</div>
						)}
						<FormInputField
							type="text"
							name="name"
							label="Nom *"
							placeholder="Prénom Nom de l'artisan"
							value={form.name}
							onChange={handleChange}
							required
						/>
						<FormInputField
							type="text"
							name="company"
							label="Société"
							placeholder="Nom de l'entreprise"
							value={form.company}
							onChange={handleChange}
						/>
						<div>
							<FormSelectField
								label="Spécialité"
								name="specialty"
								value={form.specialty}
								onChange={handleChange}
							>
								<option value="">-- Sélectionner --</option>
								{SPECIALTY_OPTIONS.map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</FormSelectField>
						</div>
						<FormInputField
							type="text"
							name="phone"
							label="Téléphone"
							placeholder="06 00 00 00 00"
							value={form.phone}
							onChange={handleChange}
						/>
						<FormInputField
							type="email"
							name="email"
							label="Email"
							placeholder="contact@exemple.fr"
							value={form.email}
							onChange={handleChange}
						/>
						<FormInputField
							type="text"
							name="city"
							label="Ville"
							value={form.city}
							onChange={handleChange}
						/>
						<FormInputField
							type="text"
							name="zipcode"
							label="Code postal"
							value={form.zipcode}
							onChange={handleChange}
						/>
						<FormInputField
							type="text"
							name="address"
							label="Adresse"
							value={form.address}
							onChange={handleChange}
						/>
						<div className="col-span-2">
							<FormTextareaField
								name="notes"
								label="Notes"
								rows={3}
								placeholder="Informations complémentaires, tarifs, disponibilités..."
								value={form.notes}
								onChange={handleChange}
							/>
						</div>
						<div className="col-span-2 flex justify-end gap-2 border-t pt-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setModalVisible(false)}
							>
								Annuler
							</Button>
							<Button type="submit">{editing ? "Modifier" : "Créer"}</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			<DeleteModal
				visible={deleteModal}
				itemLabel={toDelete ? `le prestataire "${toDelete.name}"` : undefined}
				onClose={() => setDeleteModal(false)}
				onConfirm={handleDelete}
			/>
		</>
	);
};

export default Providers;
