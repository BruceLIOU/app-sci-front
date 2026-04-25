import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bell, Check, Mail, Menu } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DateUtils } from "src/utils/date";
import { useNotifications } from "../hooks/useNotifications";
import { set } from "../store";
import type { RootState } from "../store";
import { AppHeaderDropdown } from "./header/index";
import { AppBreadcrumb } from "./index";

const typeColor: Record<string, string> = {
	matera_charge: "#f9a825",
	email_sent: "#0d6efd",
};

const AppHeader = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const sidebarShow = useSelector((state: RootState) => state.ui.sidebarShow);
	const sidebarUnfoldable = useSelector(
		(state: RootState) => state.ui.sidebarUnfoldable,
	);
	const {
		unreadCount,
		recentUnread,
		popoverLoaded,
		loadUnread,
		markRead,
		markAllRead,
	} = useNotifications();
	const [popoverOpen, setPopoverOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!popoverOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setPopoverOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [popoverOpen]);

	const handleBellClick = () => {
		if (popoverOpen) {
			setPopoverOpen(false);
			return;
		}
		setPopoverOpen(true);
		loadUnread();
	};

	const goToPage = () => {
		setPopoverOpen(false);
		navigate("/admin/notifications");
	};

	return (
		<header className="sticky top-0 z-40 mb-4 app-header border-b bg-background">
			<div className="flex h-14 items-center gap-2 px-4">
				<Button
					variant="secondary"
					size="icon"
					className="h-8 w-8"
					onClick={() => {
						if (window.innerWidth >= 1024) {
							dispatch(set({ sidebarUnfoldable: !sidebarUnfoldable }));
						} else {
							dispatch(set({ sidebarShow: !sidebarShow }));
						}
					}}
				>
					<Menu className="h-5 w-5" />
				</Button>
				<nav className="flex-1 min-w-0 app-header-breadcrumb-inline">
					<AppBreadcrumb />
				</nav>

				<div className="flex items-center gap-1">
					<div ref={containerRef} className="relative">
						<Button
							variant="ghost"
							size="icon"
							className="app-notification-trigger relative h-8 w-8 border-none"
							onClick={handleBellClick}
						>
							<Bell className="h-5 w-5" />
							{unreadCount > 0 && (
								<Badge
									variant="default"
									className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[0.6rem] flex items-center justify-center"
								>
									{unreadCount > 99 ? "99+" : unreadCount}
								</Badge>
							)}
						</Button>

						{popoverOpen && (
							<div className="app-notification-popover absolute top-[calc(100%+8px)] right-0 w-[340px] z-[1050] overflow-hidden rounded-lg border bg-background shadow-lg">
								<div className="flex items-center justify-between px-3.5 py-2.5 border-b bg-muted/40">
									<span className="font-semibold text-sm">
										Notifications non lues
										{unreadCount > 0 && (
											<Badge variant="default" className="ml-2">
												{unreadCount}
											</Badge>
										)}
									</span>
									{unreadCount > 0 && (
										<Button
											variant="secondary"
											size="sm"
											onClick={markAllRead}
											className="h-auto px-1.5 py-0.5 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
										>
											<Check className="h-3 w-3" /> Tout lire
										</Button>
									)}
								</div>

								<div className="max-h-80 overflow-y-auto">
									{!popoverLoaded ? (
										<div className="py-5 text-center text-sm text-muted-foreground">
											Chargement…
										</div>
									) : recentUnread.length === 0 ? (
										<div className="flex flex-col items-center py-6 text-sm text-muted-foreground gap-2">
											<Mail className="h-6 w-6 opacity-30" />
											Aucune notification non lue
										</div>
									) : (
										recentUnread.map((n) => (
											<Button
												type="button"
												key={n.id}
												variant="ghost"
												onClick={() => markRead(n.id)}
												className="flex w-full h-auto items-start gap-2.5 border-b px-3.5 py-2.5 text-left hover:bg-muted/40 rounded-none justify-start"
											>
												<span
													className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
													style={{
														background: typeColor[n.type] ?? "#2eb85c",
													}}
												/>
												<div className="min-w-0 flex-1">
													<div className="truncate text-sm font-semibold">
														{n.title}
													</div>
													{n.message && (
														<div className="truncate text-xs text-muted-foreground mt-0.5">
															{n.message}
														</div>
													)}
													<div className="text-[0.7rem] text-muted-foreground mt-0.5">
														{DateUtils.formatWithTime(n.createdAt)}
													</div>
												</div>
												<Check className="h-3.5 w-3.5 shrink-0 opacity-40 mt-1" />
											</Button>
										))
									)}
								</div>

								<Button
									type="button"
									variant="ghost"
									onClick={goToPage}
									className="flex w-full h-auto items-center justify-center gap-1.5 border-t px-3.5 py-2.5 text-sm font-semibold text-primary bg-muted/40 hover:bg-muted/60 rounded-none"
								>
									Voir toutes les notifications{" "}
									<ArrowRight className="h-3.5 w-3.5" />
								</Button>
							</div>
						)}
					</div>
				</div>

				<div className="ml-2">
					<AppHeaderDropdown />
				</div>
			</div>
		</header>
	);
};

export default AppHeader;
