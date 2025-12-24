import { cn } from "@/lib/utils";
import LayoutController from "./LayoutController";
import LoginDialog from "@/components/auth/components/dialog/login/LoginDialog";
import { TokenMonitor, UserProfileMonitor } from "@/components/auth";
import { Toaster } from '@/components/ui/sonner';


function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className={cn(
                'main-layout',
                'h-svh min-h-svh max-h-svh',
                'flex flex-col',
                'relative',
                'scroll-smooth',
                'overflow-hidden'
            )}
            id='main-layout'
            role='main'
            aria-label='main layout'
        >
            <div className="w-full h-full overflow-hidden relative">
                <LayoutController>
                    {children}
                </LayoutController>
            </div>

            <LoginDialog />
            <TokenMonitor />
            <UserProfileMonitor />

            <Toaster />
        </div>
    );
}

export default MainLayout;