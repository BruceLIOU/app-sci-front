import React, { Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { HashRouter, Route, Routes } from "react-router-dom";
import "./scss/style.scss";
import AuthGuard from "./components/AuthGuard";
import AuthService from "./services/auth.service";
import { type RootState, setLoading, setUser } from "./store";

const loading = (
	<div className="pt-3 text-center">
		<div className="sk-spinner sk-spinner-pulse" />
	</div>
);

const DefaultLayout = React.lazy(() => import("./layout/DefaultLayout"));
const Login = React.lazy(() => import("./views/pages/login/Login"));
const Activate = React.lazy(() => import("./views/pages/activate/Activate"));
const Page404 = React.lazy(() => import("./views/pages/page404/Page404"));
const Page500 = React.lazy(() => import("./views/pages/page500/Page500"));

const AppInner: React.FC = () => {
	const dispatch = useDispatch();
	const user = useSelector((state: RootState) => state.auth.user);

	useEffect(() => {
		dispatch(setLoading(true));
		AuthService.me()
			.then(({ data }) => {
				dispatch(setUser(data));
				// Appliquer le thème sauvegardé
				if (data.preferences?.darkMode) {
					document.documentElement.setAttribute("data-coreui-theme", "dark");
					document.documentElement.classList.add("dark");
				}
			})
			.catch(() => dispatch(setUser(null)));
	}, [dispatch]);

	return (
		<Suspense fallback={loading}>
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/activate" element={<Activate />} />
				<Route path="/404" element={<Page404 />} />
				<Route path="/500" element={<Page500 />} />
				<Route
					path="*"
					element={
						<AuthGuard>
							<DefaultLayout />
						</AuthGuard>
					}
				/>
			</Routes>
		</Suspense>
	);
};

const App: React.FC = () => (
	<HashRouter>
		<AppInner />
	</HashRouter>
);

export default App;
