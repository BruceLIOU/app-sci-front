import { AppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Info, Send, TrendingUp } from "lucide-react";
import React, { useState, useEffect } from "react";
import { DateUtils } from "src/utils/date";
import ActionButtons from "../../../components/ActionButtons";
import CrudModal from "../../../components/CrudModal";
import DeleteModal from "../../../components/DeleteModal";
import DocumentsSection from "../../../components/DocumentsSection";
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
import LeaseDataService from "../../../services/lease.service";
import PdfDataService from "../../../services/pdf.service";
import PropertyDataService from "../../../services/property.service";
import TenantDataService from "../../../services/tenant.service";
import { leaseFormSchema } from "../../../validation/schemas";

const statusLabel: Record<string, string> = {
	active: "Actif",
	expired: "Expiré",
	terminated: "Résilié",
};
const typeLabel: Record<string, string> = {
	nu: "Location nue",
	meublé: "Meublé",
	commercial: "Commercial",
};

const emptyForm = {
	property_id: "",
	tenant_id: "",
	type: "nu",
	start_date: "",
	end_date: "",
	rent_amount: "",
	charges_amount: "0",
	deposit_amount: "0",
	notice_period: "3",
	status: "active",
	notes: "",
};

const Leases = () => {
	const [tenants, setTenants] = useState<any[]>([]);
	const [properties, setProperties] = useState<any[]>([]);
	const [viewModal, setViewModal] = useState(false);
	const [filterStatus, setFilterStatus] = useState("");
	const [filterLeaseType, setFilterLeaseType] = useState("");
	const [viewing, setViewing] = useState<any>(null);
	const [emailSendingId, setEmailSendingId] = useState<number | null>(null);
	const [emailResult, setEmailResult] = useState<{
		type: "success" | "danger";
		message: string;
	} | null>(null);
	const [irlModal, setIrlModal] = useState(false);
	const [irlLease, setIrlLease] = useState<any>(null);
	const [irlSimulation, setIrlSimulation] = useState<any>(null);
	const [irlLoading, setIrlLoading] = useState(false);
	const [irlApplying, setIrlApplying] = useState(false);
	const [irlResult, setIrlResult] = useState<{
		type: "success" | "danger";
		message: string;
	} | null>(null);

	const {
		items: leases,
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
		service: LeaseDataService,
		emptyForm,
		validationSchema: leaseFormSchema,
		toForm: (l) => ({
			property_id: l.property_id || "",
			tenant_id: l.tenant_id || "",
			type: l.type || "nu",
			start_date: l.start_date || "",
			end_date: l.end_date || "",
			rent_amount: l.rent_amount || "",
			charges_amount: l.charges_amount || "0",
			deposit_amount: l.deposit_amount || "0",
			notice_period: l.notice_period || "3",
			status: l.status || "active",
			notes: l.notes || "",
		}),
	});

	useEffect(() => {
		TenantDataService.getAll().then((r) => setTenants(r.data));
		PropertyDataService.getAll().then((r) => setProperties(r.data));
	}, []);

	const totalActive = leases.filter((l) => l.status === "active").length;
	const totalRent = leases
		.filter((l) => l.status === "active")
		.reduce(
			(s, l) =>
				s +
				Number.parseFloat(l.rent_amount || 0) +
				Number.parseFloat(l.charges_amount || 0),
			0,
		);

	const hasFilter = filterStatus !== "" || filterLeaseType !== "";
	const filteredLeases = leases.filter((l) => {
		if (filterStatus && l.status !== filterStatus) return false;
		if (filterLeaseType && l.type !== filterLeaseType) return false;
		return true;
	});
	const resetFilters = () => {
		setFilterStatus("");
		setFilterLeaseType("");
	};

	const handleOpenIrl = async (lease: any) => {
		setIrlLease(lease);
		setIrlSimulation(null);
		setIrlResult(null);
		setIrlModal(true);
		setIrlLoading(true);
		try {
			const res = await LeaseDataService.simulateIrl(lease.id);
			setIrlSimulation(res.data);
		} catch (e: any) {
			setIrlResult({
				type: "danger",
				message: e?.response?.data?.message || "Erreur simulation IRL.",
			});
		} finally {
			setIrlLoading(false);
		}
	};

	const handleApplyIrl = async () => {
		if (!irlLease) return;
		setIrlApplying(true);
		try {
			const res = await LeaseDataService.applyIrl(irlLease.id);
			setIrlResult({
				type: "success",
				message: `Loyer mis à jour : ${res.data.old_rent} € → ${res.data.new_rent} €`,
			});
			fetchAll();
		} catch (e: any) {
			setIrlResult({
				type: "danger",
				message: e?.response?.data?.message || "Erreur application IRL.",
			});
		} finally {
			setIrlApplying(false);
		}
	};

	const handleEmailBail = async (id: number) => {
		setEmailSendingId(id);
		setEmailResult(null);
		try {
			const res = await PdfDataService.emailBail(id);
			setEmailResult({ type: "success", message: res.data.message });
			fetchAll();
		} catch (e: any) {
			setEmailResult({
				type: "danger",
				message: e?.response?.data?.message || "Erreur lors de l'envoi.",
			});
		} finally {
			setEmailSendingId(null);
		}
	};

	return (
		<>
			{emailResult && (
				<AppAlert
					color={emailResult.type}
					dismissible
					onClose={() => setEmailResult(null)}
					className="mb-3"
				>
					{emailResult.message}
				</AppAlert>
			)}
			<div className="grid grid-cols-12 gap-4 mb-4 text-center">
				<StatCard value={totalActive} label="Baux actifs" color="success" />
				<StatCard
					value={`${totalRent.toFixed(2)} €`}
					label="Loyers mensuels charges comprises"
					color="info"
				/>
				<StatCard value={leases.length} label="Total baux" color="secondary" />
			</div>

			<EntityTableCard
				title="Baux de location"
				addLabel="Nouveau bail"
				onAdd={openCreate}
			>
				<ViewControlBar
					filters={[
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
						{
							value: filterLeaseType,
							onChange: setFilterLeaseType,
							options: Object.entries(typeLabel).map(([v, l]) => ({
								value: v,
								label: l,
							})),
							placeholder: "Tous les types",
							width: 160,
						},
					]}
					hasActiveFilter={hasFilter}
					onResetFilters={resetFilters}
					totalCount={leases.length}
					filteredCount={filteredLeases.length}
					itemLabel="bail"
					itemLabelPlural="baux"
				/>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Bien
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Locataire
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Type
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Loyer CC
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Dépôt
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Début
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Fin
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
							{filteredLeases.length === 0 ? (
								<TableEmptyRow colSpan={9} message="Aucun bail enregistré" />
							) : (
								filteredLeases.map((l) => (
									<tr
										key={l.id}
										className="border-b hover:bg-muted/30 transition-colors"
									>
										<td className="px-4 py-3">
											{l.Property
												? `${l.Property.type} - ${l.Property.city}`
												: "-"}
										</td>
										<td className="px-4 py-3">
											{l.Tenant
												? `${l.Tenant.civility || ""} ${l.Tenant.lastname}`
												: "-"}
										</td>
										<td className="px-4 py-3">{typeLabel[l.type] || l.type}</td>
										<td className="px-4 py-3">
											{(
												Number.parseFloat(l.rent_amount || 0) +
												Number.parseFloat(l.charges_amount || 0)
											).toFixed(2)}{" "}
											€
										</td>
										<td className="px-4 py-3">
											{Number.parseFloat(l.deposit_amount || 0).toFixed(2)} €
										</td>
										<td className="px-4 py-3">
											{DateUtils.formatShort(l.start_date) || "-"}
										</td>
										<td className="px-4 py-3">
											{DateUtils.formatShort(l.end_date) || "En cours"}
										</td>
										<td className="px-4 py-3">
											<StatusBadge value={l.status} />
										</td>
										<td className="px-4 py-3 text-right">
											<ActionButtons
												onEdit={() => openEdit(l)}
												onDelete={() => openDelete(l)}
											>
												<Button
													variant="ghost"
													size="sm"
													className="mr-1"
													onClick={() => {
														setViewing(l);
														setViewModal(true);
													}}
												>
													<Info className="h-4 w-4" />
												</Button>
												{l.status === "active" && (
													<Button
														variant="ghost"
														size="sm"
														className="mr-1"
														title="Révision IRL"
														onClick={() => handleOpenIrl(l)}
													>
														<TrendingUp className="h-4 w-4" />
													</Button>
												)}
												<Button
													variant="ghost"
													size="sm"
													className={`mr-1 ${l.email_sent_at ? "text-emerald-600" : ""}`}
													disabled={emailSendingId === l.id}
													onClick={() => handleEmailBail(l.id)}
													title={
														l.email_sent_at
															? `Envoyé le ${DateUtils.formatShort(l.email_sent_at)}`
															: "Envoyer bail par email"
													}
												>
													{emailSendingId === l.id ? (
														<Spinner size="sm" />
													) : (
														<Send className="h-4 w-4" />
													)}
												</Button>
											</ActionButtons>
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
				addTitle="Nouveau bail"
				editTitle="Modifier le bail"
				size="xl"
				onClose={() => setModalVisible(false)}
				onSubmit={handleSubmit}
				submitLabel={editing ? "Modifier" : "Créer"}
			>
				<div className="col-span-6">
					<FormSelectField
						label="Bien"
						name="property_id"
						value={form.property_id}
						required
						error={formErrors.property_id}
						onChange={handleChange}
					>
						<option value="">-- Sélectionner un bien --</option>
						{properties.map((p) => (
							<option
								key={p.id}
								value={p.id}
							>{`${p.type} - ${p.address}, ${p.city}`}</option>
						))}
					</FormSelectField>
				</div>
				<div className="col-span-6">
					<label className="text-sm font-medium leading-none mb-1 block">
						Locataire
					</label>
					<select
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						name="tenant_id"
						value={form.tenant_id}
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
				<div className="col-span-4">
					<label className="text-sm font-medium leading-none mb-1 block">
						Type de bail
					</label>
					<select
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						name="type"
						value={form.type}
						onChange={handleChange}
					>
						<option value="nu">Location nue</option>
						<option value="meublé">Meublé</option>
						<option value="commercial">Commercial</option>
					</select>
				</div>
				<div className="col-span-4">
					<FormInputField
						type="number"
						name="rent_amount"
						label="Loyer hors charges (€)"
						value={form.rent_amount}
						required
						error={formErrors.rent_amount}
						onChange={handleChange}
					/>
				</div>
				<div className="col-span-4">
					<FormInputField
						type="number"
						name="charges_amount"
						label="Charges (€)"
						value={form.charges_amount}
						error={formErrors.charges_amount}
						onChange={handleChange}
					/>
				</div>
				<div className="col-span-4">
					<FormInputField
						type="number"
						name="deposit_amount"
						label="Dépôt de garantie (€)"
						value={form.deposit_amount}
						error={formErrors.deposit_amount}
						onChange={handleChange}
					/>
				</div>
				<div className="col-span-4">
					<FormInputField
						type="date"
						name="start_date"
						label="Date de début"
						value={DateUtils.formatShort(form.start_date)}
						required
						error={formErrors.start_date}
						onChange={handleChange}
					/>
				</div>
				<div className="col-span-4">
					<FormInputField
						type="date"
						name="end_date"
						label="Date de fin (optionnel)"
						value={DateUtils.formatShort(form.end_date)}
						onChange={handleChange}
					/>
				</div>
				<div className="col-span-4">
					<FormInputField
						type="number"
						name="notice_period"
						label="Préavis (mois)"
						value={form.notice_period}
						onChange={handleChange}
					/>
				</div>
				<div className="col-span-4">
					<label className="text-sm font-medium leading-none mb-1 block">
						Statut
					</label>
					<select
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						name="status"
						value={form.status}
						onChange={handleChange}
					>
						<option value="active">Actif</option>
						<option value="expired">Expiré</option>
						<option value="terminated">Résilié</option>
					</select>
				</div>
				<div className="col-span-12">
					<label className="text-sm font-medium leading-none mb-1 block">
						Notes
					</label>
					<textarea
						name="notes"
						rows={3}
						value={form.notes}
						onChange={handleChange}
						className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>
			</CrudModal>

			{viewing && (
				<Dialog
					open={viewModal}
					onOpenChange={(open) => !open && setViewModal(false)}
				>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Bail — {viewing.Property?.city}</DialogTitle>
						</DialogHeader>
						<div className="p-4">
							<div className="grid grid-cols-2 gap-3">
								{(
									[
										[
											"Bien",
											viewing.Property
												? `${viewing.Property.type}, ${viewing.Property.address}, ${viewing.Property.city}`
												: "-",
										],
										[
											"Locataire",
											viewing.Tenant
												? `${viewing.Tenant.civility || ""} ${viewing.Tenant.firstname} ${viewing.Tenant.lastname}`
												: "-",
										],
										["Type", typeLabel[viewing.type] || viewing.type],
										["Statut", statusLabel[viewing.status]],
										[
											"Loyer HC",
											`${Number.parseFloat(viewing.rent_amount || 0).toFixed(2)} €`,
										],
										[
											"Charges",
											`${Number.parseFloat(viewing.charges_amount || 0).toFixed(2)} €`,
										],
										[
											"Loyer CC",
											`${(Number.parseFloat(viewing.rent_amount || 0) + Number.parseFloat(viewing.charges_amount || 0)).toFixed(2)} €`,
										],
										[
											"Dépôt de garantie",
											`${Number.parseFloat(viewing.deposit_amount || 0).toFixed(2)} €`,
										],
										[
											"Date de début",
											DateUtils.formatShort(viewing.start_date) || "-",
										],
										[
											"Date de fin",
											DateUtils.formatShort(viewing.end_date) || "En cours",
										],
										["Préavis", `${viewing.notice_period} mois`],
									] as [string, string][]
								).map(([label, value]) => (
									<div key={label}>
										<div className="text-muted-foreground text-sm">{label}</div>
										<div className="font-semibold">{value}</div>
									</div>
								))}
								{viewing.notes && (
									<div className="col-span-2">
										<div className="text-muted-foreground text-sm">Notes</div>
										<div>{viewing.notes}</div>
									</div>
								)}
							</div>
							<hr className="my-3" />
							<strong className="block mb-2">Documents</strong>
							<DocumentsSection entityType="lease" entityId={viewing.id} />
							<hr className="my-3" />
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									disabled={emailSendingId === viewing?.id}
									onClick={() => handleEmailBail(viewing.id)}
								>
									{emailSendingId === viewing?.id ? (
										<Spinner size="sm" className="mr-1" />
									) : (
										<Send className="h-4 w-4 mr-1" />
									)}
									Envoyer bail par email
								</Button>
								<Button onClick={() => setViewModal(false)}>Fermer</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)}

			{/* IRL simulation modal */}
			<Dialog open={irlModal} onOpenChange={(o) => !o && setIrlModal(false)}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Révision IRL — {irlLease?.Property?.city}</DialogTitle>
					</DialogHeader>
					<div className="py-2 space-y-3">
						{irlResult && (
							<AppAlert
								color={irlResult.type}
								dismissible
								onClose={() => setIrlResult(null)}
							>
								{irlResult.message}
							</AppAlert>
						)}
						{irlLoading ? (
							<div className="flex justify-center py-6">
								<Spinner size="lg" />
							</div>
						) : irlSimulation ? (
							<div className="space-y-2 text-sm">
								<div className="grid grid-cols-2 gap-2">
									<div>
										<div className="text-muted-foreground">Loyer actuel</div>
										<div className="font-bold text-lg">
											{Number(irlSimulation.current_rent).toFixed(2)} €
										</div>
									</div>
									<div>
										<div className="text-muted-foreground">Loyer révisé</div>
										<div className="font-bold text-lg text-emerald-600">
											{Number(irlSimulation.new_rent).toFixed(2)} €
										</div>
									</div>
									<div>
										<div className="text-muted-foreground">
											IRL de référence
										</div>
										<div>{irlSimulation.reference_irl}</div>
									</div>
									<div>
										<div className="text-muted-foreground">
											IRL actuel ({irlSimulation.current_irl?.period})
										</div>
										<div>{irlSimulation.current_irl?.value}</div>
									</div>
									<div className="col-span-2">
										<div className="text-muted-foreground">Variation</div>
										<div
											className={
												Number(irlSimulation.variation_pct) >= 0
													? "text-emerald-600 font-semibold"
													: "text-rose-600 font-semibold"
											}
										>
											{Number(irlSimulation.variation_pct) >= 0 ? "+" : ""}
											{irlSimulation.variation_pct} %
										</div>
									</div>
								</div>
							</div>
						) : null}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIrlModal(false)}>
							Annuler
						</Button>
						{irlSimulation && !irlResult && (
							<Button disabled={irlApplying} onClick={handleApplyIrl}>
								{irlApplying ? <Spinner size="sm" className="mr-1" /> : null}
								Appliquer la révision
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<DeleteModal
				visible={deleteModal}
				itemLabel={
					toDelete ? `le bail ${toDelete.Property?.city || ""}` : undefined
				}
				onClose={() => setDeleteModal(false)}
				onConfirm={handleDelete}
			/>
		</>
	);
};

export default Leases;
