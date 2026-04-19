import http from "../utils/http-common";

class MaintenanceDataService {
	getAll() {
		return http.get("/maintenance");
	}
	get(id: number) {
		return http.get(`/maintenance/${id}`);
	}
	create(data: FormData) {
		return http.post("/maintenance", data);
	}
	update(id: number, data: FormData) {
		return http.put(`/maintenance/${id}`, data);
	}
	delete(id: number) {
		return http.delete(`/maintenance/${id}`);
	}
}

export default new MaintenanceDataService();
