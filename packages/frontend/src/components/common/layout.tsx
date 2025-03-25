import { Outlet } from 'react-router'
import '@mysten/dapp-kit/dist/index.css'
import { Header } from '@/components/common/header'

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen items-center">
      <Header />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
