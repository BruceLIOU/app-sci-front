import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type React from "react";
import { useEffect, useState } from "react";
import { DateUtils } from "src/utils/date";
import DocumentsSection from "../../../components/DocumentsSection";
import PaymentDataService from "../../../services/payment.service";

interface ViewFormsProps {
	entities: string;
	data: any[];
	setModalVisible: (v: boolean) => void;
}

const ViewForms = ({ entities, data, setModalVisible }: ViewFormsProps) => {
	const isTenant = entities === "tenants";
	const [tenantPayments, setTenantPayments] = useState<any[]>([]);

	useEffect(() => {
		if (!isTenant || !data[0]?.id) return;
		PaymentDataService.getAll()
			.then((res) =>
				setTenantPayments(
					res.data.filter((p: any) => p.tenant_id === data[0].id),
				),
			)
			.catch(() => {});
	}, [isTenant, data]);

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
							{item.monthly_income && item.Lease?.rent_amount && (
								<Field
									label="Taux effort"
									value={(() => {
										const ratio =
											(Number.parseFloat(item.Lease.rent_amount) /
												Number.parseFloat(item.monthly_income)) *
											100;
										const color =
											ratio <= 33
												? "text-green-600"
												: ratio <= 40
													? "text-amber-500"
													: "text-red-500";
										return (
											<span className={color}>
												{ratio.toFixed(1)} % (
												{ratio <= 33
													? "✓ Solvable"
													: ratio <= 40
														? "⚠ Limite"
														: "✗ Risqué"}
												)
											</span>
										);
									})()}
								/>
							)}
							{item.monthly_income && (
								<Field
									label="Revenus mensuels"
									value={`${Number.parseFloat(item.monthly_income).toFixed(0)} €`}
								/>
							)}

							{tenantPayments.length > 0 && (
								<>
									<div className="py-2 border-b font-semibold text-sm mt-1">
										Historique des paiements
									</div>
									{tenantPayments
										.sort((a, b) =>
											(b.month || "").localeCompare(a.month || ""),
										)
										.map((p) => (
											<div
												key={p.id}
												className="grid grid-cols-3 gap-2 py-1.5 border-b last:border-0"
											>
												<span className="text-sm font-medium text-muted-foreground">
													{DateUtils.formatMonthYear(p.month) ||
														p.due_date?.slice(0, 7) ||
														"—"}
												</span>
												<span className="col-span-2 text-sm flex items-center gap-2">
													{Number.parseFloat(p.amount || 0).toFixed(2)} €
													<Badge
														variant={
															p.status === "paid"
																? "default"
																: p.status === "late"
																	? "destructive"
																	: "secondary"
														}
													>
														{p.status === "paid"
															? "Payé"
															: p.status === "late"
																? "Retard"
																: "Attente"}
													</Badge>
												</span>
											</div>
										))}
								</>
							)}

							{(item.guarantor_firstname || item.guarantor_lastname) && (
								<>
									<div className="py-2 border-b font-semibold text-sm">
										Garant
									</div>
									<Field
										label="Identité"
										value={[
											item.guarantor_civility === "MR" ? "M." : "Mme",
											item.guarantor_firstname,
											item.guarantor_lastname,
										]
											.filter(Boolean)
											.join(" ")}
									/>
									{item.guarantor_email && (
										<Field
											label="Email"
											value={item.guarantor_email}
											link={`mailto:${item.guarantor_email}`}
										/>
									)}
									{item.guarantor_mobile && (
										<Field
											label="Téléphone"
											value={item.guarantor_mobile}
											link={`tel:${item.guarantor_mobile}`}
										/>
									)}
									{(item.guarantor_address || item.guarantor_city) && (
										<Field
											label="Adresse"
											value={[
												item.guarantor_address,
												item.guarantor_zipcode,
												item.guarantor_city,
											]
												.filter(Boolean)
												.join(", ")}
										/>
									)}
								</>
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
							{(item.dpe_class ||
								item.diagnostic_amiante ||
								item.diagnostic_plomb ||
								item.diagnostic_elec ||
								item.diagnostic_gaz) && (
								<>
									<div className="py-2 border-b font-semibold text-sm">
										Diagnostics
									</div>
									{item.dpe_class && (
										<Field
											label="DPE"
											value={`Classe ${item.dpe_class}${item.dpe_value ? ` — ${item.dpe_value} kWh/m²/an` : ""}`}
										/>
									)}
									{item.ges_class && (
										<Field
											label="GES"
											value={`Classe ${item.ges_class}${item.ges_value ? ` — ${item.ges_value} kg CO₂/m²/an` : ""}`}
										/>
									)}
									{item.dpe_date && (
										<Field label="Date DPE" value={item.dpe_date} />
									)}
									{item.diagnostic_date && (
										<Field
											label="Date diagnostics"
											value={item.diagnostic_date}
										/>
									)}
									<Field
										label="Présence"
										value={
											[
												item.diagnostic_amiante && "Amiante",
												item.diagnostic_plomb && "Plomb",
												item.diagnostic_elec && "Électricité",
												item.diagnostic_gaz && "Gaz",
											]
												.filter(Boolean)
												.join(", ") || "—"
										}
									/>
								</>
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
