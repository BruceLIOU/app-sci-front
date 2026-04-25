import { AppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ExternalLink, FileText, Save } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import DocumentDataService from "../services/document.service";
import LeaseDataService from "../services/lease.service";
import PdfDataService from "../services/pdf.service";
import { FormInputField, FormTextareaField } from "./FormFields";

interface PropertyLeaseModalProps {
	visible: boolean;
	// biome-ignore lint/suspicious/noExplicitAny: forme property non encore typée
	property: any;
	// biome-ignore lint/suspicious/noExplicitAny: forme lease non encore typée
	lease?: any;
	// biome-ignore lint/suspicious/noExplicitAny: forme tenants non encore typée
	tenants: any[];
	onClose: () => void;
	onSaved: () => void;
}

const emptyForm = (propertyId: number | string) => ({
	property_id: String(propertyId),
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
});

const fieldCls =
	"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const PropertyLeaseModal: React.FC<PropertyLeaseModalProps> = ({
	visible,
	property,
	lease,
	tenants,
	onClose,
	onSaved,
}) => {
	const [form, setForm] = useState(emptyForm(property?.id ?? ""));
	const [saving, setSaving] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [savedLeaseId, setSavedLeaseId] = useState<number | null>(null);
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);

	useEffect(() => {
		if (!visible) {
			setSavedLeaseId(null);
			setPdfUrl(null);
			return;
		}
		setError(null);
		if (lease) {
			setForm({
				property_id: String(property.id),
				tenant_id: lease.tenant_id ? String(lease.tenant_id) : "",
				type: lease.type || "nu",
				start_date: lease.start_date || "",
				end_date: lease.end_date || "",
				rent_amount: lease.rent_amount || "",
				charges_amount: lease.charges_amount || "0",
				deposit_amount: lease.deposit_amount || "0",
				notice_period: lease.notice_period || "3",
				status: lease.status || "active",
				notes: lease.notes || "",
			});
			setSavedLeaseId(lease.id);
		} else {
			setForm(emptyForm(property?.id ?? ""));
			setSavedLeaseId(null);
			setPdfUrl(null);
		}
	}, [visible, lease, property]);

	// biome-ignore lint/suspicious/noExplicitAny: ChangeEvent générique multi-input
	const handleChange = (e: React.ChangeEvent<any>) =>
		setForm({ ...form, [e.target.name]: e.target.value });

	const handleSelectChange = (name: string) => (value: string) =>
		setForm((prev) => ({ ...prev, [name]: value === "__none__" ? "" : value }));

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError(null);
		try {
			const fd = new FormData();
			for (const [k, v] of Object.entries(form)) fd.append(k, v as string);
			if (lease) {
				await LeaseDataService.update(lease.id, fd);
				setSavedLeaseId(lease.id);
			} else {
				const res = await LeaseDataService.create(fd);
				setSavedLeaseId(res.data.id);
			}
			onSaved();
			// biome-ignore lint/suspicious/noExplicitAny: err axios non typé
		} catch (err: any) {
			setError(
				err?.response?.data?.message ?? "Erreur lors de l'enregistrement.",
			);
		} finally {
			setSaving(false);
		}
	};

	const handleGeneratePdf = async () => {
		const leaseId = savedLeaseId ?? lease?.id;
		if (!leaseId) {
			setError("Enregistrez le bail avant de générer le PDF.");
			return;
		}
		setGenerating(true);
		setError(null);
		try {
			const res = await PdfDataService.generateBail(leaseId);
			setPdfUrl(DocumentDataService.downloadUrl(res.data.document.id));
			// biome-ignore lint/suspicious/noExplicitAny: err axios non typé
		} catch (err: any) {
			setError(
				err?.response?.data?.message ?? "Erreur lors de la génération du PDF.",
			);
		} finally {
			setGenerating(false);
		}
	};

	const loyer = (
		Number.parseFloat(form.rent_amount || "0") +
		Number.parseFloat(form.charges_amount || "0")
	).toFixed(2);

	if (!property) return null;

	return (
		<Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{lease ? "Modifier le bail" : "Créer un bail"} — {property.type},{" "}
						{property.city}
					</DialogTitle>
				</DialogHeader>

				{error && (
					<AppAlert color="danger" dismissible onClose={() => setError(null)}>
						{error}
					</AppAlert>
				)}
				{pdfUrl && (
					<AppAlert color="success">
						<span className="flex items-center gap-2">
							<FileText className="h-4 w-4" />
							PDF généré —{" "}
							<a
								href={pdfUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="underline flex items-center gap-1"
							>
								Ouvrir <ExternalLink className="h-3 w-3" />
							</a>
						</span>
					</AppAlert>
				)}

				<form id="lease-form" onSubmit={handleSave} className="space-y-4">
					<FormInputField
						label="Bien loué"
						value={`${property.type} – ${property.address}, ${property.city}`}
						readOnly
						className="bg-muted/50 text-muted-foreground"
					/>

					<div className="grid grid-cols-1 gap-4">
						<div className="space-y-1.5">
							<Label>Locataire</Label>
							<Select
								value={form.tenant_id || "__none__"}
								onValueChange={handleSelectChange("tenant_id")}
							>
								<SelectTrigger>
									<SelectValue placeholder="— Sélectionner un locataire —" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__">
										— Sélectionner un locataire —
									</SelectItem>
									{tenants.map((t) => (
										<SelectItem key={t.id} value={String(t.id)}>
											{t.civility ? `${t.civility} ` : ""}
											{t.firstname} {t.lastname}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-4">
						<div className="space-y-1.5">
							<Label>Type de bail</Label>
							<Select
								value={form.type}
								onValueChange={handleSelectChange("type")}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="nu">Location nue (3 ans)</SelectItem>
									<SelectItem value="meublé">Meublé (1 an)</SelectItem>
									<SelectItem value="commercial">Commercial (9 ans)</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<FormInputField
							label="Date de début"
							type="date"
							name="start_date"
							value={form.start_date}
							onChange={handleChange}
							required
						/>
						<FormInputField
							label="Date de fin"
							type="date"
							name="end_date"
							value={form.end_date}
							onChange={handleChange}
						/>
					</div>

					<div className="grid grid-cols-3 gap-4">
						<FormInputField
							label="Loyer HC (€)"
							type="number"
							name="rent_amount"
							value={form.rent_amount}
							onChange={handleChange}
							required
							min={0}
							step={0.01}
						/>
						<FormInputField
							label="Charges (€)"
							type="number"
							name="charges_amount"
							value={form.charges_amount}
							onChange={handleChange}
							min={0}
							step={0.01}
						/>
						<div className="flex flex-col justify-end rounded-lg border bg-muted/30 p-2 text-center">
							<div className="text-xs text-muted-foreground">Loyer CC</div>
							<strong className="text-sm">{loyer} €</strong>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-4">
						<FormInputField
							label="Dépôt de garantie (€)"
							type="number"
							name="deposit_amount"
							value={form.deposit_amount}
							onChange={handleChange}
							min={0}
							step={0.01}
						/>
						<FormInputField
							label="Préavis (mois)"
							type="number"
							name="notice_period"
							value={form.notice_period}
							onChange={handleChange}
							min={0}
						/>
						<div className="space-y-1.5">
							<Label>Statut</Label>
							<Select
								value={form.status}
								onValueChange={handleSelectChange("status")}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Actif</SelectItem>
									<SelectItem value="expired">Expiré</SelectItem>
									<SelectItem value="terminated">Résilié</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<FormTextareaField
						label="Conditions particulières / Notes"
						name="notes"
						rows={3}
						value={form.notes}
						onChange={handleChange}
					/>
				</form>

				<DialogFooter className="gap-2">
					<Button
						variant="outline"
						onClick={onClose}
						disabled={saving || generating}
					>
						Annuler
					</Button>
					{(savedLeaseId || lease?.id) && (
						<Button
							variant="outline"
							onClick={handleGeneratePdf}
							disabled={generating || saving}
						>
							{generating ? (
								<>
									<Spinner size="sm" className="mr-1" />
									Génération…
								</>
							) : (
								<>
									<FileText className="h-4 w-4 mr-1" />
									Générer PDF
								</>
							)}
						</Button>
					)}
					<Button
						type="submit"
						form="lease-form"
						disabled={saving || generating}
					>
						{saving ? (
							<>
								<Spinner size="sm" className="mr-1" />
								Enregistrement…
							</>
						) : (
							<>
								<Save className="h-4 w-4 mr-1" />
								{lease ? "Enregistrer" : "Créer le bail"}
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default PropertyLeaseModal;
