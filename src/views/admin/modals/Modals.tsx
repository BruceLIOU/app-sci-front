import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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

const Modals = ({
	entities,
	type,
	modalVisible,
	setModalVisible,
	data,
}: ModalsProps) => {
	const [dataModal, setDataModal] = useState<{
		title?: string;
		component?: React.ReactNode;
		size?: string;
	}>({});

	useEffect(() => {
		switch (type) {
			case "view":
				setDataModal({
					title: "Visualisation",
					size: "xl",
					component: (
						<ViewForms
							entities={entities}
							data={data}
							setModalVisible={setModalVisible}
						/>
					),
				});
				break;
			case "create":
				setDataModal({
					title: "Création",
					size: "xl",
					component: (
						<CreateForms
							entities={entities}
							data={data}
							setModalVisible={setModalVisible}
						/>
					),
				});
				break;
			case "edit":
				setDataModal({
					title: "Modification",
					size: "xl",
					component: (
						<EditForms
							entities={entities}
							data={data}
							setModalVisible={setModalVisible}
						/>
					),
				});
				break;
			case "delete":
				setDataModal({
					title: "Suppression",
					size: "lg",
					component: (
						<DeleteForms
							entities={entities}
							data={data}
							setModalVisible={setModalVisible}
						/>
					),
				});
				break;
			default:
				break;
		}
	}, [entities, type]);

	return (
		<Dialog
			open={modalVisible}
			onOpenChange={(o) => !o && setModalVisible(false)}
		>
			<DialogContent
				className={
					dataModal.size === "xl"
						? "max-w-4xl"
						: dataModal.size === "lg"
							? "max-w-2xl"
							: ""
				}
			>
				<DialogHeader>
					<DialogTitle>{dataModal.title}</DialogTitle>
				</DialogHeader>
				{dataModal.component}
			</DialogContent>
		</Dialog>
	);
};

export default Modals;
