import { cn } from "@/lib/utils";
import React from "react";
import { useSelector } from "react-redux";
import {
	AppContent,
	AppFooter,
	AppHeader,
	AppSidebar,
} from "../components/index";
import type { RootState } from "../store";

const DefaultLayout = () => {
	const unfoldable = useSelector(
		(state: RootState) => state.ui.sidebarUnfoldable,
	);

	return (
		<div className="flex min-h-screen bg-background">
			<AppSidebar />
			<div
				className={cn(
					"flex flex-col flex-1 min-w-0 transition-all duration-200",
					unfoldable ? "lg:ml-16" : "lg:ml-64",
				)}
			>
				<AppHeader />
				<main className="flex-1">
					<AppContent />
				</main>
				<AppFooter />
			</div>
		</div>
	);
};

export default DefaultLayout;
