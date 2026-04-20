import { AppAlert } from "@/components/ui/app-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Bell, CheckCheck, Mail, Trash2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { DateUtils } from "src/utils/date";
import NotificationService, {
	type Notification,
} from "../../../services/notification.service";

const typeConfig: Record<
	string,
	{ label: string; icon: React.ReactNode; badgeClass: string }
> = {
	matera_charge: {
		label: "Charge MATERA",
		icon: <Bell className="h-3 w-3" />,
		badgeClass: "bg-yellow-100 text-yellow-800",
	},
	email_sent: {
		label: "Email envoyé",
		icon: <Mail className="h-3 w-3" />,
		badgeClass: "bg-blue-100 text-blue-800",
	},
};

const Notifications = () => {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [filter, setFilter] = useState<"all" | "unread">("all");
	const [loading, setLoading] = useState(true);
	const [alert, setAlert] = useState<{
		type: "success" | "danger";
		message: string;
	} | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

	const fetchAll = useCallback(() => {
		setLoading(true);
		NotificationService.getAll()
			.then((r) => setNotifications(r.data))
			.catch(() =>
				setAlert({
					type: "danger",
					message: "Impossible de charger les notifications.",
				}),
			)
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		fetchAll();
	}, [fetchAll]);

	const filtered =
		filter === "unread"
			? notifications.filter((n) => !n.is_read)
			: notifications;

	const unreadCount = notifications.filter((n) => !n.is_read).length;

	const handleMarkRead = async (id: number) => {
		await NotificationService.markRead(id).catch(() => {});
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
		);
	};

	const handleMarkAllRead = async () => {
		try {
			await NotificationService.markAllRead();
			setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
			setAlert({
				type: "success",
				message: "Toutes les notifications ont été marquées comme lues.",
			});
		} catch {
			setAlert({ type: "danger", message: "Erreur lors de la mise à jour." });
		}
	};

	const handleDelete = async (id: number) => {
		await NotificationService.delete(id).catch(() => {});
		setNotifications((prev) => prev.filter((n) => n.id !== id));
		setSelectedIds((prev) => {
			const s = new Set(prev);
			s.delete(id);
			return s;
		});
	};

	const handleBulkDelete = async () => {
		const ids = Array.from(selectedIds);
		if (!ids.length) return;
		try {
			await NotificationService.bulkDelete(ids);
			setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
			setSelectedIds(new Set());
			setAlert({
				type: "success",
				message: `${ids.length} notification(s) supprimée(s).`,
			});
		} catch {
			setAlert({ type: "danger", message: "Erreur lors de la suppression." });
		}
	};

	const toggleSelect = (id: number) => {
		setSelectedIds((prev) => {
			const s = new Set(prev);
			s.has(id) ? s.delete(id) : s.add(id);
			return s;
		});
	};

	const isAllSelected =
		filtered.length > 0 && filtered.every((n) => selectedIds.has(n.id));
	const toggleSelectAll = () => {
		if (isAllSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(filtered.map((n) => n.id)));
		}
	};

	return (
		<div>
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
					<CardContent className="p-0">
						<div className="app-page-kicker mb-3">Système</div>
						<h2 className="mb-2 app-display-title">Notifications</h2>
						<p className="app-page-description mb-3">
							Alertes et événements automatiques : rappels de paiement,
							expiration de baux, emails envoyés.
						</p>
						<div className="flex flex-wrap items-center gap-2">
							<span className="app-filter-chip">
								{notifications.length} notification
								{notifications.length > 1 ? "s" : ""}
							</span>
							{unreadCount > 0 && (
								<span className="app-filter-chip">
									{unreadCount} non lue{unreadCount > 1 ? "s" : ""}
								</span>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2 border-b py-3 px-4 space-y-0">
					<div className="flex items-center gap-3">
						<strong>Notifications</strong>
						{unreadCount > 0 && (
							<Badge variant="secondary">{unreadCount} non lues</Badge>
						)}
					</div>
					<div className="flex gap-2 flex-wrap">
						<div className="flex">
							<Button
								size="sm"
								variant={filter === "all" ? "default" : "outline"}
								className="rounded-r-none"
								onClick={() => setFilter("all")}
							>
								Toutes ({notifications.length})
							</Button>
							<Button
								size="sm"
								variant={filter === "unread" ? "default" : "outline"}
								className="rounded-l-none border-l-0"
								onClick={() => setFilter("unread")}
							>
								Non lues ({unreadCount})
							</Button>
						</div>
						{unreadCount > 0 && (
							<Button size="sm" variant="outline" onClick={handleMarkAllRead}>
								<CheckCheck className="mr-1 h-4 w-4" />
								Tout marquer comme lu
							</Button>
						)}
						{selectedIds.size > 0 && (
							<Button
								size="sm"
								variant="destructive"
								onClick={handleBulkDelete}
							>
								<Trash2 className="mr-1 h-4 w-4" />
								Supprimer ({selectedIds.size})
							</Button>
						)}
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{loading ? (
						<div className="text-center py-5">
							<Spinner size="lg" />
						</div>
					) : filtered.length === 0 ? (
						<div className="text-center text-muted-foreground py-5">
							{filter === "unread"
								? "Aucune notification non lue."
								: "Aucune notification."}
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead style={{ width: 40 }}>
											<input
												type="checkbox"
												checked={isAllSelected}
												onChange={toggleSelectAll}
												className="h-4 w-4"
											/>
										</TableHead>
										<TableHead style={{ width: 12 }} />
										<TableHead>Type</TableHead>
										<TableHead>Libellé</TableHead>
										<TableHead>Détail</TableHead>
										<TableHead>Date</TableHead>
										<TableHead style={{ width: 80 }} />
									</TableRow>
								</TableHeader>
								<TableBody>
									{filtered.map((n) => {
										const cfg = typeConfig[n.type] ?? {
											label: n.type,
											icon: <Bell className="h-3 w-3" />,
											badgeClass: "bg-slate-100 text-slate-700",
										};
										return (
											<TableRow
												key={n.id}
												style={{
													cursor: !n.is_read ? "pointer" : "default",
													fontWeight: !n.is_read ? 600 : 400,
												}}
												onClick={() => {
													if (!n.is_read) handleMarkRead(n.id);
												}}
											>
												<TableCell onClick={(e) => e.stopPropagation()}>
													<input
														type="checkbox"
														checked={selectedIds.has(n.id)}
														onChange={() => toggleSelect(n.id)}
														className="h-4 w-4"
													/>
												</TableCell>
												<TableCell>
													{!n.is_read && (
														<span
															className="inline-block w-2 h-2 rounded-full bg-green-500"
															title="Non lue"
														/>
													)}
												</TableCell>
												<TableCell>
													<span
														className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.badgeClass}`}
													>
														{cfg.icon}
														{cfg.label}
													</span>
												</TableCell>
												<TableCell>{n.title}</TableCell>
												<TableCell className="text-muted-foreground text-sm">
													{n.message || "—"}
												</TableCell>
												<TableCell className="text-muted-foreground text-sm whitespace-nowrap">
													{DateUtils.formatWithTime(n.createdAt)}
												</TableCell>
												<TableCell onClick={(e) => e.stopPropagation()}>
													<Button
														size="sm"
														variant="ghost"
														className="text-destructive hover:text-destructive"
														onClick={() => handleDelete(n.id)}
														title="Supprimer"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default Notifications;
