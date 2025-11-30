import type { JSX } from "react";
import { Outlet } from "react-router-dom";

export function MainPage(): JSX.Element {
    return (
        <div className="font-[Inter] min-h-screen min-w-screen">
            <Outlet />
        </div>
    )
}