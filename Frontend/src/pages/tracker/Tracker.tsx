import { useEffect, useRef, useState, type JSX } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { TrackerNavbar } from "@/components/TrackerNavbar";
import { useParams } from "react-router-dom";
import { DBaddincome, DBaddoutcome, DBgetalltransactions, DBgetonetracker } from "@/lib/db";
import axios from "axios";
import { ApiUrl } from "@/lib/variable";
import useTransition from "@/hooks/useTransition";
import { Loader2Icon } from "lucide-react";

export function Tracker(): JSX.Element {
    const { id } = useParams();

    const { render, transitionTo } = useTransition({initValue: true, transitionDelay: 600})
    
    const [ session, setSession ] = useState<"cloud" | "local" | null>(null)
    const [ data, setData ] = useState<any[]>()
    const [ chart, setChart ] = useState<any[]>([])
    const [ trackerData, setTrackerData ] = useState<{ name: string; id: number; initialBalance: number, current_balance: number } | null>(null)
    const [ pendapatanUrl, setPendapatanUrl ] = useState<string | null>(null)
    const [ pengeluaranUrl ] = useState<string | null>(null) // remove set function bcz unused
    const [ today, setToday ] = useState<string | null>(null)
    const [ balance, setBalance ] = useState<number>(0)
    const [ historyBalance, setHistoryBalance ] = useState<any[]>([])
    const [ report, setReport ] = useState<{income: number, outcome: number, balance: number}>({income: 0, outcome: 0, balance: 0})
    
    // loading bar purposes
    const [ initialLoad, setInitialLoad ] = useState<boolean>(true)
    const [ sendingRequest, setSendingRequest ] = useState<boolean>(false)
    const [ dataLoad, setDataLoad ] = useState<boolean>(false)
    const [ graphLoad, setGraphLoad ] = useState<boolean>(false)

    const [ trackerName, setTrackerName ] = useState<string>("")

    const pendapatanJudul = useRef<HTMLInputElement | null>(null)
    const pendapatanDesc = useRef<HTMLInputElement | null>(null)
    const pendapatanImage = useRef<HTMLInputElement | null>(null)
    const pendapatanDate = useRef<HTMLInputElement | null>(null)
    const [pendapatanNominal, setPendapatanNominal] = useState<string>("")

    const pengeluaranJudul = useRef<HTMLInputElement | null>(null)
    const pengeluaranDesc = useRef<HTMLInputElement | null>(null)
    const pengeluaranImage = useRef<HTMLInputElement | null>(null)
    const pengeluaranDate = useRef<HTMLInputElement | null>(null)
    const [ pengeluaranNominal, setPengeluaranNominal ] = useState<string>("")

    const [ _theme, setTheme ] = useState<"light" | "dark" | "system">("system")

    // to get all transactions and set it inside useState
    const localInitialize = async () => {
        try {
            if(id) {
                const res = await DBgetalltransactions(parseInt(id, 10))
                setData(res as any[])
            }
        } catch(err) {
            console.log(err)
        } finally {
            setInitialLoad(false)
        }
    }
    
    const cloudInitialize = async () => {
        setDataLoad(true)

        try {
            const res = await axios.get(`${ApiUrl}/trackers/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("Authorization")}`
                }
            })

            const data = await res.data

            setTrackerData(data.data.attributes)
            setBalance(Math.round(data.data.attributes.current_balance))
            setTrackerName(data.data.attributes.name)

            getCloudTransactions()
        } catch(err) {
            console.log(err)
            // add error catcher
        } finally {
            setDataLoad(false)
        }
    }

    // separate function for fetching transactions manually after recent backend changes
    const getCloudTransactions = async () => {
        setGraphLoad(true)

        try {
            const res = await axios.get(`${ApiUrl}/trackers/${id}/transactions?size=7`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("Authorization")}`
                }
            })
            const data = await res.data

            console.log("cloud fetched transactions :", data.data)
            setData(data.data)
        } catch (err) {
            console.log(err)
        } finally {
            setGraphLoad(false)
            setInitialLoad(false)
        }
    }

    // DEBUG: delete when needed
    useEffect(() => {
        console.log("updated trackerData: ", trackerData)
    }, [trackerData])

    useEffect(() => {
        console.log("updated data: ", data)
    }, [data])

    //get the tracker data for local
    const getLocalTrackerData = async () => {
        try {
            if(id) {
                const res = await DBgetonetracker(parseInt(id, 10))
                console.log("tracker data", res)
                setTrackerData(res as { name: string; id: number; initialBalance: number, current_balance: number })
            }
        } catch(err) {
            console.log(err)
        }
    }

    // need tracker data for cloud here!

    // to bloxk inapropriate character in balance input
    const balanceFilter = (value: string) => {
        const cleaned = value.replace(/[^0-9.]/g, "")
        setPendapatanNominal(cleaned)
        setPengeluaranNominal(cleaned)
    }

    // adding income function (NEED IF ELE FUNCTION FOR CLOUD)
    const addIncome = async () => {
        setSendingRequest(true)

        const judul = pendapatanJudul.current?.value
        const desc = pendapatanDesc.current?.value
        const image = pendapatanImage.current?.files?.[0]
        const dateString = pendapatanDate.current?.value
        const date = dateString ? new Date(dateString) : null
        const cleanedBalance = parseInt(pendapatanNominal.replace(/[.]/g, ""), 10)

        if(cleanedBalance && judul !== "" && judul !== undefined && date !== null && desc !== undefined && id) {
            if(session === "local") {
                try {
                    await DBaddincome(judul, desc !== "" ? desc : null, image ? image : null, date, parseInt(id, 10), cleanedBalance)
                    localInitialize()
                } catch(err) {
                    console.log(err)
                }
            }

            if(session === "cloud") {
                try {
                    const formData = new FormData()
                    formData.append('name', judul)
                    formData.append('type', 'income')
                    formData.append('amount', cleanedBalance.toString())
                    formData.append('description', desc)
                    if(image) formData.append('image', image)
                    formData.append('date', date.toISOString().slice(0, 19).replace('T', ' '))

                    const res = await axios.post(`${ApiUrl}/trackers/${id}/transactions`, formData, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("Authorization")}`
                        }
                    })

                    console.log(res)
                    cloudInitialize()
                } catch(err) {
                    console.log(err)
                }
            }
        }

        setSendingRequest(false)
    }

    // adding outcome function (NEED IF ELE FUNCTION FOR CLOUD)
    const addOutcome = async () => {
        setSendingRequest(true)

        const judul = pengeluaranJudul.current?.value
        const desc = pengeluaranDesc.current?.value
        const image = pengeluaranImage.current?.files?.[0]
        const dateString = pengeluaranDate.current?.value
        const date = dateString ? new Date(dateString) : null
        const cleanedBalance = parseInt(pengeluaranNominal.replace(/[.]/g, ""), 10)

        if(cleanedBalance && judul !== "" && judul !== undefined && date !== null && desc !== undefined && id) {
            if(session === "local") {
                try {
                    await DBaddoutcome(judul, desc !== "" ? desc : null, image ? image : null, date, parseInt(id, 10), cleanedBalance)
                    localInitialize()
                } catch(err) {
                    console.log(err)
                }
            }

            if(session === "cloud") {
                try {
                    const formData = new FormData()
                    formData.append('name', judul)
                    formData.append('type', 'expense')
                    formData.append('amount', cleanedBalance.toString())
                    formData.append('description', desc)
                    if(image) formData.append('image', image)
                    formData.append('transaction_date', date.toISOString().slice(0, 19).replace('T', ' '))

                    const res = await axios.post(`${ApiUrl}/trackers/${id}/transactions`, formData, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("Authorization")}`
                        }
                    })

                    console.log(res)
                    cloudInitialize()
                } catch(err) {
                    console.log(err)
                }
            }
        }

        setSendingRequest(false)
    }

    // parse data for transactions history (NEED IF ELSE FOR CLOUD TO WORK!) 
    const setBalanceHistory = async () => {
        if(data && session === "local") {
            const splicedData = (data.sort((a, b) => b.date - a.date)).slice(0, 3) as {name: string, date: Date, desc: string, id: number, image: File, income: number, tracker_id: number, type: string}[]

            const clearedData: {name: string, date: string, amount: string}[] = []
            splicedData.forEach((item) => {
                // solve the date object to string
                const year = item.date.getFullYear()
                const month = item.date.getMonth()
                const day = item.date.getUTCDate()
                const formattedDate = `${day}-${month}-${year}` 

                // solve the outcome income format
                const type = item.type
                const amount = item.income
                const formattedAmount = type === "income" ? `+ Rp.${amount.toLocaleString("ID")}` : `- Rp.${amount.toLocaleString("ID")}`

                clearedData.push({name: item.name, date: formattedDate, amount: formattedAmount})
                setHistoryBalance(clearedData)
            });
        }

        if(data && session === "cloud") {
            const formattedData = data            
            
            const slicedData = (formattedData.sort((a, b) => b.attributes.date - a.attributes.date)).slice(0, 3)
            
            
            const clearedData: {name: string, date: string, amount: string}[] = []

            slicedData.forEach((item) => {
                const dateObject = new Date(item.attributes.date)
                
                // solve the date object to string
                const year = dateObject.getFullYear()
                const month = dateObject.toLocaleString("ID", {
                    month: "numeric",
                })
                const day = dateObject.getDate()
                const formattedDate = `${day}-${month}-${year}`
                
                // solve the outcome income format
                const type = item.attributes.type
                const amount = parseInt(item.attributes.amount, 10)
                const formattedAmount = type === "income" ? `+ Rp.${amount.toLocaleString("ID")}` : `- Rp.${amount.toLocaleString("ID")}`
                
                clearedData.push({name: item.attributes.name, date: formattedDate, amount: formattedAmount})
            })
            
            setHistoryBalance(clearedData)
        }
    }

    // parse data for report preview (NEED IF ELSE FOR CLOUD TO WORK!) 
    const setReportPreview = () => {
        if(data && session === "local") {
            const sortData = (data.sort((a, b) => a.date - b.date)) as {name: string, date: Date, desc: string, id: number, image: File, income: number, tracker_id: number, type: string}[]

            // variable for final income and outcome
            let income = 0
            let outcome = 0
            let balance = 0
            
            sortData.forEach((item) => {
                // solve the outcome income format
                const type = item.type
                
                if(type === "income") {
                    income += item.income
                    balance += item.income
                } else {
                    outcome += item.income
                    balance -= item.income
                }
            });
            
            setReport({income: income, outcome: outcome, balance: balance})
        }

        if(data && session === "cloud") {
            const formattedData: any[] = [];

            data.forEach((item) => {
                const dateObject = new Date(item.attributes.date)
                item.attributes.date = dateObject

                return formattedData.push(item)
            })
            
            formattedData.sort((a, b) => a.attributes.date - b.attributes.date)
            
            // variable for final income and outcome
            let income = 0
            let outcome = 0
            let balance = 0
            
            formattedData.forEach((item) => {
                // solve the outcome income format
                const type = item.attributes.type
                const amount = parseInt(item.attributes.amount, 10)
                
                if(type === "income") {
                    income += amount
                    balance += amount
                } else {
                    outcome += amount
                    balance -= amount
                }
            });

            setReport({income: income, outcome: outcome, balance: balance})
        }
    }

    useEffect(() => {
        const session = localStorage.getItem("session")
        if(session === null) window.location.href = "/access"
        
        setSession(session as "cloud" | "local")
        if(session === "cloud") {
            cloudInitialize()
        }

        if(session === "local") {
            localInitialize()
            getLocalTrackerData()
        }

        getTheme()
    }, [])
    
    const getTimestampNow = () => {
        const t = new Date()

        const year = t.getFullYear()
        const month = String(t.getMonth() + 1).padStart(2, "0")
        const day = String(t.getDate()).padStart(2, "0")

        const hour = String(t.getHours()).padStart(2, "0")
        const minute = String(t.getMinutes()).padStart(2, "0")
        const second = String(t.getSeconds()).padStart(2, "0")

        setToday(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
    }

    const getTheme = () => {
        setTheme(localStorage.getItem("vite-ui-theme") as "light" | "dark" | "system")
    }

    useEffect(() => {
        if(session === "local") {            
            if(data) {
                const defaultData = data.sort((a, b) => a.date - b.date)
                let newBalance: number = trackerData?.initialBalance ?? 0;
                // get the data
                // 1. count the last balance
                defaultData?.forEach((item) => {
                    console.log(item.income, item.type)
                    if(item.type === "income") newBalance += item.income ?? 0
                    if(item.type === "outcome") newBalance -= item.income ?? 0
                });
                setBalance(newBalance)
            }
            
            // 2. build the chart
            if(data) {
                // sort the data from the newest
                let sortedData = data.sort((a, b) => b.date - a.date)
                console.log("sortedData", sortedData)
                
                // variable
                let cuttedData = []
    
                // get only 7 newest data
                const dataLength = data.length
                if(data) {
                    if(data.length > 7) {
                        cuttedData = data.slice(0, 7)
                        console.log("sliced data")
                        console.log("cuttedData", cuttedData, dataLength)
                    } else {
                        console.log("no data sliced")
                        cuttedData = sortedData
                        console.log("cuttedData", sortedData)
                    }
                }
                
                
                let balance = 0
                const arrayBalance: {date: number, balance: number}[] = []
    
                cuttedData = cuttedData.sort((a, b) => a.date - b.date)
                cuttedData.forEach(item => {
                    if (item.type === "income") balance += item.income ?? 0
                    if (item.type === "outcome") balance -= item.income ?? 0
    
                    arrayBalance.push({
                        date: new Date(item.date).getTime(),
                        balance: balance
                    })
                })
                console.log("array balance look up", arrayBalance)
    
                setChart(arrayBalance)
            }
        }
        if(session === "cloud") {
            if(data) {
                const now = new Date()

                // set transaction dates to real date obj
                const formattedData: any[] = []
                data.forEach((item) => {
                    const realDate = new Date(item.attributes.date)
                    item.attributes.date = realDate
                    formattedData.push(item)
                })

                // sort oldest to newest for chronological progression
                formattedData.sort((a, b) => a.attributes.date - b.attributes.date)

                // calculate starting balance by working backwards from current balance
                let startingBalance = balance
                for (const item of formattedData) {
                    if (item.attributes.type === "income") {
                        startingBalance -= parseInt(item.attributes.amount, 10) ?? 0
                    }
                    if (item.attributes.type === "expense") {
                        startingBalance += parseInt(item.attributes.amount, 10) ?? 0
                    }
                }

                // Build chart from oldest to newest transaction
                const arrayBalance: {date: number | string, balance: number}[] = []
                let currentBalance = startingBalance
                let hasReachedNow = false

                for (const item of formattedData) {
                    const itemDate = item.attributes.date

                    // Insert "Now" when we pass the current time
                    if (!hasReachedNow && itemDate > now) {
                        arrayBalance.push({
                            date: "Now",
                            balance: currentBalance
                        })
                        hasReachedNow = true
                    }

                    // Apply transaction to balance
                    if (item.attributes.type === "income") {
                        currentBalance += parseInt(item.attributes.amount, 10) ?? 0
                    }
                    if (item.attributes.type === "expense") {
                        currentBalance -= parseInt(item.attributes.amount, 10) ?? 0
                    }

                    arrayBalance.push({
                        date: itemDate.getTime(),
                        balance: currentBalance
                    })
                }

                // // If all transactions are in the past, add "Now" at the end
                // if (!hasReachedNow) {
                //     arrayBalance.push({
                //         date: "Now",
                //         balance: balance
                //     })
                // }
                // TOO REDUNDANT

                console.log("array balance look up", arrayBalance)
                setChart(arrayBalance)
            }
        }
    }, [data, trackerData])

    useEffect(() => {
        if (!data) return
        setBalanceHistory()
        setReportPreview()
    }, [data])

    // config for chart
    const chartConfig = {
    desktop: {
        label: "balance",
        color: "var(--chart-1)",
    },
    } satisfies ChartConfig

    return (
        <section className="flex flex-col items-center md:max-w-[650px] ">
            <TrackerNavbar render={render} backLink="/app" trackerName={trackerName ?? ""} getTheme={getTheme} onBackClick={() => transitionTo("/app")}/>
            <AnimatePresence>
                { (dataLoad || graphLoad || sendingRequest) && 
                    <motion.div
                        key={"initial-loading"}
                        layout
                        className="fixed mt-18 z-999 shadow my-2 bg-white p-1.5 rounded-full overflow-hidden dark:bg-stone-700" 
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
                            { dataLoad && !graphLoad &&
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
                                >
                                    <Loader2Icon className="size-6 animate-spin" />
                                </motion.div>
                            }
                            { graphLoad && !sendingRequest &&
                                <motion.p
                                    key={"graph-setup"}
                                    className="px-2 whitespace-nowrap"
                                    layout
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
                                >
                                    Setting the graph...
                                </motion.p>
                            }
                            { sendingRequest &&
                                <motion.p
                                    key={"sending-request"}
                                    className="px-2 whitespace-nowrap"
                                    layout
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
                                >
                                    Sending your request...
                                </motion.p>
                            }
                        </AnimatePresence>
                    </motion.div>  
                }
                {render && <motion.div
                    key={"main"}
                    className="flex flex-col items-center mt-15 w-screen px-10 sm:px-20 gap-8 md:max-w-[650px]"
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
                    <div className="w-full flex flex-col gap-3">
                        <div className="w-full">
                            <p className="font-normal text-sm text-neutral-700 dark:text-neutral-300">Your balance:</p>
                            <p className="font-semibold text-xl">Rp.{balance.toLocaleString("ID")}</p>
                        </div>
                        <div className="w-full">
                            <ChartContainer config={chartConfig}>
                                <LineChart
                                    accessibilityLayer
                                    data={chart}
                                    margin={{
                                    left: 25,
                                    right: 25,
                                    top: 25,
                                    bottom: 10
                                    }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={6}
                                        tickFormatter={value => {
                                            const d = new Date(value)
                                            if (isNaN(d.getTime())) return value
                                            return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" })
                                        }}
                                    />
                                    <YAxis
                                        domain={['dataMin', 'dataMax']}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={false}
                                        width={0}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent indicator="line" />}
                                    />
                                    <Line
                                        dataKey="balance"
                                        type='linear'
                                        fill={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                        fillOpacity={0.2}
                                        className=""
                                        stroke={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                    >
                                        <LabelList
                                            position="top"
                                            offset={12}
                                            className= {`${localStorage.getItem("vite-ui-theme") === "light" ? "fill-black/70" : "fill-white/70"}`}
                                            fontSize={12}
                                            formatter={(balance: number) => balance.toLocaleString("ID")}
                                        />
                                    </Line>
                                </LineChart>
                            </ChartContainer>
                        </div>
                        <div className="flex justify-between w-full gap-5">
                            <Dialog>
                                <DialogTrigger className="flex-1 w-full" onClick={() => getTimestampNow()}>
                                    <motion.div whileTap={{ scale: 0.95 }}><Button className="flex-1 w-full bg-green-500/80 dark:bg-violet-600 dark:border-violet-600 text-neutral-800 font-semibold hover:bg-green-500/75 dark:hover:bg-violet-500 dark:text-white cursor-pointer" onClick={() => setPendapatanUrl(null)} >+ Income</Button></motion.div>
                                </DialogTrigger>
                                <DialogContent className="flex flex-col shadow-green-300/40 dark:shadow-green-300/7 bg-white/80 dark:bg-background-primary-dark/60 backdrop-blur-2xl">
                                    <DialogTitle className="font-medium">Income</DialogTitle>
                                    <DialogDescription className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
                                            <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pendapatanJudul} placeholder="Title" />
                                            <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" value={pendapatanNominal} onChange={(e) => balanceFilter(e.target.value)} placeholder="Amount" />
                                            <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pendapatanDesc} placeholder="Description (optional)" />
                                            <div className="flex flex-row gap-2 mt-2">
                                                {/* <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pendapatanImage} type="file" onChange={(e) => {
                                                    const file = e.target.files
                                                    console.log(e.target.files)
                                                    if(file?.length === 0) {
                                                        setPendapatanUrl(null)
                                                    }
                                                    if(file?.length === 1) {
                                                        const allowed = ["image/jpeg", "image/png", "image/jpg"]
                                                        const isAllowed = allowed.includes(file[0].type)

                                                        isAllowed && setPendapatanUrl(URL.createObjectURL(file[0]))
                                                    }
                                                }} /> */}
                                                <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pendapatanDate} type="datetime-local" step={1} defaultValue={today ? today : undefined} />
                                            </div>
                                            <img src={pendapatanUrl ? pendapatanUrl : undefined} alt="" className="w-[50%] max-h-40 rounded-md" />
                                        </div>
                                        <DialogClose onClick={() => addIncome()} className="bg-green-500/80 dark:bg-violet-600 dark:text-white border-2 dark:border-violet-700 border-green-500/80 text-black font-[Inter] font-semibold py-1.5 rounded-md cursor-pointer">Add Income</DialogClose>
                                    </DialogDescription>
                                </DialogContent>
                            </Dialog>
                            <Dialog>
                                <DialogTrigger className="flex-1 w-full" onClick={() => getTimestampNow()}>
                                    <motion.div whileTap={{ scale: 0.95 }}><Button className="flex-1 w-full bg-red-500/80 font-semibold text-neutral-800 dark:bg-red-600 dark:border-red-600 hover:bg-red-400 dark:text-white cursor-pointer">- Expense</Button></motion.div>
                                </DialogTrigger>
                                <DialogContent className="flex flex-col shadow-red-400/20 dark:shadow-red-400/7 bg-white/80 dark:bg-background-primary-dark/60 backdrop-blur-2xl">
                                    <DialogTitle className="font-medium">Expense</DialogTitle>
                                    <DialogDescription className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
                                            <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pengeluaranJudul} placeholder="Title" />
                                            <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" value={pengeluaranNominal} onChange={(e) => balanceFilter(e.target.value)} placeholder="Amount" />
                                            <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pengeluaranDesc} placeholder="Description (optional)" />
                                            <div className="flex flex-row gap-2 mt-2">
                                                {/* <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pengeluaranImage} type="file" onChange={(e) => {
                                                    const file = e.target.files
                                                    console.log(e.target.files)
                                                    if(file?.length === 0) {
                                                        setPengeluaranUrl(null)
                                                    }
                                                    if(file?.length === 1) {
                                                        const allowed = ["image/jpeg", "image/png", "image/jpg"]
                                                        const isAllowed = allowed.includes(file[0].type)

                                                        isAllowed && setPengeluaranUrl(URL.createObjectURL(file[0]))
                                                    }
                                                }} /> */}
                                                <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pengeluaranDate} type="datetime-local" step={1} defaultValue={today ? today : undefined} />
                                            </div>
                                            <img src={pengeluaranUrl ? pengeluaranUrl : undefined} alt="" className="w-[50%] max-h-40 rounded-md" />
                                        </div>
                                        <DialogClose className="bg-red-500/80 dark:bg-red-600 dark:text-white border-2 border-red-500/80 text-black font-[Inter] font-semibold py-1.5 rounded-md cursor-pointer" onClick={() => addOutcome()}>Add Expense</DialogClose>
                                    </DialogDescription>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                    <div className="w-full">
                        <div className="w-full flex flex-col gap-7">
                            <div className="flex flex-col w-full">
                                <div className="flex justify-between items-center w-full">
                                    <p className="font-medium text-base">Transactions History</p>
                                    <Button disabled={initialLoad} onClick={() => transitionTo(`/app/tracker/history/${id}?name=${trackerName}`)} className="bg-background-primary-dark font-medium h-8 dark:bg-background-primary dark:text-neutral-800 dark:border text-white/95">More</Button>
                                </div>
                                {historyBalance.length === 0 && <div className="flex flex-col justify-center items-center text-center h-35">
                                    <p className="text-center font-medium text-base text-black/50 dark:text-white/50">You have very few transactions <br /> <span className="font-normal">Try adding it and see your history here.</span></p>                                
                                </div>}
                                {historyBalance && historyBalance.map((item) => (
                                    <div className="flex justify-between items-center border-b py-3">
                                        <div className="flex flex-col">
                                            <p className="font-normal text-[15px]">{item.name}</p>
                                            <p className="font-normal text-sm text-neutral-600 dark:font-medium dark:text-neutral-400">{item.date}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{item.amount}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col w-full gap-4 h-full">
                                <div className="flex justify-between items-center w-full">
                                    <p className="font-medium text-base">Report & Insight</p>
                                    <Button disabled={initialLoad} onClick={() => transitionTo(`/app/tracker/report/${id}?name=${trackerName}`)} className="bg-background-primary-dark font-medium h-8 dark:bg-background-primar dark:text-black text-white/95 dark:bg-background-primary">More</Button>
                                </div>
                                <div className="flex flex-row gap-2 h-full w-full">
                                    <div className="flex flex-row gap-2 overflow-hidden w-full">
                                        <div className="bg-white w-fit px-4 py-3 border rounded-lg flex-1 dark:bg-black/5">
                                            <p className="font-normal text-sm">Income</p>
                                            <p className="font-medium text-lg">Rp.{report.income.toLocaleString("ID")}</p>
                                        </div>
                                        <div className="bg-white w-fit px-4 py-3 border rounded-lg flex-1 dark:bg-black/5">
                                            <p className="font-normal text-sm">Expense</p>
                                            <p className="font-medium text-lg">Rp.{report.outcome.toLocaleString("ID")}</p>
                                        </div>
                                        <div className="bg-white w-fit px-4 py-3 border rounded-lg flex-1 dark:bg-black/5 hidden">
                                            <p className="font-normal text-sm text-nowrap">Last Balance</p>
                                            <p className="font-medium text-lg text-nowrap">Rp.{report.balance.toLocaleString("ID")}</p>
                                        </div>
                                        <div className="absolute w-35 h-20 right-[3%] bg-linear-to-l from-background-primary dark:from-background-primary-dark to-transparent" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-row gap-2 justify-center items-center mb-5">
                                <p className="font-medium text-sm text-black/50 -mt-2 text-center dark:text-white/50">Report & Insight overview only count the last 7 transactions.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>}
            </AnimatePresence>  
        </section>
    )
}