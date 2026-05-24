import { useEffect, useState, useRef, type JSX } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV, faFilter, faQuestion } from "@fortawesome/free-solid-svg-icons";
import { Loader2Icon } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TrackerNavbar } from "@/components/TrackerNavbar";
import { DBgetalltransactions } from "@/lib/db";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { ApiUrl } from "@/lib/variable";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import useTransition from "@/hooks/useTransition";
import { Input } from "@/components/ui/input";

export function TrackerHistory(): JSX.Element {
    const { id } = useParams()
    const [ searchParams ] = useSearchParams()

    const { render, transitionTo } = useTransition({initValue: true, transitionDelay: 600})
    
    const [ trackerName, setTrackerName ] = useState<string>("")

    const [ showPlus, setShowPlus ] = useState(true)
    const [ showwMinus, setShowMinus ] = useState(true)
    const [ session, setSession ] = useState<"cloud" | "local" | null>(null)
    const [ data, setData ] = useState<any[]>([])

    const [ page, setPage ] = useState<number>(1)
    const [ direction, setDirection ] = useState<string>("desc")
    const [lastPage, setLastPage] = useState(1)
    const [ loadingTransactions, setLoadingTransactions ] = useState<boolean>(false)
    const abortControllerRef = useRef<AbortController | null>(null)

    // set the trackerName for first launch
    useEffect(() => {
        setTrackerName(searchParams.get("name") ?? "")
    }, [])

    const WindowSession = localStorage.getItem("session")

    const localGetTransactions = async () => {
        if(id) {
            setLoadingTransactions(true)
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
            } finally {
                setLoadingTransactions(false)
            }
        }
    }

    const cloudGetTransactions = async () => {
        // Abort previous request if it exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Create new abort controller for this request
        const abortController = new AbortController()
        abortControllerRef.current = abortController

        console.log("get transactions triggered!")

        const showBoth = showPlus && showwMinus
        const minusOnly = showwMinus && !showPlus
        const plusOnly = !showwMinus && showPlus
        const type = showBoth ? "" : minusOnly ? "income" : plusOnly ? "expense" : "nothing"

        setLoadingTransactions(true)
        try {
            console.log(id, page, direction, type)
            const res = await axios.get(`${ApiUrl}/trackers/${id}/transactions?page=${page}&size=10&filter[type]=${type}&sort=${direction == "desc" ? "-" : ""}date`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("Authorization")}`
                },
                signal: abortController.signal
            })
            
            // Only update state if this request wasn't aborted
            if (!abortController.signal.aborted) {
                const data = res.data
                const transactions = data.data 
                console.log("data: ", transactions)

                setLastPage(data.meta.last_page)
                setData(transactions)
            }
        } catch(err) {
            // Don't log abort errors, they're expected when a new request is made
            if (axios.isAxiosError(err) && err.code !== 'ERR_CANCELED') {
                console.log(err)
            }
        } finally {
            // Only clear loading if this is still the current request
            if (abortControllerRef.current === abortController) {
                setLoadingTransactions(false)
            }
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

    // const deleteTransaction = async (transactionId: number) => {
    //     console.log(id)
    //     try {
    //         const res = await axios.delete(`${ApiUrl}/api/trackers/${id}/transactions`, {
    //             headers: {
    //                 Authorization: `Bearer ${localStorage.getItem("Authorization")}`
    //             }
    //         })
    //         getData()
    //     } catch(err) {
    //         console.log(err)
    //     }
    // }

    return (
        <section className="flex flex-col items-center w-full md:max-w-[650px]">
            <TrackerNavbar trackerName={trackerName} render={render} backLink={`/app/tracker/${id}`} onBackClick={() => transitionTo(`/app/tracker/${id}`)}  />
            <AnimatePresence>
                {loadingTransactions && 
                    <motion.div
                        key={"loading-div"}
                        layout
                        className="fixed mt-20 z-999 shadow my-2 bg-white p-1.5 rounded-full overflow-hidden dark:bg-stone-700"
                        initial={{
                            y: -30,
                            opacity: 0,
                            filter: "blur(5px)"
                        }}
                        animate={{
                            y: 0,
                            opacity: 100,
                            filter: "blur(0px)"
                        }}
                        transition={{
                            delay: 0.4,
                            layout: {
                                type: 'spring',
                                mass: 1,
                                stiffness: 160,
                                damping: 19
                            }
                        }}
                        exit={{
                            y: -30,
                            opacity: 0,
                            filter: "blur(5px)"
                        }}
                    >
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                layout
                                key={"loading-spin"}
                                initial={{
                                    filter: "blur(5px)",
                                    opacity: 0,
                                    x: 100
                                }}
                                animate={{
                                    filter: "blur(0px)",
                                    opacity: 1,
                                    x: 0
                                }}
                                exit={{
                                    filter: "blur(5px)",
                                    opacity: 0,
                                    x: -100
                                }}
                                transition={{
                                    layout: {
                                        type: 'spring',
                                        mass: 1,
                                        stiffness: 160,
                                        damping: 19
                                    }
                                }}
                                className="flex items-center gap-2"
                            >
                                <motion.p
                                    className="px-2 whitespace-nowrap"
                                    layout
                                >
                                    Fetching transactions...
                                </motion.p>
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>  
                }
            </AnimatePresence>
            <AnimatePresence>
                {render && <motion.div
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
                        <h3 className="text-sm font-regular">Transactions History</h3>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <FontAwesomeIcon icon={faFilter} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white/50 backdrop-blur-xs w-45 mr-5 dark:bg-background-primary-dark/40 dark:backdrop-blur-xs">
                                <DropdownMenuRadioGroup value={direction} onValueChange={setDirection}>
                                    <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="desc" defaultChecked>Descending</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                checked={showwMinus}
                                onCheckedChange={setShowMinus}
                                >
                                Income
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                checked={showPlus}
                                onCheckedChange={setShowPlus}
                                >
                                Expense
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
                                        <div className="self-end flex-1 font-normal text-xs text-neutral-500">{item.date.toLocaleDateString("ID", {
                                            day: "numeric",
                                            month: "numeric",
                                            year: "numeric"
                                        })}</div>
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
                                                <p className="text-sm font-normal">{item.attributes.name}</p>
                                                <p className="font-semibold text-base">{item.attributes.type === "income" ? "+ " : "- "} Rp.{parseInt(item.attributes.amount, 10).toLocaleString("ID")}</p>
                                            </div>
                                        </div>
                                        <div className="self-end flex-1 font-normal text-xs text-neutral-500">{new Date(item.attributes.date).toLocaleDateString("ID", {
                                            day: "numeric",
                                            month: "numeric",
                                            year: "numeric"
                                        })}</div>
                                        <Popover>
                                            <PopoverTrigger className="w-3 -translate-x-2 self-start" onClick={(e) => e.stopPropagation()}>
                                                <FontAwesomeIcon icon={faEllipsisV} className="text-black/60 dark:text-white/60" />
                                            </PopoverTrigger>
                                            <PopoverContent className="w-fit px-0 py-2 dark:bg-neutral-800/60 backdrop-blur-xs">
                                                <motion.div 
                                                    className="flex items-center gap-1 px-3"
                                                >
                                                    <FontAwesomeIcon icon={faTrashAlt} />
                                                    <p className="font-medium text-base" onClick={(e) => {e.stopPropagation()}}>Delete</p>
                                                </motion.div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="w-full flex flex-col items-center bg-background-primary/90 dark:bg-background-primary-dark/50 backdrop-blur-xl">
                                    {item.image && <div style={{backgroundImage: `url(${ApiUrl}/storage/${item.image})`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover"}} className="w-[calc(100vw-70px)] h-70 sm:w-full bg-neutral-300" />}
                                    <div className="flex w-full flex-row justify-between items-end">
                                        <h4 className="font-medium text-xl">{item.attributes.name}</h4>
                                        <p className="font-semibold text-2xl text-neutral-600 dark:text-neutral-400">{item.attributes.type === "income" ? "+ " : "- "} Rp.{parseInt(item.attributes.amount, 10).toLocaleString("ID")}</p>
                                    </div>
                                    <p className="text-base font-normal self-start -mt-2">{item.attributes.description}</p>
                                    <p className="text-sm font-normal text-neutral-400 self-end">
                                        {(new Date(item.attributes.date)).toLocaleDateString("EN", {
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
                {render && <motion.div
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