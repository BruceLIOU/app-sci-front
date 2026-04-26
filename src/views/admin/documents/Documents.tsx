import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
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
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Download, File, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
	FormInputField,
	FormSelectField,
	FormTextareaField,
} from "../../../components/FormFields";
import StatCard from "../../../components/StatCard";
import TableEmptyRow from "../../../components/TableEmptyRow";
import useIsAdmin from "../../../hooks/useIsAdmin";
import DocumentDataService from "../../../services/document.service";
import LeaseDataService from "../../../services/lease.service";
import PropertyDataService from "../../../services/property.service";
import TenantDataService from "../../../services/tenant.service";

const CATEGORIES = [
	{
		value: "identite",
		label: "Carte d'identité / Passeport",
		color: "warning",
	},
	{ value: "bail", label: "Bail", color: "primary" },
	{ value: "etat-des-lieux", label: "État des lieux", color: "info" },
	{ value: "quittance", label: "Quittance", color: "success" },
	{ value: "assurance", label: "Assurance", color: "danger" },
	{
		value: "justificatif",
		label: "Justificatif de domicile",
		color: "secondary",
	},
	{ value: "revenu", label: "Justificatif de revenus", color: "secondary" },
	{ value: "diagnostic", label: "Diagnostic immobilier", color: "dark" },
	{ value: "autre", label: "Autre", color: "light" },
];

const ENTITY_TYPES = [
	{ value: "tenant", label: "Locataire" },
	{ value: "property", label: "Bien immobilier" },
	{ value: "lease", label: "Bail" },
];

const catInfo = (value: string) =>
	CATEGORIES.find((c) => c.value === value) ?? {
		label: value,
		color: "secondary",
	};

const formatSize = (bytes: number | null) => {
	if (!bytes) return "—";
	if (bytes < 1024) return `${bytes} o`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const Documents = () => {
	const [docs, setDocs] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [tenants, setTenants] = useState<any[]>([]);
	const [properties, setProperties] = useState<any[]>([]);
	const [leases, setLeases] = useState<any[]>([]);

	const [filterEntityType, setFilterEntityType] = useState<
		string | undefined
	>();
	const [filterCategory, setFilterCategory] = useState<string | undefined>();

	const [addModal, setAddModal] = useState(false);
	const [deleteModal, setDeleteModal] = useState(false);
	const [toDelete, setToDelete] = useState<any>(null);
	const [uploading, setUploading] = useState(false);

	const [form, setForm] = useState<{
		title: string;
		category: string;
		entity_type: string;
		entity_id: string;
		notes: string;
		file: File | null;
	}>({
		title: "",
		category: "identite",
		entity_type: "tenant",
		entity_id: "",
		notes: "",
		file: null,
	});

	const fetchDocs = useCallback(async () => {
		setLoading(true);
		try {
			const res = await DocumentDataService.getAll();
			setDocs(res.data);
		} catch {
			/* silently */
		} finally {
			setLoading(false);
		}
	}, []);

	const isAdmin = useIsAdmin();

	useEffect(() => {
		fetchDocs();
		TenantDataService.getAll()
			.then((r) => setTenants(r.data))
			.catch(() => {});
		PropertyDataService.getAll()
			.then((r) => setProperties(r.data))
			.catch(() => {});
		LeaseDataService.getAll()
			.then((r) => setLeases(r.data))
			.catch(() => {});
	}, [fetchDocs]);

	const detectCategory = (filename: string): string => {
		const name = filename.toLowerCase();
		if (/bail|contrat|location/.test(name)) return "bail";
		if (/quittance|recu|recu/.test(name)) return "quittance";
		if (/etat.des.lieux|edl/.test(name)) return "etat-des-lieux";
		if (/assurance|mrh/.test(name)) return "assurance";
		if (/dpe|diagnostic|amiante|plomb|gaz|electr/.test(name))
			return "diagnostic";
		if (/cni|carte.identite|passeport/.test(name)) return "identite";
		if (/salaire|bulletin|revenu|avis.imposition|impot/.test(name))
			return "revenu";
		if (/justificatif|domicile|facture.edf|facture.eau/.test(name))
			return "justificatif";
		return "autre";
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const category = detectCategory(file.name);
		const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
		setForm((prev) => ({
			...prev,
			file,
			category,
			title: prev.title || title,
		}));
	};

	const entityOptions = () => {
		if (form.entity_type === "tenant")
			return tenants.map((t) => ({
				value: t.id,
				label: `${t.civility || ""} ${t.firstname} ${t.lastname}`,
			}));
		if (form.entity_type === "property")
			return properties.map((p) => ({
				value: p.id,
				label: `${p.type} – ${p.city}`,
			}));
		if (form.entity_type === "lease")
			return leases.map((l) => ({
				value: l.id,
				label: `Bail #${l.id}${l.Property ? ` (${l.Property.city})` : ""}`,
			}));
		return [];
	};

	const filteredDocs = docs.filter((d) => {
		if (filterEntityType && d.entity_type !== filterEntityType) return false;
		if (filterCategory && d.category !== filterCategory) return false;
		return true;
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.file || !form.title || !form.entity_id) return;
		setUploading(true);
		try {
			const fd = new FormData();
			fd.append("title", form.title);
			fd.append("category", form.category);
			fd.append("entity_type", form.entity_type);
			fd.append("entity_id", form.entity_id);
			fd.append("notes", form.notes);
			fd.append("file", form.file);
			await DocumentDataService.create(fd);
			setAddModal(false);
			setForm({
				title: "",
				category: "identite",
				entity_type: "tenant",
				entity_id: "",
				notes: "",
				file: null,
			});
			fetchDocs();
		} catch {
			/* error */
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async () => {
		if (!toDelete) return;
		try {
			await DocumentDataService.delete(toDelete.id);
			setDeleteModal(false);
			fetchDocs();
		} catch {
			/* error */
		}
	};

	const entityLabel = (doc: any) => {
		if (doc.entity_type === "tenant") {
			const t = tenants.find((x) => x.id === doc.entity_id);
			return t
				? `${t.civility || ""} ${t.firstname} ${t.lastname}`.trim()
				: `Locataire #${doc.entity_id}`;
		}
		if (doc.entity_type === "property") {
			const p = properties.find((x) => x.id === doc.entity_id);
			return p ? `${p.type} – ${p.city}` : `Bien #${doc.entity_id}`;
		}
		if (doc.entity_type === "lease") return `Bail #${doc.entity_id}`;
		return `#${doc.entity_id}`;
	};

	return (
		<>
			<div className="mb-4">
				<Card className="app-page-hero border-0">
					<CardContent className="p-0 relative">
						<div className="app-page-kicker mb-3">Gestion documentaire</div>
						<h2 className="mb-2 app-display-title">
							Centralisez tous les documents de gestion
						</h2>
						<p className="app-page-description mb-4">
							Classez, filtrez et retrouvez rapidement les pieces liees aux
							locataires, biens et baux.
						</p>
						<div className="flex flex-wrap gap-2">
							<span className="app-filter-chip">{docs.length} documents</span>
							<span className="app-filter-chip">
								{filteredDocs.length} affiches
							</span>
							<span className="app-filter-chip">
								{CATEGORIES.length} categories
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="flex gap-4 mb-4 text-center w-full justify-content-center flex-direction-column">
				<StatCard value={docs.length} label="Documents" color="primary" />
				<StatCard
					value={docs.filter((d) => d.entity_type === "tenant").length}
					label="Locataires"
					color="warning"
				/>
				<StatCard
					value={docs.filter((d) => d.entity_type === "property").length}
					label="Biens"
					color="info"
				/>
			</div>

			<Card className="app-panel-card app-table-card">
				<CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2 border-b py-3 px-4 space-y-0">
					<strong>Mes documents</strong>
					<div className="flex gap-2 flex-wrap items-center">
						<Select
							value={filterEntityType ?? "__all__"}
							onValueChange={(v) =>
								setFilterEntityType(v === "__all__" ? undefined : v)
							}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Toutes les entités" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">Toutes les entités</SelectItem>
								{ENTITY_TYPES.map((et) => (
									<SelectItem key={et.value} value={et.value}>
										{et.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={filterCategory ?? "__all__"}
							onValueChange={(v) =>
								setFilterCategory(v === "__all__" ? undefined : v)
							}
						>
							<SelectTrigger className="w-[220px]">
								<SelectValue placeholder="Toutes les catégories" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">Toutes les catégories</SelectItem>
								{CATEGORIES.map((cat) => (
									<SelectItem key={cat.value} value={cat.value}>
										{cat.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{isAdmin && (
							<Button
								size="sm"
								className="app-ghost-button"
								onClick={() => setAddModal(true)}
							>
								<Plus className="mr-1 h-4 w-4" />
								Ajouter
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{loading ? (
						<div className="text-center py-5">
							<Spinner size="lg" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Document</TableHead>
										<TableHead>Catégorie</TableHead>
										<TableHead>Entité</TableHead>
										{/* <TableHead>Fichier</TableHead> */}
										<TableHead>Taille</TableHead>
										<TableHead>Date</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredDocs.length === 0 ? (
										<TableEmptyRow colSpan={7} message="Aucun document" />
									) : (
										filteredDocs.map((doc) => {
											const cat = catInfo(doc.category);
											return (
												<TableRow key={doc.id}>
													<TableCell>
														<File className="inline h-4 w-4 mr-2 text-muted-foreground" />
														<strong>{doc.title}</strong>
														{doc.notes && (
															<div className="text-muted-foreground text-sm">
																{doc.notes}
															</div>
														)}
													</TableCell>
													<TableCell>
														<Badge variant="secondary">{cat.label}</Badge>
													</TableCell>
													<TableCell>
														<Badge variant="outline" className="mr-1">
															{ENTITY_TYPES.find(
																(et) => et.value === doc.entity_type,
															)?.label ?? doc.entity_type}
														</Badge>
														{entityLabel(doc)}
													</TableCell>
													{/* <TableCell className="text-muted-foreground text-sm">
														{doc.file_name || "—"}
													</TableCell> */}
													<TableCell className="text-muted-foreground text-sm">
														{formatSize(doc.file_size)}
													</TableCell>
													<TableCell className="text-muted-foreground text-sm">
														{doc.createdAt
															? new Date(doc.createdAt).toLocaleDateString(
																	"fr-FR",
																)
															: "—"}
													</TableCell>
													<TableCell>
														<div className="flex gap-1 justify-end flex-nowrap">
															<Button
																variant="outline"
																size="sm"
																asChild
																title="Télécharger / Ouvrir"
															>
																<a
																	href={DocumentDataService.downloadUrl(doc.id)}
																	target="_blank"
																	rel="noreferrer"
																>
																	<Download className="h-4 w-4" />
																</a>
															</Button>
															{isAdmin && (
																<Button
																	variant="outline"
																	className="text-destructive"
																	size="sm"
																	onClick={() => {
																		setToDelete(doc);
																		setDeleteModal(true);
																	}}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															)}
														</div>
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Modal ajout */}
			<Dialog open={addModal} onOpenChange={(o) => !o && setAddModal(false)}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Ajouter un document</DialogTitle>
					</DialogHeader>
					<form className="grid grid-cols-12 gap-3" onSubmit={handleSubmit}>
						<div className="col-span-12">
							<FormInputField
								label="Titre du document"
								required
								value={form.title}
								onChange={(e) => setForm({ ...form, title: e.target.value })}
								placeholder="Ex : Bail signé 2025, Carte identité M. Dupont..."
							/>
						</div>
						<div className="col-span-6">
							<FormSelectField
								label="Catégorie"
								required
								value={form.category}
								onChange={(e) => setForm({ ...form, category: e.target.value })}
							>
								{CATEGORIES.map((c) => (
									<option key={c.value} value={c.value}>
										{c.label}
									</option>
								))}
							</FormSelectField>
						</div>
						<div className="col-span-6">
							<FormSelectField
								label="Lié à"
								required
								value={form.entity_type}
								onChange={(e) =>
									setForm({
										...form,
										entity_type: e.target.value,
										entity_id: "",
									})
								}
							>
								{ENTITY_TYPES.map((et) => (
									<option key={et.value} value={et.value}>
										{et.label}
									</option>
								))}
							</FormSelectField>
						</div>
						<div className="col-span-12">
							<FormSelectField
								label={
									<>
										{ENTITY_TYPES.find((et) => et.value === form.entity_type)
											?.label ?? "Entité"}{" "}
										<span className="text-destructive">*</span>
									</>
								}
								required
								value={form.entity_id}
								onChange={(e) =>
									setForm({ ...form, entity_id: e.target.value })
								}
							>
								<option value="">-- Sélectionner --</option>
								{entityOptions().map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</FormSelectField>
						</div>
						<div className="col-span-12">
							<FormInputField
								label="Fichier"
								required
								type="file"
								accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx"
								onChange={handleFileChange}
							/>
							<p className="text-muted-foreground text-sm">
								PDF, Word, images, Excel acceptés
							</p>
						</div>
						<div className="col-span-12">
							<FormTextareaField
								label="Notes"
								rows={2}
								value={form.notes}
								onChange={(e) => setForm({ ...form, notes: e.target.value })}
								placeholder="Précisions optionnelles..."
							/>
						</div>
						<div className="col-span-12 flex gap-2 justify-end pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setAddModal(false)}
							>
								Annuler
							</Button>
							<Button type="submit" disabled={uploading}>
								{uploading ? <Spinner size="sm" className="mr-1" /> : null}
								Enregistrer
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Modal suppression */}
			<Dialog
				open={deleteModal}
				onOpenChange={(o) => !o && setDeleteModal(false)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Suppression</DialogTitle>
					</DialogHeader>
					<p>
						Supprimer le document <strong>{toDelete?.title}</strong> ? Cette
						action est irréversible.
					</p>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteModal(false)}>
							Annuler
						</Button>
						<Button variant="destructive" onClick={handleDelete}>
							Supprimer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default Documents;
