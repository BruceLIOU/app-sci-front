import { Temporal } from "@js-temporal/polyfill";

// biome-ignore lint/complexity/noStaticOnlyClass: utilitaire de date avec méthodes statiques
export class DateUtils {
	private static DEFAULT_TIMEZONE = "Europe/Paris";
	private static DEFAULT_LOCALE = "fr-FR";

	private static isPlainDateString(date: string): boolean {
		return /^\d{4}-\d{2}-\d{2}$/.test(date);
	}

	/**
	 * Convertit une entrée en Temporal.Instant
	 */
	private static toInstant(date: Date | string): Temporal.Instant {
		if (date instanceof Date) {
			if (Number.isNaN(date.getTime())) {
				throw new Error("Date invalide");
			}
			return Temporal.Instant.from(date.toISOString());
		}

		return Temporal.Instant.from(date);
	}

	/**
	 * Formate une date avec options Intl
	 */
	static format(
		date: Date | string,
		options?: Intl.DateTimeFormatOptions,
		timezone: string = DateUtils.DEFAULT_TIMEZONE,
		locale: string = DateUtils.DEFAULT_LOCALE,
	): string {
		try {
			// 👉 Cas 1 : date simple (YYYY-MM-DD)
			if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
				const d = Temporal.PlainDate.from(date);

				return new Intl.DateTimeFormat(locale, {
					year: "numeric",
					month: "long",
					day: "numeric",
					...options,
				}).format(new Date(d.year, d.month - 1, d.day));
			}

			// 👉 Cas 2 : date avec heure / Date object
			const instant = DateUtils.toInstant(date);
			const zoned = instant.toZonedDateTimeISO(timezone);

			return zoned.toLocaleString(locale, {
				year: "numeric",
				month: "long",
				day: "numeric",
				...options,
			});
		} catch {
			return "Date invalide";
		}
	}

	/**
	 * Format court: 11/04/2026
	 */
	static formatShort(date: Date | string): string {
		try {
			// Cas 1: date simple (YYYY-MM-DD)
			if (typeof date === "string" && DateUtils.isPlainDateString(date)) {
				const d = Temporal.PlainDate.from(date);

				return `${d.day.toString().padStart(2, "0")}/${d.month
					.toString()
					.padStart(2, "0")}/${d.year}`;
			}

			// Cas 2: date avec heure
			const z = DateUtils.toInstant(date).toZonedDateTimeISO(
				DateUtils.DEFAULT_TIMEZONE,
			);

			return `${z.day.toString().padStart(2, "0")}/${z.month
				.toString()
				.padStart(2, "0")}/${z.year}`;
		} catch {
			return "Date invalide";
		}
	}

	/**
	 * Format avec heure: 11 avril 2026 à 11:41
	 */
	static formatWithTime(date: Date | string): string {
		return DateUtils.format(date, {
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	/**
	 * Format date en forme mm-AAAA (ex: 04/2026)
	 * date recoit 2025-01
	 */
	static formatMonthYear(date: Date | string): string {
		try {
			// Cas 1: date simple (YYYY-MM)
			if (typeof date === "string" && /^\d{4}-\d{2}$/.test(date)) {
				const [year, month] = date.split("-").map(Number);
				return `${month.toString().padStart(2, "0")}/${year}`;
			}

			// Cas 2: date avec heure
			const z = DateUtils.toInstant(date).toZonedDateTimeISO(
				DateUtils.DEFAULT_TIMEZONE,
			);
			return `${z.month.toString().padStart(2, "0")}/${z.year}`;
		} catch {
			return "Date invalide";
		}
	}

	/**
	 * Format ISO local (utile pour input HTML)
	 * ex: 2026-04-11
	 */
	static formatISODate(date: Date | string): string {
		try {
			const z = DateUtils.toInstant(date).toZonedDateTimeISO(
				DateUtils.DEFAULT_TIMEZONE,
			);

			return `${z.year}-${z.month.toString().padStart(2, "0")}-${z.day
				.toString()
				.padStart(2, "0")}`;
		} catch {
			return "Date invalide";
		}
	}

	/**
	 * Vérifie si une date est valide
	 */
	static isValid(date: Date | string): boolean {
		try {
			DateUtils.toInstant(date);
			return true;
		} catch {
			return false;
		}
	}
}
