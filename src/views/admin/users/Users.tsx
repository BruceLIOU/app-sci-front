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
import { Mail, Pencil, Trash2, UserPlus } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import DeleteModal from "../../../components/DeleteModal";
import {
	FormInputField,
	FormSelectField,
} from "../../../components/FormFields";
import StatCard from "../../../components/StatCard";
import TableEmptyRow from "../../../components/TableEmptyRow";
import TenantDataService from "../../../services/tenant.service";
import UserDataService from "../../../services/user.service";

interface AppUser {
	id: number;
	email: string;
	name: string | null;
	avatar: string | null;
	role: "admin" | "viewer" | "locataire";
	tenant_id: number | null;
	status: "pending" | "active";
	createdAt: string;
}

interface Tenant {
	id: number;
	firstname: string;
	lastname: string;
}

const roleLabel: Record<string, string> = {
	admin: "Admin",
	viewer: "Lecteur",
	locataire: "Locataire",
};
const roleColor: Record<string, string> = {
	admin: "danger",
	viewer: "secondary",
	locataire: "primary",
};
const statusColor: Record<string, string> = {
	active: "success",
	pending: "warning",
};
const statusLabel: Record<string, string> = {
	active: "Actif",
	pending: "En attente",
};

const Users = () => {
	const [users, setUsers] = useState<AppUser[]>([]);
	const [tenants, setTenants] = useState<Tenant[]>([]);
	const [loading, setLoading] = useState(true);
	const [inviteModal, setInviteModal] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteName, setInviteName] = useState("");
	const [inviteRole, setInviteRole] = useState("viewer");
	const [inviteTenantId, setInviteTenantId] = useState("");
	const [inviteLoading, setInviteLoading] = useState(false);
	const [inviteError, setInviteError] = useState<string | null>(null);
	const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
	const [deleteModal, setDeleteModal] = useState(false);
	const [toDelete, setToDelete] = useState<AppUser | null>(null);
	const [globalMsg, setGlobalMsg] = useState<{
		type: string;
		text: string;
	} | null>(null);
	const [editModal, setEditModal] = useState(false);
	const [editingUser, setEditingUser] = useState<AppUser | null>(null);
	const [editName, setEditName] = useState("");
	const [editRole, setEditRole] = useState("viewer");
	const [editTenantId, setEditTenantId] = useState("");
	const [editLoading, setEditLoading] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);
	const [resendLoading, setResendLoading] = useState(false);

	const fetchUsers = useCallback(() => {
		setLoading(true);
		UserDataService.getAll()
			.then(({ data }) => setUsers(data))
			.catch(() => setUsers([]))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		fetchUsers();
		TenantDataService.getAll()
			.then(({ data }) => setTenants(data))
			.catch(() => {});
	}, [fetchUsers]);

	const handleInvite = async (e: React.FormEvent) => {
		e.preventDefault();
		setInviteLoading(true);
		setInviteError(null);
		setInviteSuccess(null);
		const fd = new FormData();
		fd.append("email", inviteEmail);
		fd.append("name", inviteName);
		fd.append("role", inviteRole);
		if (inviteRole === "locataire" && inviteTenantId)
			fd.append("tenant_id", inviteTenantId);
		try {
			await UserDataService.invite(fd);
			setInviteSuccess(`Invitation envoyée à ${inviteEmail}.`);
			setInviteEmail("");
			setInviteName("");
			setInviteRole("viewer");
			setInviteTenantId("");
			fetchUsers();
		} catch (err: any) {
			setInviteError(err.response?.data?.message || "Erreur lors de l'envoi.");
		} finally {
			setInviteLoading(false);
		}
	};

	const openEdit = (user: AppUser) => {
		setEditingUser(user);
		setEditName(user.name ?? "");
		setEditRole(user.role);
		setEditTenantId(user.tenant_id ? String(user.tenant_id) : "");
		setEditError(null);
		setEditModal(true);
	};

	const handleSaveEdit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingUser) return;
		setEditLoading(true);
		setEditError(null);
		const fd = new FormData();
		fd.append("name", editName);
		fd.append("role", editRole);
		if (editRole === "locataire" && editTenantId)
			fd.append("tenant_id", editTenantId);
		try {
			const { data } = await UserDataService.update(editingUser.id, fd);
			setUsers((prev) =>
				prev.map((u) => (u.id === editingUser.id ? { ...u, ...data } : u)),
			);
			setEditModal(false);
		} catch (err: any) {
			setEditError(
				err.response?.data?.message || "Erreur lors de la mise à jour.",
			);
		} finally {
			setEditLoading(false);
		}
	};

	const handleResend = async (user: AppUser) => {
		setResendLoading(true);
		try {
			await UserDataService.resendInvite(user.id);
			setGlobalMsg({
				type: "success",
				text: `Invitation renvoyée à ${user.email}.`,
			});
		} catch (err: any) {
			const messageError = err.response?.data?.message;
			setGlobalMsg({
				type: "danger",
				text: `${messageError || "Erreur lors du renvoi de l'invitation."}`,
			});
		} finally {
			setResendLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!toDelete) return;
		try {
			await UserDataService.delete(toDelete.id);
			setUsers((prev) => prev.filter((u) => u.id !== toDelete.id));
			setDeleteModal(false);
			setToDelete(null);
		} catch (err: any) {
			setGlobalMsg({
				type: "danger",
				text: err.response?.data?.message || "Erreur suppression.",
			});
			setDeleteModal(false);
		}
	};

	const activeCount = users.filter((u) => u.status === "active").length;
	const pendingCount = users.filter((u) => u.status === "pending").length;
	const adminCount = users.filter((u) => u.role === "admin").length;

	return (
		<>
			<div className="mb-4">
				<Card className="app-page-hero border-0">
					<CardContent className="p-0 relative">
						<div className="app-page-kicker mb-3">Administration</div>
						<h2 className="mb-2 app-display-title">
							Pilotez les acces utilisateurs
						</h2>
						<p className="app-page-description mb-4">
							Gere les invitations, les roles et le suivi des comptes dans une
							interface uniforme avec le reste du back-office.
						</p>
						<div className="flex flex-wrap gap-2">
							<span className="app-filter-chip">{users.length} comptes</span>
							<span className="app-filter-chip">
								{pendingCount} invitations
							</span>
							<span className="app-filter-chip">
								{adminCount} administrateurs
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="flex gap-4 mb-4 text-center w-full justify-content-center flex-direction-column">
				<StatCard value={users.length} label="Utilisateurs" color="primary" />
				<StatCard value={activeCount} label="Comptes actifs" color="success" />
				<StatCard
					value={pendingCount}
					label="Invitations en attente"
					color="warning"
				/>
				<StatCard value={adminCount} label="Administrateurs" color="danger" />
			</div>

			{globalMsg && (
				<AppAlert
					color={globalMsg.type as any}
					dismissible
					onClose={() => setGlobalMsg(null)}
					className="mb-3"
				>
					{globalMsg.text}
				</AppAlert>
			)}

			<Card className="app-panel-card app-table-card">
				<CardHeader className="flex flex-row justify-between items-center border-b py-3 px-4 space-y-0">
					<strong>Gestion des utilisateurs</strong>
					<Button
						size="sm"
						variant="outline"
						className="app-ghost-button"
						onClick={() => {
							setInviteModal(true);
							setInviteSuccess(null);
							setInviteError(null);
						}}
					>
						<UserPlus className="mr-2 h-4 w-4" />
						Inviter un utilisateur
					</Button>
				</CardHeader>
				<CardContent className="p-0">
					{loading ? (
						<div className="text-center py-4">
							<Spinner size="lg" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Utilisateur</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Statut</TableHead>
										<TableHead>Rôle</TableHead>
										<TableHead>Invité le</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{users.length === 0 ? (
										<TableEmptyRow colSpan={6} message="Aucun utilisateur" />
									) : (
										users.map((user) => (
											<TableRow key={user.id}>
												<TableCell>
													<div className="flex items-center gap-2">
														{user.avatar ? (
															<img
																src={user.avatar}
																alt=""
																width={32}
																height={32}
																className="rounded-full"
															/>
														) : (
															<div
																className="rounded-full bg-slate-400 flex items-center justify-center text-white"
																style={{
																	width: 32,
																	height: 32,
																	fontSize: 14,
																	flexShrink: 0,
																}}
															>
																{(user.name || user.email)[0].toUpperCase()}
															</div>
														)}
														<span>
															{user.name || (
																<em className="text-muted-foreground">—</em>
															)}
														</span>
													</div>
												</TableCell>
												<TableCell>{user.email}</TableCell>
												<TableCell>
													<Badge
														variant={
															user.status === "active" ? "default" : "secondary"
														}
													>
														{statusLabel[user.status]}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge variant="outline">
														{roleLabel[user.role]}
													</Badge>
												</TableCell>
												<TableCell>
													{new Date(user.createdAt).toLocaleDateString("fr-FR")}
												</TableCell>
												<TableCell className="text-right">
													<TooltipProvider>
														<div className="flex gap-2 justify-end">
															{user.status === "pending" && (
																<Tooltip>
																	<TooltipTrigger asChild>
																		<Button
																			variant="outline"
																			size="sm"
																			disabled={resendLoading}
																			onClick={() => handleResend(user)}
																		>
																			<Mail className="h-4 w-4" />
																		</Button>
																	</TooltipTrigger>
																	<TooltipContent>
																		Renvoyer l&apos;invitation
																	</TooltipContent>
																</Tooltip>
															)}
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		variant="outline"
																		size="sm"
																		onClick={() => openEdit(user)}
																	>
																		<Pencil className="h-4 w-4" />
																	</Button>
																</TooltipTrigger>
																<TooltipContent>Modifier</TooltipContent>
															</Tooltip>
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		variant="outline"
																		size="sm"
																		className="text-destructive hover:text-destructive"
																		onClick={() => {
																			setToDelete(user);
																			setDeleteModal(true);
																		}}
																	>
																		<Trash2 className="h-4 w-4" />
																	</Button>
																</TooltipTrigger>
																<TooltipContent>Supprimer</TooltipContent>
															</Tooltip>
														</div>
													</TooltipProvider>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Modal invitation */}
			<Dialog
				open={inviteModal}
				onOpenChange={(open) => !open && setInviteModal(false)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Inviter un utilisateur</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleInvite}>
						<div className="space-y-3 py-2">
							{inviteError && (
								<AppAlert
									color="danger"
									dismissible
									onClose={() => setInviteError(null)}
								>
									{inviteError}
								</AppAlert>
							)}
							{inviteSuccess && (
								<AppAlert color="success">{inviteSuccess}</AppAlert>
							)}
							<div>
								<FormInputField
									label="Nom"
									type="text"
									value={inviteName}
									onChange={(e) => setInviteName(e.target.value)}
									placeholder="Prénom Nom"
									disabled={inviteLoading}
								/>
							</div>
							<div>
								<FormInputField
									label="Adresse email"
									required
									type="email"
									value={inviteEmail}
									onChange={(e) => setInviteEmail(e.target.value)}
									placeholder="utilisateur@exemple.fr"
									disabled={inviteLoading}
								/>
							</div>
							<div>
								<FormSelectField
									label="Rôle"
									value={inviteRole}
									onChange={(e) => {
										setInviteRole(e.target.value);
										setInviteTenantId("");
									}}
									disabled={inviteLoading}
								>
									<option value="viewer">
										Lecteur — consultation uniquement
									</option>
									<option value="admin">Administrateur — accès complet</option>
									<option value="locataire">
										Locataire — accès portail locataire
									</option>
								</FormSelectField>
							</div>
							{inviteRole === "locataire" && (
								<div>
									<FormSelectField
										label="Locataire associé"
										required
										value={inviteTenantId}
										onChange={(e) => setInviteTenantId(e.target.value)}
										disabled={inviteLoading}
									>
										<option value="">— Sélectionner un locataire —</option>
										{tenants.map((t) => (
											<option key={t.id} value={String(t.id)}>
												{t.firstname} {t.lastname}
											</option>
										))}
									</FormSelectField>
								</div>
							)}
							<p className="text-muted-foreground text-sm mb-0">
								Un email contenant un lien d&apos;activation (valable 24h) sera
								envoyé à cette adresse.
							</p>
						</div>
						<DialogFooter className="pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setInviteModal(false)}
								disabled={inviteLoading}
							>
								Fermer
							</Button>
							<Button type="submit" disabled={inviteLoading}>
								{inviteLoading ? <Spinner size="sm" className="mr-2" /> : null}
								Envoyer l&apos;invitation
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Modal édition */}
			<Dialog
				open={editModal}
				onOpenChange={(open) => !open && setEditModal(false)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSaveEdit}>
						<div className="space-y-3 py-2">
							{editError && (
								<AppAlert
									color="danger"
									dismissible
									onClose={() => setEditError(null)}
								>
									{editError}
								</AppAlert>
							)}
							<div>
								<FormInputField
									label="Email"
									type="email"
									value={editingUser?.email ?? ""}
									disabled
								/>
							</div>
							<div>
								<FormInputField
									label="Nom"
									type="text"
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									placeholder="Prénom Nom"
									disabled={editLoading}
								/>
							</div>
							<div>
								<FormSelectField
									label="Rôle"
									value={editRole}
									onChange={(e) => {
										setEditRole(e.target.value);
										setEditTenantId("");
									}}
									disabled={editLoading}
								>
									<option value="viewer">
										Lecteur — consultation uniquement
									</option>
									<option value="admin">Administrateur — accès complet</option>
									<option value="locataire">
										Locataire — accès portail locataire
									</option>
								</FormSelectField>
							</div>
							{editRole === "locataire" && (
								<div>
									<FormSelectField
										label="Locataire associé"
										required
										value={editTenantId}
										onChange={(e) => setEditTenantId(e.target.value)}
										disabled={editLoading}
									>
										<option value="">— Sélectionner un locataire —</option>
										{tenants.map((t) => (
											<option key={t.id} value={String(t.id)}>
												{t.firstname} {t.lastname}
											</option>
										))}
									</FormSelectField>
								</div>
							)}
						</div>
						<DialogFooter className="pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setEditModal(false)}
								disabled={editLoading}
							>
								Annuler
							</Button>
							<Button type="submit" disabled={editLoading}>
								{editLoading ? <Spinner size="sm" className="mr-2" /> : null}
								Enregistrer
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Modal suppression */}
			<DeleteModal
				visible={deleteModal}
				onClose={() => setDeleteModal(false)}
				onConfirm={handleDelete}
				itemLabel={toDelete ? `l'utilisateur ${toDelete.email}` : ""}
			/>
		</>
	);
};

export default Users;
