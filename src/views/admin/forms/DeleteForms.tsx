import { Button } from "@/components/ui/button";
import React from "react";
import PropertyDataService from "../../../services/property.service";
import TenantDataService from "../../../services/tenant.service";

interface DeleteFormsProps {
	entities: string;
	data: any[];
	setModalVisible: (v: boolean) => void;
}

const DeleteForms = ({ entities, data, setModalVisible }: DeleteFormsProps) => {
	const isTenant = entities === "tenants";

	const handleDelete = async () => {
		try {
			const response = isTenant
				? await TenantDataService.delete(data[0].id)
				: await PropertyDataService.delete(data[0].id);
			if (response.status === 200 || response.status === 201)
				setModalVisible(false);
		} catch (error: any) {
			console.log(error.message);
		}
	};

	const confirmText = isTenant
		? "Êtes-vous sûr de vouloir supprimer le locataire "
		: "Êtes-vous sûr de vouloir supprimer le bien ";
	const entityName = isTenant
		? `${data[0]?.civility || ""} ${data[0]?.firstname} ${data[0]?.lastname}`
		: `${data[0]?.type} ${data[0]?.city}`;

	return (
		<>
			<p className="text-sm text-slate-600 dark:text-slate-400">
				{confirmText}
				<strong>{entityName}</strong> ?
			</p>
			<div className="flex justify-end gap-2 pt-4 border-t">
				<Button variant="outline" onClick={() => setModalVisible(false)}>
					Annuler
				</Button>
				<Button variant="destructive" onClick={handleDelete}>
					Supprimer
				</Button>
			</div>
		</>
	);
};

export default DeleteForms;
