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
	getIrl() {
		return http.get("/leases/irl");
	}
	simulateIrl(leaseId: number) {
		return http.get(`/leases/${leaseId}/irl-simulate`);
	}
	applyIrl(leaseId: number) {
		return http.post(`/leases/${leaseId}/irl-apply`, {});
	}
	renew(leaseId: number, newEndDate: string, sendEmail = true) {
		const fd = new FormData();
		fd.append("new_end_date", newEndDate);
		fd.append("send_email", sendEmail ? "1" : "0");
		return http.post(`/leases/${leaseId}/renew`, fd);
	}
	terminate(
		leaseId: number,
		terminationDate: string,
		reason?: string,
		sendEmail = true,
	) {
		const fd = new FormData();
		fd.append("termination_date", terminationDate);
		if (reason) fd.append("reason", reason);
		fd.append("send_email", sendEmail ? "1" : "0");
		return http.post(`/leases/${leaseId}/terminate`, fd);
	}
}

export default new LeaseDataService();
