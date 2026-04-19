import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type React from "react";
import DocumentsSection from "../../../components/DocumentsSection";

interface ViewFormsProps {
	entities: string;
	data: any[];
	setModalVisible: (v: boolean) => void;
}

const ViewForms = ({ entities, data, setModalVisible }: ViewFormsProps) => {
	const isTenant = entities === "tenants";

	const Field = ({
		label,
		value,
		link,
	}: { label: string; value?: React.ReactNode; link?: string }) => (
		<div className="grid grid-cols-3 gap-2 py-1.5 border-b last:border-0">
			<span className="text-sm font-medium text-muted-foreground">{label}</span>
			<span className="col-span-2 text-sm">
				{link && value ? (
					<a href={link} className="text-primary hover:underline">
						{value}
					</a>
				) : (
					value || <span className="text-muted-foreground">—</span>
				)}
			</span>
		</div>
	);

	return (
		<>
			{data.map((item) => (
				<div key={item.id}>
					{isTenant ? (
						<>
							{item.avatar && (
								<div className="text-center mb-3">
									<img
										src={item.avatar}
										alt="Avatar"
										className="rounded-full mx-auto"
										style={{ width: 96, height: 96, objectFit: "cover" }}
									/>
								</div>
							)}
							<Field label="Civilité" value={item.civility} />
							<Field label="Prénom" value={item.firstname} />
							<Field label="Nom" value={item.lastname} />
							<Field
								label="Email"
								value={item.email}
								link={item.email ? `mailto:${item.email}` : undefined}
							/>
							<Field
								label="Téléphone"
								value={item.mobile}
								link={item.mobile ? `tel:${item.mobile}` : undefined}
							/>
							<Field
								label="Bien loué"
								value={
									item.Property
										? `${item.Property.type} de ${item.Property.area} m² à ${item.Property.city}`
										: "Aucun bien associé"
								}
							/>
							{(item.previous_address || item.previous_city) && (
								<Field
									label="Anc. adresse"
									value={[
										item.previous_address,
										item.previous_zipcode,
										item.previous_city,
									]
										.filter(Boolean)
										.join(", ")}
								/>
							)}
							{item.comments && (
								<Field
									label="Commentaires"
									value={
										<span style={{ whiteSpace: "pre-wrap" }}>
											{item.comments}
										</span>
									}
								/>
							)}
						</>
					) : (
						<>
							<Field
								label="Type"
								value={<Badge variant="outline">{item.type}</Badge>}
							/>
							<Field label="Adresse" value={item.address} />
							<Field label="Ville" value={item.city} />
							<Field label="Code postal" value={item.zipcode} />
							<Field
								label="Surface"
								value={item.area ? `${item.area} m²` : undefined}
							/>
							<Field label="Pièces" value={item.pieces} />
							{item.comments && (
								<Field
									label="Commentaires"
									value={
										<span style={{ whiteSpace: "pre-wrap" }}>
											{item.comments}
										</span>
									}
								/>
							)}
							<div className="mt-3">
								<DocumentsSection entityType="property" entityId={item.id} />
							</div>
						</>
					)}
					<div className="flex justify-end mt-4 pt-3 border-t">
						<Button onClick={() => setModalVisible(false)}>Quitter</Button>
					</div>
				</div>
			))}
		</>
	);
};

export default ViewForms;
