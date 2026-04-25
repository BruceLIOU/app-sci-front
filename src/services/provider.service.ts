import http from "../utils/http-common";

class ProviderDataService {
	getAll() {
		return http.get("/providers");
	}
	get(id: number) {
		return http.get(`/providers/${id}`);
	}
	create(data: FormData) {
		return http.post("/providers", data);
	}
	update(id: number, data: FormData) {
		return http.put(`/providers/${id}`, data);
	}
	delete(id: number) {
		return http.delete(`/providers/${id}`);
	}
}

export default new ProviderDataService();
