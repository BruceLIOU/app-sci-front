import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Download, FileText } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import TenantPortalService, {
	type TenantDocument,
} from "../../services/tenant_portal.service";

const CATEGORY_LABEL: Record<string, string> = {
	identite: "Identité",
	bail: "Bail",
	"etat-des-lieux": "État des lieux",
	quittance: "Quittance",
	assurance: "Assurance",
	autre: "Autre",
};

function formatSize(bytes: number | null): string {
	if (!bytes) return "";
	if (bytes < 1024) return `${bytes} o`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
	return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

const TenantDocuments: React.FC = () => {
	const [docs, setDocs] = useState<TenantDocument[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		TenantPortalService.getDocuments()
			.then((r) => setDocs(r.data))
			.catch((e) =>
				setError(e.response?.data?.message || "Erreur de chargement."),
			)
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">Mes documents</h1>

			{loading && (
				<div className="flex justify-center py-12">
					<Spinner size="lg" />
				</div>
			)}
			{error && (
				<div className="text-destructive text-sm py-4 text-center">{error}</div>
			)}
			{!loading && !error && docs.length === 0 && (
				<p className="text-muted-foreground text-sm py-6 text-center">
					Aucun document disponible.
				</p>
			)}
			{!loading && !error && docs.length > 0 && (
				<Card>
					<CardHeader className="py-3 px-4 border-b">
						<strong className="text-sm">{docs.length} document(s)</strong>
					</CardHeader>
					<CardContent className="p-0">
						<ul className="divide-y">
							{docs.map((doc) => (
								<li key={doc.id} className="flex items-center gap-3 px-4 py-3">
									<FileText className="h-5 w-5 text-muted-foreground shrink-0" />
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">{doc.title}</p>
										<div className="flex items-center gap-2 mt-0.5">
											<Badge variant="outline" className="text-xs">
												{CATEGORY_LABEL[doc.category] ?? doc.category}
											</Badge>
											{doc.file_size && (
												<span className="text-xs text-muted-foreground">
													{formatSize(doc.file_size)}
												</span>
											)}
											<span className="text-xs text-muted-foreground">
												{new Date(doc.createdAt).toLocaleDateString("fr-FR")}
											</span>
										</div>
									</div>
									<Button
										variant="outline"
										size="sm"
										asChild
										className="shrink-0"
									>
										<a
											href={doc.file_url}
											target="_blank"
											rel="noreferrer"
											download
										>
											<Download className="h-4 w-4" />
										</a>
									</Button>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default TenantDocuments;
