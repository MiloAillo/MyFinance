import { Input } from "@/components/ui/input";
import { faArrowRightFromBracket, faCloud, faEllipsisV, faLock, faMagnifyingGlass, faMoneyBillWave, faQuestion, faUserPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PlusIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState, type JSX } from "react";
import { motion, AnimatePresence, spring } from "motion/react";
import { useRouteLoaderData } from "react-router-dom";
import { faTrashAlt, faUser } from "@fortawesome/free-regular-svg-icons";
import { ApiUrl, StorageUrl } from "@/lib/variable";
import axios, { isAxiosError } from "axios";
import { DBcreatetracker, DBgetalltrackers } from "@/lib/db";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ModeToggle } from "@/components/mode-toggle";

export function Dashboard(): JSX.Element {
    const mainLoaderData = useRouteLoaderData("main")
    
    const [ trackers, setTrackers ] = useState<{id: number, user_id: number, description: string, initial_balance: number, name: string, transactions: {amount: number, type: "income" | "expense"}[]}[] | []>([])
    const [ _user, setUser ] = useState<any[]>([])
    const [ isAccountOpen, setIsAccountOpen ] = useState<boolean>(false)
    const [ isCreateBoxOpen, setIsCreateBoxOpen ] = useState<boolean>(false)
    const [ isOut, setIsOut ] = useState<boolean>(false)
    const [ initialBalance, setInitialBalance ] = useState<string>("")
    const [ session, setSession ] = useState<"cloud" | "local" | null>(null)
    const [ searchValue, setSearchValue ] = useState<string>("")

    const createBoxTitle = useRef<HTMLInputElement | null>(null)
    const createBoxDescription = useRef<HTMLInputElement | null>(null)

    const cloudGetTrackers = async () => {
        const authToken = localStorage.getItem("Authorization")

        try {
            const res = await axios.get(`${ApiUrl}/api/trackers`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            })

            const data = await res.data
            console.log("cloud trackers initial fetch", data.data.trackers)
            setTrackers(data.data.trackers)
        } catch(err) {
            if(isAxiosError(err)) {
                console.log("dashboardLoader", err)
                // error catcher required
            }
        }
    }

    const localGetTrackers = async () => {
        try {
            const res = await DBgetalltrackers()
            console.log(res)
            setTrackers(res as [any])
        } catch(err) {
            console.log(err)
        }
    }
    
    useEffect(() => {
        setUser(mainLoaderData)

        const session = localStorage.getItem("session")
        if(session === null) window.location.href = "/access"
        if(session === "cloud") cloudGetTrackers()
        if(session === "local") localGetTrackers()
        setSession(session as "cloud" | "local")
    }, [])

    const reloadTracker = () => {
        if(session === "cloud") cloudGetTrackers()
        if(session === "local") localGetTrackers()
    }

    const modifyInitialBalance = (value: string) => {
        const cleaned = value.replace(/[^0-9.]/g, "")
        setInitialBalance(cleaned)
    }

    const decideCreateBox = async () => {
        // not created output
        if(createBoxTitle.current?.value === "" || createBoxDescription.current?.value === "" || initialBalance === "") {
            setIsCreateBoxOpen(false)
            console.log("not created!")
            return
        }

        if(createBoxTitle.current && createBoxDescription.current) {
            // clean the dot in balance
            const cleanedBalance = parseInt(initialBalance.replace(/[.]/g, ""), 10)
            const name = createBoxTitle.current.value
            const desc = createBoxDescription.current.value

            console.log(name, desc, cleanedBalance)
    
            if(session === "local") {
                try {
                    await DBcreatetracker(name, desc, cleanedBalance)
                    setIsCreateBoxOpen(false)
                    console.log("created!")
                    // get the tracker and render!
                } catch(err) {
                    setIsCreateBoxOpen(false)
                    console.log(err)
                }

                try {
                    const res = await DBgetalltrackers()
                    console.log(res)
                    setTrackers(res as [any])
                } catch(err) {
                    console.log(err)
                }
            }

            if(session === "cloud") {
                try {
                    setIsCreateBoxOpen(false)
                    const res = await axios.post(`${ApiUrl}/api/trackers`, {
                        name: name,
                        description: desc,
                        initial_balance: cleanedBalance
                    }, {
                        headers: {
                            Authorization: `Bearer ${window.localStorage.getItem("Authorization")}`
                        }
                    })

                    console.log(res)
                    reloadTracker()
                } catch(err) {
                    setIsCreateBoxOpen(false)
                    if(isAxiosError(err)) {
                        console.log(err)
                    }
                }
            }
        }
    }

    const signout = async () => {
        try {
            await axios.post(`${ApiUrl}/api/auth/logout`, {}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("Authorization")}`
                }
            })
            localStorage.removeItem("Authorization")
            setIsOut(true)
            setTimeout(() => {
                window.location.href = "/access"
            }, 500)
        } catch(err) {
            if(isAxiosError(err)) {
                console.log(err)
            }
        }
    }

    const signup = async () => {
        setIsOut(true)
        setTimeout(() => {
            window.location.href = "/access/signup"
        }, 500)
    }

    const deleteTracker = async (id: number) => {
        if(session === "cloud") {
            try {
                await axios.delete(`${ApiUrl}/api/trackers/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("Authorization")}`
                    }
                })
                reloadTracker()
            } catch(err) {
                reloadTracker()
            }
        }
    }

    const searchTracker = async () => {
        try {            
            if(session === "cloud") {
                const res = await axios.get(`${ApiUrl}/api/search/trackers?q=${encodeURIComponent(searchValue)}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("Authorization")}`
                    }
                })
            
                const data = await res.data
                console.log("cloud trackers search fetch", data.data.trackers)
                setTrackers(data.data.trackers)
            }
        } catch(err) {
            console.log(err)
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            console.log("triggered!")
            searchTracker()
        }, 750)

        return () => {
            console.log("debounced")
            clearTimeout(timer)
        }
    }, [searchValue])

    return (
        <section onClick={() => decideCreateBox()} className="flex flex-col items-center gap-5 min-h-screen md:max-w-[650px]">
            <div className="flex justify-center max-w-[650px]">
                <AnimatePresence>
                    {!isOut && <motion.div
                        className="flex justify-center items-center gap-2 mt-5 w-[85%] fixed z-10 md:max-w-[650px]"
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
                        {session === "cloud" && <div className="flex items-center flex-1 backdrop-blur-[2px] dark:backdrop-blur-xs backdrop-grayscale-100">
                            <label htmlFor="search" className="absolute pl-4 z-1">
                                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-neutral-700 dark:text-neutral-400" />
                            </label>
                            <Input id="search" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} type="text" className="rounded-full h-10 pl-11 bg-white/50 focus:bg-neutral-50/80 backdrop-grayscale-50 dark:bg-white/3" placeholder="Search MyTracker" />
                        </div>}
                        {session === "local" && <div className="flex items-center flex-1 backdrop-blur-[2px]">
                            <label htmlFor="search" className="absolute pl-4 z-1">
                                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-neutral-700 dark:text-neutral-400" />
                            </label>
                            <Input id="search" disabled type="text" className="rounded-full h-10 pl-11 bg-white/50 focus:bg-neutral-50/80 backdrop-blur-[2px] backdrop-grayscale-50 dark:backdrop-blur-xs" placeholder="Search mode disabled in local account" />
                        </div>}
                        <motion.div>
                            <AnimatePresence mode="popLayout">
                                {!isAccountOpen &&
                                    <motion.div
                                        key="accountDetailsClosed"
                                        onClick={() => setIsAccountOpen(true)}
                                        style={{backgroundImage: session === "cloud" ? `url(${StorageUrl}${mainLoaderData?.avatar}` : "none", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover"}}
                                        className={`w-10 h-10 rounded-full shadow ring ring-input ${mainLoaderData?.avatar === null || mainLoaderData?.avatar === undefined  ? "flex justify-center items-center bg-white/60 backdrop-blur-[2px] dark:backdrop-blur-xs dark:bg-white/3" : ""}`}
                                        initial={{
                                            opacity: 0
                                        }}
                                        animate={{
                                            opacity: 100
                                        }}
                                    >
                                        {!mainLoaderData?.avatar && <FontAwesomeIcon icon={faUser} className="text-base text-neutral-800 dark:text-neutral-400" />}
                                    </motion.div>}
                                {isAccountOpen &&
                                    <motion.div
                                        key="accountDetailsOpen"
                                        onClick={() => setIsAccountOpen(false)}
                                        className="w-10 h-10 rounded-full border-[0.5px] shadow flex justify-center items-center text-neutral-500 bg-white/60 backdrop-blur-[2px] dark:backdrop-blur-xs dark:bg-white/3"
                                        initial={{
                                            opacity: 0
                                        }}
                                        animate={{
                                            opacity: 100
                                        }}
                                    >
                                        <XIcon className="dark:text-neutral-400" />
                                </motion.div>}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>}
                </AnimatePresence>
                <div>
                    <AnimatePresence mode="popLayout">
                        <motion.div>
                            <AnimatePresence>
                                {isAccountOpen && !isOut && <motion.div
                                    key="accountDetails"
                                    className="fixed right-0 sm:right-[4%] top-0 mt-18 mr-6 flex flex-col gap-3.5 bg-neutral-50/80 dark:bg-neutral-800/60 border-[0.5px] shadow p-3.5 rounded-xl backdrop-blur-[2px] dark:backdrop-blur-[6px] backdrop-grayscale-50 z-20 md:right-auto md:translate-x-17 md:w-60"
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
                                            <motion.div
                                                style={{backgroundImage: session === "cloud" ? `url(${StorageUrl}${mainLoaderData?.avatar}` : "none", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover"}} className={`w-10 h-10 rounded-full dark:bg-transparent ${mainLoaderData.avatar === null || mainLoaderData.avatar === undefined ? "flex justify-center items-center border" : ""}`}>
                                                {!mainLoaderData?.avatar && <FontAwesomeIcon icon={faUser} className="text-base text-neutral-700 dark:text-neutral-400" />}
                                            </motion.div>
                                            <div>
                                                <h3 className="font-medium text-[15px]">{mainLoaderData?.name}</h3>
                                                <p className="font-medium text-xs text-black/80 dark:text-white/80">{mainLoaderData?.email}</p>
                                            </div>
                                            
                                        </div>
                                        <div>
                                            <ModeToggle />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 w-full">
                                        {session === "local" &&
                                            <motion.div
                                                className="flex items-center gap-2.5 bg-green-500/20 dark:bg-violet-700/40 rounded-full py-2 px-4 w-full"
                                                whileTap={{
                                                    scale: 0.95
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faCloud} />
                                                <p onClick={() => {signup()}} className="font-medium text-[15px]">Signup</p>
                                            </motion.div>
                                        }
                                        <motion.div 
                                            onClick={() => {setIsOut(true); setTimeout(() => window.location.href = "/app/editProfile", 500)}} 
                                            className="flex items-center gap-2.5 bg-green-500/20 dark:bg-violet-700/40 rounded-full py-2 px-4 w-full"
                                            whileTap={{
                                                scale: 0.95
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faUserPen} />
                                            <p className="font-medium text-[15px]">Edit Profile</p>
                                        </motion.div>
                                        {session === "cloud" && 
                                            <motion.div 
                                                className="flex items-center gap-2.5 bg-green-500/20 dark:bg-violet-700/40 rounded-full py-2 px-4 w-full"
                                                whileTap={{
                                                    scale: 0.95
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faLock} />
                                                <p className="font-medium text-[15px]">Change Password</p>
                                            </motion.div>
                                        }
                                        {session === "cloud" &&
                                            <motion.div 
                                                className="flex items-center gap-2.5 bg-green-500/20 dark:bg-violet-700/40 rounded-full py-2 px-4 w-full"
                                                whileTap={{
                                                    scale: 0.95
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faArrowRightFromBracket} />
                                                <p onClick={() => signout()} className="font-medium text-[15px]">Signout</p>
                                            </motion.div>
                                        }
                                    </div>
                                </motion.div>}
                            </AnimatePresence>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
            <motion.div 
                className="flex flex-col sm:grid sm:grid-cols-2 w-full px-7 justify-center items-center gap-2.5 mt-15"
                // layout
            >
                <AnimatePresence mode="popLayout">
                    {isCreateBoxOpen &&
                        <motion.div
                            key={"createBox"}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-neutral-800/60 w-full flex-1 px-4 py-3 rounded-xl h-full z-10"
                            initial={{
                                x: -50,
                                opacity: 0,
                                filter: "blur(5px)"
                            }}
                            animate={{
                                x: 0,
                                opacity: 100,
                                filter: "blur(0px)"
                            }}
                            exit={{
                                x: -50,
                                opacity: 0,
                                filter: "blur(5px)"
                            }}
                        >
                            <div className="flex flex-col gap-3.5">
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-col gap-0.5">
                                        <Input ref={createBoxTitle}  className="border-0 shadow-none font-semibold dark:text-base p-0 m-0 focus-visible:ring-0 dark:bg-transparent" placeholder="Put your tittle here..." />
                                        <Input ref={createBoxDescription}  className="text-base font-normal p-0 m-0 border-0 shadow-none focus-visible:ring-0 dark:bg-transparent dark:text-white/75 dark:text-base" placeholder="Put your description here..." />
                                    </div>
                                    <div className="flex items-center">
                                        <p className="font-medium text-neutral-500 mr-1">Rp.</p>
                                        <Input value={initialBalance} onChange={(e) => {modifyInitialBalance(e.target.value)}} type="text" className="px-0 focus-visible:ring-0 focus-visible:border-none border-none shadow-none font-regular font-[Inter] text-base text-neutral-800 dark:bg-transparent dark:text-white/50" placeholder="Put your initial balance here..."/>
                                    </div>
                                </div>
                            </div>
                    </motion.div>}
                </AnimatePresence>
                <AnimatePresence>
                    {!isOut && trackers?.map((item, i) => (
                        <motion.div
                            key={i}
                            className="bg-white w-full flex-1 px-5 py-4 rounded-xl z-0 dark:bg-neutral-800/60"
                            initial={{
                                x: 30,
                                opacity: 0,
                                filter: "blur(5px)"
                            }}
                            animate={{
                                x: 0,
                                opacity: 100,
                                filter: "blur(0px)",
                                transition: {
                                    delay: (i * 0.2) + 0.4
                                },
                    
                            }}
                            transition={{
                                layout: {
                                    delay: (i * 0.02),
                                    type: 'spring',
                                    mass: 1,
                                    stiffness: 160,
                                    damping: 19
                                }
                            }}
                            exit={{
                                x: -30,
                                opacity: 0,
                                filter: "blur(5px)",
                                transition: {
                                    delay: 0.2
                                }
                            }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {!isCreateBoxOpen && e.stopPropagation(); {!isCreateBoxOpen && setIsOut(true) }; {!isCreateBoxOpen && setTimeout(() => window.location.href = `/app/tracker/${item.id}`, 500)}}}
                            layout='position'
                            layoutId={i.toString()}
                        >
                            {session === "cloud" &&
                                <div className="w-full flex justify-between gap-3">
                                    <div className="flex flex-col gap-3.5 min-w-0">
                                        <div className="flex flex-col gap-0.5">
                                            <h2 className="font-semibold text-base text-wrap wrap-break-word">{item.name}</h2>
                                            <p className="text-base font-normal text-wrap wrap-break-word text-black/80 dark:text-white/80">{item.description}</p>
                                        </div>
                                        <div>
                                            {item.transactions?.map((item) => (
                                                <p className="text-sm font-normal text-black/80 dark:text-white/80">
                                                    {item.type === "expense" ? "-" : "+"} Rp. {item.amount.toLocaleString("ID")}
                                                </p>
                                            ))}
                                            {item.transactions?.length === 0 && <p className="font-medium text-sm text-black/50 dark:text-white/50">{(item.name).toLowerCase()} last transactions will apear here.</p>}
                                        </div>
                                    </div>
                                    <Popover>
                                        <PopoverTrigger className="w-3 self-start" onClick={(e) => e.stopPropagation()}>
                                            <FontAwesomeIcon icon={faEllipsisV} className="text-black/60 dark:text-white/60" />
                                        </PopoverTrigger>
                                        <PopoverContent className="w-fit px-0 py-2 dark:bg-neutral-800/60 backdrop-blur-xs">
                                            <motion.div 
                                                className="flex items-center gap-1 px-3"
                                            >
                                                <FontAwesomeIcon icon={faTrashAlt} />
                                                <p className="font-medium text-base" onClick={(e) => {e.stopPropagation(); deleteTracker(item.id)}}>Delete</p>
                                            </motion.div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            }
                            {session === "local" &&
                                <div className="flex justify-between gap-3 w-full">
                                    <div className="flex flex-col gap-3.5 min-w-0">
                                        <div className="flex flex-col gap-0.5 w-full">
                                            <h2 className="font-semibold text-base text-wrap wrap-break-word">{item.name}</h2>
                                            <p className="text-base font-normal text-wrap wrap-break-word text-black/80 dark:text-white/80">{item.description}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-black/50 dark:text-white/50">{(item.name).toLowerCase()} transactions preview is disabled in local environment.</p>
                                        </div>
                                    </div>
                                    <Popover>
                                        <PopoverTrigger className="w-3 self-start" onClick={(e) => e.stopPropagation()}>
                                            <FontAwesomeIcon icon={faEllipsisV} className="text-black/60 dark:text-white/60" />
                                        </PopoverTrigger>
                                        <PopoverContent className="w-fit px-0 py-2 dark:bg-neutral-800/60 backdrop-blur-xs">
                                            <motion.div 
                                                className="flex items-center gap-1 px-3"
                                            >
                                                <FontAwesomeIcon icon={faTrashAlt} />
                                                <p className="font-medium text-base" onClick={(e) => {e.stopPropagation(); deleteTracker(item.id)}}>Delete</p>
                                            </motion.div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            }
                        </motion.div>
                    ))}
                    {!trackers?.length && !isCreateBoxOpen && !isOut &&
                        <motion.div 
                            className="absolute left-[50%] translate-x-[-50%] top-25 z-0 flex flex-col items-center gap-4 w-[60%]"
                            key={"intro"}
                            onClick={(e) => e.stopPropagation()}
                            initial={{
                                x: 50,
                                opacity: 0,
                                filter: "blur(5px)"
                            }}
                            animate={{
                                x: 0,
                                opacity: 100,
                                filter: "blur(0px)",
                                transition: {
                                    delay: 0.4
                                }
                            }}
                            exit={{
                                x: 50,
                                opacity: 0,
                                filter: "blur(5px)"
                            }}
                        >
                            <motion.div>
                                <FontAwesomeIcon icon={searchValue  === "" ? faMoneyBillWave : faQuestion} className="text-5xl text-neutral-300" />
                            </motion.div>
                            <motion.div className="text-center text-neutral-400">
                                <p className="font-medium">{searchValue === "" ? "Its a bit empty here eh?" : "*Cricket noise*"}</p>
                                <p>{searchValue === "" ? "Start making your tracker by clicking the + sign below!" : "No tracker found, try a different search!"}</p>
                            </motion.div>
                        </motion.div>
                    }
                </AnimatePresence>
            </motion.div>
            <AnimatePresence>
                {!isOut && <motion.div
                    className="flex justify-center items-center w-12 h-12 fixed bottom-0 right-0 mr-6 mb-8 rounded-md bg-green-400/60 dark:bg-violet-700/60 backdrop-blur-[2px] backdrop-grayscale-50 sm:right-[4%] border-[0.5px] shadow md:bottom-0 md:right-auto md:translate-x-70"
                    initial={{
                        y: 50,
                        opacity: 0,
                        filter: "blur(5px)"
                    }}
                    animate={{
                        y: 0,
                        opacity: 100,
                        filter: "blur(0px)",
                        transition: {
                            type: spring,
                            stiffness: 200,
                            damping: 15,
                            mass: 1,
                        delay: 0.9
                        }
                    }}
                    whileTap={{
                        scale: 0.95
                    }}
                    exit={{
                        x: -30,
                        opacity: 0,
                        transition: {
                            delay: 0.3
                        }
                    }}
                >
                    <PlusIcon onClick={(e) => {e.stopPropagation(); setIsCreateBoxOpen(true)}} className="text-white" size={30} />
                </motion.div>}
            </AnimatePresence>
        </section>
    )
}