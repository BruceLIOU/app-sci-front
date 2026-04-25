import { AppAlert } from "@/components/ui/app-alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { User, Users } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import ActionButtons from "../../../components/ActionButtons";
import CrudModal from "../../../components/CrudModal";
import DeleteModal from "../../../components/DeleteModal";
import EntityTableCard from "../../../components/EntityTableCard";
import {
	FormInputField,
	FormSelectField,
	FormTextareaField,
} from "../../../components/FormFields";
import StatCard from "../../../components/StatCard";
import TableEmptyRow from "../../../components/TableEmptyRow";
import useEntityCrud from "../../../hooks/useEntityCrud";
import AssociateDataService from "../../../services/associate.service";
import OwnerConfigDataService from "../../../services/owner_config.service";
import { type RootState, setOwnerProfileType } from "../../../store";
import { associateFormSchema } from "../../../validation/schemas";

const emptyForm = {
	civility: "MR",
	firstname: "",
	lastname: "",
	email: "",
	phone: "",
	address: "",
	shares: "",
	role: "Collaborateur",
};

const Associates = () => {
	const dispatch = useDispatch();
	const ownerType = useSelector((state: RootState) => state.owner.profileType);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Charger le type de bailleur au montage si nécessaire
		OwnerConfigDataService.get()
			.then((r) => {
				const type = (r.data.owner_profile_type || "INDIVIDUAL") as
					| "SCI"
					| "PROFESSIONAL"
					| "INDIVIDUAL";
				dispatch(setOwnerProfileType(type));
			})
			.catch(() => {
				dispatch(setOwnerProfileType("INDIVIDUAL"));
			})
			.finally(() => setLoading(false));
	}, [dispatch]);

	// Métodes d'aide pour les labels et rôles
	const getPageTitle = () => {
		if (ownerType === "SCI") return "Co-bailleurs";
		if (ownerType === "PROFESSIONAL") return "Co-propriétaires";
		return "Collaborateurs";
	};

	const getStatLabels = () => {
		if (ownerType === "SCI")
			return { item: "Co-bailleurs", referent: "Gérant" };
		if (ownerType === "PROFESSIONAL")
			return { item: "Co-propriétaires", referent: "Responsable" };
		return { item: "Collaborateurs", referent: "Référent" };
	};

	const getRoleOptions = () => {
		if (ownerType === "SCI") {
			return [
				{ value: "Co-bailleur", label: "Co-bailleur" },
				{ value: "Bailleur principal", label: "Bailleur principal" },
				{ value: "Gérant", label: "Gérant" },
				{ value: "Gérant associé", label: "Gérant associé" },
			];
		}
		if (ownerType === "PROFESSIONAL") {
			return [
				{ value: "Co-propriétaire", label: "Co-propriétaire" },
				{ value: "Responsable", label: "Responsable" },
				{ value: "Collaborateur", label: "Collaborateur" },
			];
		}
		return [{ value: "Collaborateur", label: "Collaborateur" }];
	};

	const getDefaultRole = () => {
		if (ownerType === "SCI") return "Co-bailleur";
		if (ownerType === "PROFESSIONAL") return "Co-propriétaire";
		return "Collaborateur";
	};

	// Construire emptyForm dynamiquement selon le type de bailleur
	const formConfig = {
		...emptyForm,
		role: getDefaultRole(),
	};

	const {
		items: associates,
		modalVisible,
		setModalVisible,
		deleteModal,
		setDeleteModal,
		editing,
		toDelete,
		form,
		formErrors,
		handleChange,
		openCreate,
		openEdit,
		openDelete,
		handleSubmit,
		handleDelete,
	} = useEntityCrud({
		service: AssociateDataService,
		emptyForm: formConfig,
		validationSchema: associateFormSchema,
		toForm: (a) => ({
			civility: a.civility || "MR",
			firstname: a.firstname || "",
			lastname: a.lastname || "",
			email: a.email || "",
			phone: a.phone || "",
			address: a.address || "",
			shares: a.shares || "",
			role: a.role || getDefaultRole(),
		}),
	});

	const totalShares = associates.reduce(
		(s, a) => s + Number.parseFloat(a.shares || 0),
		0,
	);
	const gerant = associates.find(
		(a) =>
			a.role === "Gérant" ||
			a.role === "Gérant associé" ||
			a.role === "Responsable",
	);

	if (loading) return <div className="sk-spinner sk-spinner-pulse" />;

	const labels = getStatLabels();
	const pageTitle = getPageTitle();

	// Pour les bailleurs individuels, afficher une info
	if (ownerType === "INDIVIDUAL") {
		return (
			<div>
				<Card>
					<CardHeader className="border-b py-3 px-4">
						<strong>{pageTitle}</strong>
					</CardHeader>
					<CardContent>
						<AppAlert color="info" className="mb-3">
							<strong>Bailleur particulier</strong>
							<br />
							Pour un bailleur particulier, vous pouvez ajouter des
							collaborateurs associés à votre gestion locative. Cette
							fonctionnalité est essentiellement destinée aux co-propriétaires
							et aux structures professionnelles.
						</AppAlert>
						<EntityTableCard
							title={`Liste des ${pageTitle.toLowerCase()}`}
							onAdd={openCreate}
						>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Nom</TableHead>
										<TableHead>Rôle</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Parts</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{associates.length === 0 ? (
										<TableEmptyRow
											colSpan={5}
											message={`Aucun ${pageTitle.toLowerCase()}`}
										/>
									) : (
										associates.map((a) => (
											<TableRow key={a.id}>
												<TableCell>
													{a.civility || ""} {a.firstname} {a.lastname}
												</TableCell>
												<TableCell>
													<Badge variant="secondary">{a.role}</Badge>
												</TableCell>
												<TableCell>{a.email || "-"}</TableCell>
												<TableCell>
													<strong>
														{Number.parseFloat(a.shares || 0).toFixed(2)} %
													</strong>
												</TableCell>
												<TableCell className="text-right">
													<ActionButtons
														onEdit={() => openEdit(a)}
														onDelete={() => openDelete(a)}
													/>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</EntityTableCard>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<>
			<div className="mb-4">
				<Card className="app-page-hero border-0">
					<CardContent className="p-0">
						<div className="app-page-kicker mb-3">Gouvernance</div>
						<h2 className="mb-2 app-display-title">{getPageTitle()}</h2>
						<p className="app-page-description mb-3">
							Gérez les associés de votre SCI : parts sociales, gérant et
							coordonnées.
						</p>
						<div className="flex flex-wrap items-center gap-2">
							<span className="app-filter-chip">
								{associates.length} associé{associates.length > 1 ? "s" : ""}
							</span>
							<span className="app-filter-chip">
								{totalShares.toFixed(0)} % répartis
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="flex gap-4 mb-4 text-center w-full justify-content-center flex-direction-column">
				<StatCard
					value={associates.length}
					label={labels.item}
					color="primary"
				/>
				<StatCard
					value={`${totalShares.toFixed(2)} %`}
					label={`Parts${totalShares !== 100 ? " ⚠ ≠ 100%" : ""}`}
					color={totalShares === 100 ? "success" : "warning"}
				/>
				<StatCard
					value={gerant ? `${gerant.civility || ""} ${gerant.lastname}` : "—"}
					label={labels.referent}
					color="info"
				/>
			</div>

			<div className="flex flex-col md:flex-row gap-4">
				<div className="md:w-5/12">
					<Card className="mb-4">
						<CardHeader className="border-b py-3 px-4">
							<strong>Répartition des quotes-parts</strong>
						</CardHeader>
						<CardContent className="pt-4">
							{associates.length === 0 ? (
								<p className="text-muted-foreground">
									Aucun {pageTitle.toLowerCase()}
								</p>
							) : (
								associates.map((a) => (
									<div key={a.id} className="mb-3">
										<div className="flex justify-between mb-1">
											<span>
												<User className="inline h-4 w-4 mr-1" />
												{a.civility || ""} {a.firstname} {a.lastname}
												{(a.role === "Gérant" ||
													a.role === "Gérant associé" ||
													a.role === "Responsable") && (
													<Badge className="ml-2">
														{ownerType === "SCI" ? "Gérant" : "Responsable"}
													</Badge>
												)}
											</span>
											<strong>
												{Number.parseFloat(a.shares || 0).toFixed(2)} %
											</strong>
										</div>
										<div className="h-2 rounded bg-slate-200 overflow-hidden">
											<div
												className="h-full bg-primary rounded"
												style={{
													width: `${Number.parseFloat(a.shares || 0)}%`,
												}}
											/>
										</div>
									</div>
								))
							)}
						</CardContent>
					</Card>
				</div>

				<div className="md:w-7/12">
					<EntityTableCard
						title={`Liste des ${pageTitle.toLowerCase()}`}
						onAdd={openCreate}
					>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Nom</TableHead>
									<TableHead>Rôle</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Parts</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{associates.length === 0 ? (
									<TableEmptyRow
										colSpan={5}
										message={`Aucun ${pageTitle.toLowerCase()}`}
									/>
								) : (
									associates.map((a) => (
										<TableRow key={a.id}>
											<TableCell>
												{a.civility || ""} {a.firstname} {a.lastname}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														a.role === "Gérant" ||
														a.role === "Gérant associé" ||
														a.role === "Responsable"
															? "default"
															: "secondary"
													}
												>
													{a.role}
												</Badge>
											</TableCell>
											<TableCell>{a.email || "-"}</TableCell>
											<TableCell>
												<strong>
													{Number.parseFloat(a.shares || 0).toFixed(2)} %
												</strong>
											</TableCell>
											<TableCell className="text-right">
												<ActionButtons
													onEdit={() => openEdit(a)}
													onDelete={() => openDelete(a)}
												/>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</EntityTableCard>
				</div>
			</div>

			<CrudModal
				visible={modalVisible}
				editing={editing}
				addTitle={`Nouveau ${labels.item.toLowerCase().slice(0, -1)}`}
				editTitle={`Modifier le ${labels.item.toLowerCase().slice(0, -1)}`}
				onClose={() => setModalVisible(false)}
				onSubmit={handleSubmit}
			>
				<div className="grid grid-cols-12 gap-3">
					<div className="col-span-4">
						<FormSelectField
							label="Civilité"
							name="civility"
							value={form.civility}
							onChange={handleChange}
						>
							<option value="MR">M.</option>
							<option value="MME">Mme</option>
						</FormSelectField>
					</div>
					<div className="col-span-4">
						<FormInputField
							type="text"
							name="firstname"
							label="Prénom"
							value={form.firstname}
							onChange={handleChange}
						/>
					</div>
					<div className="col-span-4">
						<FormInputField
							type="text"
							name="lastname"
							label="Nom"
							value={form.lastname}
							onChange={handleChange}
							required
							error={formErrors.lastname}
						/>
					</div>
					<div className="col-span-6">
						<FormInputField
							type="email"
							name="email"
							label="Email"
							value={form.email}
							onChange={handleChange}
							error={formErrors.email}
						/>
					</div>
					<div className="col-span-6">
						<FormInputField
							type="text"
							name="phone"
							label="Téléphone"
							value={form.phone}
							onChange={handleChange}
						/>
					</div>
					<div className="col-span-8">
						<FormTextareaField
							label="Adresse"
							name="address"
							rows={2}
							value={form.address}
							onChange={handleChange}
						/>
					</div>
					<div className="col-span-4">
						<FormInputField
							type="number"
							name="shares"
							label="Quote-part (%)"
							min="0"
							max="100"
							step="0.01"
							value={form.shares}
							onChange={handleChange}
							required
							error={formErrors.shares}
						/>
					</div>
					<div className="col-span-12">
						<FormSelectField
							label="Rôle"
							name="role"
							value={form.role}
							onChange={handleChange}
						>
							{getRoleOptions().map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</FormSelectField>
					</div>
				</div>
			</CrudModal>

			<DeleteModal
				visible={deleteModal}
				itemLabel={
					toDelete
						? `${toDelete.civility || ""} ${toDelete.firstname} ${toDelete.lastname}`.trim()
						: undefined
				}
				onClose={() => setDeleteModal(false)}
				onConfirm={handleDelete}
			/>
		</>
	);
};

export default Associates;
