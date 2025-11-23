import { useState, type JSX } from "react";
import { AnimatePresence, motion, spring } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRightFromBracket, faFilter, faLock, faSun, faUserPen } from "@fortawesome/free-solid-svg-icons";
import { userData } from "@/lib/userData";
import { XIcon } from "lucide-react";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function TrackerHistory(): JSX.Element {
    const [ isAccountOpen, setIsAccountOpen ] = useState<boolean>(false)
    const [ direction, setDirection ] = useState("desc")
    const [ showPlus, setShowPlus ] = useState(true)
    const [ showwMinus, setShowMinus ] = useState(true)

    return (
        <section className="flex flex-col items-center">
            <div className="flex justify-center z-10">
                <div className="fixed z-0 bg-background-primary w-full h-15" />
                <div className="flex justify-between items-center gap-2 mt-5 w-[85%] z-10 fixed">
                    <FontAwesomeIcon icon={faArrowLeft} className="w-10 h-10 text-xl text-neutral-800" />
                    <h1 className="ml-[7px] font-medium text-base text-neutral-500">My New Tracker</h1>
                    <motion.div>
                        <AnimatePresence mode="popLayout">
                            {!isAccountOpen &&
                                <motion.div
                                    key="accountDetailsClosed"
                                    onClick={() => setIsAccountOpen(true)}
                                    style={{backgroundImage: `url(${userData.userImages})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "contain"}}
                                    className="w-8 h-8 rounded-full"
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
                                    className="w-8 h-8 rounded-full border-[0.5px] shadow flex justify-center items-center text-neutral-500"
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
                                className="fixed right-0 sm:right-[4%] top-0 mt-15 mr-6 flex flex-col gap-3.5 bg-neutral-50/40 border-[0.5px] shadow p-3.5 rounded-xl backdrop-blur-[2px] backdrop-grayscale-50"
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
                                    <div className="flex items-center gap-2.5 bg-green-500/20 rounded-full py-2 px-4 w-full">
                                        <FontAwesomeIcon icon={faSun}/>
                                        <p className="font-medium text-[15px]">Switch theme</p>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-green-500/20 rounded-full py-2 px-4 w-full">
                                        <FontAwesomeIcon icon={faUserPen} />
                                        <p className="font-medium text-[15px]">Edit Profile</p>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-green-500/20 rounded-full py-2 px-4 w-full">
                                        <FontAwesomeIcon icon={faLock} />
                                        <p className="font-medium text-[15px]">Change Password</p>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-green-500/20 rounded-full py-2 px-4 w-full">
                                        <FontAwesomeIcon icon={faArrowRightFromBracket} />
                                        <p className="font-medium text-[15px]">Signout</p>
                                    </div>
                                </div>
                            </motion.div>}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
            <div className="flex flex-col items-center mt-18 w-[87%] gap-3">
                <div className="flex justify-between w-full">
                    <h3 className="text-sm font-regular">Riwayat finansial</h3>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <FontAwesomeIcon icon={faFilter} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white/50 backdrop-blur-[2px] w-45 mr-5">
                            <DropdownMenuRadioGroup value={direction} onValueChange={setDirection}>
                                <DropdownMenuRadioItem value="asc">Naik</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="desc">Turun</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                            checked={showPlus}
                            onCheckedChange={setShowPlus}
                            >
                            Pengeluaran
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                            checked={showwMinus}
                            onCheckedChange={setShowMinus}
                            >
                            Pemasukkan
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="w-full flex flex-col gap-2 mb-15">
                    <Dialog>
                        <DialogTrigger className="flex w-full bg-white rounded-md">
                            <div className="w-20 bg-neutral-400 rounded-l-md" />
                            <div className="flex w-full text-start justify-between flex-1 p-3">
                                <div className="flex flex-col w-full pb-5 gap-0.5">
                                    <div className="flex w-full flex-col flex-1">
                                        <p className="text-sm font-normal">Gajian</p>
                                        <p className="font-semibold text-base">+ Rp. 4.200.000</p>
                                    </div>
                                </div>
                                <div className="self-end flex-1 font-normal text-xs text-neutral-500">11/4/25</div>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="w-full flex flex-col items-center">
                            <div className="w-[calc(100vw-70px)] h-70 sm:w-full bg-neutral-300" />
                            <div className="flex w-full flex-row justify-between items-end">
                                <h4 className="font-medium text-xl">Gajian</h4>
                                <p className="font-semibold text-2xl text-neutral-600">+ Rp. 4.200.000</p>
                            </div>
                            <p className="text-sm font-normal text-neutral-400 self-end">Kamis, 11 October 2025</p>
                        </DialogContent>
                    </Dialog>
                    <Dialog>
                        <DialogTrigger className="flex w-full bg-white rounded-md">
                            <div className="w-20 bg-neutral-400 rounded-l-md" />
                            <div className="flex w-full text-start justify-between flex-1 p-3">
                                <div className="flex flex-col w-full pb-5 gap-0.5">
                                    <div className="flex w-full flex-col flex-1">
                                        <p className="text-sm font-normal">Jajan</p>
                                        <p className="font-semibold text-base">- Rp. 20.000</p>
                                    </div>
                                    <p className="font-normal w-full text-sm text-neutral-700">Ini contoh deskrips..</p>
                                </div>
                                <div className="self-end flex-1 font-normal text-xs text-neutral-500">11/2/25</div>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="w-full flex flex-col items-center">
                            <div className="w-[calc(100vw-70px)] h-70 sm:w-full bg-neutral-300" />
                            <div className="flex w-full flex-row justify-between items-end">
                                <h4 className="font-medium text-xl">Jajan</h4>
                                <p className="font-semibold text-2xl text-neutral-600">- Rp.100.000</p>
                            </div>
                            <p className="text-base font-normal">Ini contoh deskripsi yang sangat sangat panjaang sekali. Lorem dolor sit amet.</p>
                            <p className="text-sm font-normal text-neutral-400 self-end">Kamis, 11 October 2025</p>
                        </DialogContent>
                    </Dialog>
                    <Dialog>
                        <DialogTrigger className="flex w-full bg-white rounded-md">
                            <div className="flex w-full text-start justify-between flex-1 p-3">
                                <div className="flex flex-col w-full pb-5 gap-0.5">
                                    <div className="flex w-full flex-col flex-1">
                                        <p className="text-sm font-normal shrink">Bayar sewaan</p>
                                        <p className="font-semibold text-base shrink-0 ">- Rp.2.676.000</p>
                                    </div>
                                </div>
                                <div className="self-end flex-1 font-normal text-xs text-neutral-500">11/2/25</div>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="w-full flex flex-col items-center">
                            <div className="flex w-full flex-row justify-between items-end">
                                <h4 className="font-medium text-xl">Bayar Sewaan</h4>
                                <p className="font-semibold text-2xl text-neutral-600">- Rp.2.676.000</p>
                            </div>
                            <p className="text-sm font-normal text-neutral-400 self-end">Kamis, 11 October 2025</p>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <div className="fixed bottom-0 w-full bg-background-primary h-15 flex justify-center items-center">
                <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious href="#" />
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationLink href="#">1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationLink href="#" isActive className="bg-green-400/60 text-white">
                            2
                        </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationLink href="#">3</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationNext href="#" />
                    </PaginationItem>
                </PaginationContent>
                </Pagination>
            </div>
        </section>
    )
}