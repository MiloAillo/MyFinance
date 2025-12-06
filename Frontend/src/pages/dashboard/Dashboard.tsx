import { Input } from "@/components/ui/input";
import { faArrowRightFromBracket, faCloud, faLock, faMagnifyingGlass, faMoneyBillWave, faSun, faUserPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PlusIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState, type JSX } from "react";
import { motion, AnimatePresence, spring } from "motion/react";
import { useRouteLoaderData } from "react-router-dom";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { ApiUrl, StorageUrl } from "@/lib/variable";
import axios, { isAxiosError } from "axios";
import { DBcreatetracker, DBgetalltrackers } from "@/lib/db";

export function Dashboard(): JSX.Element {
    const mainLoaderData = useRouteLoaderData("main")
    
    const [ trackers, setTrackers ] = useState<any[]>([])
    const [ user, setUser ] = useState<any>()
    const [ isAccountOpen, setIsAccountOpen ] = useState<boolean>(false)
    const [ isCreateBoxOpen, setIsCreateBoxOpen ] = useState<boolean>(false)
    const [ isOut, setIsOut ] = useState<boolean>(false)
    const [ initialBalance, setInitialBalance ] = useState<string>("")
    const [ session, setSession ] = useState<"cloud" | "local" | null>(null)
    
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
            setTrackers(data.trackers)
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
                    const res = await DBcreatetracker(name, desc, cleanedBalance)
                    setIsCreateBoxOpen(false)
                    console.log("created!", res)
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
        }

        // try {
        //     const res = await axios.post(`${ApiUrl}/api/trackers`, {
        //         name: name,
        //         description: desc,
        //         initial_balance: cleanedBalance
        //     }, {
        //         headers: {
        //             Authorization: `Bearer ${window.localStorage.getItem("Authorization")}`
        //         }
        //     })

        //     console.log(res)
        // } catch(err) {
        //     if(isAxiosError(err)) {
        //         console.log(err)
        //     }
        // }
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

    return (
        <section onClick={() => decideCreateBox()} className="flex flex-col items-center gap-5 min-h-screen">
            <div className="flex justify-center">
                <AnimatePresence>
                    {!isOut && <motion.div
                        className="flex justify-center items-center gap-2 mt-5 w-[85%] fixed z-10"
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
                        {session === "cloud" && <div className="flex items-center flex-1 bg-white/10 backdrop-blur-[2px]">
                            <label htmlFor="search" className="absolute pl-4 z-1">
                                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-neutral-700" />
                            </label>
                            <Input id="search" type="text" className="rounded-full h-10 pl-11 bg-white/50 focus:bg-neutral-50/80 backdrop-blur-[2px] backdrop-grayscale-50" placeholder="Search MyTracker" />
                        </div>}
                        {session === "local" && <div className="flex items-center flex-1 bg-white/10 backdrop-blur-[2px]">
                            <Input id="search" disabled type="text" className="rounded-full h-10 pl-11bg-white/50 focus:bg-neutral-50/80 backdrop-blur-[2px] backdrop-grayscale-50" placeholder="Search mode disabled in local account" />
                        </div>}
                        <motion.div>
                            <AnimatePresence mode="popLayout">
                                {!isAccountOpen &&
                                    <motion.div
                                        key="accountDetailsClosed"
                                        onClick={() => setIsAccountOpen(true)}
                                        style={{backgroundImage: session === "cloud" ? `url(${StorageUrl}${user?.avatar}` : "none", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover"}}
                                        className={`w-10 h-10 rounded-full shadow ring ring-input ${mainLoaderData?.avatar === null || mainLoaderData?.avatar === undefined  ? "flex justify-center items-center bg-white border" : ""}`}
                                        initial={{
                                            opacity: 0
                                        }}
                                        animate={{
                                            opacity: 100
                                        }}
                                    >
                                        {!user?.avatar && <FontAwesomeIcon icon={faUser} className="text-base text-neutral-800" />}
                                    </motion.div>}
                                {isAccountOpen &&
                                    <motion.div
                                        key="accountDetailsOpen"
                                        onClick={() => setIsAccountOpen(false)}
                                        className="w-10 h-10 rounded-full border-[0.5px] shadow flex justify-center items-center text-neutral-500"
                                        initial={{
                                            opacity: 0
                                        }}
                                        animate={{
                                            opacity: 100
                                        }}
                                    >
                                        <XIcon />
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
                                    className="fixed right-0 sm:right-[4%] top-0 mt-18 mr-6 flex flex-col gap-3.5 bg-neutral-50/80 border-[0.5px] shadow p-3.5 rounded-xl backdrop-blur-[2px] backdrop-grayscale-50 z-20"
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
                                    <div className="flex items-center gap-2.5">
                                        <motion.div 
                                            style={{backgroundImage: session === "cloud" ? `url(${StorageUrl}${user?.avatar}` : "none", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover"}} className={`w-10 h-10 rounded-full ${mainLoaderData.avatar === null || mainLoaderData.avatar === undefined ? "flex justify-center items-center border" : ""}`}>
                                            {!user?.avatar && <FontAwesomeIcon icon={faUser} className="text-base text-neutral-700" />}
                                        </motion.div>
                                        <div>
                                            <h3 className="font-medium text-[15px]">{user?.name}</h3>
                                            <p className="font-medium text-xs">{user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 w-full">
                                        {session === "local" &&
                                            <motion.div
                                                className="flex items-center gap-2.5 bg-green-500/20 rounded-full py-2 px-4 w-full"
                                                whileTap={{
                                                    scale: 0.95
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faCloud} />
                                                <p onClick={() => {signup()}} className="font-medium text-[15px]">Signup</p>
                                            </motion.div>
                                        }
                                        <motion.div 
                                            className="flex items-center gap-2.5 bg-green-500/20 rounded-full py-2 px-4 w-full"
                                            whileTap={{
                                                scale: 0.95
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faSun}/>
                                            <p className="font-medium text-[15px]">Switch theme</p>
                                        </motion.div>
                                        <motion.div 
                                            onClick={() => {setIsOut(true); setTimeout(() => window.location.href = "/app/editProfile", 500)}} 
                                            className="flex items-center gap-2.5 bg-green-500/20 rounded-full py-2 px-4 w-full"
                                            whileTap={{
                                                scale: 0.95
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faUserPen} />
                                            <p className="font-medium text-[15px]">Edit Profile</p>
                                        </motion.div>
                                        {session === "cloud" && 
                                            <motion.div 
                                                className="flex items-center gap-2.5 bg-green-500/20 rounded-full py-2 px-4 w-full"
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
                                                className="flex items-center gap-2.5 bg-green-500/20 rounded-full py-2 px-4 w-full"
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
                className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 w-[87%] justify-center items-center gap-2.5 mt-15"
                // layout
            >
                <AnimatePresence mode="popLayout">
                    {isCreateBoxOpen &&
                        <motion.div
                            key={"createBox"}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full flex-1 px-4 py-3 rounded-xl h-full z-10"
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
                                        <Input ref={createBoxTitle}  className="border-0 shadow-none font-semibold text-base p-0 m-0 focus-visible:ring-0" placeholder="Put your tittle here..." />
                                        <Input ref={createBoxDescription}  className="text-base font-normal p-0 m-0 border-0 shadow-none focus-visible:ring-0" placeholder="Put your description here..." />
                                    </div>
                                    <div className="flex items-center">
                                        <p className="font-medium text-neutral-500 mr-1">Rp.</p>
                                        <Input value={initialBalance} onChange={(e) => {modifyInitialBalance(e.target.value)}} type="text" className="px-0 focus-visible:ring-0 focus-visible:border-none border-none shadow-none font-regular font-[Inter] text-base text-neutral-800" placeholder="Put your initial balance here..."/>
                                    </div>
                                </div>
                            </div>
                    </motion.div>}
                </AnimatePresence>
                <AnimatePresence>
                    {!isOut && trackers?.map((item: any, i: any) => (
                        <motion.div
                            key={i}
                            className="bg-white w-full flex-1 px-5 py-4 rounded-xl z-0"
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
                                <div className="flex flex-col gap-3.5">
                                    <div className="flex flex-col gap-0.5">
                                        <h2 className="font-semibold text-base">{item.tittle}</h2>
                                        <p className="text-base font-normal">{item.desc}</p>
                                    </div>
                                    <div>
                                        {item.history.map((item: any) => (
                                            <p className="text-sm font-normal">
                                                {item.type === "pengeluaran" ? "-" : "+"} Rp. {item.harga.toLocaleString("ID")}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            }
                            {session === "local" &&
                                <div className="flex flex-col gap-3.5">
                                    <div className="flex flex-col gap-0.5">
                                        <h2 className="font-semibold text-base">{item.name}</h2>
                                        <p className="text-base font-normal">{item.description}</p>
                                    </div>
                                    <div>
                                        {/* {item.history?.map((item: any) => (
                                            <p className="text-sm font-normal">
                                                {item.type === "pengeluaran" ? "-" : "+"} Rp. {item.harga.toLocaleString("ID")}
                                            </p>
                                        ))} */}
                                        {/* Not yet implemented */}
                                        {<p className="font-medium text-sm text-black/50">{(item.name).toLowerCase()} last transactions will apear here.</p>}
                                    </div>
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
                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-5xl text-neutral-300" />
                            </motion.div>
                            <motion.div className="text-center text-neutral-400">
                                <p className="font-medium">Its a bit empty here eh?</p>
                                <p>Start making your tracker by clicking the + sign below!</p>
                            </motion.div>
                        </motion.div>
                    }
                </AnimatePresence>
            </motion.div>
            <AnimatePresence>
                {!isOut && <motion.div
                    className="flex justify-center items-center w-12 h-12 fixed bottom-0 right-0 mr-6 mb-8 rounded-md bg-green-400/60 backdrop-blur-[2px] backdrop-grayscale-50 sm:right-[4%] border-[0.5px] shadow"
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