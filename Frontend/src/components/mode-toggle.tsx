import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

interface modeToggleInterface {
  getTheme?: () => void
}

export function ModeToggle({ getTheme }: modeToggleInterface) {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-lg border-none shadow-none bg-transparent ring ring-black/10">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => {setTheme("light"); getTheme && getTheme()}}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {setTheme("dark"); getTheme && getTheme()}}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {setTheme("system"); getTheme && getTheme()}}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}