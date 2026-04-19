import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import type React from "react";
import { useEffect, useState } from "react";
import CreateForms from "../forms/CreateForms";
import DeleteForms from "../forms/DeleteForms";
import EditForms from "../forms/EditForms";
import ViewForms from "../forms/ViewForms";

interface ModalsProps {
	entities: string;
	type: string | null;
	modalVisible: boolean;
	setModalVisible: (v: boolean) => void;
	data: any[];
}

const SHEET_TYPES = ["view"];

const TITLES: Record<string, string> = {
	view: "Visualisation",
	create: "Création",
	edit: "Modification",
	delete: "Suppression",
};

const Modals = ({
	entities,
	type,
	modalVisible,
	setModalVisible,
	data,
}: ModalsProps) => {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		if (modalVisible) setMounted(true);
	}, [modalVisible]);

	const title = type ? (TITLES[type] ?? "") : "";
	const isSheet = type ? SHEET_TYPES.includes(type) : false;

	const formContent = () => {
		switch (type) {
			case "view":
				return (
					<ViewForms
						entities={entities}
						data={data}
						setModalVisible={setModalVisible}
					/>
				);
			case "create":
				return (
					<CreateForms
						entities={entities}
						data={data}
						setModalVisible={setModalVisible}
					/>
				);
			case "edit":
				return (
					<EditForms
						entities={entities}
						data={data}
						setModalVisible={setModalVisible}
					/>
				);
			case "delete":
				return (
					<DeleteForms
						entities={entities}
						data={data}
						setModalVisible={setModalVisible}
					/>
				);
			default:
				return null;
		}
	};

	if (!mounted) return null;

	if (isSheet) {
		return (
			<Sheet
				open={modalVisible}
				onOpenChange={(o) => !o && setModalVisible(false)}
			>
				<SheetContent side="right">
					<SheetHeader>
						<SheetTitle>{title}</SheetTitle>
					</SheetHeader>
					<SheetBody>{formContent()}</SheetBody>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Dialog
			open={modalVisible}
			onOpenChange={(o) => !o && setModalVisible(false)}
		>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				{formContent()}
			</DialogContent>
		</Dialog>
	);
};

export default Modals;
