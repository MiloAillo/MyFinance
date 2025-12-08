import type { JSX } from "react";
import { Outlet } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle";

export function MainPage(): JSX.Element {
    return (
        <div className="font-[Inter] min-h-screen min-w-screen flex justify-center bg-background-primary dark:bg-background-primary-dark">
            <Outlet />
        </div>
    )
}