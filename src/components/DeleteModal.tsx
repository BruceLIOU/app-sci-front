import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type React from "react";

interface DeleteModalProps {
	visible: boolean;
	itemLabel?: string;
	onClose: () => void;
	onConfirm: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
	visible,
	itemLabel,
	onClose,
	onConfirm,
}) => (
	<Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
		<DialogContent className="max-w-sm">
			<DialogHeader>
				<DialogTitle>Suppression</DialogTitle>
			</DialogHeader>
			<p className="text-sm text-slate-600 dark:text-slate-400">
				Supprimer
				{itemLabel ? (
					<>
						{" "}
						<strong>{itemLabel}</strong>
					</>
				) : (
					" cet élément"
				)}{" "}
				?
			</p>
			<div className="flex justify-end gap-2 pt-2">
				<Button variant="outline" onClick={onClose}>
					Annuler
				</Button>
				<Button variant="destructive" onClick={onConfirm}>
					Supprimer
				</Button>
			</div>
		</DialogContent>
	</Dialog>
);

export default DeleteModal;
