import { AppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, ExternalLink, FileText, Send } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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
import useEntityCrud from "../../../hooks/useEntityCrud";
import DocumentDataService from "../../../services/document.service";
import LeaseDataService from "../../../services/lease.service";
import PdfDataService from "../../../services/pdf.service";
import PropertyDataService from "../../../services/property.service";
import QuittanceDataService from "../../../services/quittance.service";
import TenantDataService from "../../../services/tenant.service";
import { quittanceFormSchema } from "../../../validation/schemas";

const Quittances = () => {
	const [tenants, setTenants] = useState<any[]>([]);
	const [properties, setProperties] = useState<any[]>([]);
	const [leases, setLeases] = useState<any[]>([]);
	const [printModal, setPrintModal] = useState(false);
	const [printing, setPrinting] = useState<any>(null);
	const printRef = useRef<HTMLDivElement>(null);
	const [pdfGenerating, setPdfGenerating] = useState(false);
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [quittanceDocs, setQuittanceDocs] = useState<Record<number, any>>({});
	const [emailSendingId, setEmailSendingId] = useState<number | null>(null);
	const [emailResult, setEmailResult] = useState<{
		type: "success" | "danger";
		message: string;
	} | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
	const [bulkLoading, setBulkLoading] = useState(false);
	const [bulkGenerating, setBulkGenerating] = useState(false);
	const [bulkEmailing, setBulkEmailing] = useState(false);
	const [bulkAlert, setBulkAlert] = useState<{
		type: "success" | "danger";
		message: string;
	} | null>(null);

	const emptyForm = {
		tenant_id: "",
		property_id: "",
		lease_id: "",
		payment_id: "",
		period: "",
		rent_amount: "",
		charges_amount: "0",
		total_amount: "",
		issue_date: new Date().toISOString().split("T")[0],
	};

	const {
		items: quittances,
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
		handleDelete,
		fetchAll,
	} = useEntityCrud({
		service: QuittanceDataService,
		emptyForm,
		validationSchema: quittanceFormSchema,
		toForm: (q) => ({
			tenant_id: q.tenant_id || "",
			property_id: q.property_id || "",
			lease_id: q.lease_id || "",
			payment_id: q.payment_id || "",
			period: q.period || "",
			rent_amount: q.rent_amount || "",
			charges_amount: q.charges_amount || "0",
			total_amount: q.total_amount || "",
			issue_date: q.issue_date || "",
		}),
	});

	const rent = Number.parseFloat(form.rent_amount || "0");
	const charges = Number.parseFloat(form.charges_amount || "0");

	const fetchDocs = () =>
		DocumentDataService.getAll({ entity_type: "quittance" })
			.then((r) => {
				const map: Record<number, any> = {};
				r.data.forEach((d: any) => {
					map[d.entity_id] = d;
				});
				setQuittanceDocs(map);
			})
			.catch(console.error);

	useEffect(() => {
		fetchDocs();
		TenantDataService.getAll().then((r) => setTenants(r.data));
		PropertyDataService.getAll().then((r) => setProperties(r.data));
		LeaseDataService.getAll().then((r) => setLeases(r.data));
	}, []);

	const handleQuittanceChange = (e: React.ChangeEvent<any>) => {
		const updated = { ...form, [e.target.name]: e.target.value };
		if (e.target.name === "rent_amount" || e.target.name === "charges_amount") {
			const r =
				Number.parseFloat(
					e.target.name === "rent_amount" ? e.target.value : form.rent_amount,
				) || 0;
			const c =
				Number.parseFloat(
					e.target.name === "charges_amount"
						? e.target.value
						: form.charges_amount,
				) || 0;
			updated.total_amount = (r + c).toFixed(2);
		}
		Object.entries(updated).forEach(([key, value]) =>
			setFieldValue(key, value),
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const total = (
			Number.parseFloat(form.rent_amount || "0") +
			Number.parseFloat(form.charges_amount || "0")
		).toFixed(2);
		if (!validateForm({ total_amount: total })) return;
		const fd = new FormData();
		Object.entries({ ...form, total_amount: total }).forEach(([k, v]) =>
			fd.append(k, v as string),
		);
		try {
			if (editing) await QuittanceDataService.update(editing.id, fd);
			else await QuittanceDataService.create(fd);
			setModalVisible(false);
			fetchAll();
		} catch (err) {
			console.error(err);
		}
	};

	const handleEmailQuittance = async (id: number) => {
		setEmailSendingId(id);
		setEmailResult(null);
		try {
			const res = await PdfDataService.emailQuittance(id);
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

	const handleGeneratePdf = async () => {
		if (!printing?.id) return;
		setPdfGenerating(true);
		setPdfUrl(null);
		try {
			const res = await PdfDataService.generateQuittance(printing.id);
			const doc = res.data.document;
			setPdfUrl(DocumentDataService.downloadUrl(doc.id));
			setQuittanceDocs((prev) => ({ ...prev, [printing.id]: doc }));
		} catch (e) {
			console.error(e);
		} finally {
			setPdfGenerating(false);
		}
	};

	const isAllSelected =
		quittances.length > 0 && quittances.every((q) => selectedIds.has(q.id));

	const toggleSelectAll = () => {
		if (isAllSelected) setSelectedIds(new Set());
		else setSelectedIds(new Set(quittances.map((q) => q.id)));
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
			await QuittanceDataService.bulkDelete([...selectedIds]);
			const count = selectedIds.size;
			setSelectedIds(new Set());
			fetchAll();
			fetchDocs();
			setBulkAlert({
				type: "success",
				message: `${count} quittance(s) supprimée(s).`,
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

	const handleBulkGeneratePdf = async () => {
		setBulkGenerating(true);
		setBulkAlert(null);
		try {
			const res = await QuittanceDataService.bulkGeneratePdf([...selectedIds]);
			const { succeeded, failed } = res.data;
			setSelectedIds(new Set());
			fetchDocs();
			setBulkAlert({
				type: succeeded > 0 ? "success" : "danger",
				message: `${succeeded} PDF généré(s)${failed > 0 ? `, ${failed} erreur(s)` : ""}.`,
			});
		} catch {
			setBulkAlert({
				type: "danger",
				message: "Erreur lors de la génération des PDFs.",
			});
		} finally {
			setBulkGenerating(false);
		}
	};

	const handleBulkEmail = async () => {
		setBulkEmailing(true);
		setBulkAlert(null);
		try {
			const res = await QuittanceDataService.bulkEmail([...selectedIds]);
			const { sent, errors } = res.data;
			setSelectedIds(new Set());
			fetchAll();
			setBulkAlert({
				type: sent > 0 ? "success" : "danger",
				message: `${sent} email(s) envoyé(s)${errors > 0 ? `, ${errors} erreur(s)` : ""}.`,
			});
		} catch (e: any) {
			setBulkAlert({
				type: "danger",
				message:
					e?.response?.data?.message || "Erreur lors de l'envoi des emails.",
			});
		} finally {
			setBulkEmailing(false);
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
			<div className="grid grid-cols-3 gap-3 mb-4 text-center">
				<StatCard
					value={quittances.length}
					label={
						quittances.length > 1 ? "Quittances émises" : "Quittance émise"
					}
					color="primary"
				/>
				<StatCard
					value={`${quittances.reduce((s, q) => s + Number.parseFloat(q.total_amount || 0), 0).toFixed(2)} €`}
					label="Montant total"
					color="success"
				/>
				<StatCard
					value={new Set(quittances.map((q) => q.tenant_id)).size}
					label="Locataires concernés"
					color="info"
				/>
			</div>

			<EntityTableCard
				title="Quittances de loyer"
				addLabel="Nouvelle quittance"
				onAdd={openCreate}
			>
				{selectedIds.size > 0 && (
					<div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b flex-wrap">
						<span className="text-sm text-muted-foreground">
							{selectedIds.size} sélectionnée(s)
						</span>
						<Button
							size="sm"
							variant="outline"
							onClick={handleBulkGeneratePdf}
							disabled={bulkGenerating}
						>
							{bulkGenerating ? (
								<>
									<Spinner size="sm" className="mr-1" />
									Génération...
								</>
							) : (
								<>
									<FileText className="h-3 w-3 mr-1" />
									Générer les PDFs
								</>
							)}
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={handleBulkEmail}
							disabled={bulkEmailing}
						>
							{bulkEmailing ? (
								<>
									<Spinner size="sm" className="mr-1" />
									Envoi...
								</>
							) : (
								<>
									<Send className="h-3 w-3 mr-1" />
									Envoyer par email
								</>
							)}
						</Button>
						<Button
							size="sm"
							variant="destructive"
							onClick={() => setBulkDeleteModal(true)}
						>
							Supprimer
						</Button>
					</div>
				)}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-8">
								<input
									type="checkbox"
									checked={isAllSelected}
									onChange={toggleSelectAll}
									className="h-4 w-4"
								/>
							</TableHead>
							<TableHead>Période</TableHead>
							<TableHead>Locataire</TableHead>
							<TableHead>Bien</TableHead>
							<TableHead>Loyer HC</TableHead>
							<TableHead>Charges</TableHead>
							<TableHead>Total CC</TableHead>
							<TableHead>Émission</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{quittances.length === 0 ? (
							<TableEmptyRow colSpan={9} message="Aucune quittance" />
						) : (
							quittances.map((q) => (
								<TableRow key={q.id}>
									<TableCell>
										<input
											type="checkbox"
											checked={selectedIds.has(q.id)}
											onChange={() => toggleSelect(q.id)}
											className="h-4 w-4"
										/>
									</TableCell>
									<TableCell>
										{DateUtils.formatMonthYear(q.period) || q.period || "-"}
									</TableCell>
									<TableCell>
										{q.Tenant
											? `${q.Tenant.civility || ""} ${q.Tenant.firstname} ${q.Tenant.lastname}`.trim()
											: "-"}
									</TableCell>
									<TableCell>
										{q.Property
											? `${q.Property.type} – ${q.Property.city}`
											: "-"}
									</TableCell>
									<TableCell>
										{Number.parseFloat(q.rent_amount || 0).toFixed(2)} €
									</TableCell>
									<TableCell>
										{Number.parseFloat(q.charges_amount || 0).toFixed(2)} €
									</TableCell>
									<TableCell>
										{Number.parseFloat(q.total_amount || 0).toFixed(2)} €
									</TableCell>
									<TableCell>{q.issue_date || "-"}</TableCell>
									<TableCell>
										<div className="flex items-center gap-1">
											<TooltipProvider>
												{quittanceDocs[q.id] ? (
													<Tooltip>
														<TooltipTrigger asChild>
															<a
																href={DocumentDataService.downloadUrl(
																	quittanceDocs[q.id].id,
																)}
																target="_blank"
																rel="noreferrer"
															>
																<Button
																	size="sm"
																	variant="ghost"
																	className="h-7 w-7 p-0"
																>
																	<Download className="h-3.5 w-3.5 text-emerald-600" />
																</Button>
															</a>
														</TooltipTrigger>
														<TooltipContent>Télécharger le PDF</TooltipContent>
													</Tooltip>
												) : (
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																size="sm"
																variant="ghost"
																className="h-7 w-7 p-0"
																onClick={() => {
																	setPrinting(q);
																	setPrintModal(true);
																}}
															>
																<FileText className="h-3.5 w-3.5" />
															</Button>
														</TooltipTrigger>
														<TooltipContent>Générer PDF</TooltipContent>
													</Tooltip>
												)}
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															size="sm"
															variant="ghost"
															className="h-7 w-7 p-0"
															onClick={() => handleEmailQuittance(q.id)}
															disabled={emailSendingId === q.id}
														>
															{emailSendingId === q.id ? (
																<Spinner size="sm" />
															) : (
																<Send className="h-3.5 w-3.5" />
															)}
														</Button>
													</TooltipTrigger>
													<TooltipContent>Envoyer par email</TooltipContent>
												</Tooltip>
											</TooltipProvider>
											<ActionButtons
												onEdit={() => openEdit(q)}
												onDelete={() => openDelete(q)}
											/>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</EntityTableCard>

			<CrudModal
				visible={modalVisible}
				editing={editing}
				addTitle="Nouvelle quittance"
				editTitle="Modifier la quittance"
				onClose={() => setModalVisible(false)}
				onSubmit={handleSubmit}
			>
				<FormSelectField
					label="Locataire"
					name="tenant_id"
					value={form.tenant_id}
					onChange={handleQuittanceChange}
					required
					error={formErrors.tenant_id}
				>
					<option value="">— Choisir —</option>
					{tenants.map((t) => (
						<option key={t.id} value={t.id}>
							{t.civility} {t.firstname} {t.lastname}
						</option>
					))}
				</FormSelectField>

				<FormSelectField
					label="Bien"
					name="property_id"
					value={form.property_id}
					onChange={handleQuittanceChange}
					required
					error={formErrors.property_id}
				>
					<option value="">— Choisir —</option>
					{properties.map((p) => (
						<option key={p.id} value={p.id}>
							{p.type} – {p.city}
						</option>
					))}
				</FormSelectField>

				<FormSelectField
					label="Bail"
					name="lease_id"
					value={form.lease_id}
					onChange={handleQuittanceChange}
				>
					<option value="">— Aucun bail —</option>
					{leases.map((l) => (
						<option key={l.id} value={l.id}>
							{l.Tenant
								? `${l.Tenant.firstname} ${l.Tenant.lastname}`
								: `Bail #${l.id}`}{" "}
							– {l.start_date}
						</option>
					))}
				</FormSelectField>

				<FormInputField
					label="Période"
					name="period"
					type="month"
					value={form.period}
					onChange={handleQuittanceChange}
					required
					error={formErrors.period}
				/>
				<FormInputField
					label="Loyer HC (€)"
					name="rent_amount"
					type="number"
					step="0.01"
					value={form.rent_amount}
					onChange={handleQuittanceChange}
					required
					error={formErrors.rent_amount}
				/>
				<FormInputField
					label="Charges (€)"
					name="charges_amount"
					type="number"
					step="0.01"
					value={form.charges_amount}
					onChange={handleQuittanceChange}
				/>
				<FormInputField
					label={`Total CC : ${(rent + charges).toFixed(2)} €`}
					name="total_amount"
					type="number"
					step="0.01"
					value={(rent + charges).toFixed(2)}
					readOnly
				/>
				<FormInputField
					label="Date d'émission"
					name="issue_date"
					type="date"
					value={form.issue_date}
					onChange={handleQuittanceChange}
					required
					error={formErrors.issue_date}
				/>
			</CrudModal>

			<DeleteModal
				visible={deleteModal}
				itemLabel={
					toDelete
						? `la quittance de ${DateUtils.formatMonthYear(toDelete.period) || toDelete.period}`
						: ""
				}
				onClose={() => setDeleteModal(false)}
				onConfirm={handleDelete}
			/>

			<DeleteModal
				visible={bulkDeleteModal}
				itemLabel={`${selectedIds.size} quittance(s)`}
				onClose={() => setBulkDeleteModal(false)}
				onConfirm={handleBulkDelete}
			/>

			<Dialog
				open={printModal}
				onOpenChange={(o) => {
					if (!o) {
						setPrintModal(false);
						setPdfUrl(null);
					}
				}}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							Quittance –{" "}
							{printing
								? DateUtils.formatMonthYear(printing.period) || printing.period
								: ""}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						{printing && (
							<p className="text-sm text-muted-foreground">
								{`${printing.Tenant?.civility || ""} ${printing.Tenant?.firstname || ""} ${printing.Tenant?.lastname || ""}`.trim()}
								<br />
								Total :{" "}
								{Number.parseFloat(printing.total_amount || 0).toFixed(2)} €
							</p>
						)}
						{pdfUrl ? (
							<div className="flex gap-2">
								<a href={pdfUrl} target="_blank" rel="noreferrer">
									<Button variant="outline" size="sm">
										<ExternalLink className="h-4 w-4 mr-1" />
										Ouvrir
									</Button>
								</a>
								<a href={pdfUrl} download>
									<Button variant="outline" size="sm">
										<Download className="h-4 w-4 mr-1" />
										Télécharger
									</Button>
								</a>
							</div>
						) : (
							<Button onClick={handleGeneratePdf} disabled={pdfGenerating}>
								{pdfGenerating ? (
									<>
										<Spinner size="sm" className="mr-2" />
										Génération...
									</>
								) : (
									<>
										<FileText className="h-4 w-4 mr-1" />
										Générer le PDF
									</>
								)}
							</Button>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default Quittances;
