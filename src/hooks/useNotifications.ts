import { useCallback, useEffect, useState } from "react";
import NotificationService, {
	type Notification,
} from "../services/notification.service";

// Dérive l'URL WebSocket
// - Si VITE_API_URL est vide (mode proxy Vite), utilise le host courant → Vite proxy vers localhost:3000/ws
// - Sinon, construit directement l'URL ws(s)://
const WS_URL = (() => {
	// biome-ignore lint/suspicious/noExplicitAny: import.meta.env non typé avec Vite
	const apiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
	if (!apiUrl) {
		const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
		return `${proto}//${window.location.host}/ws`;
	}
	return `${apiUrl.replace(/\/+$/, "").replace(/^http/, "ws")}/ws`;
})();

type Listener = (notif: Notification) => void;

// ─── WebSocket singleton ──────────────────────────────────────────────────────

let wsInstance: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const wsListeners = new Set<Listener>();

function connect(): void {
	if (wsInstance && wsInstance.readyState <= WebSocket.OPEN) return;

	wsInstance = new WebSocket(WS_URL);

	wsInstance.addEventListener("message", (event) => {
		try {
			const msg = JSON.parse(event.data);
			if (msg.type === "notification") {
				for (const fn of wsListeners) fn(msg.data as Notification);
			}
		} catch {
			/* noop */
		}
	});

	wsInstance.addEventListener("close", () => {
		wsInstance = null;
		// Reconnexion automatique après 5s
		if (reconnectTimer) clearTimeout(reconnectTimer);
		reconnectTimer = setTimeout(connect, 5_000);
	});

	wsInstance.addEventListener("error", () => {
		wsInstance?.close();
	});
}

function subscribeWs(fn: Listener): () => void {
	if (wsListeners.size === 0) connect();
	wsListeners.add(fn);
	return () => wsListeners.delete(fn);
}

// ─── État partagé module-level ────────────────────────────────────────────────
// Toutes les instances du hook partagent le même état pour rester synchronisées.

let sharedUnreadCount = 0;
let sharedRecentUnread: Notification[] = [];
let sharedPopoverLoaded = false;
let countInitialized = false;

const unreadCountSubs = new Set<(v: number) => void>();
const recentUnreadSubs = new Set<(v: Notification[]) => void>();
const popoverLoadedSubs = new Set<(v: boolean) => void>();

function setSharedUnreadCount(value: number | ((prev: number) => number)) {
	sharedUnreadCount =
		typeof value === "function" ? value(sharedUnreadCount) : value;
	for (const fn of unreadCountSubs) fn(sharedUnreadCount);
}

function setSharedRecentUnread(
	value: Notification[] | ((prev: Notification[]) => Notification[]),
) {
	sharedRecentUnread =
		typeof value === "function" ? value(sharedRecentUnread) : value;
	for (const fn of recentUnreadSubs) fn(sharedRecentUnread);
}

function setSharedPopoverLoaded(value: boolean) {
	sharedPopoverLoaded = value;
	for (const fn of popoverLoadedSubs) fn(sharedPopoverLoaded);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useNotifications() {
	const [unreadCount, setUnreadCount] = useState(sharedUnreadCount);
	const [recentUnread, setRecentUnread] =
		useState<Notification[]>(sharedRecentUnread);
	const [popoverLoaded, setPopoverLoaded] = useState(sharedPopoverLoaded);

	// S'abonne aux changements d'état partagé
	useEffect(() => {
		unreadCountSubs.add(setUnreadCount);
		recentUnreadSubs.add(setRecentUnread);
		popoverLoadedSubs.add(setPopoverLoaded);
		return () => {
			unreadCountSubs.delete(setUnreadCount);
			recentUnreadSubs.delete(setRecentUnread);
			popoverLoadedSubs.delete(setPopoverLoaded);
		};
	}, []);

	// Charge le compteur initial une seule fois
	useEffect(() => {
		if (!countInitialized) {
			countInitialized = true;
			NotificationService.getUnreadCount()
				.then((r) => setSharedUnreadCount(r.data.count))
				.catch(() => {});
		}
	}, []);

	// S'abonne aux notifications temps réel
	useEffect(() => {
		const unsub = subscribeWs((notif) => {
			setSharedUnreadCount((c) => c + 1);
			// Ajoute en tête si le popover est ouvert
			setSharedRecentUnread((prev) =>
				prev.length > 0 ? [notif, ...prev] : prev,
			);
		});
		return unsub;
	}, []);

	// Chargement des non lues (appelé à l'ouverture du popover)
	const loadUnread = useCallback(() => {
		setSharedPopoverLoaded(false);
		NotificationService.getAll(true)
			.then((r) => {
				setSharedRecentUnread(r.data);
				setSharedPopoverLoaded(true);
			})
			.catch(() => setSharedPopoverLoaded(true));
	}, []);

	const markRead = useCallback(async (id: number) => {
		await NotificationService.markRead(id).catch(() => {});
		setSharedRecentUnread((prev) => prev.filter((n) => n.id !== id));
		setSharedUnreadCount((c) => Math.max(0, c - 1));
	}, []);

	const markAllRead = useCallback(async () => {
		await NotificationService.markAllRead().catch(() => {});
		setSharedRecentUnread([]);
		setSharedUnreadCount(0);
	}, []);

	return {
		unreadCount,
		recentUnread,
		popoverLoaded,
		loadUnread,
		markRead,
		markAllRead,
	};
}
