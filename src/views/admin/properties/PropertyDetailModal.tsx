import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import DocumentsSection from "../../../components/DocumentsSection";
import PropertyLeaseModal from "../../../components/PropertyLeaseModal";
import LeaseDataService from "../../../services/lease.service";
import TenantDataService from "../../../services/tenant.service";
import "leaflet/dist/leaflet.css";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";

interface PropertyDetailModalProps {
	visible: boolean;
	property: any;
	onClose: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

const statusLabel: Record<string, string> = {
	active: "Actif",
	expired: "Expiré",
	terminated: "Résilié",
};
const statusBadgeClass: Record<string, string> = {
	active:
		"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 mr-2",
	expired:
		"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 mr-2",
	terminated:
		"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-rose-100 text-rose-700 mr-2",
};
const typeLabel: Record<string, string> = {
	nu: "Location nue",
	meublé: "Meublé",
	commercial: "Commercial",
};

const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
	visible,
	property,
	onClose,
	onEdit,
	onDelete,
}) => {
	const [leases, setLeases] = useState<any[]>([]);
	const [leasesLoading, setLeasesLoading] = useState(false);
	const [tenants, setTenants] = useState<any[]>([]);
	const [leaseModalVisible, setLeaseModalVisible] = useState(false);
	const [editingLease, setEditingLease] = useState<any>(null);
	const [activeTab, setActiveTab] = useState("detail");

	const fetchLeases = () => {
		if (!property?.id) return;
		setLeasesLoading(true);
		LeaseDataService.getAll()
			.then((r) =>
				setLeases(
					r.data.filter(
						(l: any) =>
							l.property_id === property.id || l.Property?.id === property.id,
					),
				),
			)
			.catch(console.error)
			.finally(() => setLeasesLoading(false));
	};

	useEffect(() => {
		if (!visible) return;
		fetchLeases();
		TenantDataService.getAll()
			.then((r) => setTenants(r.data))
			.catch(console.error);
	}, [visible, property?.id]);

	const userRole = useSelector(
		(state: RootState) => state.auth.user?.role ?? "viewer",
	);
	const isAdmin = userRole === "admin";
	if (!property) return null;

	const images: string[] = (() => {
		const list: string[] = [];
		if (property.thumbnail) list.push(property.thumbnail);
		try {
			const parsed = JSON.parse(property.images || "[]");
			if (Array.isArray(parsed)) list.push(...parsed);
		} catch {}
		return [...new Set(list)];
	})();

	const hasCoords =
		property.latitude != null &&
		property.longitude != null &&
		!Number.isNaN(Number(property.latitude)) &&
		!Number.isNaN(Number(property.longitude));

	const tabs = [
		"detail",
		"tenants",
		"bail",
		"features",
		"comments",
		"documents",
	];
	const tabLabels: Record<string, string> = {
		detail: "Détail",
		tenants: "Locataires",
		bail: "Bail",
		features: "Caractéristiques",
		comments: "Commentaires",
		documents: "Documents",
	};

	return (
		<>
			<Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{property.type} – {property.city}
						</DialogTitle>
					</DialogHeader>
					<div className="grid grid-cols-12 gap-4">
						{/* Colonne gauche */}
						<div className="col-span-5">
							{images.length > 0 ? (
								<div className="mb-3 rounded overflow-hidden">
									<img
										src={images[0]}
										alt="Photo 1"
										style={{ width: "100%", height: 280, objectFit: "cover" }}
									/>
								</div>
							) : (
								<div
									className="flex items-center justify-center bg-muted/30 rounded border mb-3"
									style={{ height: 280 }}
								>
									<span className="text-muted-foreground">
										Aucune photo disponible
									</span>
								</div>
							)}

							{hasCoords && (
								<MapContainer
									center={[
										Number(property.latitude),
										Number(property.longitude),
									]}
									zoom={14}
									style={{ height: 200, width: "100%", borderRadius: 8 }}
									scrollWheelZoom={false}
									dragging={false}
									zoomControl={false}
									attributionControl={false}
								>
									<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
									<Marker
										position={[
											Number(property.latitude),
											Number(property.longitude),
										]}
									/>
								</MapContainer>
							)}
						</div>

						{/* Colonne droite : onglets */}
						<div className="col-span-7">
							<div className="flex gap-1 border-b mb-3 flex-wrap">
								{tabs.map((tab) => (
									<button
										key={tab}
										type="button"
										className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
										onClick={() => setActiveTab(tab)}
									>
										{tabLabels[tab]}
									</button>
								))}
							</div>

							{activeTab === "detail" && (
								<div>
									<table className="w-full text-sm border">
										<tbody>
											<tr className="border-b">
												<th className="px-3 py-2 text-left font-medium whitespace-nowrap">
													Adresse
												</th>
												<td className="px-3 py-2">{property.address}</td>
											</tr>
											<tr className="border-b">
												<th className="px-3 py-2 text-left font-medium">
													Code postal
												</th>
												<td className="px-3 py-2">{property.zipcode}</td>
											</tr>
											<tr className="border-b">
												<th className="px-3 py-2 text-left font-medium">
													Ville
												</th>
												<td className="px-3 py-2">{property.city}</td>
											</tr>
											<tr className="border-b">
												<th className="px-3 py-2 text-left font-medium">
													Type
												</th>
												<td className="px-3 py-2">
													<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-teal-100 text-teal-700">
														{property.type}
													</span>
												</td>
											</tr>
											<tr className="border-b">
												<th className="px-3 py-2 text-left font-medium">
													Pièces
												</th>
												<td className="px-3 py-2">{property.pieces}</td>
											</tr>
											<tr className="border-b">
												<th className="px-3 py-2 text-left font-medium">
													Superficie
												</th>
												<td className="px-3 py-2">{property.area} m²</td>
											</tr>
											{hasCoords && (
												<tr className="border-b">
													<th className="px-3 py-2 text-left font-medium">
														Coordonnées
													</th>
													<td className="px-3 py-2">
														<small className="text-muted-foreground">
															{Number(property.latitude).toFixed(5)},{" "}
															{Number(property.longitude).toFixed(5)}
														</small>
													</td>
												</tr>
											)}
										</tbody>
									</table>
									{property.rooms &&
										(() => {
											let rooms: any[] = [];
											try {
												rooms = JSON.parse(property.rooms);
											} catch {
												rooms = [];
											}
											return rooms.length > 0 ? (
												<div className="mt-3">
													<strong className="block mb-2">
														Détail des pièces
													</strong>
													<div className="flex flex-wrap gap-2">
														{rooms.map((r: any, i: number) => (
															<span
																key={i}
																className="inline-flex items-center gap-1 border rounded-md px-2 py-1 text-sm"
															>
																<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600">
																	{r.count ?? 1}
																</span>
																{typeof r === "object"
																	? `${r.type ?? ""}${r.area ? ` – ${r.area} m²` : ""}`
																	: String(r)}
															</span>
														))}
													</div>
												</div>
											) : null;
										})()}
								</div>
							)}

							{activeTab === "tenants" &&
								(() => {
									const tenantList: any[] = Array.isArray(property.Tenants)
										? property.Tenants
										: [];
									if (tenantList.length === 0) {
										return (
											<p className="text-muted-foreground italic">
												Aucun locataire associé à ce bien.
											</p>
										);
									}
									return (
										<ul className="divide-y">
											{tenantList.map((t: any) => (
												<li key={t.id} className="px-0 py-2">
													<div className="font-semibold">
														{t.civility ? `${t.civility} ` : ""}
														{t.firstname} {t.lastname}
													</div>
													{t.email && (
														<div className="text-muted-foreground text-sm">
															{t.email}
														</div>
													)}
													{t.mobile && (
														<div className="text-muted-foreground text-sm">
															{t.mobile}
														</div>
													)}
												</li>
											))}
										</ul>
									);
								})()}

							{activeTab === "bail" && (
								<div>
									<div className="flex justify-between items-center mb-3">
										<span className="font-semibold text-muted-foreground text-sm">
											{leases.length} bail{leases.length > 1 ? "x" : ""} associé
											{leases.length > 1 ? "s" : ""}
										</span>
										{isAdmin && (
											<Button
												size="sm"
												variant="outline"
												onClick={() => {
													setEditingLease(null);
													setLeaseModalVisible(true);
												}}
											>
												<Plus className="h-4 w-4 mr-1" />
												Nouveau bail
											</Button>
										)}
									</div>
									{leasesLoading ? (
										<div className="text-center py-3">
											<Spinner size="sm" />
										</div>
									) : leases.length === 0 ? (
										<p className="text-muted-foreground italic text-sm">
											Aucun bail enregistré pour ce bien.
										</p>
									) : (
										<ul className="divide-y">
											{leases.map((l: any) => (
												<li key={l.id} className="py-2">
													<div className="flex justify-between items-start">
														<div>
															<span className={statusBadgeClass[l.status]}>
																{statusLabel[l.status]}
															</span>
															<span className="text-sm font-semibold">
																{l.Tenant
																	? `${l.Tenant.civility ?? ""} ${l.Tenant.firstname} ${l.Tenant.lastname}`
																	: "Sans locataire"}
															</span>
														</div>
														{isAdmin && (
															<Button
																variant="ghost"
																size="sm"
																onClick={() => {
																	setEditingLease(l);
																	setLeaseModalVisible(true);
																}}
															>
																<Pencil className="h-4 w-4" />
															</Button>
														)}
													</div>
													<div className="text-muted-foreground text-sm mt-1">
														{l.start_date} → {l.end_date || "En cours"}{" "}
														&nbsp;·&nbsp;
														{(
															Number.parseFloat(l.rent_amount || 0) +
															Number.parseFloat(l.charges_amount || 0)
														).toFixed(2)}{" "}
														€ CC
													</div>
												</li>
											))}
										</ul>
									)}
								</div>
							)}

							{activeTab === "features" &&
								(property.features ? (
									(() => {
										let features: any[] = [];
										try {
											features = JSON.parse(property.features);
										} catch {
											features = [property.features];
										}
										return features.length > 0 ? (
											<div className="flex flex-wrap gap-2">
												{features.map((f: any, i: number) => (
													<span
														key={i}
														className="border rounded-md px-2 py-1 text-sm"
													>
														{typeof f === "object"
															? JSON.stringify(f)
															: String(f)}
													</span>
												))}
											</div>
										) : (
											<p className="text-muted-foreground italic">
												Aucune caractéristique renseignée.
											</p>
										);
									})()
								) : (
									<p className="text-muted-foreground italic">
										Aucune caractéristique renseignée.
									</p>
								))}

							{activeTab === "comments" &&
								(property.comments ? (
									<p style={{ whiteSpace: "pre-wrap" }}>{property.comments}</p>
								) : (
									<p className="text-muted-foreground italic">
										Aucun commentaire renseigné.
									</p>
								))}

							{activeTab === "documents" && (
								<DocumentsSection
									entityType="property"
									entityId={property.id}
								/>
							)}
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={onClose}>
							Fermer
						</Button>
						{isAdmin && (
							<Button variant="outline" onClick={onEdit}>
								<Pencil className="h-4 w-4 mr-1" />
								Modifier
							</Button>
						)}
						{isAdmin && (
							<Button variant="destructive" onClick={onDelete}>
								<Trash2 className="h-4 w-4 mr-1" />
								Supprimer
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{leaseModalVisible && (
				<PropertyLeaseModal
					visible={leaseModalVisible}
					property={property}
					lease={editingLease}
					tenants={tenants}
					onClose={() => setLeaseModalVisible(false)}
					onSaved={() => {
						fetchLeases();
						setLeaseModalVisible(false);
					}}
				/>
			)}
		</>
	);
};

export default PropertyDetailModal;
