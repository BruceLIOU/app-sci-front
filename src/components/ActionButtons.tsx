import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, Trash2 } from "lucide-react";
import type React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

interface ActionButtonsProps {
	onEdit: () => void;
	onDelete: () => void;
	editTooltip?: string;
	deleteTooltip?: string;
	children?: React.ReactNode;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
	onEdit,
	onDelete,
	editTooltip = "Modifier",
	deleteTooltip = "Supprimer",
	children,
}) => {
	const userRole = useSelector(
		(state: RootState) => state.auth.user?.role ?? "viewer",
	);
	const isAdmin = userRole === "admin";

	return (
		<TooltipProvider delayDuration={300}>
			<div className="flex items-center gap-1">
				{children}
				{isAdmin && (
					<>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="icon"
									variant="secondary"
									className="h-7 w-7 rounded-md"
									onClick={onEdit}
								>
									<Pencil className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{editTooltip}</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="icon"
									variant="secondary"
									className="h-7 w-7 rounded-md text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
									onClick={onDelete}
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{deleteTooltip}</TooltipContent>
						</Tooltip>
					</>
				)}
			</div>
		</TooltipProvider>
	);
};

export default ActionButtons;
