import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus } from "lucide-react";
import type React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

interface EntityTableCardProps {
	title: string;
	addLabel?: string;
	onAdd?: () => void;
	/** Extra controls rendered in the header (right side, before/instead of the Add button) */
	headerActions?: React.ReactNode;
	children: React.ReactNode;
}

const EntityTableCard: React.FC<EntityTableCardProps> = ({
	title,
	addLabel = "Ajouter",
	onAdd,
	headerActions,
	children,
}) => {
	const userRole = useSelector(
		(state: RootState) => state.auth.user?.role ?? "viewer",
	);
	const isAdmin = userRole === "admin";

	return (
		<Card className="overflow-hidden">
			<CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b space-y-0 bg-gradient-to-r from-slate-50/80 to-white dark:from-slate-800/40 dark:to-transparent">
				<h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
					{title}
				</h3>
				<div className="flex items-center gap-2 flex-wrap">
					{headerActions}
					{isAdmin && onAdd && (
						<Button
							size="sm"
							onClick={onAdd}
							className="h-8 gap-1.5 text-xs px-3"
						>
							<Plus className="h-3.5 w-3.5" />
							{addLabel}
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="p-0">{children}</CardContent>
		</Card>
	);
};

export default EntityTableCard;
