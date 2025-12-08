import { useEffect, useState, type JSX } from "react";
import { AnimatePresence, motion, spring } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRightFromBracket, faFilter, faLock, faQuestion, faSun, faUserPen } from "@fortawesome/free-solid-svg-icons";
import { userData } from "@/lib/userData";
import { XIcon } from "lucide-react";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrackerNavbar } from "@/components/TrackerNavbar";
import { DBgetalltransactions } from "@/lib/db";
import { useParams, useRouteLoaderData } from "react-router-dom";
import axios from "axios";
import { ApiUrl } from "@/lib/variable";

export function TrackerHistory(): JSX.Element {
    const { id } = useParams()

    const [ isOut, setIsOut ] = useState<boolean>(false)
    const [ isAccountOpen, setIsAccountOpen ] = useState<boolean>(false)
    const [ showPlus, setShowPlus ] = useState(true)
    const [ showwMinus, setShowMinus ] = useState(true)
    const [ session, setSession ] = useState<"cloud" | "local" | null>(null)
    const [ data, setData ] = useState<any[]>([])

    const [ page, setPage ] = useState<number>(1)
    const [ direction, setDirection ] = useState<string>("desc")
    const [lastPage, setLastPage] = useState(1)

    const WindowSession = localStorage.getItem("session")

    const localGetTransactions = async () => {
        if(id) {
            try {
                const res = await DBgetalltransactions(parseInt(id, 10)) as any[]
                
                //paginate
                const size = 10
                const offset = (page - 1) * size

                const cleanedData: any[] = []

                // set the data according to the direction and the state first
                if(direction === "desc") res.sort((a, b) => b.date - a.date)
                else if(direction === "asc") res.sort((a, b) => a.date - b.date)

                res.forEach(item => {
                    const itemType = item.type
                    if(itemType === "income" && showPlus) cleanedData.push(item)
                    if(itemType === "outcome" && showwMinus) cleanedData.push(item)
                })
                // set url
                cleanedData.forEach(item => {
                    if(item.image) {
                        const image = item.image
                        const url = URL.createObjectURL(image)
                        item.image = url
                    }
                })

                // calculate last page
                const total = cleanedData.length
                const pages = Math.ceil(total / size)
                setLastPage(pages)

                // paginate
                const paginatedData = cleanedData.slice((offset), size * page)
                console.log("data", paginatedData)
                setData(paginatedData)             
            } catch(err) {
                console.log(err)
            }
        }
    }

    const cloudGetTransactions = async () => {
        console.log("get transactions triggered!")

        const showBoth = showPlus && showwMinus
        const minusOnly = showwMinus && !showPlus
        const plusOnly = !showwMinus && showPlus
        const type = showBoth ? "both" : minusOnly ? "expense" : plusOnly ? "income" : ""

        try {
            console.log(id, page, direction, type)
            const res = await axios.get(`${ApiUrl}/api/trackers/${id}/paginate/transactions?page=${page}&per_page=10&order=${direction}&type=${type}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("Authorization")}`
                }
            })
            const data = res.data
            const transactions = data.data.transactions.data 
            console.log(data.data.transactions.data)

            setLastPage(data.data.transactions.last_page)
            setData(transactions)
        } catch(err) {
            console.log(err)
        }
    }

    const getData = () => {
        if(WindowSession === "local") localGetTransactions()
        if(WindowSession === "cloud") cloudGetTransactions()
    }

    const changePage = (direction: "up" | "down" | "first" | "last") => {
        if(direction === "first") setPage(1)
        if(direction === "last") setPage(lastPage)
        if(direction === "down" && page !== 1) setPage(prev => prev -= 1) 
        if(direction === "up" && page !== lastPage) setPage(prev => prev += 1) 
    }

    useEffect(() => {
        if(WindowSession === null) window.location.href = "/access"
        setSession(WindowSession as "cloud" | "local")

        getData()
    }, [])

    useEffect(() => {
        getData()
    }, [page, direction, showPlus, showwMinus])

    return (
        <section className="flex flex-col items-center w-full md:max-w-[650px]">
            <TrackerNavbar trackerName="My New Navbar" setIsOut={setIsOut} isOut={isOut} backLink={`/app/tracker/${id}`}  />
            <AnimatePresence>
                {!isOut && <motion.div
                    key={"tracker-history"}
                    className="flex flex-col items-center mt-18 w-[87%] gap-3"
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
                            delay: 0.4
                        }
                    }}
                    exit={{
                        x: -30,
                        opacity: 0,
                        transition: {
                            delay: 0.1
                        }
                    }}
                >
                    <div className="flex justify-between w-full fixed left-[50%] -translate-x-[50%] px-10 md:w-160 bg-background-primary pt-3 -mt-3 pb-2 dark:bg-background-primary-dark">
                        <h3 className="text-sm font-regular">Riwayat finansial</h3>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <FontAwesomeIcon icon={faFilter} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white/50 backdrop-blur-xs w-45 mr-5 dark:bg-background-primary-dark/40 dark:backdrop-blur-xs">
                                <DropdownMenuRadioGroup value={direction} onValueChange={setDirection}>
                                    <DropdownMenuRadioItem value="asc">Naik</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="desc" defaultChecked>Turun</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                checked={showwMinus}
                                onCheckedChange={setShowMinus}
                                >
                                Pengeluaran
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                checked={showPlus}
                                onCheckedChange={setShowPlus}
                                >
                                Pemasukkan
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="w-full flex flex-col gap-2 mb-15 mt-7">
                        {data.length === 0 && <div className="flex flex-col items-center gap-5 justify-center h-75 px-5">
                            <FontAwesomeIcon icon={faQuestion} className="text-7xl text-black/40 dark:text-white/50" />
                            <p className="text-center font-medium text-base text-black/50 dark:text-white/50">Oops... Your data looks empty <br /> <span className="font-normal">Try changing the filter or adding some data.</span></p>
                        </div>}
                        {session === "local" && data.map(item => (
                            <Dialog>
                                <DialogTrigger className="flex w-full bg-white rounded-md dark:bg-neutral-800/60 dark:border">
                                    {item.image && <div style={{backgroundImage: `url(${item.image})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover"}} className="w-20 bg-neutral-400 rounded-l-md" />}
                                    <div className="flex w-full text-start justify-between flex-1 p-3">
                                        <div className="flex flex-col w-full pb-5 gap-0.5">
                                            <div className="flex w-full flex-col flex-1">
                                                <p className="text-sm font-normal">{item.name}</p>
                                                <p className="font-semibold text-base">{item.type === "income" ? "+ " : "- "} Rp.{item.income.toLocaleString("iD")}</p>
                                            </div>
                                        </div>
                                        <div className="self-end flex-1 font-normal text-xs text-neutral-500">{item.date.getDay()}-{item.date.getMonth()}-{item.date.getFullYear()}</div>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="w-full flex flex-col items-center bg-background-primary/90 dark:bg-background-primary-dark/50 backdrop-blur-xl">
                                    {item.image && <div style={{backgroundImage: `url(${item.image})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover"}} className="w-[calc(100vw-70px)] h-70 sm:w-full bg-neutral-300" />}
                                    <div className="flex w-full flex-row justify-between items-end">
                                        <h4 className="font-medium text-xl">{item.name}</h4>
                                        <p className="font-semibold text-2xl text-neutral-600 dark:text-neutral-400">{item.type === "income" ? "+ " : "- "} Rp.{item.income.toLocaleString("iD")}</p>
                                    </div>
                                    <p className="text-base font-normal self-start -mt-2">{item.desc}</p>
                                    <p className="text-sm font-normal text-neutral-400 self-end">
                                        {item.date.toLocaleDateString("ID", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric"
                                        })}
                                    </p>
                                </DialogContent>
                            </Dialog>
                        ))}
                        {session === "cloud" && data.map(item => (
                            <Dialog>
                                <DialogTrigger className="flex w-full bg-white rounded-md dark:bg-neutral-800/60 dark:border">
                                    {item.image && <div style={{backgroundImage: `url(${ApiUrl}/storage/${item.image})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover"}} className="w-20 bg-neutral-400 rounded-l-md" />}
                                    <div className="flex w-full text-start justify-between flex-1 p-3">
                                        <div className="flex flex-col w-full pb-5 gap-0.5">
                                            <div className="flex w-full flex-col flex-1">
                                                <p className="text-sm font-normal">{item.name}</p>
                                                <p className="font-semibold text-base">{item.type === "income" ? "+ " : "- "} Rp.{parseInt(item.amount, 10).toLocaleString("ID")}</p>
                                            </div>
                                        </div>
                                        <div className="self-end flex-1 font-normal text-xs text-neutral-500">{(new Date(item.transaction_date)).getDate()}-{(new Date(item.transaction_date)).getMonth()}-{(new Date(item.transaction_date)).getFullYear()}</div>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="w-full flex flex-col items-center bg-background-primary/90 dark:bg-background-primary-dark/50 backdrop-blur-xl">
                                    {item.image && <div style={{backgroundImage: `url(${ApiUrl}/storage/${item.image})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover"}} className="w-[calc(100vw-70px)] h-70 sm:w-full bg-neutral-300" />}
                                    <div className="flex w-full flex-row justify-between items-end">
                                        <h4 className="font-medium text-xl">{item.name}</h4>
                                        <p className="font-semibold text-2xl text-neutral-600 dark:text-neutral-400">{item.type === "income" ? "+ " : "- "} Rp.{parseInt(item.amount, 10).toLocaleString("ID")}</p>
                                    </div>
                                    <p className="text-base font-normal self-start -mt-2">{item.description}</p>
                                    <p className="text-sm font-normal text-neutral-400 self-end">
                                        {(new Date(item.transaction_date)).toLocaleDateString("ID", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric"
                                        })}
                                    </p>
                                </DialogContent>
                            </Dialog>
                        ))}
                    </div>
                </motion.div>}
                {!isOut && <motion.div
                    className="w-full bg-background-primary flex justify-center items-center h-15 fixed bottom-0 dark:bg-background-primary-dark"
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
                            delay: 0.4
                        }
                    }}
                    exit={{
                        x: -30,
                        opacity: 0,
                        transition: {
                            delay: 0.1
                        }
                    }}
                >
                    {data.length > 0 &&                     
                        <Pagination className="relative">
                        <PaginationContent className="relative">
                            <PaginationItem onClick={() => changePage("first")} className={`${page === 1 && "opacity-0"}`}>
                                <PaginationPrevious />
                            </PaginationItem>
                            <PaginationItem onClick={() => changePage("down")} className={`${page === 1 && "opacity-0"}`}>
                                <PaginationLink>1</PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink isActive className="bg-green-400/60 text-white dark:bg-violet-600">
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                            <PaginationItem onClick={() => changePage("up")} className={`${page === lastPage && "opacity-0"}`}>
                                <PaginationLink>{page + 1}</PaginationLink>
                            </PaginationItem>
                            <PaginationItem onClick={() => changePage("last")} className={`${page === lastPage && "opacity-0"}`}>
                                <PaginationNext />
                            </PaginationItem>
                        </PaginationContent>
                        </Pagination>
                    }
                </motion.div>}
            </AnimatePresence>
        </section>
    )
}