import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import SimpleBar from "simplebar-react";
import { set, setOwnerProfileType } from "../store";
import type { RootState } from "../store";
import { AppSidebarNav } from "./AppSidebarNav";
import "simplebar/dist/simplebar.min.css";
import { useMemo } from "react";
import navigation from "../_nav";
import OwnerConfigDataService from "../services/owner_config.service";

const SIDEBAR_WIDTH = 256;
const SIDEBAR_NARROW = 64;

const AppSidebar = () => {
	const dispatch = useDispatch();
	const unfoldable = useSelector(
		(state: RootState) => state.ui.sidebarUnfoldable,
	);
	const sidebarShow = useSelector((state: RootState) => state.ui.sidebarShow);
	const userRole = useSelector(
		(state: RootState) => state.auth.user?.role ?? "viewer",
	);
	const ownerType = useSelector((state: RootState) => state.owner.profileType);

	useEffect(() => {
		OwnerConfigDataService.get()
			.then((r) => {
				const type = (r.data.owner_profile_type || "INDIVIDUAL") as
					| "SCI"
					| "PROFESSIONAL"
					| "INDIVIDUAL";
				dispatch(setOwnerProfileType(type));
			})
			.catch(() => dispatch(setOwnerProfileType("INDIVIDUAL")));
	}, [dispatch]);

	const getAssociatesLabel = () => {
		if (ownerType === "SCI") return "Co-bailleurs";
		if (ownerType === "PROFESSIONAL") return "Co-propriétaires";
		return "Collaborateurs";
	};

	const isSciProfile = ownerType === "SCI";

	const filteredNav = useMemo(
		() =>
			navigation
				.map((item) => {
					if (item.to === "/admin/associates")
						return { ...item, name: getAssociatesLabel() };
					if (item.name === "Co-bailleurs")
						return { ...item, name: getAssociatesLabel() };
					return item;
				})
				.filter((item) => {
					if (item.to === "/admin/declarations" && !isSciProfile) return false;
					if (item.name === "Déclaration 2072" && !isSciProfile) return false;
					// biome-ignore lint/suspicious/noExplicitAny: le type de rôle vient du store
					return !item.roles || item.roles.includes(userRole as any);
				}),
		// biome-ignore lint/correctness/useExhaustiveDependencies: getAssociatesLabel redéfinie inline sans useCallback
		[isSciProfile, userRole, getAssociatesLabel],
	);

	const sidebarW = unfoldable ? SIDEBAR_NARROW : SIDEBAR_WIDTH;

	return (
		<>
			{/* Mobile overlay */}
			{sidebarShow && (
				<div
					role="button"
					tabIndex={-1}
					aria-label="Fermer la sidebar"
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={() => dispatch(set({ sidebarShow: false }))}
					onKeyDown={(e) =>
						e.key === "Escape" && dispatch(set({ sidebarShow: false }))
					}
				/>
			)}

			<aside
				className={cn(
					"app-sidebar fixed top-0 left-0 h-screen z-50 flex flex-col transition-all duration-200",
					sidebarShow ? "translate-x-0" : "-translate-x-full",
					"lg:translate-x-0",
				)}
				style={{ width: sidebarW }}
			>
				{/* Brand */}
				<div className="app-sidebar-brand">
					<span className="app-sidebar-brand-mark">
						<svg
							viewBox="0 0 160 160"
							height={24}
							width={24}
							fill="white"
							aria-hidden="true"
						>
							<path d="M80 10 L150 150 L10 150 Z" />
						</svg>
					</span>
					{!unfoldable && (
						<span className="app-sidebar-brand-text">
							<span className="app-sidebar-brand-title">Pilotage Immo</span>
						</span>
					)}
					{/* Mobile close button */}
					<button
						type="button"
						className="ml-auto lg:hidden text-white/60 hover:text-white"
						onClick={() => dispatch(set({ sidebarShow: false }))}
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Nav */}
				<div className="sidebar-nav flex-1 min-h-0">
					<SimpleBar style={{ height: "100%" }}>
						<AppSidebarNav items={filteredNav} narrow={unfoldable} />
					</SimpleBar>
				</div>
			</aside>
		</>
	);
};

export default React.memo(AppSidebar);
