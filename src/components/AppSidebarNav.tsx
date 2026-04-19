import { cn } from "@/lib/utils";
import React from "react";
import { NavLink } from "react-router-dom";
import type { NavItem } from "../_nav";

export const AppSidebarNav = ({
	items,
	narrow = false,
}: { items: NavItem[]; narrow?: boolean }) => (
	<React.Fragment>
		{items.map((item, index) => {
			if (item.type === "title") {
				if (narrow) return null;
				return (
					<div key={item.name} className="nav-title">
						{item.name}
					</div>
				);
			}

			return (
				<NavLink
					key={item.to ?? item.name}
					to={item.to ?? ""}
					className={({ isActive }) =>
						cn(
							"nav-link flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
							isActive
								? "nav-link-active bg-white/10 text-white"
								: "text-white/70 hover:text-white hover:bg-white/8",
						)
					}
				>
					{item.icon && (
						<span className="shrink-0 flex items-center w-5 h-5">
							{item.icon}
						</span>
					)}
					{!narrow && <span>{item.name}</span>}
				</NavLink>
			);
		})}
	</React.Fragment>
);
