import { Input } from "@/components/ui/input";
import { userData } from "@/lib/userData";
import { faArrowRightFromBracket, faLock, faMagnifyingGlass, faSun, faUserPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PlusIcon, XIcon } from "lucide-react";
import { useState, type JSX } from "react";
import { motion, AnimatePresence, spring } from "motion/react";

export function Dashboard(): JSX.Element {
    const [ isAccountOpen, setIsAccountOpen ] = useState<boolean>(false)

    return (
        <section className="flex flex-col items-center gap-5">
            <div className="flex justify-center">
                <div className="flex justify-center items-center gap-2 mt-5 w-[85%] fixed">
                    <div className="flex items-center flex-1">
                        <label htmlFor="search" className="absolute pl-4 z-1">
                            <FontAwesomeIcon icon={faMagnifyingGlass} className="" />
                        </label>
                        <Input id="search" type="text" className="rounded-full h-10 pl-11 bg-neutral-50/30 focus:bg-neutral-50/50 backdrop-blur-[2px] backdrop-grayscale-50" placeholder="Search MyTracker" />
                    </div>
                    <motion.div>
                        <AnimatePresence mode="popLayout">
                            {!isAccountOpen &&
                                <motion.div
                                    key="accountDetailsClosed"
                                    onClick={() => setIsAccountOpen(true)}
                                    style={{backgroundImage: `url(${userData.userImages})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "contain"}}
                                    className="w-10 h-10 rounded-full"
                                    initial={{
                                        opacity: 0
                                    }}
                                    animate={{
                                        opacity: 100
                                    }}
                                />}
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
                </div>
                <div>
                    <motion.div>
                        <AnimatePresence>
                            {isAccountOpen && <motion.div 
                                key="accountDetails"
                                className="fixed right-0 sm:right-[4%] top-0 mt-18 mr-6 flex flex-col gap-3.5 bg-neutral-50/30 border-[0.5px] shadow p-3.5 rounded-xl backdrop-blur-[2px] backdrop-grayscale-50"
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
                                    <div style={{backgroundImage: `url(${userData.userImages})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "contain"}} className="w-10 h-10 rounded-full"></div>
                                    <div>
                                        <h3 className="font-medium text-[15px]">{userData.username}</h3>
                                        <p className="font-medium text-xs">{userData.email}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="flex items-center gap-2.5 bg-neutral-100 rounded-full py-2 px-4 w-full">
                                        <FontAwesomeIcon icon={faSun}/>
                                        <p className="font-medium text-[15px]">Switch theme</p>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-neutral-100 rounded-full py-2 px-4 w-full">
                                        <FontAwesomeIcon icon={faUserPen} />
                                        <p className="font-medium text-[15px]">Edit Profile</p>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-neutral-100 rounded-full py-2 px-4 w-full">
                                        <FontAwesomeIcon icon={faLock} />
                                        <p className="font-medium text-[15px]">Change Password</p>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-neutral-100 rounded-full py-2 px-4 w-full">
                                        <FontAwesomeIcon icon={faArrowRightFromBracket} />
                                        <p className="font-medium text-[15px]">Signout</p>
                                    </div>
                                </div>
                            </motion.div>}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 w-[87%] justify-center items-center gap-2.5 mt-15">
                {userData.tracker.map(item => (
                    <div className="bg-linear-to-t from-green-400/0 to-green-300/20 w-full flex-1 px-4 py-3 rounded-xl border-[1.75px]">
                        <div className="flex flex-col gap-3.5">
                            <div className="flex flex-col gap-0.5">
                                <h2 className="font-semibold text-base">{item.tittle}</h2>
                                <p className="text-base font-normal">{item.desc}</p>
                            </div>
                            <div>
                                {item.history.map(item => (
                                    <p className="text-sm font-normal">
                                        {item.type === "pengeluaran" ? "-" : "+"} Rp. {item.harga.toLocaleString("ID")}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-center items-center w-12 h-12 fixed bottom-0 right-0 mr-6 mb-8 rounded-md bg-neutral-50/30 backdrop-blur-[2px] backdrop-grayscale-50 sm:right-[4%] border-[0.5px] shadow">
                <PlusIcon />
            </div>
        </section>
    )
}