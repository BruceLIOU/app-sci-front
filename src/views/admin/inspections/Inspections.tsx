import { AppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Download, ExternalLink, FileText, Info, Send } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
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
import useEntityCrud from "../../../hooks/useEntityCrud";
import DocumentDataService from "../../../services/document.service";
import InspectionDataService from "../../../services/inspection.service";
import LeaseDataService from "../../../services/lease.service";
import PdfDataService from "../../../services/pdf.service";
import PropertyDataService from "../../../services/property.service";
import TenantDataService from "../../../services/tenant.service";
import { inspectionFormSchema } from "../../../validation/schemas";

const emptyForm = {
	property_id: "",
	tenant_id: "",
	lease_id: "",
	type: "entree",
	date: new Date().toISOString().split("T")[0],
	status: "pending",
	general_notes: "",
};

const Inspections = () => {
	const [tenants, setTenants] = useState<any[]>([]);
	const [properties, setProperties] = useState<any[]>([]);
	const [leases, setLeases] = useState<any[]>([]);
	const [viewModal, setViewModal] = useState(false);
	const [pdfGenerating, setPdfGenerating] = useState(false);
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [viewing, setViewing] = useState<any>(null);
	const [inspectionDocs, setInspectionDocs] = useState<Record<number, any>>({});
	const [emailSending, setEmailSending] = useState(false);
	const [emailResult, setEmailResult] = useState<{
		type: "success" | "danger";
		message: string;
	} | null>(null);

	const {
		items: inspections,
		modalVisible,
		setModalVisible,
		deleteModal,
		setDeleteModal,
		editing,
		toDelete,
		form,
		formErrors,
		setFieldValue,
		validateForm,
		handleChange,
		openCreate,
		openEdit,
		openDelete,
		handleDelete: baseHandleDelete,
		fetchAll,
	} = useEntityCrud({
		service: InspectionDataService,
		emptyForm,
		validationSchema: inspectionFormSchema,
		toForm: (i) => ({
			property_id: i.property_id || "",
			tenant_id: i.tenant_id || "",
			lease_id: i.lease_id || "",
			type: i.type,
			date: i.date,
			status: i.status,
			general_notes: i.general_notes || "",
		}),
	});

	const fetchDocs = () =>
		DocumentDataService.getAll({ entity_type: "inspection" })
			.then((r) => {
				const map: Record<number, any> = {};
				r.data.forEach((d: any) => {
					map[d.entity_id] = d;
				});
				setInspectionDocs(map);
			})
			.catch(console.error);

	useEffect(() => {
		fetchDocs();
		TenantDataService.getAll().then((r) => setTenants(r.data));
		PropertyDataService.getAll().then((r) => setProperties(r.data));
		LeaseDataService.getAll().then((r) => setLeases(r.data));
	}, []);

	const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const pid = e.target.value;
		let tenantId = "";
		if (pid) {
			const activeLease = leases.find(
				(l: any) => String(l.property_id) === pid && l.status === "active",
			);
			if (activeLease?.tenant_id) tenantId = String(activeLease.tenant_id);
		}
		setFieldValue("property_id", pid);
		setFieldValue("tenant_id", tenantId);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;
		const fd = new FormData();
		Object.entries(form).forEach(([k, v]) => fd.append(k, v));
		try {
			if (editing) {
				await InspectionDataService.update(editing.id, fd);
			} else {
				const created = await InspectionDataService.create(fd);
				const newId = created.data.id;
				try {
					const pdfRes = await PdfDataService.generateEtatDesLieux(newId);
					const doc = pdfRes.data.document;
					setInspectionDocs((prev) => ({ ...prev, [newId]: doc }));
				} catch (pdfErr) {
					console.error("Génération PDF échouée :", pdfErr);
				}
			}
			setModalVisible(false);
			fetchAll();
		} catch (err) {
			console.error(err);
		}
	};

	const handleDelete = async () => {
		await baseHandleDelete();
		fetchDocs();
	};

	const openView = (i: any) => {
		const copy = { ...i };
		try {
			copy._rooms = i.rooms ? JSON.parse(i.rooms) : [];
		} catch {
			copy._rooms = [];
		}
		setViewing(copy);
		setViewModal(true);
		setPdfUrl(
			inspectionDocs[i.id]
				? DocumentDataService.downloadUrl(inspectionDocs[i.id].id)
				: null,
		);
	};

	return (
		<>
			<div className="grid grid-cols-12 gap-4 mb-4 text-center">
				<StatCard
					value={inspections.filter((i) => i.type === "entree").length}
					label="États d'entrée"
					color="success"
				/>
				<StatCard
					value={inspections.filter((i) => i.type === "sortie").length}
					label="États de sortie"
					color="danger"
				/>
				<StatCard
					value={inspections.filter((i) => i.status === "pending").length}
					label="En attente"
					color="warning"
				/>
			</div>

			<EntityTableCard
				title="États des lieux"
				addLabel="Nouveau"
				onAdd={openCreate}
			>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Type
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Bien
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Locataire
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Date
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Pièces vérifiées
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
							{inspections.length === 0 ? (
								<TableEmptyRow colSpan={7} message="Aucun état des lieux" />
							) : (
								inspections.map((i) => {
									let roomCount = 0;
									try {
										roomCount = i.rooms ? JSON.parse(i.rooms).length : 0;
									} catch {
										roomCount = 0;
									}
									return (
										<tr
											key={i.id}
											className="border-b hover:bg-muted/30 transition-colors"
										>
											<td className="px-4 py-3">
												<StatusBadge value={i.type} />
											</td>
											<td className="px-4 py-3">
												{i.Property
													? `${i.Property.type} - ${i.Property.city}`
													: "-"}
											</td>
											<td className="px-4 py-3">
												{i.Tenant
													? `${i.Tenant.civility || ""} ${i.Tenant.lastname}`
													: "-"}
											</td>
											<td className="px-4 py-3">
												{DateUtils.formatShort(i.date)}
											</td>
											<td className="px-4 py-3">
												{roomCount} pièce{roomCount > 1 ? "s" : ""}
											</td>
											<td className="px-4 py-3">
												<StatusBadge value={i.status} />
											</td>
											<td className="px-4 py-3 text-right">
												<ActionButtons
													onEdit={() => openEdit(i)}
													onDelete={() => openDelete(i)}
												>
													{inspectionDocs[i.id] ? (
														<a
															href={DocumentDataService.downloadUrl(
																inspectionDocs[i.id].id,
															)}
															target="_blank"
															rel="noopener noreferrer"
														>
															<Button
																variant="ghost"
																size="sm"
																className="mr-1"
															>
																<Download className="h-4 w-4" />
															</Button>
														</a>
													) : (
														<Button
															variant="ghost"
															size="sm"
															className="mr-1"
															onClick={() => openView(i)}
														>
															<Info className="h-4 w-4" />
														</Button>
													)}
												</ActionButtons>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</EntityTableCard>

			<CrudModal
				visible={modalVisible}
				editing={editing}
				addTitle="Nouvel état des lieux"
				editTitle="Modifier l'état des lieux"
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
						onChange={handlePropertyChange}
						required
						error={formErrors.property_id}
					>
						<option value="">-- Sélectionner --</option>
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
						Type
					</label>
					<select
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
						name="type"
						value={form.type}
						onChange={handleChange}
					>
						<option value="entree">État d'entrée</option>
						<option value="sortie">État de sortie</option>
					</select>
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
					<label className="text-sm font-medium leading-none mb-1 block">
						Statut
					</label>
					<select
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
						name="status"
						value={form.status}
						onChange={handleChange}
					>
						<option value="pending">En attente</option>
						<option value="completed">Complété</option>
					</select>
				</div>
				<div className="col-span-12">
					<label className="text-sm font-medium leading-none mb-1 block">
						Observations générales
					</label>
					<textarea
						name="general_notes"
						rows={2}
						value={form.general_notes}
						onChange={handleChange}
						className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>
			</CrudModal>

			{viewing && (
				<Dialog
					open={viewModal}
					onOpenChange={(open) =>
						!open && (setViewModal(false), setPdfUrl(null))
					}
				>
					<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>
								<StatusBadge value={viewing.type} className="mr-2" />
								{viewing.Property
									? `${viewing.Property.type} - ${viewing.Property.city}`
									: "État des lieux"}
							</DialogTitle>
						</DialogHeader>
						<div className="p-4">
							<div className="grid grid-cols-2 gap-3 mb-3">
								<div>
									<div className="text-muted-foreground text-sm">Locataire</div>
									<div className="font-semibold">
										{viewing.Tenant
											? `${viewing.Tenant.civility || ""} ${viewing.Tenant.firstname} ${viewing.Tenant.lastname}`
											: "-"}
									</div>
								</div>
								<div>
									<div className="text-muted-foreground text-sm">Date</div>
									<div className="font-semibold">
										{DateUtils.formatShort(viewing.date)}
									</div>
								</div>
								<div>
									<div className="text-muted-foreground text-sm">Statut</div>
									<StatusBadge value={viewing.status} />
								</div>
								<div className="col-span-2">
									<div className="text-muted-foreground text-sm">
										Observations générales
									</div>
									<div>
										{viewing.general_notes || (
											<span className="text-muted-foreground italic">
												Aucune observation
											</span>
										)}
									</div>
								</div>
							</div>
							{viewing._rooms && viewing._rooms.length > 0 && (
								<>
									<strong>Pièces</strong>
									<div className="overflow-x-auto mt-2">
										<table className="w-full text-sm border">
											<thead>
												<tr className="border-b bg-muted/50">
													<th className="px-3 py-2 text-left">Pièce</th>
													<th className="px-3 py-2 text-left">État</th>
													<th className="px-3 py-2 text-left">Observations</th>
												</tr>
											</thead>
											<tbody>
												{viewing._rooms.map((r: any, idx: number) => (
													<tr key={idx} className="border-b">
														<td className="px-3 py-2">{r.name}</td>
														<td className="px-3 py-2">
															<StatusBadge value={r.condition} isCondition />
														</td>
														<td className="px-3 py-2">{r.notes || "-"}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</>
							)}
							<hr className="my-3" />
							<strong className="block mb-2">Documents</strong>
							<DocumentsSection entityType="inspection" entityId={viewing.id} />
							<hr className="my-3" />
							{pdfUrl && (
								<AppAlert
									color="success"
									className="flex items-center gap-2 mb-3"
								>
									<FileText className="inline mr-1 h-4 w-4" />
									PDF généré —{" "}
									<a
										href={pdfUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1 underline"
									>
										Ouvrir <ExternalLink className="inline h-3 w-3" />
									</a>
								</AppAlert>
							)}
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
							<div className="flex justify-end items-center gap-2 flex-wrap">
								{viewing.email_sent_at && (
									<span className="text-emerald-600 text-sm">
										<Send className="inline h-3 w-3 mr-1" />
										Envoyé par mail le{" "}
										{DateUtils.formatShort(viewing.email_sent_at)}
									</span>
								)}
								<Button
									variant="outline"
									disabled={emailSending}
									onClick={async () => {
										setEmailSending(true);
										setEmailResult(null);
										try {
											const res = await PdfDataService.emailEtatDesLieux(
												viewing.id,
											);
											setEmailResult({
												type: "success",
												message: res.data.message,
											});
											setViewing((prev: any) => ({
												...prev,
												email_sent_at: res.data.email_sent_at,
											}));
											fetchAll();
										} catch (e: any) {
											setEmailResult({
												type: "danger",
												message:
													e?.response?.data?.message ||
													"Erreur lors de l'envoi.",
											});
										} finally {
											setEmailSending(false);
										}
									}}
								>
									{emailSending ? (
										<Spinner size="sm" className="mr-1" />
									) : (
										<Send className="h-4 w-4 mr-1" />
									)}
									Envoyer par email
								</Button>
								<Button
									variant="outline"
									disabled={pdfGenerating}
									onClick={async () => {
										setPdfGenerating(true);
										try {
											const r = await PdfDataService.generateEtatDesLieux(
												viewing.id,
											);
											const doc = r.data.document;
											setPdfUrl(DocumentDataService.downloadUrl(doc.id));
											setInspectionDocs((prev) => ({
												...prev,
												[viewing.id]: doc,
											}));
										} catch (e) {
											console.error(e);
										} finally {
											setPdfGenerating(false);
										}
									}}
								>
									{pdfGenerating ? (
										<Spinner size="sm" className="mr-1" />
									) : (
										<FileText className="h-4 w-4 mr-1" />
									)}
									Générer PDF
								</Button>
								<Button onClick={() => setViewModal(false)}>Fermer</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)}

			<DeleteModal
				visible={deleteModal}
				itemLabel={
					toDelete ? `l'état des lieux du ${toDelete.date}` : undefined
				}
				onClose={() => setDeleteModal(false)}
				onConfirm={handleDelete}
			/>
		</>
	);
};

export default Inspections;
