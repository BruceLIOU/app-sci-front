import http from "../utils/http-common";

class LeaseDataService {
	getAll() {
		return http.get("/leases");
	}
	get(id: number) {
		return http.get(`/leases/${id}`);
	}
	create(data: FormData) {
		return http.post("/leases", data);
	}
	update(id: number, data: FormData) {
		return http.put(`/leases/${id}`, data);
	}
	delete(id: number) {
		return http.delete(`/leases/${id}`);
	}
}

export default new LeaseDataService();
