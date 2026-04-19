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
	children: React.ReactNode;
}

const EntityTableCard: React.FC<EntityTableCardProps> = ({
	title,
	addLabel = "Ajouter",
	onAdd,
	children,
}) => {
	const userRole = useSelector(
		(state: RootState) => state.auth.user?.role ?? "viewer",
	);
	const isAdmin = userRole === "admin";

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b space-y-0">
				<h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
					{title}
				</h3>
				{isAdmin && onAdd && (
					<Button
						size="sm"
						variant="outline"
						onClick={onAdd}
						className="h-7 gap-1 text-xs"
					>
						<Plus className="h-3 w-3" />
						{addLabel}
					</Button>
				)}
			</CardHeader>
			<CardContent className="p-0">{children}</CardContent>
		</Card>
	);
};

export default EntityTableCard;
