import http from "../utils/http-common";

class TenantDataService {
	getAll() {
		return http.get("/tenants");
	}
	get(id: number) {
		return http.get(`/tenants/${id}`);
	}
	create(data: FormData) {
		return http.post("/tenants", data);
	}
	update(id: number, data: FormData) {
		return http.put(`/tenants/${id}`, data);
	}
	delete(id: number) {
		return http.delete(`/tenants/${id}`);
	}
	toggleActive(id: number) {
		return http.patch(`/tenants/${id}/toggle-active`);
	}
}

export default new TenantDataService();
