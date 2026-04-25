import http from "../utils/http-common";

export interface TenantDashboard {
	tenant: {
		id: number;
		firstname: string;
		lastname: string;
		email: string | null;
		phone: string | null;
		Property: { id: number; address: string; city: string } | null;
	};
	activeLease: {
		id: number;
		start_date: string;
		end_date: string | null;
		rent_amount: number;
		charges_amount: number;
		status: string;
	} | null;
	pendingPayments: number;
}

export interface TenantPayment {
	id: number;
	amount: number;
	due_date: string;
	paid_date: string | null;
	status: string;
	month: string | null;
	Property: { id: number; address: string } | null;
}

export interface TenantDocument {
	id: number;
	title: string;
	category: string;
	file_url: string;
	file_name: string | null;
	file_size: number | null;
	mime_type: string | null;
	createdAt: string;
}

export interface TenantMaintenanceItem {
	id: number;
	title: string;
	description: string | null;
	type: string;
	priority: string;
	status: string;
	reported_at: string | null;
	createdAt: string;
	Property: { id: number; address: string } | null;
}

class TenantPortalService {
	getDashboard() {
		return http.get<TenantDashboard>("/tenant-portal/dashboard");
	}
	getPayments() {
		return http.get<TenantPayment[]>("/tenant-portal/payments");
	}
	getDocuments() {
		return http.get<TenantDocument[]>("/tenant-portal/documents");
	}
	getMaintenance() {
		return http.get<TenantMaintenanceItem[]>("/tenant-portal/maintenance");
	}
	createMaintenance(data: FormData) {
		return http.post<TenantMaintenanceItem>("/tenant-portal/maintenance", data);
	}
}

export default new TenantPortalService();
