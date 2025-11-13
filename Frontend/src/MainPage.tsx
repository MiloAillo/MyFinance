import type { JSX } from "react";
import { Outlet } from "react-router-dom";

export function MainPage(): JSX.Element {
    return (
        <div className="font-[Inter]">
            <Outlet />
        </div>
    )
}