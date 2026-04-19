import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type React from "react";

interface CrudModalProps {
	visible: boolean;
	// biome-ignore lint/suspicious/noExplicitAny: valeur d'édition générique
	editing: any;
	title?: string;
	addTitle?: string;
	editTitle?: string;
	size?: "sm" | "lg" | "xl";
	onClose: () => void;
	onSubmit: (e: React.FormEvent) => void;
	submitLabel?: string;
	children: React.ReactNode;
}

const sizeClass: Record<string, string> = {
	sm: "max-w-sm",
	lg: "max-w-2xl",
	xl: "max-w-4xl",
};

const CrudModal: React.FC<CrudModalProps> = ({
	visible,
	editing,
	title,
	addTitle = "Ajouter",
	editTitle = "Modifier",
	size = "lg",
	onClose,
	onSubmit,
	submitLabel,
	children,
}) => (
	<Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
		<DialogContent className={cn(sizeClass[size] ?? sizeClass.lg)}>
			<DialogHeader>
				<DialogTitle>{title ?? (editing ? editTitle : addTitle)}</DialogTitle>
			</DialogHeader>
			<form onSubmit={onSubmit}>
				<div className="grid grid-cols-2 gap-4">{children}</div>
				<div className="flex justify-end gap-2 pt-4 mt-4 border-t">
					<Button type="button" variant="outline" onClick={onClose}>
						Annuler
					</Button>
					<Button type="submit">
						{submitLabel ?? (editing ? "Modifier" : "Ajouter")}
					</Button>
				</div>
			</form>
		</DialogContent>
	</Dialog>
);

export default CrudModal;
