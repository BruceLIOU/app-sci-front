import { AppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect, useMemo } from "react";
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
import { StatusBadge } from "../../../components/StatusBadge";
import TableEmptyRow from "../../../components/TableEmptyRow";
import ViewControlBar from "../../../components/ViewControlBar";
import useEntityCrud from "../../../hooks/useEntityCrud";
import PaymentDataService from "../../../services/payment.service";
import PropertyDataService from "../../../services/property.service";
import TenantDataService from "../../../services/tenant.service";
import { paymentFormSchema } from "../../../validation/schemas";

const statusLabel: Record<string, string> = {
	paid: "Payé",
	pending: "En attente",
	late: "En retard",
};

const emptyForm = {
	tenant_id: "",
	property_id: "",
	amount: "",
	month: "",
	due_date: "",
	paid_date: "",
	status: "pending",
};

const Payments = () => {
	const [tenants, setTenants] = useState<any[]>([]);
	const [properties, setProperties] = useState<any[]>([]);
	const [filterStatus, setFilterStatus] = useState("");
	const [filterYear, setFilterYear] = useState("");
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
	const [bulkLoading, setBulkLoading] = useState(false);
	const [bulkAlert, setBulkAlert] = useState<{
		type: "success" | "danger";
		message: string;
	} | null>(null);

	const {
		items: payments,
		modalVisible,
		setModalVisible,
		deleteModal,
		setDeleteModal,
		editing,
		toDelete,
		form: formData,
		formErrors,
		handleChange,
		openCreate,
		openEdit,
		openDelete,
		handleSubmit,
		handleDelete,
		fetchAll,
	} = useEntityCrud({
		service: PaymentDataService,
		emptyForm,
		validationSchema: paymentFormSchema,
		toForm: (p) => ({
			tenant_id: p.tenant_id || "",
			property_id: p.property_id || "",
			amount: p.amount || "",
			month: p.month || "",
			due_date: p.due_date || "",
			paid_date: p.paid_date || "",
			status: p.status || "pending",
		}),
	});

	useEffect(() => {
		TenantDataService.getAll()
			.then((res) => setTenants(res.data))
			.catch(console.error);
		PropertyDataService.getAll()
			.then((res) => setProperties(res.data))
			.catch(console.error);
	}, []);

	const totalPaid = payments
		.filter((p) => p.status === "paid")
		.reduce((sum, p) => sum + Number.parseFloat(p.amount || 0), 0);
	const totalPending = payments
		.filter((p) => p.status !== "paid")
		.reduce((sum, p) => sum + Number.parseFloat(p.amount || 0), 0);

	const availableYears = useMemo(() => {
		const years = new Set(
			payments.map((p) => p.due_date?.slice(0, 4)).filter(Boolean),
		);
		return Array.from(years as Set<string>)
			.sort()
			.reverse();
	}, [payments]);

	const filteredPayments = payments
		.filter((p) => !filterStatus || p.status === filterStatus)
		.filter((p) => !filterYear || p.due_date?.startsWith(filterYear));

	const isAllSelected =
		filteredPayments.length > 0 &&
		filteredPayments.every((p) => selectedIds.has(p.id));

	const toggleSelectAll = () => {
		if (isAllSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(filteredPayments.map((p) => p.id)));
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
			await PaymentDataService.bulkDelete([...selectedIds]);
			const count = selectedIds.size;
			setSelectedIds(new Set());
			fetchAll();
			setBulkAlert({
				type: "success",
				message: `${count} paiement(s) supprimé(s).`,
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
			<div className="grid grid-cols-12 gap-4 mb-4 text-center">
				<StatCard
					value={`${totalPaid.toFixed(2)} €`}
					label="Loyers perçus"
					color="success"
				/>
				<StatCard
					value={`${totalPending.toFixed(2)} €`}
					label="En attente / En retard"
					color="warning"
				/>
				<StatCard
					value={payments.length}
					label="Total des paiements"
					color="info"
				/>
			</div>
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

			<EntityTableCard title="Paiements" onAdd={openCreate}>
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
							value: filterYear,
							onChange: setFilterYear,
							options: availableYears.map((y) => ({ value: y, label: y })),
							placeholder: "Toutes les années",
							width: 188,
						},
						{
							value: filterStatus,
							onChange: setFilterStatus,
							options: Object.entries(statusLabel).map(([v, l]) => ({
								value: v,
								label: l,
							})),
							placeholder: "Tous les statuts",
							width: 160,
						},
					]}
					hasActiveFilter={filterStatus !== "" || filterYear !== ""}
					onResetFilters={() => {
						setFilterStatus("");
						setFilterYear("");
					}}
					totalCount={payments.length}
					filteredCount={filteredPayments.length}
					itemLabel="paiement"
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
									Mois
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Locataire
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Bien
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Montant
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Échéance
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Statut
								</th>
								<th className="px-4 py-3 text-right font-medium text-muted-foreground">
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{filteredPayments.length === 0 ? (
								<TableEmptyRow
									colSpan={8}
									message="Aucun paiement enregistré"
								/>
							) : (
								filteredPayments.map((payment) => (
									<tr
										key={payment.id}
										className="border-b hover:bg-muted/30 transition-colors"
									>
										<td className="px-4 py-3">
											<input
												type="checkbox"
												className="rounded border-input"
												checked={selectedIds.has(payment.id)}
												onChange={() => toggleSelect(payment.id)}
											/>
										</td>
										<td className="px-4 py-3">
											{DateUtils.formatMonthYear(payment.month) || "-"}
										</td>
										<td className="px-4 py-3">
											{payment.Tenant
												? `${payment.Tenant.civility || ""} ${payment.Tenant.firstname} ${payment.Tenant.lastname}`
												: "-"}
										</td>
										<td className="px-4 py-3">
											{payment.Property
												? `${payment.Property.type} - ${payment.Property.city}`
												: "-"}
										</td>
										<td className="px-4 py-3">
											{Number.parseFloat(payment.amount || 0).toFixed(2)} €
										</td>
										<td className="px-4 py-3">
											{DateUtils.formatShort(payment.due_date) || "-"}
										</td>
										<td className="px-4 py-3">
											<StatusBadge value={payment.status} />
										</td>
										<td className="px-4 py-3 text-right">
											<ActionButtons
												onEdit={() => openEdit(payment)}
												onDelete={() => openDelete(payment)}
											/>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</EntityTableCard>

			<CrudModal
				visible={modalVisible}
				editing={editing}
				addTitle="Ajouter un paiement"
				editTitle="Modifier le paiement"
				onClose={() => setModalVisible(false)}
				onSubmit={handleSubmit}
			>
				<div className="col-span-6">
					<select
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						name="tenant_id"
						value={formData.tenant_id}
						onChange={handleChange}
					>
						<option value="">-- Sélectionner --</option>
						{tenants.map((t) => (
							<option
								key={t.id}
								value={t.id}
							>{`${t.civility || ""} ${t.firstname} ${t.lastname}`}</option>
						))}
					</select>
				</div>
				<div className="col-span-6">
					<select
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						name="property_id"
						value={formData.property_id}
						onChange={handleChange}
					>
						<option value="">-- Sélectionner --</option>
						{properties.map((p) => (
							<option
								key={p.id}
								value={p.id}
							>{`${p.type} - ${p.address}, ${p.city}`}</option>
						))}
					</select>
				</div>
				<div className="col-span-4">
					<FormInputField
						type="text"
						name="month"
						label="Mois (ex: Janvier 2024)"
						value={formData.month}
						onChange={handleChange}
						required
						error={formErrors.month}
					/>
				</div>
				<div className="col-span-4">
					<FormInputField
						type="number"
						name="amount"
						label="Montant (€)"
						value={formData.amount}
						onChange={handleChange}
						required
						error={formErrors.amount}
					/>
				</div>
				<div className="col-span-4">
					<FormSelectField
						label="Statut"
						name="status"
						value={formData.status}
						onChange={handleChange}
						error={formErrors.status}
					>
						<option value="pending">En attente</option>
						<option value="paid">Payé</option>
						<option value="late">En retard</option>
					</FormSelectField>
				</div>
				<div className="col-span-6">
					<FormInputField
						type="date"
						name="due_date"
						label="Date d'échéance"
						value={formData.due_date}
						onChange={handleChange}
					/>
				</div>
				<div className="col-span-6">
					<FormInputField
						type="date"
						name="paid_date"
						label="Date de paiement"
						value={formData.paid_date}
						onChange={handleChange}
					/>
				</div>
			</CrudModal>

			<DeleteModal
				visible={deleteModal}
				itemLabel={toDelete?.month}
				onClose={() => setDeleteModal(false)}
				onConfirm={handleDelete}
			/>
			<DeleteModal
				visible={bulkDeleteModal}
				itemLabel={`${selectedIds.size} paiement(s)`}
				onClose={() => setBulkDeleteModal(false)}
				onConfirm={handleBulkDelete}
			/>
		</>
	);
};

export default Payments;
