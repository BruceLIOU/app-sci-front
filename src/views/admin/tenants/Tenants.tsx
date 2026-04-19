import { Button } from "@/components/ui/button";
import {
	BookUser,
	Pencil,
	Plus,
	ToggleLeft,
	ToggleRight,
	Trash2,
	User,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DateUtils } from "src/utils/date";
import ViewControlBar from "../../../components/ViewControlBar";
import type { ViewMode } from "../../../components/ViewControlBar";
import useIsAdmin from "../../../hooks/useIsAdmin";
import TenantDataService from "../../../services/tenant.service";
import Modal from "../modals/Modals";

const Tenants = () => {
	const navigate = useNavigate();
	const [data, setData] = useState<any[]>([]);
	const [tenantId, setTenantId] = useState<number | null>(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [modalType, setModalType] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<ViewMode>("vignette");
	const [filterCivility, setFilterCivility] = useState("");
	const [filterCity, setFilterCity] = useState("");
	const [filterActive, setFilterActive] = useState<
		"all" | "active" | "inactive"
	>("all");

	const civilityOptions = [
		...new Set(data.map((d) => d.civility).filter(Boolean)),
	];
	const cityOptions = [
		...new Set(data.map((d) => d.Property?.city).filter(Boolean)),
	];

	const hasFilter =
		filterCivility !== "" || filterCity !== "" || filterActive !== "all";

	const filteredData = data.filter((item) => {
		if (filterCivility && item.civility !== filterCivility) return false;
		if (filterCity && item.Property?.city !== filterCity) return false;
		if (filterActive === "active" && !item.is_active) return false;
		if (filterActive === "inactive" && item.is_active) return false;
		return true;
	});

	const resetFilters = () => {
		setFilterCivility("");
		setFilterCity("");
		setFilterActive("all");
	};
	const isAdmin = useIsAdmin();

	const handleViewTenant = (id: number) => {
		setTenantId(id);
		setModalType("view");
		setModalVisible(true);
	};
	const handleEditTenant = (id: number) => {
		navigate(`/admin/tenants/${id}/edit`);
	};
	const handleDeleteTenant = (id: number) => {
		setTenantId(id);
		setModalType("delete");
		setModalVisible(true);
	};
	const handleCreateTenant = () => {
		navigate("/admin/tenants/new");
	};
	const handleToggleActive = async (id: number) => {
		try {
			await TenantDataService.toggleActive(id);
			const response = await TenantDataService.getAll();
			setData(response.data);
		} catch (error: any) {
			console.error(error.message);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: recharger après ouverture/fermeture de la modale
	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await TenantDataService.getAll();
				setData(response.data);
			} catch (error: any) {
				console.log(error.message);
			}
		};
		fetchData();
	}, [modalVisible]);

	return (
		<>
			<div className="max-w-screen-xl mx-auto px-4">
				<div className="flex justify-end mb-4">
					{isAdmin && (
						<Button onClick={handleCreateTenant}>
							<Plus className="text-danger mx-2 h-4 w-4" />
							Ajouter un locataire
						</Button>
					)}
				</div>

				<ViewControlBar
					viewMode={viewMode}
					onViewModeChange={setViewMode}
					supportedModes={["vignette", "list"]}
					filters={[
						{
							value: filterActive,
							onChange: (v: string) =>
								setFilterActive(v as "all" | "active" | "inactive"),
							options: [
								{ value: "active", label: "Actifs" },
								{ value: "inactive", label: "Inactifs" },
							],
							placeholder: "Tous",
							width: 120,
						},
						{
							value: filterCivility,
							onChange: setFilterCivility,
							options: civilityOptions.map((c) => ({ value: c, label: c })),
							placeholder: "Civilité",
							width: 130,
						},
						{
							value: filterCity,
							onChange: setFilterCity,
							options: cityOptions.map((c) => ({ value: c, label: c })),
							placeholder: "Toutes les villes",
							width: 160,
						},
					]}
					hasActiveFilter={hasFilter}
					onResetFilters={resetFilters}
					totalCount={data.length}
					filteredCount={filteredData.length}
					itemLabel="locataire"
				/>
			</div>

			<div className="w-full px-4">
				{/* Vue vignettes */}
				{viewMode === "vignette" && (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{filteredData.map((item) => (
							<div
								key={item.id}
								className="rounded-xl border bg-card shadow-sm"
							>
								<div className="flex justify-center pt-3">
									{item.avatar ? (
										<img
											src={item.avatar}
											alt="Avatar"
											className="rounded-full"
											style={{ width: 72, height: 72, objectFit: "cover" }}
										/>
									) : (
										<User size={48} />
									)}
								</div>
								<div className="p-4">
									<h3 className="font-semibold text-base text-center">
										{`${item.civility || ""} ${item.firstname} ${item.lastname}`}
										{!item.is_active && (
											<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 ml-2">
												Inactif
											</span>
										)}
									</h3>
									<p className="text-sm text-muted-foreground">
										{item.Property
											? `Locataire de : ${item.Property.type} à ${item.Property.city}`
											: "Aucun bien associé"}
										<br />
										{item.email && (
											<>
												<a
													href={`mailto:${item.email}`}
													className="text-decoration-none"
												>
													{item.email}
												</a>
												<br />
											</>
										)}
										{item.mobile && (
											<a
												href={`tel:${item.mobile}`}
												className="text-decoration-none"
											>
												{item.mobile}
											</a>
										)}
									</p>
									<div className="flex flex-wrap gap-2 justify-end mt-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleViewTenant(item.id)}
											title="Voir"
										>
											<BookUser className="h-4 w-4" />
										</Button>
										{isAdmin && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleToggleActive(item.id)}
												title={item.is_active ? "Désactiver" : "Activer"}
											>
												{item.is_active ? (
													<ToggleRight className="h-4 w-4 text-emerald-600" />
												) : (
													<ToggleLeft className="h-4 w-4 text-slate-400" />
												)}
											</Button>
										)}
										{isAdmin && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleEditTenant(item.id)}
												title="Modifier"
											>
												<Pencil className="h-4 w-4" />
											</Button>
										)}
										{isAdmin && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDeleteTenant(item.id)}
												title="Supprimer"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}
									</div>
								</div>
								<div className="px-4 py-3 border-t text-sm text-muted-foreground">
									<small>{DateUtils.formatWithTime(item.createdAt)}</small>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Vue liste */}
				{viewMode === "list" && (
					<div className="flex flex-col gap-2">
						{filteredData.map((item) => (
							<div
								key={item.id}
								className="rounded-xl border bg-card shadow-sm"
							>
								<div className="flex items-center">
									<div
										className="flex items-center justify-center"
										style={{ width: 64, flexShrink: 0 }}
									>
										{item.avatar ? (
											<img
												src={item.avatar}
												alt="Avatar"
												className="rounded-full"
												style={{ width: 40, height: 40, objectFit: "cover" }}
											/>
										) : (
											<User size={28} />
										)}
									</div>
									<div className="flex items-center flex-1 py-2 gap-4 px-4">
										<strong style={{ minWidth: 200 }}>
											{`${item.civility || ""} ${item.firstname} ${item.lastname}`}
											{!item.is_active && (
												<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 ml-2">
													Inactif
												</span>
											)}
										</strong>
										<span className="text-muted-foreground">
											{item.Property
												? `${item.Property.type} à ${item.Property.city}`
												: "Aucun bien"}
										</span>
										{item.email && (
											<a
												href={`mailto:${item.email}`}
												className="text-muted-foreground no-underline text-sm"
											>
												{item.email}
											</a>
										)}
										{item.mobile && (
											<a
												href={`tel:${item.mobile}`}
												className="text-muted-foreground no-underline text-sm"
											>
												{item.mobile}
											</a>
										)}
										<small className="text-muted-foreground ml-auto">
											{DateUtils.formatWithTime(item.createdAt)}
										</small>
									</div>
									<div className="flex gap-1 mr-3" style={{ flexShrink: 0 }}>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleViewTenant(item.id)}
											title="Voir"
										>
											<BookUser className="h-4 w-4" />
										</Button>
										{isAdmin && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleToggleActive(item.id)}
												title={item.is_active ? "Désactiver" : "Activer"}
											>
												{item.is_active ? (
													<ToggleRight className="h-4 w-4 text-emerald-600" />
												) : (
													<ToggleLeft className="h-4 w-4 text-slate-400" />
												)}
											</Button>
										)}
										{isAdmin && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleEditTenant(item.id)}
												title="Modifier"
											>
												<Pencil className="h-4 w-4" />
											</Button>
										)}
										{isAdmin && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDeleteTenant(item.id)}
												title="Supprimer"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{modalVisible && (
				<Modal
					type={modalType}
					entities="tenants"
					modalVisible={modalVisible}
					setModalVisible={setModalVisible}
					data={data.filter((item) => item.id === tenantId)}
				/>
			)}
		</>
	);
};

export default Tenants;
