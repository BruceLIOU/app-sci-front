import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PropertyDataService from "../../../services/property.service";
import CreateForms from "../forms/CreateForms";
import EditForms from "../forms/EditForms";

const PropertyFormPage = () => {
	const { id } = useParams<{ id?: string }>();
	const navigate = useNavigate();
	const isEdit = Boolean(id);

	const [property, setProperty] = useState<any>(null);
	const [loading, setLoading] = useState(isEdit);
	const [notFound, setNotFound] = useState(false);

	useEffect(() => {
		if (!id) return;
		PropertyDataService.get(Number(id))
			.then((res) => setProperty(res.data))
			.catch(() => setNotFound(true))
			.finally(() => setLoading(false));
	}, [id]);

	const goBack = () => navigate("/admin/properties");

	if (loading) {
		return (
			<div className="flex justify-center py-20">
				<Spinner size="lg" />
			</div>
		);
	}

	if (notFound) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-10 text-center">
				<p className="text-muted-foreground mb-4">Bien introuvable.</p>
				<Button variant="outline" onClick={goBack}>
					<ArrowLeft className="h-4 w-4 mr-1" />
					Retour
				</Button>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto px-4 py-6">
			<div className="flex items-center gap-3 mb-6">
				<Button variant="ghost" size="sm" onClick={goBack} className="shrink-0">
					<ArrowLeft className="h-4 w-4 mr-1" />
					Retour
				</Button>
				<h1 className="text-xl font-semibold truncate">
					{isEdit ? "Modifier le bien" : "Nouveau bien"}
				</h1>
			</div>

			{isEdit ? (
				property && (
					<EditForms
						entities="properties"
						data={[property]}
						setModalVisible={goBack}
					/>
				)
			) : (
				<CreateForms entities="properties" data={[]} setModalVisible={goBack} />
			)}
		</div>
	);
};

export default PropertyFormPage;
