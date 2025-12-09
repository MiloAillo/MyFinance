import type { JSX } from "react";
import { Outlet } from "react-router-dom";

export function MainPage(): JSX.Element {
    return (
        <div className="font-[Inter] min-h-screen min-w-screen flex justify-center bg-background-primary dark:bg-background-primary-dark">
            <Outlet />
        </div>
    )
}