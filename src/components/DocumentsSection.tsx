import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { CloudDownload, Plus, Trash2, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import DocumentDataService from "../services/document.service";

const CATEGORIES: { value: string; label: string; color: string }[] = [
	{ value: "bail", label: "Bail", color: "blue" },
	{ value: "etat-des-lieux", label: "État des lieux", color: "teal" },
	{ value: "quittance", label: "Quittance", color: "emerald" },
	{ value: "assurance", label: "Assurance", color: "amber" },
	{ value: "diagnostic", label: "Diagnostic", color: "slate" },
	{ value: "identite", label: "Identité", color: "slate" },
	{ value: "justificatif", label: "Justificatif", color: "slate" },
	{ value: "revenu", label: "Revenus", color: "emerald" },
	{ value: "autre", label: "Autre", color: "slate" },
];

const catBadgeClass: Record<string, string> = {
	blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
	teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
	emerald:
		"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
	amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
	slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const CATEGORIES_BY_ENTITY: Record<string, string[]> = {
	property: ["bail", "etat-des-lieux", "diagnostic", "assurance", "autre"],
	tenant: ["identite", "assurance", "justificatif", "revenu", "autre"],
	lease: ["bail", "quittance", "assurance", "diagnostic", "autre"],
	inspection: ["etat-des-lieux", "diagnostic", "autre"],
};

function formatSize(bytes?: number) {
	if (!bytes) return "";
	if (bytes < 1024) return `${bytes} o`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
	return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

interface DocumentsSectionProps {
	entityType: "property" | "tenant" | "lease" | "inspection";
	entityId: number;
}

const emptyForm = { title: "", category: "", notes: "" };

const DocumentsSection: React.FC<DocumentsSectionProps> = ({
	entityType,
	entityId,
}) => {
	// biome-ignore lint/suspicious/noExplicitAny: shape docs non typée
	const [docs, setDocs] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState(emptyForm);
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [deleting, setDeleting] = useState<number | null>(null);

	const allowedCategories = CATEGORIES.filter((c) =>
		(CATEGORIES_BY_ENTITY[entityType] ?? []).includes(c.value),
	);

	const fetchDocs = () => {
		setLoading(true);
		DocumentDataService.getAll({ entity_type: entityType, entity_id: entityId })
			.then((r) => setDocs(r.data))
			.catch(console.error)
			.finally(() => setLoading(false));
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: fetchDocs redéfinie inline
	useEffect(() => {
		if (entityId) fetchDocs();
	}, [entityId]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!file) return;
		const fd = new FormData();
		fd.append("title", form.title);
		fd.append("category", form.category);
		fd.append("notes", form.notes);
		fd.append("entity_type", entityType);
		fd.append("entity_id", String(entityId));
		fd.append("file", file);
		setUploading(true);
		try {
			await DocumentDataService.create(fd);
			setShowForm(false);
			setForm(emptyForm);
			setFile(null);
			fetchDocs();
		} catch (err) {
			console.error(err);
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async (id: number) => {
		if (!window.confirm("Supprimer ce document ?")) return;
		setDeleting(id);
		try {
			await DocumentDataService.delete(id);
			setDocs((prev) => prev.filter((d) => d.id !== id));
		} catch (err) {
			console.error(err);
		} finally {
			setDeleting(null);
		}
	};

	const getCatMeta = (val: string) => CATEGORIES.find((c) => c.value === val);

	return (
		<div>
			<div className="flex justify-between items-center mb-2">
				<span className="text-sm text-muted-foreground font-medium">
					{docs.length} document{docs.length > 1 ? "s" : ""}
				</span>
				<Button
					variant="outline"
					size="sm"
					className="h-7 gap-1 text-xs"
					onClick={() => {
						setShowForm((v) => !v);
						if (showForm) {
							setForm(emptyForm);
							setFile(null);
						}
					}}
				>
					{showForm ? (
						<>
							<X className="h-3 w-3" />
							Annuler
						</>
					) : (
						<>
							<Plus className="h-3 w-3" />
							Ajouter
						</>
					)}
				</Button>
			</div>

			{showForm && (
				<form
					onSubmit={handleSubmit}
					className="border rounded-lg p-3 mb-3 bg-muted/30 space-y-2"
				>
					<div className="grid grid-cols-2 gap-2">
						<input
							className="h-8 rounded-md border border-input bg-background px-3 text-sm col-span-2 sm:col-span-1"
							placeholder="Titre du document"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							required
						/>
						<select
							className="h-8 rounded-md border border-input bg-background px-3 text-sm col-span-2 sm:col-span-1"
							value={form.category}
							onChange={(e) => setForm({ ...form, category: e.target.value })}
							required
						>
							<option value="">-- Catégorie --</option>
							{allowedCategories.map((c) => (
								<option key={c.value} value={c.value}>
									{c.label}
								</option>
							))}
						</select>
						<input
							type="file"
							className="h-8 col-span-2 text-sm file:mr-2 file:h-7 file:rounded-md file:border-0 file:bg-muted file:px-2 file:text-xs"
							onChange={(e) => setFile(e.target.files?.[0] ?? null)}
							required
						/>
						<textarea
							className="col-span-2 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
							placeholder="Notes (optionnel)"
							rows={2}
							value={form.notes}
							onChange={(e) => setForm({ ...form, notes: e.target.value })}
						/>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							size="sm"
							type="button"
							onClick={() => {
								setShowForm(false);
								setForm(emptyForm);
								setFile(null);
							}}
						>
							Annuler
						</Button>
						<Button size="sm" type="submit" disabled={uploading}>
							{uploading && <Spinner size="sm" className="mr-1" />}
							Enregistrer
						</Button>
					</div>
				</form>
			)}

			{loading ? (
				<div className="flex justify-center py-4">
					<Spinner />
				</div>
			) : docs.length === 0 ? (
				<p className="text-sm text-muted-foreground italic">
					Aucun document associé.
				</p>
			) : (
				<ul className="divide-y">
					{docs.map((doc) => {
						const cat = getCatMeta(doc.category);
						return (
							<li key={doc.id} className="flex items-center gap-2 py-2">
								<div className="flex-1 min-w-0">
									<div className="text-sm font-medium truncate">
										{doc.title}
									</div>
									<div className="flex items-center gap-1 mt-0.5 flex-wrap">
										{cat && (
											<span
												className={cn(
													"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
													catBadgeClass[cat.color],
												)}
											>
												{cat.label}
											</span>
										)}
										{doc.file_size && (
											<span className="text-xs text-muted-foreground">
												{formatSize(doc.file_size)}
											</span>
										)}
										{doc.notes && (
											<span
												className="text-xs text-muted-foreground italic truncate max-w-[200px]"
												title={doc.notes}
											>
												{doc.notes}
											</span>
										)}
									</div>
								</div>
								<a
									href={DocumentDataService.downloadUrl(doc.id)}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
									title="Télécharger"
								>
									<CloudDownload className="h-4 w-4" />
								</a>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
									title="Supprimer"
									onClick={() => handleDelete(doc.id)}
									disabled={deleting === doc.id}
								>
									{deleting === doc.id ? (
										<Spinner size="sm" />
									) : (
										<Trash2 className="h-3.5 w-3.5" />
									)}
								</Button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
};

export default DocumentsSection;
