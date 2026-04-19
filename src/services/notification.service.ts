import http from "../utils/http-common";

export interface Notification {
	id: number;
	type: "matera_charge" | "email_sent";
	title: string;
	message: string | null;
	is_read: boolean;
	// biome-ignore lint/suspicious/noExplicitAny: métadonnées de notification non typées
	metadata: Record<string, any> | null;
	createdAt: string;
}

class NotificationDataService {
	getAll(unreadOnly = false) {
		return http.get<Notification[]>(
			`/notifications${unreadOnly ? "?unread=true" : ""}`,
		);
	}

	getUnreadCount() {
		return http.get<{ count: number }>("/notifications/unread-count");
	}

	markRead(id: number) {
		return http.put<Notification>(`/notifications/${id}/read`);
	}

	markAllRead() {
		return http.put("/notifications/mark-all-read");
	}

	delete(id: number) {
		return http.delete(`/notifications/${id}`);
	}

	bulkDelete(ids: number[]) {
		const fd = new FormData();
		fd.append("ids", JSON.stringify(ids));
		return http.post("/notifications/bulk-delete", fd);
	}
}

export default new NotificationDataService();
