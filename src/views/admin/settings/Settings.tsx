import { AppAlert } from "@/components/ui/app-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
	Bell,
	Calendar,
	Clock,
	FileText,
	Lock,
	Mail,
	Send,
	Settings2,
	Unlock,
	XCircle,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { FormInputField } from "../../../components/FormFields";
import AssociateDataService from "../../../services/associate.service";
import OwnerConfigDataService, {
	type OwnerConfigData,
} from "../../../services/owner_config.service";
import PropertyDataService from "../../../services/property.service";
import VisitDataService from "../../../services/visit.service";
import { setOwnerProfileType } from "../../../store";
import http from "../../../utils/http-common";

interface Associate {
	id: number;
	civility: string;
	firstname: string;
	lastname: string;
	email: string | null;
	phone: string | null;
	role: string;
}

interface GoogleCalendar {
	id: string;
	summary: string;
	primary: boolean;
}

interface Property {
	id: number;
	name: string;
	address?: string;
	city?: string;
}

const TABS = [
	"owner",
	"google",
	"smtp",
	"imap",
	"cron",
	"email_templates",
	"alerts",
] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
	owner: "Bailleurs",
	google: "Google Calendar",
	smtp: "Envoi de mail",
	imap: "Récup. mail Matera",
	cron: "Cron",
	email_templates: "Templates email",
	alerts: "Alertes",
};
const TAB_ICONS: Record<Tab, React.ReactNode> = {
	owner: <Settings2 className="h-3.5 w-3.5" />,
	google: <Calendar className="h-3.5 w-3.5" />,
	smtp: <Send className="h-3.5 w-3.5" />,
	imap: <Mail className="h-3.5 w-3.5" />,
	cron: <Clock className="h-3.5 w-3.5" />,
	email_templates: <FileText className="h-3.5 w-3.5" />,
	alerts: <Bell className="h-3.5 w-3.5" />,
};

const DEFAULT_TEMPLATES = {
	email_template_payment_reminder:
		"Bonjour {{civilite}} {{nom_locataire}},\n\nVotre loyer de {{montant}} € pour le mois de {{mois}} (bien : {{bien}}) est en retard de {{jours_retard}} jours.\n\nMerci de régulariser votre situation dans les plus brefs délais.\n\nCordialement",
	email_template_lease_expiry:
		"Bonjour {{civilite}} {{nom_locataire}},\n\nNous vous informons que votre bail pour le bien {{bien}} arrive à échéance le {{date_fin_bail}}.\n\nMerci de nous contacter pour convenir des modalités de renouvellement ou de résiliation.\n\nCordialement",
	email_template_quittance:
		"Bonjour {{civilite}} {{nom_locataire}},\n\nVeuillez trouver ci-joint votre quittance de loyer pour le mois de {{mois}} d'un montant de {{montant}} € (bien : {{bien}}).\n\nCordialement",
};

const Settings: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const [config, setConfig] = useState<OwnerConfigData>({});
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [gerants, setGerants] = useState<Associate[]>([]);
	const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([]);
	const [googleConnected, setGoogleConnected] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [googleCalendarsError, setGoogleCalendarsError] = useState(false);
	const [googleAlert, setGoogleAlert] = useState<{
		type: "success" | "danger" | "info";
		message: string;
	} | null>(null);
	const [activeTab, setActiveTab] = useState<Tab>("owner");
	const [showSmtpPass, setShowSmtpPass] = useState(false);
	const [showImapPass, setShowImapPass] = useState(false);
	const [properties, setProperties] = useState<Property[]>([]);
	const isSciProfile = (config.owner_profile_type || "INDIVIDUAL") === "SCI";
	const isIndividual =
		(config.owner_profile_type || "INDIVIDUAL") === "INDIVIDUAL";
	const isProfessional =
		(config.owner_profile_type || "INDIVIDUAL") === "PROFESSIONAL";

	const fetchGoogleCalendars = async () => {
		setGoogleCalendarsError(false);
		try {
			const rc = await http.get<GoogleCalendar[]>("/visits/google/calendars");
			setGoogleCalendars(rc.data);
		} catch (e: any) {
			const msg = e?.response?.data?.message || e.message || "";
			console.error("fetchGoogleCalendars error:", msg);
			setGoogleCalendarsError(true);
			setGoogleAlert({
				type: "danger",
				message: `Erreur chargement calendriers : ${msg}`,
			});
		}
	};

	useEffect(() => {
		OwnerConfigDataService.get()
			.then((r) => setConfig({ owner_profile_type: "INDIVIDUAL", ...r.data }))
			.catch(() => {});

		AssociateDataService.getAll()
			.then((r) => {
				const all: Associate[] = r.data;
				setGerants(
					all.filter(
						(a) =>
							a.role === "Gérant" ||
							a.role === "Gérant associé" ||
							a.role === "Bailleur principal",
					),
				);
			})
			.catch(() => {});

		VisitDataService.getGoogleStatus()
			.then((r) => {
				setGoogleConnected(r.data.connected);
				if (r.data.connected) fetchGoogleCalendars();
			})
			.catch(() => {});

		PropertyDataService.getAll()
			.then((r) => setProperties(r.data))
			.catch(() => {});
	}, []);

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const google = params.get("google");
		if (google === "success") {
			setGoogleConnected(true);
			setGoogleAlert({
				type: "success",
				message: "Google Calendar connecté avec succès !",
			});
			fetchGoogleCalendars();
			navigate("/admin/settings", { replace: true });
		} else if (google === "error") {
			setGoogleAlert({
				type: "danger",
				message:
					"Échec de la connexion à Google Calendar. Vérifiez vos identifiants OAuth.",
			});
			navigate("/admin/settings", { replace: true });
		}
	}, [location.search, navigate]);

	const handleGoogleReconnect = async () => {
		setGoogleLoading(true);
		try {
			await VisitDataService.disconnectGoogle();
			setGoogleConnected(false);
			setGoogleCalendars([]);
			setGoogleCalendarsError(false);
			setConfig((prev) => ({ ...prev, google_calendar_id: null }));
			const { data } = await VisitDataService.getGoogleAuthUrl();
			window.location.href = data.url;
		} catch {
			setGoogleAlert({
				type: "danger",
				message: "Erreur lors de la reconnexion Google.",
			});
			setGoogleLoading(false);
		}
	};

	const handleGoogleConnect = async () => {
		setGoogleLoading(true);
		try {
			const { data } = await VisitDataService.getGoogleAuthUrl();
			window.location.href = data.url;
		} catch {
			setGoogleAlert({
				type: "danger",
				message: "Impossible d'obtenir l'URL d'autorisation Google.",
			});
			setGoogleLoading(false);
		}
	};

	const handleGoogleDisconnect = async () => {
		setGoogleLoading(true);
		try {
			await VisitDataService.disconnectGoogle();
			setGoogleConnected(false);
			setGoogleCalendars([]);
			setGoogleCalendarsError(false);
			setConfig((prev) => ({ ...prev, google_calendar_id: null }));
			setGoogleAlert({ type: "info", message: "Google Calendar déconnecté." });
		} catch {
			setGoogleAlert({
				type: "danger",
				message: "Impossible de déconnecter Google Calendar.",
			});
		} finally {
			setGoogleLoading(false);
		}
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		setSaved(false);
		setConfig((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleGerantSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSaved(false);
		const id = e.target.value ? Number(e.target.value) : null;
		if (!id) {
			setConfig((prev) => ({
				...prev,
				manager_associate_id: null,
				manager_civility: "",
				manager_firstname: "",
				manager_lastname: "",
				manager_email: "",
				manager_phone: "",
			}));
			return;
		}
		const associate = gerants.find((a) => a.id === id);
		if (associate) {
			setConfig((prev) => ({
				...prev,
				manager_associate_id: associate.id,
				manager_civility: associate.civility || "",
				manager_firstname: associate.firstname || "",
				manager_lastname: associate.lastname || "",
				manager_email: associate.email || "",
				manager_phone: associate.phone || "",
			}));
		}
	};

	// Helper pour les composants Select (onValueChange ne fournit pas d'event)
	const handleSelectChange = (name: string) => (value: string) => {
		setSaved(false);
		setConfig((prev) => ({
			...prev,
			[name]: value === "__none__" ? "" : value,
		}));
	};

	const handleSave = async () => {
		setSaving(true);
		setSaved(false);
		setError(null);
		try {
			const fd = new FormData();
			Object.entries(config).forEach(([k, v]) => {
				if (v != null && k !== "id") fd.append(k, String(v));
			});
			const r = await OwnerConfigDataService.update(fd);
			setConfig(r.data);
			if (r.data.owner_profile_type) {
				dispatch(
					setOwnerProfileType(
						r.data.owner_profile_type as "SCI" | "PROFESSIONAL" | "INDIVIDUAL",
					),
				);
			}
			setSaved(true);
		} catch (e: any) {
			setError(
				e?.response?.data?.message ||
					e.message ||
					"Erreur lors de la sauvegarde",
			);
		} finally {
			setSaving(false);
		}
	};

	const SaveButton = () => (
		<Button onClick={handleSave} disabled={saving}>
			{saving ? (
				<>
					<Spinner size="sm" className="mr-2" />
					Enregistrement…
				</>
			) : (
				"Enregistrer"
			)}
		</Button>
	);

	return (
		<div className="max-full">
			<div className="mb-4">
				<Card className="app-page-hero border-0">
					<CardContent className="p-0">
						<div className="app-page-kicker mb-3">Administration</div>
						<h2 className="mb-2 app-display-title">Paramètres</h2>
						<p className="app-page-description mb-3">
							Configurez votre SCI, vos notifications, vos intégrations et vos
							modèles d'email.
						</p>
					</CardContent>
				</Card>
			</div>

			<Card className="mb-4 app-panel-card">
				<CardContent className="p-0">
					{/* Tabs nav */}
					<div className="flex gap-1 border-b border-border/60 px-4 pt-4 overflow-x-auto overflow-y-hidden">
						{TABS.map((tab) => (
							<Button
								key={tab}
								variant="ghost"
								size="sm"
								onClick={() => setActiveTab(tab)}
								style={
									activeTab === tab
										? { borderBottomColor: "var(--color-card)" }
										: undefined
								}
								className={[
									"inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-md whitespace-nowrap transition-all duration-150 border -mb-px h-auto",
									activeTab === tab
										? "bg-transparent border-border/60 text-primary"
										: "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40",
								].join(" ")}
							>
								{TAB_ICONS[tab]}
								{TAB_LABELS[tab]}
								{tab === "google" && (
									<Badge
										variant={googleConnected ? "default" : "secondary"}
										className="text-[0.6rem] px-1.5 py-0 h-4 ml-0.5"
									>
										{googleConnected ? "✓" : "—"}
									</Badge>
								)}
							</Button>
						))}
					</div>

					<div className="p-4">
						{/* Tab: Bailleurs */}
						{activeTab === "owner" && (
							<div>
								{saved && (
									<AppAlert
										color="success"
										dismissible
										onClose={() => setSaved(false)}
									>
										Paramètres enregistrés avec succès.
									</AppAlert>
								)}
								{error && <AppAlert color="danger">{error}</AppAlert>}

								<h6 className="text-xs font-semibold uppercase text-muted-foreground mb-3 mt-2">
									Profil bailleur
								</h6>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
									<div>
										<Label>Type de bailleur</Label>
										<Select
											value={config.owner_profile_type || "INDIVIDUAL"}
											onValueChange={handleSelectChange("owner_profile_type")}
										>
											<SelectTrigger className="mt-1">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="INDIVIDUAL">
													Bailleur particulier
												</SelectItem>
												<SelectItem value="PROFESSIONAL">
													Bailleur professionnel
												</SelectItem>
												<SelectItem value="SCI">
													SCI (Société Civile Immobilière)
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
									{(isSciProfile || isProfessional) && (
										<div>
											<FormInputField
												label="Forme juridique"
												name="legal_form"
												value={config.legal_form || ""}
												onChange={handleChange}
												placeholder={isSciProfile ? "SCI" : "SARL, EIRL, etc."}
											/>
										</div>
									)}
								</div>

								<div className="mb-3">
									<FormInputField
										label={
											<>
												{isSciProfile ? "Raison sociale" : "Nom du bailleur"}{" "}
												<span className="text-destructive">*</span>
											</>
										}
										name="name"
										value={config.name || ""}
										onChange={handleChange}
										placeholder={
											isSciProfile
												? "Nom de la SCI (sans la forme juridique)"
												: isProfessional
													? "Nom de l'entreprise ou de la personne"
													: "Nom du bailleur affiché dans les documents"
										}
									/>
								</div>

								{(isSciProfile || isProfessional) && (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
										<div>
											<FormInputField
												label="SIRET"
												name="siret"
												value={config.siret || ""}
												onChange={handleChange}
												placeholder="123 456 789 00010"
											/>
										</div>
										<div>
											<FormInputField
												label="RCS"
												name="rcs"
												value={config.rcs || ""}
												onChange={handleChange}
												placeholder="RCS Paris 123 456 789"
											/>
										</div>
									</div>
								)}

								<div className="mb-3">
									<FormInputField
										label={isSciProfile ? "Adresse du siège social" : "Adresse"}
										name="address"
										value={config.address || ""}
										onChange={handleChange}
										placeholder="Numéro et nom de la rue"
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
									<div>
										<FormInputField
											label="Code postal"
											name="zipcode"
											value={config.zipcode || ""}
											onChange={handleChange}
											placeholder="75001"
										/>
									</div>
									<div className="md:col-span-2">
										<FormInputField
											label="Ville"
											name="city"
											value={config.city || ""}
											onChange={handleChange}
											placeholder="Paris"
										/>
									</div>
								</div>

								<div className="mb-4">
									<FormInputField
										label="IBAN (compte bancaire)"
										name="iban"
										value={config.iban || ""}
										onChange={handleChange}
										placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
									/>
								</div>

								{(isSciProfile || isProfessional) && (
									<>
										<h6 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
											{isSciProfile ? "Gérant" : "Responsable"}
										</h6>

										<div className="mb-3">
											<Label>
												{isSciProfile
													? "Sélectionner un gérant associé"
													: "Sélectionner un responsable"}
											</Label>
											<Select
												value={
													config.manager_associate_id != null
														? String(config.manager_associate_id)
														: "__none__"
												}
												onValueChange={(value) => {
													setSaved(false);
													const id =
														value !== "__none__" ? Number(value) : null;
													if (!id) {
														setConfig((prev) => ({
															...prev,
															manager_associate_id: null,
															manager_civility: "",
															manager_firstname: "",
															manager_lastname: "",
															manager_email: "",
															manager_phone: "",
														}));
														return;
													}
													const associate = gerants.find((a) => a.id === id);
													if (associate) {
														setConfig((prev) => ({
															...prev,
															manager_associate_id: associate.id,
															manager_civility: associate.civility || "",
															manager_firstname: associate.firstname || "",
															manager_lastname: associate.lastname || "",
															manager_email: associate.email || "",
															manager_phone: associate.phone || "",
														}));
													}
												}}
												disabled={gerants.length === 0}
											>
												<SelectTrigger className="mt-1">
													<SelectValue placeholder="— Saisie manuelle —" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="__none__">
														— Saisie manuelle —
													</SelectItem>
													{gerants.map((a) => (
														<SelectItem key={a.id} value={String(a.id)}>
															{a.civility} {a.firstname} {a.lastname}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<p className="text-xs text-muted-foreground mt-1">
												{gerants.length === 0
													? isSciProfile
														? "Aucun co-bailleur avec un rôle de gestion trouvé."
														: "Aucun responsable trouvé."
													: "La sélection remplit automatiquement les champs ci-dessous."}
											</p>
										</div>

										<div className="grid grid-cols-12 gap-3 mb-3">
											<div className="col-span-2">
												<Label>Civilité</Label>
												<Select
													value={config.manager_civility || "__none__"}
													onValueChange={handleSelectChange("manager_civility")}
												>
													<SelectTrigger className="mt-1">
														<SelectValue placeholder="—" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="__none__">—</SelectItem>
														<SelectItem value="M.">M.</SelectItem>
														<SelectItem value="Mme">Mme</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="col-span-5">
												<FormInputField
													label="Prénom"
													name="manager_firstname"
													value={config.manager_firstname || ""}
													onChange={handleChange}
												/>
											</div>
											<div className="col-span-5">
												<FormInputField
													label="Nom"
													name="manager_lastname"
													value={config.manager_lastname || ""}
													onChange={handleChange}
												/>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
											<div>
												<FormInputField
													label="Email"
													type="email"
													name="manager_email"
													value={config.manager_email || ""}
													onChange={handleChange}
												/>
											</div>
											<div>
												<FormInputField
													label="Téléphone"
													name="manager_phone"
													value={config.manager_phone || ""}
													onChange={handleChange}
													placeholder="06 00 00 00 00"
												/>
											</div>
										</div>
									</>
								)}

								<div className="flex justify-end">
									<SaveButton />
								</div>
							</div>
						)}

						{/* Tab: Google Calendar */}
						{activeTab === "google" && (
							<div>
								{googleAlert && (
									<AppAlert
										color={googleAlert.type}
										dismissible
										onClose={() => setGoogleAlert(null)}
									>
										{googleAlert.message}
									</AppAlert>
								)}

								{googleConnected ? (
									<>
										{googleCalendarsError ? (
											<AppAlert color="warning" className="mb-3">
												Impossible de charger la liste des calendriers. Les
												permissions ont peut-être changé. Déconnectez puis
												reconnectez votre compte Google pour autoriser les
												nouveaux accès.
												<div className="mt-2">
													<Button
														variant="outline"
														size="sm"
														onClick={handleGoogleReconnect}
														disabled={googleLoading}
													>
														{googleLoading && (
															<Spinner size="sm" className="mr-1" />
														)}
														Se reconnecter
													</Button>
												</div>
											</AppAlert>
										) : (
											<div className="mb-3">
												<Label>Calendrier à synchroniser</Label>
												<Select
													value={config.google_calendar_id || "__none__"}
													onValueChange={handleSelectChange(
														"google_calendar_id",
													)}
												>
													<SelectTrigger className="mt-1">
														<SelectValue placeholder="— Calendrier principal (primary) —" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="__none__">
															— Calendrier principal (primary) —
														</SelectItem>
														{googleCalendars.map((cal) => (
															<SelectItem key={cal.id} value={cal.id}>
																{cal.summary}
																{cal.primary ? " (principal)" : ""}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<p className="text-xs text-muted-foreground mt-1">
													Les visites seront synchronisées vers ce calendrier.
												</p>
											</div>
										)}
										<div className="flex justify-between items-center">
											<Button
												variant="outline"
												size="sm"
												onClick={handleGoogleDisconnect}
												disabled={googleLoading}
												className="text-destructive hover:text-destructive"
											>
												{googleLoading ? (
													<Spinner size="sm" className="mr-1" />
												) : (
													<XCircle className="h-4 w-4 mr-1" />
												)}
												Déconnecter Google Calendar
											</Button>
											<SaveButton />
										</div>
									</>
								) : (
									<div className="flex flex-col items-start gap-2">
										<p className="text-muted-foreground mb-2">
											Connectez votre compte Google pour synchroniser
											automatiquement vos visites avec Google Calendar.
										</p>
										<Button
											variant="outline"
											onClick={handleGoogleConnect}
											disabled={googleLoading}
										>
											{googleLoading ? (
												<Spinner size="sm" className="mr-2" />
											) : (
												<svg
													className="mr-2"
													width="16"
													height="16"
													viewBox="0 0 488 512"
													fill="currentColor"
												>
													<path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
												</svg>
											)}
											Connecter Google Calendar
										</Button>
									</div>
								)}
							</div>
						)}

						{/* Tab: SMTP */}
						{activeTab === "smtp" && (
							<div>
								{saved && (
									<AppAlert
										color="success"
										dismissible
										onClose={() => setSaved(false)}
									>
										Paramètres enregistrés avec succès.
									</AppAlert>
								)}
								{error && <AppAlert color="danger">{error}</AppAlert>}

								<h6 className="text-xs font-semibold uppercase text-muted-foreground mb-3 mt-2">
									Configuration SMTP (envoi de mails)
								</h6>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
									<div className="md:col-span-2">
										<FormInputField
											label="Serveur SMTP"
											name="smtp_host"
											value={config.smtp_host || ""}
											onChange={handleChange}
											placeholder="smtp.gmail.com"
										/>
									</div>
									<div>
										<FormInputField
											label="Port"
											type="number"
											name="smtp_port"
											value={config.smtp_port ?? ""}
											onChange={handleChange}
											placeholder="587"
										/>
									</div>
								</div>

								<div className="mb-3">
									<label className="flex items-center gap-2 text-sm cursor-pointer">
										<input
											type="checkbox"
											id="smtp_secure"
											name="smtp_secure"
											checked={!!config.smtp_secure}
											onChange={(e) => {
												setSaved(false);
												setConfig((prev) => ({
													...prev,
													smtp_secure: e.target.checked,
												}));
											}}
											className="h-4 w-4 rounded border-input"
										/>
										Connexion sécurisée (SSL/TLS — port 465)
									</label>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
									<div>
										<FormInputField
											label="Utilisateur (login)"
											name="smtp_user"
											value={config.smtp_user || ""}
											onChange={handleChange}
											placeholder="user@example.com"
											autoComplete="off"
										/>
									</div>
									<div>
										<Label>Mot de passe</Label>
										<div className="flex mt-1">
											<Input
												type={showSmtpPass ? "text" : "password"}
												name="smtp_pass"
												value={config.smtp_pass || ""}
												onChange={handleChange}
												autoComplete="new-password"
												className="rounded-r-none"
											/>
											<Button
												type="button"
												variant="secondary"
												size="icon"
												onClick={() => setShowSmtpPass((v) => !v)}
												className="rounded-l-none border border-l-0 border-input h-9 w-10 shrink-0"
											>
												{showSmtpPass ? (
													<Unlock className="h-4 w-4" />
												) : (
													<Lock className="h-4 w-4" />
												)}
											</Button>
										</div>
									</div>
								</div>

								<div className="mb-4">
									<FormInputField
										label="Adresse expéditeur (From)"
										name="smtp_from"
										value={config.smtp_from || ""}
										onChange={handleChange}
										placeholder="no-reply@example.com"
									/>
									<p className="text-xs text-muted-foreground mt-1">
										Si vide, l&apos;adresse utilisateur sera utilisée.
									</p>
								</div>

								<div className="flex justify-end">
									<SaveButton />
								</div>
							</div>
						)}

						{/* Tab: IMAP */}
						{activeTab === "imap" && (
							<div>
								{saved && (
									<AppAlert
										color="success"
										dismissible
										onClose={() => setSaved(false)}
									>
										Paramètres enregistrés avec succès.
									</AppAlert>
								)}
								{error && <AppAlert color="danger">{error}</AppAlert>}

								<h6 className="text-xs font-semibold uppercase text-muted-foreground mb-3 mt-2">
									Configuration IMAP (récupération emails Matera)
								</h6>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
									<div className="md:col-span-2">
										<FormInputField
											label="Serveur IMAP"
											name="imap_host"
											value={config.imap_host || ""}
											onChange={handleChange}
											placeholder="imap.free.fr"
										/>
									</div>
									<div>
										<FormInputField
											label="Port"
											type="number"
											name="imap_port"
											value={config.imap_port ?? ""}
											onChange={handleChange}
											placeholder="993"
										/>
									</div>
								</div>

								<div className="mb-3">
									<label className="flex items-center gap-2 text-sm cursor-pointer">
										<input
											type="checkbox"
											id="imap_tls"
											name="imap_tls"
											checked={config.imap_tls !== false}
											onChange={(e) => {
												setSaved(false);
												setConfig((prev) => ({
													...prev,
													imap_tls: e.target.checked,
												}));
											}}
											className="h-4 w-4 rounded border-input"
										/>
										Utiliser TLS
									</label>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
									<div>
										<FormInputField
											label="Utilisateur (login)"
											name="imap_user"
											value={config.imap_user || ""}
											onChange={handleChange}
											placeholder="user@free.fr"
											autoComplete="off"
										/>
									</div>
									<div>
										<Label>Mot de passe</Label>
										<div className="flex mt-1">
											<Input
												type={showImapPass ? "text" : "password"}
												name="imap_pass"
												value={config.imap_pass || ""}
												onChange={handleChange}
												autoComplete="new-password"
												className="rounded-r-none"
											/>
											<Button
												type="button"
												variant="secondary"
												size="icon"
												onClick={() => setShowImapPass((v) => !v)}
												className="rounded-l-none border border-l-0 border-input h-9 w-10 shrink-0"
											>
												{showImapPass ? (
													<Unlock className="h-4 w-4" />
												) : (
													<Lock className="h-4 w-4" />
												)}
											</Button>
										</div>
									</div>
								</div>

								<h6 className="text-xs font-semibold uppercase text-muted-foreground mb-3 mt-4">
									Paramètres Matera
								</h6>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
									<div className="md:col-span-2">
										<FormInputField
											label="Email expéditeur Matera"
											name="matera_sender_email"
											value={config.matera_sender_email || ""}
											onChange={handleChange}
											placeholder="notif@matera.eu"
										/>
										<p className="text-xs text-muted-foreground mt-1">
											Les emails reçus de cet expéditeur seront traités.
										</p>
									</div>
									<div>
										<Label>Bien associé</Label>
										<Select
											value={
												config.matera_property_id != null &&
												config.matera_property_id !== ""
													? String(config.matera_property_id)
													: "__none__"
											}
											onValueChange={(v) => {
												setSaved(false);
												setConfig((prev) => ({
													...prev,
													matera_property_id: v === "__none__" ? null : v,
												}));
											}}
											disabled={properties.length === 0}
										>
											<SelectTrigger className="mt-1">
												<SelectValue placeholder="— Aucun bien —" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="__none__">— Aucun bien —</SelectItem>
												{properties.map((p) => (
													<SelectItem key={p.id} value={String(p.id)}>
														{p.name}
														{p.city ? ` — ${p.city}` : ""}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<p className="text-xs text-muted-foreground mt-1">
											Les charges seront liées à ce bien.
										</p>
									</div>
								</div>

								<div className="flex justify-end">
									<SaveButton />
								</div>
							</div>
						)}

						{/* Tab: Cron */}
						{activeTab === "cron" && (
							<div>
								{saved && (
									<AppAlert
										color="success"
										dismissible
										onClose={() => setSaved(false)}
									>
										Paramètres enregistrés. Le cron sera rechargé immédiatement.
									</AppAlert>
								)}
								{error && <AppAlert color="danger">{error}</AppAlert>}

								<h6 className="text-xs font-semibold uppercase text-muted-foreground mb-3 mt-2">
									Planification automatique (Cron)
								</h6>

								<div className="mb-3">
									<label className="flex items-center gap-2 text-sm cursor-pointer">
										<input
											type="checkbox"
											id="charge_cron_enabled"
											name="charge_cron_enabled"
											checked={config.charge_cron_enabled !== false}
											onChange={(e) => {
												setSaved(false);
												setConfig((prev) => ({
													...prev,
													charge_cron_enabled: e.target.checked,
												}));
											}}
											className="h-4 w-4 rounded border-input"
										/>
										Activer la récupération automatique des emails Matera
									</label>
								</div>

								<div className="max-w-lg mb-3">
									<FormInputField
										label="Schedule (syntaxe cron)"
										name="charge_cron_schedule"
										value={config.charge_cron_schedule || "0 8 * * *"}
										onChange={handleChange}
										placeholder="0 8 * * *"
										disabled={config.charge_cron_enabled === false}
									/>
									<p className="text-xs text-muted-foreground mt-1">
										Exemples : <code>0 8 * * *</code> (chaque jour à 8h00) —{" "}
										<code>0 */6 * * *</code> (toutes les 6h) —{" "}
										<code>*/30 * * * *</code> (toutes les 30 min)
									</p>
								</div>

								<div className="flex justify-end">
									<SaveButton />
								</div>
							</div>
						)}

						{/* Tab: Email templates */}
						{activeTab === "email_templates" && (
							<div>
								{saved && (
									<AppAlert
										color="success"
										dismissible
										onClose={() => setSaved(false)}
									>
										Templates enregistrés.
									</AppAlert>
								)}
								{error && <AppAlert color="danger">{error}</AppAlert>}

								<p className="text-sm text-muted-foreground mb-4">
									Personnalisez les emails envoyés automatiquement à vos
									locataires. Utilisez les variables entre doubles accolades
									pour insérer des données dynamiques.
								</p>

								<div className="mb-2 p-3 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground">
									<strong className="text-foreground">
										Variables disponibles :
									</strong>{" "}
									{[
										"{{civilite}}",
										"{{nom_locataire}}",
										"{{montant}}",
										"{{mois}}",
										"{{bien}}",
										"{{date_echeance}}",
										"{{jours_retard}}",
										"{{date_fin_bail}}",
									].map((v) => (
										<code
											key={v}
											className="mx-1 px-1 py-0.5 rounded bg-muted border border-border"
										>
											{v}
										</code>
									))}
								</div>

								<div className="space-y-5 mt-4">
									<div>
										<Label className="text-sm font-medium">
											Rappel de paiement
										</Label>
										<p className="text-xs text-muted-foreground mb-1">
											Envoyé automatiquement en cas de loyer impayé ou en
											retard.
										</p>
										<textarea
											name="email_template_payment_reminder"
											value={
												config.email_template_payment_reminder ??
												DEFAULT_TEMPLATES.email_template_payment_reminder
											}
											onChange={handleChange}
											rows={6}
											className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1 font-mono resize-y"
										/>
									</div>

									<div>
										<Label className="text-sm font-medium">
											Expiration de bail
										</Label>
										<p className="text-xs text-muted-foreground mb-1">
											Envoyé à l'approche de la date de fin de bail pour
											informer le locataire.
										</p>
										<textarea
											name="email_template_lease_expiry"
											value={
												config.email_template_lease_expiry ??
												DEFAULT_TEMPLATES.email_template_lease_expiry
											}
											onChange={handleChange}
											rows={6}
											className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1 font-mono resize-y"
										/>
									</div>

									<div>
										<Label className="text-sm font-medium">
											Envoi de quittance
										</Label>
										<p className="text-xs text-muted-foreground mb-1">
											Corps de l'email accompagnant la quittance de loyer en
											pièce jointe.
										</p>
										<textarea
											name="email_template_quittance"
											value={
												config.email_template_quittance ??
												DEFAULT_TEMPLATES.email_template_quittance
											}
											onChange={handleChange}
											rows={6}
											className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1 font-mono resize-y"
										/>
									</div>
								</div>

								<div className="flex justify-end mt-4">
									<SaveButton />
								</div>
							</div>
						)}

						{activeTab === "alerts" && (
							<div className="space-y-6">
								<div>
									<h3 className="font-semibold mb-1">Rappels impayés</h3>
									<p className="text-sm text-muted-foreground mb-3">
										Jours après l'échéance auxquels envoyer un rappel (séparés
										par des virgules). Ex : 5,15,30
									</p>
									<input
										type="text"
										name="payment_reminder_days"
										value={config.payment_reminder_days ?? "5,15,30"}
										onChange={handleChange}
										placeholder="5,15,30"
										className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
									/>
								</div>
								<div>
									<h3 className="font-semibold mb-1">
										Alertes expiration de bail
									</h3>
									<p className="text-sm text-muted-foreground mb-3">
										Jours avant la fin du bail pour déclencher une alerte
										(séparés par des virgules). Ex : 30,90
									</p>
									<input
										type="text"
										name="lease_expiry_alert_days"
										value={config.lease_expiry_alert_days ?? "30,90"}
										onChange={handleChange}
										placeholder="30,90"
										className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
									/>
								</div>
								<div className="flex justify-end mt-4">
									<SaveButton />
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default Settings;
