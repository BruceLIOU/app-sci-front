import React from "react";
import { Link, useLocation } from "react-router-dom";
import routes from "../routes";

const AppBreadcrumb = () => {
	const currentLocation = useLocation().pathname;

	// biome-ignore lint/suspicious/noExplicitAny: type des routes non exporté
	const getRouteName = (pathname: string, routeList: any[]) => {
		const currentRoute = routeList.find((route) => route.path === pathname);
		return currentRoute ? currentRoute.name : false;
	};

	const getBreadcrumbs = (location: string) => {
		const breadcrumbs: { pathname: string; name: string; active: boolean }[] =
			[];
		location.split("/").reduce((prev, curr, index, array) => {
			const currentPathname = `${prev}/${curr}`;
			const routeName = getRouteName(currentPathname, routes);
			if (routeName) {
				breadcrumbs.push({
					pathname: currentPathname,
					name: routeName,
					active: index + 1 === array.length,
				});
			}
			return currentPathname;
		});
		return breadcrumbs;
	};

	const breadcrumbs = getBreadcrumbs(currentLocation);

	return (
		<nav aria-label="breadcrumb" className="m-0 ms-2">
			<ol className="flex list-none items-center gap-1 text-sm text-muted-foreground p-0 m-0">
				<li>
					<Link to="/" className="hover:text-foreground transition-colors">
						Accueil
					</Link>
				</li>
				{breadcrumbs.map((breadcrumb) => (
					<React.Fragment key={breadcrumb.pathname}>
						<li className="select-none">/</li>
						<li>
							<span
								className={
									breadcrumb.active ? "text-foreground font-medium" : ""
								}
							>
								{breadcrumb.name}
							</span>
						</li>
					</React.Fragment>
				))}
			</ol>
		</nav>
	);
};

export default React.memo(AppBreadcrumb);
