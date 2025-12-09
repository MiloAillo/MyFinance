import { AnimatePresence, spring } from "motion/react";
import { useEffect, useState, type JSX } from "react";
import { motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { XIcon } from "lucide-react";
import { useRouteLoaderData } from "react-router-dom";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { ModeToggle } from "./mode-toggle";

interface trackerNavbarInterface {
    isOut: boolean,
    setIsOut: (value: boolean) => void,
    backLink: string,
    trackerName: string,
    getTheme?: () => void
}

export function TrackerNavbar({ isOut, setIsOut, backLink, trackerName, getTheme }: trackerNavbarInterface): JSX.Element {
    const [ session, setSession ] = useState<"local" | "cloud" | null>(null)
    const [ userData, setUserData ] = useState<any>()
    const user = useRouteLoaderData("main")
    const WindowSession = localStorage.getItem("session")

    useEffect(() => {

        if(WindowSession === null) window.location.href = "/access"
        
        // for locl
        if(WindowSession === "local") {
            console.log("navbar", user)
            setUserData(user)
        }

        //for cloud
        if(WindowSession === "cloud") {
            console.log("navbar", user)
            setUserData(user)
            console.log(user)
        }

        setSession(WindowSession as "cloud" | "local")
    }, [])
    
    const [ isAccountOpen, setIsAccountOpen ] = useState<boolean>(false)

    return (
            <div className="flex justify-center z-10 fixed md:max-w-[650px]">
                <AnimatePresence>
                    {!isOut && <motion.div
                    key={"navbar"}
                    className="w-screen"
                    initial={{
                        x: 30,
                        opacity: 0,
                        // filter: "blur(5px)"
                    }}
                    animate={{
                        x: 0,
                        opacity: 100,
                        // filter: "blur(0px)",
                        transition: {
                            delay: 0.3
                        }
                    }}
                    exit={{
                        x: -30,
                        opacity: 0
                    }}
                    >
                        <div className="fixed z-0 bg-background-primary w-full h-15 dark:bg-background-primary-dark" />
                        <div className="flex justify-center items-center fixed w-screen z-10 mt-5 px-5 md:max-w-[650px]">
                            <div className="flex justify-between items-center z-10 w-full">
                                <FontAwesomeIcon icon={faArrowLeft} onClick={() => {setIsOut(true); setTimeout(() => window.location.href = backLink, 400)}} className="w-10 h-10 text-xl text-neutral-800 dark:text-neutral-400" />
                                <h1 className="ml-[7px] font-medium text-base text-neutral-500">{trackerName}</h1>
                                <motion.div>
                                    <AnimatePresence mode="popLayout">
                                        {!isAccountOpen &&
                                            <motion.div
                                                key="accountDetailsClosed"
                                                onClick={() => setIsAccountOpen(true)}
                                                style={{backgroundImage: `url(${session === "local" ? "" : ""})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "contain"}}
                                                className={`w-8 h-8 rounded-full ${session === "local" ? "flex justify-center items-center border" : "flex justify-center items-center border"}`}
                                                initial={{
                                                    opacity: 0
                                                }}
                                                animate={{
                                                    opacity: 100
                                                }}
                                            >
                                                {!userData?.avatar && <FontAwesomeIcon icon={faUser} className="text-sm text-neutral-700 dark:text-neutral-400" />}
                                            </motion.div>}
                                        {isAccountOpen &&
                                            <motion.div
                                                key="accountDetailsOpen"
                                                onClick={() => setIsAccountOpen(false)}
                                                className="w-8 h-8 rounded-full border-[0.5px] shadow flex justify-center items-center text-neutral-500 dark:text-neutral-400"
                                                initial={{
                                                    opacity: 0
                                                }}
                                                animate={{
                                                    opacity: 100
                                                }}
                                            >
                                                <XIcon size={20} className="dark:text-neutral-400" />
                                        </motion.div>}
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>}
                </AnimatePresence>
                <div>
                    <motion.div>
                        <AnimatePresence>
                            {isAccountOpen && !isOut && <motion.div 
                                key="accountDetails"
                                className="fixed right-0 sm:right-[4%] top-0 mt-18 mr-6 flex flex-col gap-3.5 bg-neutral-50/80 dark:bg-neutral-800/60 border-[0.5px] shadow p-3.5 rounded-xl backdrop-blur-[2px] dark:backdrop-blur-[6px] backdrop-grayscale-50 z-20 md:right-auto md:-translate-x-60 md:w-54"
                                initial = {{
                                    x: 10,
                                    opacity: 0
                                }}
                                animate = {{
                                    x: 0,
                                    opacity: 100,
                                    transition: {
                                        type: spring,
                                        stiffness: 380,
                                        damping: 30,
                                        mass: 1
                                    }
                                }}
                                exit={{
                                    x: 10,
                                    opacity: 0,
                                    transition: {
                                        type: spring,
                                        stiffness: 400,
                                        damping: 30,
                                        mass: 1
                                    }
                                }}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div style={{backgroundImage: `url(${session === "local" ? "" : ""})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "contain"}} className={`w-10 h-10 rounded-full ${session === "local" ? "flex justify-center items-center border" : "flex justify-center items-center border"}`}>
                                             {!userData?.avatar && <FontAwesomeIcon icon={faUser} className="text-base text-neutral-700 dark:text-neutral-400" />}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[15px]">{session === "local" ? userData?.name : userData?.name}</h3>
                                            <p className="font-medium text-xs">{session === "local" ? null : userData?.email}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <ModeToggle getTheme={getTheme} />
                                    </div>
                                </div>
                            </motion.div>}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
    )
}