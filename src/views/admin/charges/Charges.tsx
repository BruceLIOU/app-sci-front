import { AppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RefreshCw } from "lucide-react";
import React, { useState, useEffect } from "react";
import { DateUtils } from "src/utils/date";
import ActionButtons from "../../../components/ActionButtons";
import CrudModal from "../../../components/CrudModal";
import DeleteModal from "../../../components/DeleteModal";
import EntityTableCard from "../../../components/EntityTableCard";
import {
	FormInputField,
	FormSelectField,
} from "../../../components/FormFields";
import StatCard from "../../../components/StatCard";
import TableEmptyRow from "../../../components/TableEmptyRow";
import ViewControlBar from "../../../components/ViewControlBar";
import useEntityCrud from "../../../hooks/useEntityCrud";
import ChargeDataService from "../../../services/charge.service";
import PropertyDataService from "../../../services/property.service";
import { chargeFormSchema } from "../../../validation/schemas";

const typeLabel: Record<string, string> = {
	assurance: "Assurance",
	taxe_fonciere: "Taxe foncière",
	entretien: "Entretien",
	travaux: "Travaux",
	charges_copro: "Charges copro",
	frais_gestion: "Frais gestion",
	autre: "Autre",
};
const typeBadgeClass: Record<string, string> = {
	assurance:
		"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-teal-100 text-teal-700",
	taxe_fonciere:
		"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700",
	entretien:
		"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700",
	travaux:
		"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-rose-100 text-rose-700",
	charges_copro:
		"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600",
	frais_gestion:
		"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-900 text-white",
	autre:
		"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600",
};
const freqLabel: Record<string, string> = {
	unique: "Unique",
	mensuel: "Mensuel",
	trimestriel: "Trimestriel",
	annuel: "Annuel",
};

const emptyForm = {
	property_id: "",
	type: "autre",
	description: "",
	amount: "",
	date: "",
	frequency: "unique",
};

const Charges = () => {
	const [properties, setProperties] = useState<any[]>([]);
	const [filterType, setFilterType] = useState("");
	const [filterFrequency, setFilterFrequency] = useState("");
	const [syncing, setSyncing] = useState(false);
	const [syncAlert, setSyncAlert] = useState<{
		type: "success" | "danger";
		message: string;
	} | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
	const [bulkLoading, setBulkLoading] = useState(false);
	const [bulkAlert, setBulkAlert] = useState<{
		type: "success" | "danger";
		message: string;
	} | null>(null);

	const {
		items: charges,
		modalVisible,
		setModalVisible,
		deleteModal,
		setDeleteModal,
		editing,
		toDelete,
		form,
		formErrors,
		handleChange,
		openCreate,
		openEdit,
		openDelete,
		handleSubmit,
		handleDelete,
		fetchAll,
	} = useEntityCrud({
		service: ChargeDataService,
		emptyForm,
		validationSchema: chargeFormSchema,
		toForm: (c) => ({
			property_id: c.property_id || "",
			type: c.type,
			description: c.description || "",
			amount: c.amount,
			date: c.date,
			frequency: c.frequency,
		}),
	});

	useEffect(() => {
		PropertyDataService.getAll().then((r) => setProperties(r.data));
	}, []);

	const handleSyncMatera = async () => {
		setSyncing(true);
		setSyncAlert(null);
		try {
			const res = await ChargeDataService.syncMatera();
			const { created, skipped, errors } = res.data;
			if (errors.length > 0) {
				setSyncAlert({
					type: "danger",
					message: `Sync terminée avec erreurs — créées : ${created}, ignorées : ${skipped}. Erreur : ${errors[0]}`,
				});
			} else if (created === 0) {
				setSyncAlert({
					type: "success",
					message: `Aucun nouvel email MATERA détecté (${skipped} déjà traité(s)).`,
				});
			} else {
				setSyncAlert({
					type: "success",
					message: `${created} charge(s) créée(s) automatiquement depuis MATERA !`,
				});
				window.location.reload();
			}
		} catch (e: any) {
			setSyncAlert({
				type: "danger",
				message:
					e.response?.data?.message ||
					"Erreur lors de la synchronisation MATERA.",
			});
		} finally {
			setSyncing(false);
		}
	};

	const hasFilter = filterType !== "" || filterFrequency !== "";
	const filtered = charges.filter((c) => {
		if (filterType && c.type !== filterType) return false;
		if (filterFrequency && c.frequency !== filterFrequency) return false;
		return true;
	});
	const total = filtered.reduce(
		(s, c) => s + Number.parseFloat(c.amount || 0),
		0,
	);
	const totalAnnual = charges.reduce((s, c) => {
		const a = Number.parseFloat(c.amount || 0);
		if (c.frequency === "mensuel") return s + a * 12;
		if (c.frequency === "trimestriel") return s + a * 4;
		return s + a;
	}, 0);

	const isAllSelected =
		filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

	const toggleSelectAll = () => {
		if (isAllSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(filtered.map((c) => c.id)));
		}
	};

	const toggleSelect = (id: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleBulkDelete = async () => {
		setBulkLoading(true);
		try {
			await ChargeDataService.bulkDelete([...selectedIds]);
			const count = selectedIds.size;
			setSelectedIds(new Set());
			fetchAll();
			setBulkAlert({
				type: "success",
				message: `${count} charge(s) supprimée(s).`,
			});
		} catch {
			setBulkAlert({
				type: "danger",
				message: "Erreur lors de la suppression.",
			});
		} finally {
			setBulkLoading(false);
			setBulkDeleteModal(false);
		}
	};

	return (
		<>
			<div className="grid grid-cols-12 gap-4 mb-4 text-center justify-center">
				{Object.entries(
					charges.reduce((acc: Record<string, number>, c) => {
						acc[c.type] = (acc[c.type] || 0) + Number.parseFloat(c.amount || 0);
						return acc;
					}, {}),
				)
					.slice(0, 3)
					.map(([type, amount]) => (
						<StatCard
							key={type}
							value={`${(amount as number).toFixed(2)} €`}
							label={typeLabel[type]}
							color="secondary"
						/>
					))}
				<StatCard
					value={`${totalAnnual.toFixed(2)} €`}
					label="Total annualisé"
					color="dark"
				/>
			</div>

			{syncAlert && (
				<AppAlert
					color={syncAlert.type}
					dismissible
					onClose={() => setSyncAlert(null)}
					className="mb-3"
				>
					{syncAlert.message}
				</AppAlert>
			)}
			{bulkAlert && (
				<AppAlert
					color={bulkAlert.type}
					dismissible
					onClose={() => setBulkAlert(null)}
					className="mb-3"
				>
					{bulkAlert.message}
				</AppAlert>
			)}

			<EntityTableCard title="Charges &amp; dépenses" onAdd={openCreate}>
				<div className="flex justify-end mb-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleSyncMatera}
						disabled={syncing}
					>
						{syncing ? (
							<Spinner size="sm" className="mr-1" />
						) : (
							<RefreshCw className="h-4 w-4 mr-1" />
						)}
						{syncing ? "Synchronisation…" : "Sync MATERA"}
					</Button>
				</div>
				{selectedIds.size > 0 && (
					<div className="flex items-center gap-2 p-2 mb-2 bg-muted/30 border rounded-md">
						<span className="font-semibold">
							{selectedIds.size} sélectionné(s)
						</span>
						<Button
							size="sm"
							variant="destructive"
							onClick={() => setBulkDeleteModal(true)}
							disabled={bulkLoading}
						>
							Supprimer la sélection
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => setSelectedIds(new Set())}
							disabled={bulkLoading}
						>
							Annuler
						</Button>
					</div>
				)}
				<ViewControlBar
					filters={[
						{
							value: filterType,
							onChange: setFilterType,
							options: Object.entries(typeLabel).map(([v, l]) => ({
								value: v,
								label: l,
							})),
							placeholder: "Tous les types",
							width: 180,
						},
						{
							value: filterFrequency,
							onChange: setFilterFrequency,
							options: Object.entries(freqLabel).map(([v, l]) => ({
								value: v,
								label: l,
							})),
							placeholder: "Toutes les fréquences",
							width: 180,
						},
					]}
					hasActiveFilter={hasFilter}
					onResetFilters={() => {
						setFilterType("");
						setFilterFrequency("");
					}}
					totalCount={charges.length}
					filteredCount={filtered.length}
					itemLabel="charge"
				/>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/50">
								<th
									className="px-4 py-3 text-left font-medium text-muted-foreground"
									style={{ width: "40px" }}
								>
									<input
										type="checkbox"
										className="rounded border-input"
										checked={isAllSelected}
										onChange={toggleSelectAll}
									/>
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Type
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Description
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Bien
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Montant
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Fréquence
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Date
								</th>
								<th className="px-4 py-3 text-right font-medium text-muted-foreground">
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{filtered.length === 0 ? (
								<TableEmptyRow
									colSpan={8}
									message="Aucune charge enregistrée"
								/>
							) : (
								filtered.map((c) => (
									<tr
										key={c.id}
										className="border-b hover:bg-muted/30 transition-colors"
									>
										<td className="px-4 py-3">
											<input
												type="checkbox"
												className="rounded border-input"
												checked={selectedIds.has(c.id)}
												onChange={() => toggleSelect(c.id)}
											/>
										</td>
										<td className="px-4 py-3">
											<span
												className={
													typeBadgeClass[c.type] ||
													"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600"
												}
											>
												{typeLabel[c.type] || c.type}
											</span>
										</td>
										<td className="px-4 py-3">{c.description || "-"}</td>
										<td className="px-4 py-3">
											{c.Property
												? `${c.Property.type} - ${c.Property.city}`
												: "Général"}
										</td>
										<td className="px-4 py-3">
											{Number.parseFloat(c.amount || 0).toFixed(2)} €
										</td>
										<td className="px-4 py-3">
											{freqLabel[c.frequency] || c.frequency}
										</td>
										<td className="px-4 py-3">
											{DateUtils.formatShort(c.date) || "-"}
										</td>
										<td className="px-4 py-3 text-right">
											<ActionButtons
												onEdit={() => openEdit(c)}
												onDelete={() => openDelete(c)}
											/>
										</td>
									</tr>
								))
							)}
							{filtered.length > 0 && (
								<tr className="font-bold border-b">
									<td colSpan={4} className="px-4 py-3 text-right">
										Total affiché :
									</td>
									<td className="px-4 py-3">{total.toFixed(2)} €</td>
									<td colSpan={3} />
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</EntityTableCard>

			<CrudModal
				visible={modalVisible}
				editing={editing}
				addTitle="Ajouter une charge"
				editTitle="Modifier la charge"
				onClose={() => setModalVisible(false)}
				onSubmit={handleSubmit}
			>
				<div className="col-span-6">
					<select
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						name="type"
						value={form.type}
						onChange={handleChange}
					>
						{Object.entries(typeLabel).map(([v, l]) => (
							<option key={v} value={v}>
								{l}
							</option>
						))}
					</select>
				</div>
				<div className="col-span-6">
					<select
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						name="property_id"
						value={form.property_id}
						onChange={handleChange}
					>
						<option value="">-- Général (tous biens) --</option>
						{properties.map((p) => (
							<option
								key={p.id}
								value={p.id}
							>{`${p.type} - ${p.address}, ${p.city}`}</option>
						))}
					</select>
				</div>
				<div className="col-span-12">
					<input
						type="text"
						name="description"
						placeholder="Description"
						value={form.description}
						onChange={handleChange}
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>
				<div className="col-span-4">
					<FormInputField
						type="number"
						name="amount"
						label="Montant (€)"
						value={form.amount}
						onChange={handleChange}
						required
						error={formErrors.amount}
					/>
				</div>
				<div className="col-span-4">
					<FormInputField
						type="date"
						name="date"
						label="Date"
						value={form.date}
						onChange={handleChange}
						required
						error={formErrors.date}
					/>
				</div>
				<div className="col-span-4">
					<FormSelectField
						label="Fréquence"
						name="frequency"
						value={form.frequency}
						onChange={handleChange}
					>
						<option value="unique">Unique</option>
						<option value="mensuel">Mensuel</option>
						<option value="trimestriel">Trimestriel</option>
						<option value="annuel">Annuel</option>
					</FormSelectField>
				</div>
			</CrudModal>

			<DeleteModal
				visible={deleteModal}
				itemLabel={toDelete?.description || typeLabel[toDelete?.type]}
				onClose={() => setDeleteModal(false)}
				onConfirm={handleDelete}
			/>
			<DeleteModal
				visible={bulkDeleteModal}
				itemLabel={`${selectedIds.size} charge(s)`}
				onClose={() => setBulkDeleteModal(false)}
				onConfirm={handleBulkDelete}
			/>
		</>
	);
};

export default Charges;
