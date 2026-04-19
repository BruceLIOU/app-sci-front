import { AppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import frLocale from "@fullcalendar/core/locales/fr";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { format } from "date-fns";
import { Calendar, Plus, Trash2 } from "lucide-react";
import type { ChangeEvent, FC } from "react";
import { useCallback, useEffect, useState } from "react";
import StatCard from "../../../components/StatCard";
import PropertyDataService from "../../../services/property.service";
import TenantDataService from "../../../services/tenant.service";
import VisitDataService from "../../../services/visit.service";

const typeColor: Record<string, string> = {
	visite: "#3b82f6",
	rdv: "#8b5cf6",
	autre: "#6b7280",
};

const emptyForm = {
	title: "",
	description: "",
	property_id: "",
	tenant_id: "",
	contact_name: "",
	contact_email: "",
	contact_phone: "",
	date: "",
	time: "10:00",
	duration: "60",
	type: "visite",
	status: "scheduled",
	notes: "",
};

interface CalEvent {
	id: string;
	title: string;
	start: Date;
	end: Date;
	backgroundColor: string;
	borderColor: string;
	textColor: string;
	extendedProps: any;
}

const fieldClassName =
	"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm";

const textareaClassName =
	"flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm";

const Visits: FC = () => {
	const [events, setEvents] = useState<CalEvent[]>([]);
	const [properties, setProperties] = useState<any[]>([]);
	const [tenants, setTenants] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [googleConnected, setGoogleConnected] = useState(false);
	const [alert, setAlert] = useState<{
		type: "success" | "danger" | "info";
		message: string;
	} | null>(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [deleteModal, setDeleteModal] = useState(false);
	const [editing, setEditing] = useState<any>(null);
	const [form, setForm] = useState({ ...emptyForm });
	const [saving, setSaving] = useState(false);

	const fetchVisits = useCallback(async () => {
		try {
			const { data } = await VisitDataService.getAll();
			setEvents(
				data.map((visit: any) => {
					const start = new Date(`${visit.date}T${visit.time}:00`);
					const end = new Date(start.getTime() + visit.duration * 60_000);
					const color = typeColor[visit.type] || "#6b7280";

					return {
						id: String(visit.id),
						title: visit.title,
						start,
						end,
						backgroundColor: color,
						borderColor: color,
						textColor: "#fff",
						extendedProps: visit,
					};
				}),
			);
		} catch {
			setAlert({
				type: "danger",
				message: "Impossible de charger les visites.",
			});
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchGoogleStatus = useCallback(async () => {
		try {
			const { data } = await VisitDataService.getGoogleStatus();
			setGoogleConnected(data.connected);
		} catch {}
	}, []);

	useEffect(() => {
		fetchVisits();
		fetchGoogleStatus();
		PropertyDataService.getAll()
			.then((response) => setProperties(response.data))
			.catch(() => {});
		TenantDataService.getAll()
			.then((response) => setTenants(response.data))
			.catch(() => {});
	}, [fetchGoogleStatus, fetchVisits]);

	const handleChange = (
		event: ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = event.target;

		setForm((previous) => {
			const next = { ...previous, [name]: value };

			if (name === "property_id" && value) {
				const tenant = tenants.find(
					(item: any) => String(item.property_id) === value,
				);
				if (tenant) next.tenant_id = String(tenant.id);
			}

			return next;
		});
	};

	const openCreate = (slot?: { date: string; time: string }) => {
		const date = slot?.date ?? format(new Date(), "yyyy-MM-dd");
		const time = slot?.time ?? "10:00";

		setEditing(null);
		setForm({ ...emptyForm, date, time });
		setModalVisible(true);
	};

	const openEdit = (visit: any) => {
		setEditing(visit);
		setForm({
			title: visit.title || "",
			description: visit.description || "",
			property_id: String(visit.property_id || ""),
			tenant_id: String(visit.tenant_id || ""),
			contact_name: visit.contact_name || "",
			contact_email: visit.contact_email || "",
			contact_phone: visit.contact_phone || "",
			date: visit.date || "",
			time: visit.time || "10:00",
			duration: String(visit.duration || 60),
			type: visit.type || "visite",
			status: visit.status || "scheduled",
			notes: visit.notes || "",
		});
		setModalVisible(true);
	};

	const handleSave = async () => {
		if (!form.title || !form.property_id || !form.date) {
			setAlert({
				type: "danger",
				message: "Titre, bien et date sont obligatoires.",
			});
			return;
		}

		setSaving(true);
		try {
			const formData = new FormData();
			for (const [key, value] of Object.entries(form))
				formData.append(key, value);

			if (editing) {
				await VisitDataService.update(editing.id, formData);
			} else {
				await VisitDataService.create(formData);
			}

			setModalVisible(false);
			await fetchVisits();
		} catch {
			setAlert({
				type: "danger",
				message: "Erreur lors de la sauvegarde.",
			});
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!editing) return;

		try {
			await VisitDataService.delete(editing.id);
			setDeleteModal(false);
			setModalVisible(false);
			await fetchVisits();
		} catch {
			setAlert({
				type: "danger",
				message: "Erreur lors de la suppression.",
			});
		}
	};

	const filteredTenants = form.property_id
		? tenants.filter(
				(tenant: any) => String(tenant.property_id) === form.property_id,
			)
		: tenants;

	const totalVisits = events.length;
	const scheduledVisits = events.filter(
		(event) => event.extendedProps?.status === "scheduled",
	).length;
	const completedVisits = events.filter(
		(event) => event.extendedProps?.status === "completed",
	).length;
	const cancelledVisits = events.filter(
		(event) => event.extendedProps?.status === "cancelled",
	).length;

	return (
		<>
			{alert && (
				<AppAlert
					color={alert.type}
					dismissible
					onClose={() => setAlert(null)}
					className="mb-3"
				>
					{alert.message}
				</AppAlert>
			)}

			<div className="mb-4">
				<Card className="app-page-hero border-0">
					<CardContent className="relative p-0">
						<div className="app-page-kicker mb-3">Agenda locatif</div>
						<h2 className="mb-2 app-display-title">Calendrier des visites</h2>
						<p className="app-page-description mb-4">
							Organisez les rendez-vous, suivez les statuts et gardez une vision
							claire des prochaines actions terrain.
						</p>
						<div className="flex flex-wrap gap-2">
							<span className="app-filter-chip">{totalVisits} visites</span>
							<span className="app-filter-chip">
								{scheduledVisits} planifiees
							</span>
							<span className="app-filter-chip">
								{cancelledVisits} annulees
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="mb-4 grid grid-cols-4 gap-3 text-center">
				<StatCard
					value={totalVisits}
					label="Total des visites"
					color="primary"
				/>
				<StatCard value={scheduledVisits} label="Planifiées" color="info" />
				<StatCard value={completedVisits} label="Effectuées" color="success" />
				<StatCard value={cancelledVisits} label="Annulées" color="danger" />
			</div>

			<div className="mb-3 flex items-center justify-between">
				<h5 className="mb-0 flex items-center app-card-title">
					<Calendar className="mr-2 h-5 w-5" />
					Planning
				</h5>
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						className="app-ghost-button"
						onClick={() => openCreate()}
					>
						<Plus className="mr-1 h-4 w-4" />
						Nouvelle visite
					</Button>
				</div>
			</div>

			<Card className="app-panel-card app-calendar-card">
				<CardContent className="app-calendar-shell" style={{ minHeight: 600 }}>
					{loading ? (
						<div
							className="flex items-center justify-center"
							style={{ height: 500 }}
						>
							<Spinner size="lg" />
						</div>
					) : (
						<div className="app-calendar">
							<FullCalendar
								plugins={[
									dayGridPlugin,
									timeGridPlugin,
									interactionPlugin,
									listPlugin,
								]}
								locale={frLocale}
								initialView="dayGridMonth"
								headerToolbar={{
									left: "prev,next today",
									center: "title",
									right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
								}}
								events={events}
								height={620}
								selectable
								select={(arg: DateSelectArg) => {
									const date = format(arg.start, "yyyy-MM-dd");
									const time = arg.allDay
										? "10:00"
										: format(arg.start, "HH:mm");
									openCreate({ date, time });
								}}
								eventClick={(arg: EventClickArg) => {
									openEdit({
										id: Number(arg.event.id),
										...arg.event.extendedProps,
									});
								}}
								eventDidMount={(info) => {
									if (info.event.extendedProps.status === "cancelled") {
										info.el.style.opacity = "0.45";
									}
								}}
								dayMaxEvents
								nowIndicator
							/>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={modalVisible}
				onOpenChange={(open) => !open && setModalVisible(false)}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{editing ? "Modifier la visite" : "Nouvelle visite"}
						</DialogTitle>
					</DialogHeader>
					<div className="grid grid-cols-12 gap-3 py-2">
						<div className="col-span-8 space-y-1.5">
							<Label htmlFor="visit-title">Titre *</Label>
							<Input
								id="visit-title"
								name="title"
								value={form.title}
								onChange={handleChange}
								placeholder="Ex : Visite T3 - M. Dupont"
							/>
						</div>
						<div className="col-span-4 space-y-1.5">
							<Label htmlFor="visit-type">Type</Label>
							<select
								id="visit-type"
								name="type"
								value={form.type}
								onChange={handleChange}
								className={fieldClassName}
							>
								<option value="visite">Visite</option>
								<option value="rdv">Rendez-vous</option>
								<option value="autre">Autre</option>
							</select>
						</div>
						<div className="col-span-4 space-y-1.5">
							<Label htmlFor="visit-date">Date *</Label>
							<Input
								id="visit-date"
								type="date"
								name="date"
								value={form.date}
								onChange={handleChange}
							/>
						</div>
						<div className="col-span-4 space-y-1.5">
							<Label htmlFor="visit-time">Heure</Label>
							<Input
								id="visit-time"
								type="time"
								name="time"
								value={form.time}
								onChange={handleChange}
							/>
						</div>
						<div className="col-span-4 space-y-1.5">
							<Label htmlFor="visit-duration">Durée (min)</Label>
							<Input
								id="visit-duration"
								type="number"
								name="duration"
								value={form.duration}
								onChange={handleChange}
								min={15}
								step={15}
							/>
						</div>
						<div className="col-span-6 space-y-1.5">
							<Label htmlFor="visit-property">Bien *</Label>
							<select
								id="visit-property"
								name="property_id"
								value={form.property_id}
								onChange={handleChange}
								className={fieldClassName}
							>
								<option value="">-- Sélectionner un bien --</option>
								{properties.map((property: any) => (
									<option key={property.id} value={property.id}>
										{property.address}, {property.city}
									</option>
								))}
							</select>
						</div>
						<div className="col-span-6 space-y-1.5">
							<Label htmlFor="visit-tenant">Locataire (optionnel)</Label>
							<select
								id="visit-tenant"
								name="tenant_id"
								value={form.tenant_id}
								onChange={handleChange}
								className={fieldClassName}
							>
								<option value="">-- Aucun --</option>
								{filteredTenants.map((tenant: any) => (
									<option key={tenant.id} value={tenant.id}>
										{tenant.civility} {tenant.firstname} {tenant.lastname}
									</option>
								))}
							</select>
						</div>
						<div className="col-span-4 space-y-1.5">
							<Label htmlFor="visit-contact-name">Nom du contact</Label>
							<Input
								id="visit-contact-name"
								name="contact_name"
								value={form.contact_name}
								onChange={handleChange}
								placeholder="Nom Prénom"
							/>
						</div>
						<div className="col-span-4 space-y-1.5">
							<Label htmlFor="visit-contact-email">Email du contact</Label>
							<Input
								id="visit-contact-email"
								type="email"
								name="contact_email"
								value={form.contact_email}
								onChange={handleChange}
								placeholder="email@exemple.fr"
							/>
						</div>
						<div className="col-span-4 space-y-1.5">
							<Label htmlFor="visit-contact-phone">Téléphone</Label>
							<Input
								id="visit-contact-phone"
								name="contact_phone"
								value={form.contact_phone}
								onChange={handleChange}
								placeholder="06 00 00 00 00"
							/>
						</div>
						<div
							className={
								editing ? "col-span-6 space-y-1.5" : "col-span-12 space-y-1.5"
							}
						>
							<Label htmlFor="visit-description">Description</Label>
							<textarea
								id="visit-description"
								name="description"
								value={form.description}
								onChange={handleChange}
								rows={2}
								className={textareaClassName}
							/>
						</div>
						{editing && (
							<div className="col-span-6 space-y-1.5">
								<Label htmlFor="visit-status">Statut</Label>
								<select
									id="visit-status"
									name="status"
									value={form.status}
									onChange={handleChange}
									className={fieldClassName}
								>
									<option value="scheduled">Planifiée</option>
									<option value="completed">Effectuée</option>
									<option value="cancelled">Annulée</option>
								</select>
							</div>
						)}
						<div className="col-span-12 space-y-1.5">
							<Label htmlFor="visit-notes">Notes internes</Label>
							<textarea
								id="visit-notes"
								name="notes"
								value={form.notes}
								onChange={handleChange}
								rows={2}
								className={textareaClassName}
							/>
						</div>
						{googleConnected && (
							<div className="col-span-12">
								<AppAlert color="info" className="py-2 text-sm">
									<Calendar className="mr-1 inline h-4 w-4" />
									Cette visite sera automatiquement synchronisée avec votre
									Google Calendar.
								</AppAlert>
							</div>
						)}
					</div>
					<DialogFooter className="flex flex-row items-center justify-between">
						<div>
							{editing && (
								<Button
									variant="destructive"
									size="sm"
									onClick={() => setDeleteModal(true)}
								>
									<Trash2 className="mr-1 h-4 w-4" />
									Supprimer
								</Button>
							)}
						</div>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setModalVisible(false)}>
								Annuler
							</Button>
							<Button onClick={handleSave} disabled={saving}>
								{saving ? <Spinner size="sm" className="mr-1" /> : null}
								{editing ? "Enregistrer" : "Créer la visite"}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={deleteModal}
				onOpenChange={(open) => !open && setDeleteModal(false)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirmer la suppression</DialogTitle>
					</DialogHeader>
					<p>
						Supprimer la visite <strong>{editing?.title}</strong> ?
					</p>
					{googleConnected && editing?.google_event_id && (
						<AppAlert color="warning" className="py-2 text-sm">
							L&apos;événement sera également supprimé de votre Google Calendar.
						</AppAlert>
					)}
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

export default Visits;
