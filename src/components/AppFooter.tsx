import React from "react";

const AppFooter = () => (
	<footer className="app-footer px-4 py-2 text-xs text-muted-foreground border-t flex items-center gap-1">
		<a
			href="https://bruceliou.fr"
			target="_blank"
			rel="noopener noreferrer"
			className="hover:underline"
		>
			Bruce LIOU
		</a>
		<span>&copy; 2024-{new Date().getFullYear()}.</span>
	</footer>
);

export default React.memo(AppFooter);
