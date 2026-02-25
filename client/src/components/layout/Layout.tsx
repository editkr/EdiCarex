import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuthStore } from '@/stores/authStore'
import StaffAIChatBubble from './StaffAIChatBubble'

export default function Layout() {
    const user = useAuthStore((state) => state.user)

    return (
        <div className="flex h-screen w-full relative overflow-hidden bg-background">
            {/* Global Background Image */}
            <div
                className="fixed inset-0 z-0 pointer-events-none opacity-[0.4] dark:opacity-[0.15]"
                style={{
                    backgroundImage: `url('/assets/bg.png')`,
                    backgroundSize: 'cover', // Ensures image covers the screen without repeating
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat', // Single image instance
                    filter: 'blur(1px)'
                }}
            />

            {/* Content Wrapper - Relative to sit above background */}
            <div className="relative z-10 flex h-full w-full">
                <Sidebar userRole={user?.role || 'ADMIN'} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
                        <Outlet />
                    </main>
                </div>
            </div>

            {/* Global AI Assistant Bubble for Staff */}
            <StaffAIChatBubble />
        </div>
    )
}
