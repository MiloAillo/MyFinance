import type { JSX } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";

export function MainPage(): JSX.Element {
    return (
        <div className="font-[Inter] min-h-screen min-w-screen flex justify-center bg-background-primary dark:bg-background-primary-dark">
            <Outlet />
            <Toaster
                
                theme="system"
                position="bottom-right"
                expand
                visibleToasts={15}
                className="fixed! left-10! bottom-8! w-fit! select-none!"
                toastOptions={{
                    classNames: {
                        toast: "!pointer-events-auto",
                    }
                }}
            />
        </div>
    )
}