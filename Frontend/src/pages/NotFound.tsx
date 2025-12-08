import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { XIcon } from "lucide-react";
import type { JSX } from "react";
import { Link } from "react-router-dom";
import { motion, spring } from "motion/react"

export function NotFound(): JSX.Element {
  return (
    <Empty className="font-[inter] flex justify-center items-center w-screen h-screen bg-background-primary dark:bg-background-primary-dark">
        <EmptyHeader>
            <motion.div
                initial = {{
                    y: 50,
                    opacity: 0,
                    filter: "blur(5px)"
                }}
                animate = {{
                    transition: {
                        delay: 0.8,
                        type: spring,
                        stiffness: 120,
                        damping: 15,
                        mass: 2
                    },
                    y: 0,
                    opacity: 100,
                    filter: "blur(0px)"
                }}
            >
                <EmptyMedia variant="default">
                    <XIcon size={100} />
                </EmptyMedia>
            </motion.div>
            <motion.div
                initial = {{
                    y: 50,
                    opacity: 0,
                    filter: "blur(5px)"
                }}
                animate = {{
                    transition: {
                        type: spring,
                        stiffness: 120,
                        damping: 13,
                        mass: 2,
                        delay: 0.5
                    },
                    y: 0,
                    opacity: 100,
                    filter: "blur(0px)"
                }}
            >
            <EmptyTitle className="font-semibold text-[24px]">
                Pages Not Found!
            </EmptyTitle>
            </motion.div>
        </EmptyHeader>
        <motion.div
            initial = {{
                y: 30,
                opacity: 0,
                filter: "blur(5px)"
            }}
            animate = {{
                transition: {
                        type: spring,
                        stiffness: 120,
                        damping: 10,
                        mass: 2,
                    delay: 0.3
                },
                y: 0,
                opacity: 100,
                filter: "blur(0px)"
            }}
        >
            <EmptyDescription className="font-medium text-[16px]">
                Looks like the page you're looking for is nonexistent, <br/>
                consider returning to the <Link to={"/app"}>dashboard.</Link> 
            </EmptyDescription>
        </motion.div>
    </Empty>
  )
}
