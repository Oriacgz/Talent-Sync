/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: All React Router v6 routes. Public routes: / /login /register.
 *                 Protected routes: /student/* and /recruiter/*.
 *                 ProtectedRoute checks authStore — redirects if not logged in
 *                 or wrong role.
 * DEPENDS ON: react-router-dom, authStore, all page components
 */
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";

const router = createBrowserRouter([
  { path: "/", element: <div>Landing</div> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
]);
export default function AppRouter() {
  return <RouterProvider router={router} />;
}