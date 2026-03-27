/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Wrapper layout for all app pages. Contains Sidebar (left)
 *                 and AppNavbar (top). Main content renders via <Outlet />.
 * DEPENDS ON: Sidebar, AppNavbar, react-router-dom Outlet, uiStore
 */
import { Outlet } from 'react-router-dom'
import AppNavbar from './AppNavbar'
import PageTransition from './PageTransition'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="neo-shell min-h-screen md:flex">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AppNavbar />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  )
}