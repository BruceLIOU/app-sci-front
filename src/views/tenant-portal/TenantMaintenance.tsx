import { AppAlert } from "@/components/ui/app-alert";
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
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Plus } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { FormInputField, FormSelectField } from "../../components/FormFields";
import TenantPortalService, {
	type TenantMaintenanceItem,
} from "../../services/tenant_portal.service";

const TYPE_LABEL: Record<string, string> = {
	plomberie: "Plomberie",
	electricite: "Électricité",
	chauffage: "Chauffage",
	serrurerie: "Serrurerie",
	peinture: "Peinture",
	nettoyage: "Nettoyage",
	travaux: "Travaux",
	autre: "Autre",
};
const STATUS_LABEL: Record<string, string> = {
	open: "Ouvert",
	in_progress: "En cours",
	resolved: "Résolu",
	closed: "Clôturé",
};
const STATUS_VARIANT: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	open: "destructive",
	in_progress: "secondary",
	resolved: "default",
	closed: "outline",
};

const TenantMaintenance: React.FC = () => {
	const [items, setItems] = useState<TenantMaintenanceItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [form, setForm] = useState({
		title: "",
		description: "",
		type: "autre",
	});
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitSuccess, setSubmitSuccess] = useState(false);

	const load = useCallback(() => {
		setLoading(true);
		TenantPortalService.getMaintenance()
			.then((r) => setItems(r.data))
			.catch((e) =>
				setError(e.response?.data?.message || "Erreur de chargement."),
			)
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		setSubmitError(null);
		const fd = new FormData();
		fd.append("title", form.title);
		fd.append("description", form.description);
		fd.append("type", form.type);
		try {
			await TenantPortalService.createMaintenance(fd);
			setSubmitSuccess(true);
			setForm({ title: "", description: "", type: "autre" });
			load();
			setTimeout(() => {
				setModalOpen(false);
				setSubmitSuccess(false);
			}, 1200);
		} catch (err: any) {
			setSubmitError(err.response?.data?.message || "Erreur lors de l'envoi.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">Signalement d'incident</h1>
				<Button
					size="sm"
					variant="outline"
					onClick={() => {
						setModalOpen(true);
						setSubmitError(null);
						setSubmitSuccess(false);
					}}
				>
					<Plus className="h-4 w-4 mr-1" />
					Signaler
				</Button>
			</div>

			{loading && (
				<div className="flex justify-center py-12">
					<Spinner size="lg" />
				</div>
			)}
			{error && (
				<div className="text-destructive text-sm py-4 text-center">{error}</div>
			)}
			{!loading && !error && items.length === 0 && (
				<p className="text-muted-foreground text-sm py-6 text-center">
					Aucun signalement. Utilisez le bouton ci-dessus pour soumettre un
					incident.
				</p>
			)}
			{!loading && !error && items.length > 0 && (
				<div className="space-y-3">
					{items.map((item) => (
						<Card key={item.id}>
							<CardContent className="pt-4 pb-3 px-4">
								<div className="flex items-start justify-between gap-2">
									<div className="flex-1 min-w-0">
										<p className="font-medium text-sm">{item.title}</p>
										{item.description && (
											<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
												{item.description}
											</p>
										)}
										<div className="flex flex-wrap items-center gap-2 mt-2">
											<Badge variant="outline" className="text-xs">
												{TYPE_LABEL[item.type] ?? item.type}
											</Badge>
											<Badge
												variant={STATUS_VARIANT[item.status] ?? "secondary"}
												className="text-xs"
											>
												{STATUS_LABEL[item.status] ?? item.status}
											</Badge>
											<span className="text-xs text-muted-foreground">
												{item.reported_at
													? new Date(item.reported_at).toLocaleDateString(
															"fr-FR",
														)
													: new Date(item.createdAt).toLocaleDateString(
															"fr-FR",
														)}
											</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			<Dialog
				open={modalOpen}
				onOpenChange={(open) => !open && setModalOpen(false)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Signaler un incident</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit}>
						<div className="space-y-3 py-2">
							{submitError && (
								<AppAlert
									color="danger"
									dismissible
									onClose={() => setSubmitError(null)}
								>
									{submitError}
								</AppAlert>
							)}
							{submitSuccess && (
								<AppAlert color="success">
									Signalement envoyé avec succès.
								</AppAlert>
							)}
							<FormInputField
								label="Titre"
								required
								value={form.title}
								onChange={(e) =>
									setForm((p) => ({ ...p, title: e.target.value }))
								}
								placeholder="Ex : Fuite sous l'évier"
								disabled={submitting}
							/>
							<div>
								<Label>Description (optionnel)</Label>
								<textarea
									value={form.description}
									onChange={(e) =>
										setForm((p) => ({ ...p, description: e.target.value }))
									}
									rows={3}
									disabled={submitting}
									className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1 resize-none"
									placeholder="Décrivez le problème…"
								/>
							</div>
							<FormSelectField
								label="Catégorie"
								value={form.type}
								onChange={(e) =>
									setForm((p) => ({ ...p, type: e.target.value }))
								}
								disabled={submitting}
							>
								{Object.entries(TYPE_LABEL).map(([val, label]) => (
									<option key={val} value={val}>
										{label}
									</option>
								))}
							</FormSelectField>
						</div>
						<DialogFooter className="pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setModalOpen(false)}
								disabled={submitting}
							>
								Fermer
							</Button>
							<Button type="submit" disabled={submitting}>
								{submitting ? <Spinner size="sm" className="mr-2" /> : null}
								Envoyer
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default TenantMaintenance;
