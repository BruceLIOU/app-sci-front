import { AppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Trash2, Wrench } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { DateUtils } from "src/utils/date";
import DeleteModal from "../../../components/DeleteModal";
import EntityTableCard from "../../../components/EntityTableCard";
import {
	FormInputField,
	FormSelectField,
	FormTextareaField,
} from "../../../components/FormFields";
import { StatusBadge } from "../../../components/StatusBadge";
import TableEmptyRow from "../../../components/TableEmptyRow";
import useIsAdmin from "../../../hooks/useIsAdmin";
import MaintenanceDataService from "../../../services/maintenance.service";
import PropertyDataService from "../../../services/property.service";
import TenantDataService from "../../../services/tenant.service";

const TYPE_LABELS: Record<string, string> = {
	plomberie: "Plomberie",
	electricite: "Électricité",
	chauffage: "Chauffage",
	serrurerie: "Serrurerie",
	peinture: "Peinture",
	nettoyage: "Nettoyage",
	travaux: "Travaux",
	autre: "Autre",
};

const PRIORITY_LABELS: Record<string, string> = {
	low: "Faible",
	medium: "Normal",
	high: "Élevée",
	urgent: "Urgent",
};

const STATUS_LABELS: Record<string, string> = {
	open: "Ouvert",
	in_progress: "En cours",
	resolved: "Résolu",
	closed: "Clôturé",
};

const emptyForm = {
	property_id: "",
	tenant_id: "",
	title: "",
	description: "",
	type: "autre",
	priority: "medium",
	status: "open",
	reported_at: "",
	resolved_at: "",
	provider_name: "",
	provider_phone: "",
	estimated_cost: "",
	actual_cost: "",
	notes: "",
};

const Maintenance = () => {
	const [items, setItems] = useState<any[]>([]);
	const [properties, setProperties] = useState<any[]>([]);
	const [tenants, setTenants] = useState<any[]>([]);
	const [modalVisible, setModalVisible] = useState(false);
	const [deleteModal, setDeleteModal] = useState(false);
	const [editing, setEditing] = useState<any>(null);
	const [toDelete, setToDelete] = useState<any>(null);
	const [form, setForm] = useState<Record<string, string>>(emptyForm);
	const [submitError, setSubmitError] = useState("");
	const [filterStatus, setFilterStatus] = useState("");
	const [filterPriority, setFilterPriority] = useState("");
	const isAdmin = useIsAdmin();

	const fetchAll = async () => {
		try {
			const r = await MaintenanceDataService.getAll();
			setItems(r.data);
		} catch (e: any) {
			console.error(e.message);
		}
	};

	useEffect(() => {
		fetchAll();
		PropertyDataService.getAll().then((r) => setProperties(r.data));
		TenantDataService.getAll().then((r) => setTenants(r.data));
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
		setForm({
			...emptyForm,
			reported_at: new Date().toISOString().slice(0, 10),
		});
		setSubmitError("");
		setModalVisible(true);
	};

	const openEdit = (item: any) => {
		setEditing(item);
		setForm({
			property_id: item.property_id || "",
			tenant_id: item.tenant_id || "",
			title: item.title || "",
			description: item.description || "",
			type: item.type || "autre",
			priority: item.priority || "medium",
			status: item.status || "open",
			reported_at: item.reported_at || "",
			resolved_at: item.resolved_at || "",
			provider_name: item.provider_name || "",
			provider_phone: item.provider_phone || "",
			estimated_cost: item.estimated_cost || "",
			actual_cost: item.actual_cost || "",
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
			if (editing) await MaintenanceDataService.update(editing.id, fd);
			else await MaintenanceDataService.create(fd);
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
			await MaintenanceDataService.delete(toDelete.id);
			setDeleteModal(false);
			fetchAll();
		} catch (e: any) {
			console.error(e.message);
		}
	};

	const filtered = items.filter((i) => {
		if (filterStatus && i.status !== filterStatus) return false;
		if (filterPriority && i.priority !== filterPriority) return false;
		return true;
	});

	const totalOpen = items.filter((i) => i.status === "open").length;
	const totalInProgress = items.filter(
		(i) => i.status === "in_progress",
	).length;
	const totalCost = items.reduce(
		(s, i) => s + Number.parseFloat(i.actual_cost || 0),
		0,
	);

	return (
		<>
			<div className="mb-4">
				<Card className="app-page-hero border-0">
					<CardContent className="p-0">
						<div className="app-page-kicker mb-3">Gestion du patrimoine</div>
						<h2 className="mb-2 app-display-title">Maintenance & travaux</h2>
						<p className="app-page-description mb-3">
							Signalez et suivez les interventions sur vos biens : plomberie,
							électricité, travaux et entretien.
						</p>
						<div className="flex flex-wrap items-center gap-2">
							<span className="app-filter-chip">
								{items.length} demande{items.length > 1 ? "s" : ""}
							</span>
							<span className="app-filter-chip">
								{totalOpen} ouverte{totalOpen > 1 ? "s" : ""}
							</span>
							<span className="app-filter-chip">
								{totalInProgress} en cours
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Header KPIs */}
			<div className="grid grid-cols-3 gap-3 mb-4 text-center">
				<Card className="p-4">
					<div className="text-2xl font-bold text-rose-500">{totalOpen}</div>
					<div className="text-sm text-muted-foreground">Ouverts</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-amber-500">
						{totalInProgress}
					</div>
					<div className="text-sm text-muted-foreground">En cours</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold">{totalCost.toFixed(0)} €</div>
					<div className="text-sm text-muted-foreground">Coût total réel</div>
				</Card>
			</div>

			<EntityTableCard
				title="Maintenance & travaux"
				addLabel="Signaler"
				onAdd={openCreate}
				headerActions={
					<>
						<select
							className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
							value={filterStatus}
							onChange={(e) => setFilterStatus(e.target.value)}
						>
							<option value="">Tous les statuts</option>
							{Object.entries(STATUS_LABELS).map(([v, l]) => (
								<option key={v} value={v}>
									{l}
								</option>
							))}
						</select>
						<select
							className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
							value={filterPriority}
							onChange={(e) => setFilterPriority(e.target.value)}
						>
							<option value="">Toutes les priorités</option>
							{Object.entries(PRIORITY_LABELS).map(([v, l]) => (
								<option key={v} value={v}>
									{l}
								</option>
							))}
						</select>
					</>
				}
			>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Bien</TableHead>
							<TableHead>Titre</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Priorité</TableHead>
							<TableHead>Statut</TableHead>
							<TableHead>Prestataire</TableHead>
							<TableHead>Coût</TableHead>
							<TableHead>Date</TableHead>
							{isAdmin && <TableHead className="text-right">Actions</TableHead>}
						</TableRow>
					</TableHeader>
					<TableBody>
						{filtered.length === 0 ? (
							<TableEmptyRow
								colSpan={9}
								message="Aucune intervention enregistrée"
							/>
						) : (
							filtered.map((item) => (
								<TableRow key={item.id}>
									<TableCell>
										{item.Property
											? `${item.Property.type} — ${item.Property.city}`
											: "—"}
									</TableCell>
									<TableCell className="font-medium">{item.title}</TableCell>
									<TableCell>{TYPE_LABELS[item.type] || item.type}</TableCell>
									<TableCell>
										<StatusBadge value={item.priority} />
									</TableCell>
									<TableCell>
										<StatusBadge value={item.status} />
									</TableCell>
									<TableCell>{item.provider_name || "—"}</TableCell>
									<TableCell>
										{item.actual_cost
											? `${Number.parseFloat(item.actual_cost).toFixed(0)} €`
											: item.estimated_cost
												? `~${Number.parseFloat(item.estimated_cost).toFixed(0)} €`
												: "—"}
									</TableCell>
									<TableCell>
										{DateUtils.formatShort(item.reported_at) ||
											DateUtils.formatShort(item.createdAt) ||
											"—"}
									</TableCell>
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

			{/* Create/Edit modal */}
			<Dialog
				open={modalVisible}
				onOpenChange={(o) => !o && setModalVisible(false)}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{editing
								? "Modifier l'intervention"
								: "Signaler une intervention"}
						</DialogTitle>
					</DialogHeader>
					<form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
						{submitError && (
							<div className="col-span-2">
								<AppAlert color="danger">{submitError}</AppAlert>
							</div>
						)}
						<FormSelectField
							label="Bien *"
							name="property_id"
							value={form.property_id}
							onChange={handleChange}
						>
							<option value="">-- Sélectionner --</option>
							{properties.map((p) => (
								<option key={p.id} value={p.id}>
									{p.type} — {p.address}, {p.city}
								</option>
							))}
						</FormSelectField>
						<FormSelectField
							label="Locataire"
							name="tenant_id"
							value={form.tenant_id}
							onChange={handleChange}
						>
							<option value="">-- Aucun --</option>
							{tenants.map((t) => (
								<option key={t.id} value={t.id}>
									{t.civility} {t.firstname} {t.lastname}
								</option>
							))}
						</FormSelectField>
						<div className="col-span-2">
							<FormInputField
								type="text"
								name="title"
								label="Titre *"
								placeholder="Description courte du problème"
								value={form.title}
								onChange={handleChange}
								required
							/>
						</div>
						<FormSelectField
							label="Type"
							name="type"
							value={form.type}
							onChange={handleChange}
						>
							{Object.entries(TYPE_LABELS).map(([v, l]) => (
								<option key={v} value={v}>
									{l}
								</option>
							))}
						</FormSelectField>
						<FormSelectField
							label="Priorité"
							name="priority"
							value={form.priority}
							onChange={handleChange}
						>
							{Object.entries(PRIORITY_LABELS).map(([v, l]) => (
								<option key={v} value={v}>
									{l}
								</option>
							))}
						</FormSelectField>
						<FormSelectField
							label="Statut"
							name="status"
							value={form.status}
							onChange={handleChange}
						>
							{Object.entries(STATUS_LABELS).map(([v, l]) => (
								<option key={v} value={v}>
									{l}
								</option>
							))}
						</FormSelectField>
						<FormInputField
							type="date"
							name="reported_at"
							label="Date signalement"
							value={form.reported_at}
							onChange={handleChange}
						/>
						<FormInputField
							type="date"
							name="resolved_at"
							label="Date résolution"
							value={form.resolved_at}
							onChange={handleChange}
						/>
						<FormInputField
							type="text"
							name="provider_name"
							label="Prestataire"
							placeholder="Nom de l'artisan"
							value={form.provider_name}
							onChange={handleChange}
						/>
						<FormInputField
							type="text"
							name="provider_phone"
							label="Tél prestataire"
							placeholder="Téléphone"
							value={form.provider_phone}
							onChange={handleChange}
						/>
						<FormInputField
							type="number"
							name="estimated_cost"
							label="Coût estimé (€)"
							value={form.estimated_cost}
							onChange={handleChange}
						/>
						<FormInputField
							type="number"
							name="actual_cost"
							label="Coût réel (€)"
							value={form.actual_cost}
							onChange={handleChange}
						/>
						<div className="col-span-2">
							<FormTextareaField
								name="description"
								label="Description"
								rows={3}
								placeholder="Détails du problème..."
								value={form.description}
								onChange={handleChange}
							/>
						</div>
						<div className="col-span-2">
							<FormTextareaField
								name="notes"
								label="Notes internes"
								rows={2}
								placeholder="Notes..."
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
				itemLabel={toDelete ? `l'intervention "${toDelete.title}"` : undefined}
				onClose={() => setDeleteModal(false)}
				onConfirm={handleDelete}
			/>
		</>
	);
};

export default Maintenance;
