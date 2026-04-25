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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Mail, RefreshCw, Trash2, UserPlus } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import DeleteModal from "../../../components/DeleteModal";
import {
	FormInputField,
	FormSelectField,
} from "../../../components/FormFields";
import StatCard from "../../../components/StatCard";
import TableEmptyRow from "../../../components/TableEmptyRow";
import UserDataService from "../../../services/user.service";

interface AppUser {
	id: number;
	email: string;
	name: string | null;
	avatar: string | null;
	role: "admin" | "viewer";
	status: "pending" | "active";
	createdAt: string;
}

const roleLabel: Record<string, string> = { admin: "Admin", viewer: "Lecteur" };
const roleColor: Record<string, string> = {
	admin: "danger",
	viewer: "secondary",
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
	const [loading, setLoading] = useState(true);
	const [inviteModal, setInviteModal] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteName, setInviteName] = useState("");
	const [inviteRole, setInviteRole] = useState("viewer");
	const [inviteLoading, setInviteLoading] = useState(false);
	const [inviteError, setInviteError] = useState<string | null>(null);
	const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
	const [deleteModal, setDeleteModal] = useState(false);
	const [toDelete, setToDelete] = useState<AppUser | null>(null);
	const [actionLoading, setActionLoading] = useState<number | null>(null);
	const [globalMsg, setGlobalMsg] = useState<{
		type: string;
		text: string;
	} | null>(null);

	const fetchUsers = useCallback(() => {
		setLoading(true);
		UserDataService.getAll()
			.then(({ data }) => setUsers(data))
			.catch(() => setUsers([]))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		fetchUsers();
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
		try {
			await UserDataService.invite(fd);
			setInviteSuccess(`Invitation envoyée à ${inviteEmail}.`);
			setInviteEmail("");
			setInviteName("");
			setInviteRole("viewer");
			fetchUsers();
		} catch (err: any) {
			setInviteError(err.response?.data?.message || "Erreur lors de l'envoi.");
		} finally {
			setInviteLoading(false);
		}
	};

	const handleResend = async (user: AppUser) => {
		setActionLoading(user.id);
		try {
			await UserDataService.resendInvite(user.id);
			setGlobalMsg({
				type: "success",
				text: `Invitation renvoyée à ${user.email}.`,
			});
		} catch (err: any) {
			setGlobalMsg({
				type: "danger",
				text: err.response?.data?.message || "Erreur.",
			});
		} finally {
			setActionLoading(null);
		}
	};

	const handleRoleChange = async (user: AppUser, newRole: string) => {
		const fd = new FormData();
		fd.append("role", newRole);
		setActionLoading(user.id);
		try {
			await UserDataService.updateRole(user.id, fd);
			setUsers((prev) =>
				prev.map((u) =>
					u.id === user.id ? { ...u, role: newRole as "admin" | "viewer" } : u,
				),
			);
		} catch (err: any) {
			setGlobalMsg({
				type: "danger",
				text: err.response?.data?.message || "Erreur.",
			});
		} finally {
			setActionLoading(null);
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
													<Select
														value={user.role}
														onValueChange={(val) => handleRoleChange(user, val)}
														disabled={actionLoading === user.id}
													>
														<SelectTrigger className="w-28 h-8 text-sm">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="viewer">Lecteur</SelectItem>
															<SelectItem value="admin">Admin</SelectItem>
														</SelectContent>
													</Select>
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
																			onClick={() => handleResend(user)}
																			disabled={actionLoading === user.id}
																		>
																			{actionLoading === user.id ? (
																				<Spinner size="sm" />
																			) : (
																				<Mail className="h-4 w-4" />
																			)}
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
									onChange={(e) => setInviteRole(e.target.value)}
									disabled={inviteLoading}
								>
									<option value="viewer">
										Lecteur — consultation uniquement
									</option>
									<option value="admin">Administrateur — accès complet</option>
								</FormSelectField>
							</div>
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
