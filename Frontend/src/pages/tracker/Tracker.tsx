import { useEffect, useRef, useState, type JSX } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { TrackerNavbar } from "@/components/TrackerNavbar";
import { useParams } from "react-router-dom";
import { DBaddincome, DBaddoutcome, DBgetalltransactions, DBgetonetracker } from "@/lib/db";
import axios from "axios";
import { ApiUrl } from "@/lib/variable";


export function Tracker(): JSX.Element {
    const { id } = useParams();

    const [ session, setSession ] = useState<"cloud" | "local" | null>(null)
    const [ data, setData ] = useState<any[]>()
    const [ chart, setChart ] = useState<any[]>([])
    const [ trackerData, setTrackerData ] = useState<{ name: string; id: number; initialBalance: number, current_balance: number } | null>(null)
    const [ isOut, setIsOut ] = useState<boolean>(false)
    const [ pendapatanUrl, setPendapatanUrl ] = useState<string | null>(null)
    const [ pengeluaranUrl, setPengeluaranUrl ] = useState<string | null>(null)
    const [ today, setToday ] = useState<string | null>(null)
    const [ balance, setBalance ] = useState<number>(0)
    const [ historyBalance, setHistoryBalance ] = useState<any[]>([])
    const [ report, setReport ] = useState<{income: number, outcome: number, balance: number}>({income: 0, outcome: 0, balance: 0})
    

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
        }
    }
    
    const cloudInitialize = async () => {
        try {
            const res = await axios.get(`${ApiUrl}/api/trackers/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("Authorization")}`
                }
            })

            const data = await res.data

            console.log("cloud initialize data fetch", data.data.tracker)
            setData(data.data.tracker.transactions as any[])
            setTrackerData(data.data.tracker)
        } catch(err) {
            console.log(err)
            // add error catcher
        }
    }

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
                    formData.append('transaction_date', date.toISOString().slice(0, 19).replace('T', ' '))

                    const res = await axios.post(`${ApiUrl}/api/trackers/${id}/transactions`, formData, {
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
    }

    // adding outcome function (NEED IF ELE FUNCTION FOR CLOUD)
    const addOutcome = async () => {
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

                    const res = await axios.post(`${ApiUrl}/api/trackers/${id}/transactions`, formData, {
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
                const day = item.date.getDate()
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
            
            const slicedData = (formattedData.sort((a, b) => b.transaction_date - a.transaction_date)).slice(0, 3)
            const clearedData: {name: string, date: string, amount: string}[] = []
            slicedData.forEach((item) => {
                // solve the date object to string
                const year = item.transaction_date.getFullYear()
                const month = item.transaction_date.getMonth()
                const day = item.transaction_date.getDate()
                const formattedDate = `${day}-${month}-${year}`
                console.log(`${day}-${month}-${year}`, item.transaction_date)
                
                // solve the outcome income format
                const type = item.type
                const amount = parseInt(item.amount, 10)
                const formattedAmount = type === "income" ? `+ Rp.${amount.toLocaleString("ID")}` : `- Rp.${amount.toLocaleString("ID")}`

                clearedData.push({name: item.name, date: formattedDate, amount: formattedAmount})
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
                const realDate = new Date(item.transaction_date)
                item.transaction_date = realDate

                return formattedData.push(item)
            })
            
            formattedData.sort((a, b) => a.transaction_date - b.transaction_date)

            // variable for final income and outcome
            let income = 0
            let outcome = 0
            let balance = 0
            
            formattedData.forEach((item) => {
                // solve the outcome income format
                const type = item.type
                const amount = parseInt(item.amount, 10)
                
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
                setBalance(trackerData ? trackerData.current_balance : 0)

                // set the transaction date to real date
                const formattedData: any[] = []
                data.forEach((item) => {
                    const realDate = new Date(item.transaction_date)
                    item.transaction_date = realDate

                    return formattedData.push(item)
                })
                console.log("real date data", formattedData)

                // sort data from the oldest
                formattedData.sort((a, b) => a.transaction_date - b.transaction_date)
                console.log("oldest to newest data", formattedData)

                // build the chart
                let balance = 0
                const arrayBalance: {date: number, balance: number}[] = []
    
                formattedData.forEach(item => {
                    if (item.type === "income") balance += parseInt(item.amount, 10) ?? 0
                    if (item.type === "expense") balance -= parseInt(item.amount, 10) ?? 0
    
                    arrayBalance.push({
                        date: item.transaction_date.getTime(),
                        balance: balance
                    })
                })
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
        <section className="flex flex-col items-center md:max-w-[650px]">
            <TrackerNavbar setIsOut={setIsOut} isOut={isOut} backLink="/app" trackerName={trackerData?.name ?? ""} getTheme={getTheme} />
            <AnimatePresence>
                {!isOut && <motion.div
                    key={"main"}
                    className="flex flex-col items-center mt-15 w-[87%] gap-8"
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
                                <AreaChart
                                    accessibilityLayer
                                    data={chart}
                                    margin={{
                                    left: 10,
                                    right: 10,
                                    top: 10 ,
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
                                    <Area
                                        dataKey="balance"
                                        type='natural'
                                        fill={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                        fillOpacity={0.2}
                                        stroke={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </div>
                        <div className="flex justify-between w-full gap-5">
                            <Dialog>
                                <DialogTrigger className="flex-1 w-full" onClick={() => getTimestampNow()}>
                                    <motion.div whileTap={{ scale: 0.95 }}><Button className="flex-1 w-full bg-green-400/75 dark:bg-violet-600 dark:border-violet-600 text-neutral-800 font-semibold hover:bg-green-400 dark:hover:bg-violet-500 dark:text-white" onClick={() => setPendapatanUrl(null)} >+ Income</Button></motion.div>
                                </DialogTrigger>
                                <DialogContent className="flex flex-col shadow-green-300/40 dark:shadow-green-300/7 bg-white/80 dark:bg-background-primary-dark/60 backdrop-blur-2xl">
                                    <DialogTitle className="font-medium">Income</DialogTitle>
                                    <DialogDescription className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
                                            <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pendapatanJudul} placeholder="Title" />
                                            <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" value={pendapatanNominal} onChange={(e) => balanceFilter(e.target.value)} placeholder="Amount" />
                                            <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pendapatanDesc} placeholder="Description (optional)" />
                                            <div className="flex flex-row gap-2 mt-2">
                                                <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pendapatanImage} type="file" onChange={(e) => {
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
                                                }} />
                                                <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pendapatanDate} type="datetime-local" step={1} defaultValue={today ? today : undefined} />
                                            </div>
                                            <img src={pendapatanUrl ? pendapatanUrl : undefined} alt="" className="w-[50%] max-h-40 rounded-md" />
                                        </div>
                                        <DialogClose onClick={() => addIncome()} className="bg-green-400/75 dark:bg-violet-600 dark:text-white border-2 dark:border-violet-700 border-green-400 text-black font-[Inter] font-semibold py-1.5 rounded-md">Add Income</DialogClose>
                                    </DialogDescription>
                                </DialogContent>
                            </Dialog>
                            <Dialog>
                                <DialogTrigger className="flex-1 w-full" onClick={() => getTimestampNow()}>
                                    <motion.div whileTap={{ scale: 0.95 }}><Button className="flex-1 w-full bg-red-400/80 font-semibold text-neutral-800 dark:bg-red-600 dark:border-red-600 hover:bg-red-400 dark:text-white">- Expense</Button></motion.div>
                                </DialogTrigger>
                                <DialogContent className="flex flex-col shadow-red-400/20 dark:shadow-red-400/7 bg-white/80 dark:bg-background-primary-dark/60 backdrop-blur-2xl">
                                    <DialogTitle className="font-medium">Expense</DialogTitle>
                                    <DialogDescription className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
                                            <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pengeluaranJudul} placeholder="Title" />
                                            <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" value={pengeluaranNominal} onChange={(e) => balanceFilter(e.target.value)} placeholder="Amount" />
                                            <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pengeluaranDesc} placeholder="Description (optional)" />
                                            <div className="flex flex-row gap-2 mt-2">
                                                <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pengeluaranImage} type="file" onChange={(e) => {
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
                                                }} />
                                                <Input className="ring bg-white/30 dark:ring ring-black/20 dark:ring-white/20" ref={pengeluaranDate} type="datetime-local" step={1} defaultValue={today ? today : undefined} />
                                            </div>
                                            <img src={pengeluaranUrl ? pengeluaranUrl : undefined} alt="" className="w-[50%] max-h-40 rounded-md" />
                                        </div>
                                        <DialogClose className="bg-red-400/75 dark:bg-red-600 dark:text-white border-2 border-red-500 text-black font-[Inter] font-semibold py-1.5 rounded-md" onClick={() => addOutcome()}>Add Expense</DialogClose>
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
                                    <Button onClick={() => { setIsOut(true); setTimeout(() => { window.location.href = `/app/tracker/history/${trackerData?.id}`; }, 400); }} className="bg-background-primary-dark font-medium h-8 dark:bg-background-primary dark:text-neutral-800 dark:border text-white/95">More</Button>
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
                                    <Button onClick={() => {setIsOut(true); setTimeout(() => window.location.href = `/app/tracker/report/${trackerData?.id}`, 400)}} className="bg-background-primary-dark font-medium h-8 dark:bg-background-primar dark:text-black text-white/95 dark:bg-background-primary">More</Button>
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
                                        <div className="absolute w-20 h-25 left-[calc(100vw-100px)] bg-linear-to-l from-background-primary dark:from-background-primary-dark to-transparent" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-row gap-2 justify-center items-center mb-5">
                                <p className="font-medium text-sm text-black/50 -mt-2 text-center dark:text-white/50">This page only show the last 7 transactions, data may look innacurate. Please refer to our <span className="text-blue-500/50 hover:text-blue-400/50 underline" onClick={() => {setIsOut(true); setTimeout(() => window.location.href = "/faq", 600)}}>FAQ</span></p>
                            </div>
                        </div>
                    </div>
                </motion.div>}
            </AnimatePresence>  
        </section>
    )
}