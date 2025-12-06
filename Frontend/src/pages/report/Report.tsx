import { useEffect, useState, type JSX } from "react";
import { AnimatePresence, motion, MotionConfig, spring, useScroll } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRightFromBracket, faDollar, faFilter, faLock, faSun, faTriangleExclamation, faUserPen } from "@fortawesome/free-solid-svg-icons";
import { userData } from "@/lib/userData";
import { XIcon } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { TrackerNavbar } from "@/components/TrackerNavbar";
import { useParams } from "react-router-dom";
import { DBgetalltransactions, DBgetonetracker } from "@/lib/db";
import { parse } from "date-fns";

export function Report(): JSX.Element {
    const { id } = useParams()

    const [ session, setSession ] = useState<"cloud" | "local" | null>(null)
    const [ data, setData ] = useState<any[]>()
    const [ displayData, setDisplayData ] = useState<{income: number, outcome: number, incomePercentage: number, outcomePercentage: number, chartData: any[], highestIncome: number | null, highestOutcome: number | null, transactionsHistory: any[]}>({income: 0, outcome: 0, incomePercentage: 0, outcomePercentage: 0, chartData: [], highestIncome: null, highestOutcome: null, transactionsHistory: []})
    const [ historyData, setHistoryData ] = useState<any[]>([])
    const [ trackerData, setTrackerData ] = useState<{ name: string; id: number; initialBalance: number } | null>(null)

    const [ range, setRange ] = useState<number>(7)
    const [ isOut, setIsOut ] = useState<boolean>(false)
    const [ page, setPage ] = useState<number>(1)
    const [ lastPage, setLastPage ] = useState<number>(1)

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
        //
    }

    //get the tracker data for local
    const getTrackerData = async () => {
        try {
            if(id) {
                const res = await DBgetonetracker(parseInt(id, 10))
                console.log("tracker data", res)
                setTrackerData(res as { name: string; id: number; initialBalance: number })
            }
        } catch(err) {
            console.log(err)
        }
    }

    const parse7Days = () => {
        if(data) {
            const now = new Date()
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
            // count the 7 days 
            const last7Days = (data.filter(item => item.date >= sevenDaysAgo)).sort((a, b) => a.date - b.date)
            
            let sevenDaysIncome = 0
            let SevenDaysOutcome = 0
            let SevenDaysBalance = 0 // unused, for now
            last7Days.forEach((item) => {
                if(item.type === "income") sevenDaysIncome += item.income
                if(item.type === "outcome") SevenDaysOutcome += item.income
            });
            
            // count the 7 days before
            const last7DaysBefore = (data.filter(item => item.date >= fourteenDaysAgo && item.date < sevenDaysAgo)).sort((a, b) => a.date - b.date)

            let sevenDaysBeforeIncome = 0
            let sevenDaysBeforeOutcome = 0
            let sevenDaysBeforeBalance = 0 // unused, for now
            last7DaysBefore.forEach((item) => {
                if(item.type === "income") sevenDaysBeforeIncome += item.income
                if(item.type === "outcome") sevenDaysBeforeOutcome += item.income            
            })

            // calcute income message
            let incomeComparationPercentage = Math.round((sevenDaysIncome - sevenDaysBeforeIncome) / sevenDaysBeforeIncome * 100)
            if(incomeComparationPercentage === Infinity) incomeComparationPercentage = 100

            // calcute income message
            let outcomeComparationPercentage = Math.round((SevenDaysOutcome - sevenDaysBeforeOutcome) / sevenDaysBeforeOutcome * 100)
            if(outcomeComparationPercentage === Infinity) outcomeComparationPercentage = 100

            // making chart data
            let chartNowBalance = 0
            let chartReadyData: {date: number, balance: number}[] = []
            last7Days.forEach((item) => {
                if(item.type === "income") chartNowBalance += item.income
                if(item.type === "outcome") chartNowBalance -= item.income

                chartReadyData.push({date: item.date, balance: chartNowBalance})
            })
            // making first and second message
            const arraySevenDaysIncome: number[] = []
            const arraySevenDaysOutcome: number[] = []
            last7Days.forEach((item) => {
                if(item.type === "income") arraySevenDaysIncome.push(item.income)
                if(item.type === "outcome") arraySevenDaysOutcome.push(item.income) 
            })

            let highestSevenDaysIncome: number | null = Math.max(...arraySevenDaysIncome)
            if(highestSevenDaysIncome === -Infinity) highestSevenDaysIncome = null 

            let highestSevenDaysOutcome: number | null = Math.max(...arraySevenDaysOutcome)
            if(highestSevenDaysOutcome === -Infinity) highestSevenDaysOutcome = null 

            // set data
            setDisplayData({income: sevenDaysIncome, outcome: SevenDaysOutcome, incomePercentage: incomeComparationPercentage, outcomePercentage: outcomeComparationPercentage, chartData: chartReadyData, highestIncome: highestSevenDaysIncome, highestOutcome: highestSevenDaysOutcome, transactionsHistory: last7Days})
        }
    }

    const parse30Days = () => {
        if(data) {
            const now = new Date()
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    
            // count the 30 days 
            const last30Days = (data.filter(item => item.date >= thirtyDaysAgo)).sort((a, b) => a.date - b.date)
            
            let thirtyDaysIncome = 0
            let thirtyDaysOutcome = 0
            let thirtyDaysBalance = 0 // unused, for now
            last30Days.forEach((item) => {
                if(item.type === "income") thirtyDaysIncome += item.income
                if(item.type === "outcome") thirtyDaysOutcome += item.income
            });
            
            // count the 30 days before
            const last30DaysBefore = (data.filter(item => item.date >= sixtyDaysAgo && item.date < thirtyDaysAgo)).sort((a, b) => a.date - b.date)

            let thirtyDaysBeforeIncome = 0
            let thirtyDaysBeforeOutcome = 0
            let thirtyDaysBeforeBalance = 0 // unused, for now
            last30DaysBefore.forEach((item) => {
                if(item.type === "income") thirtyDaysBeforeIncome += item.income
                if(item.type === "outcome") thirtyDaysBeforeOutcome += item.income            
            })
            
            // calcute income message
            let incomeComparationPercentage = Math.round((thirtyDaysIncome - thirtyDaysBeforeIncome) / thirtyDaysBeforeIncome * 100)
            if(incomeComparationPercentage === Infinity) incomeComparationPercentage = 100

            // calcute income message
            let outcomeComparationPercentage = Math.round((thirtyDaysOutcome - thirtyDaysBeforeOutcome) / thirtyDaysBeforeOutcome * 100)
            if(outcomeComparationPercentage === Infinity) outcomeComparationPercentage = 100

            // making chart data
            let chartNowBalance = 0
            let chartReadyData: {date: number, balance: number}[] = []
            last30Days.forEach((item) => {
                if(item.type === "income") chartNowBalance += item.income
                if(item.type === "outcome") chartNowBalance -= item.income

                chartReadyData.push({date: item.date, balance: chartNowBalance})
            })

            // making first and second message
            const arrayThirtyDaysIncome: number[] = []
            const arrayThirtyDaysOutcome: number[] = []
            last30Days.forEach((item) => {
                if(item.type === "income") arrayThirtyDaysIncome.push(item.income)
                if(item.type === "outcome") arrayThirtyDaysOutcome.push(item.income) 
            })

            let highestThirtyDaysIncome: number | null = Math.max(...arrayThirtyDaysIncome)
            if(highestThirtyDaysIncome === -Infinity) highestThirtyDaysIncome = null 

            let highestThirtyDaysOutcome: number | null = Math.max(...arrayThirtyDaysOutcome)
            if(highestThirtyDaysOutcome === -Infinity) highestThirtyDaysOutcome = null 

            setDisplayData({income: thirtyDaysIncome, outcome: thirtyDaysOutcome, incomePercentage: incomeComparationPercentage, outcomePercentage: outcomeComparationPercentage, chartData: chartReadyData, highestIncome: highestThirtyDaysIncome, highestOutcome: highestThirtyDaysOutcome, transactionsHistory: last30Days})
        }
    }

    const parse1Year = () => {
        if(data) {
            const now = new Date()
            const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)
    
            // count the 1 year 
            const last1Year = (data.filter(item => item.date >= oneYearAgo)).sort((a, b) => a.date - b.date)
            
            let oneYearIncome = 0
            let oneYearOutcome = 0
            let oneYearBalance = 0 // unused, for now
            last1Year.forEach((item) => {
                if(item.type === "income") oneYearIncome += item.income
                if(item.type === "outcome") oneYearOutcome += item.income
            });
            
            // count the 1 year before
            const last1YearBefore = (data.filter(item => item.date >= twoYearsAgo && item.date < oneYearAgo)).sort((a, b) => a.date - b.date)

            let oneYearBeforeIncome = 0
            let oneYearBeforeOutcome = 0
            let oneYearBeforeBalance = 0 // unused, for now
            last1YearBefore.forEach((item) => {
                if(item.type === "income") oneYearBeforeIncome += item.income
                if(item.type === "outcome") oneYearBeforeOutcome += item.income            
            })
            
            // calcute income message
            let incomeComparationPercentage = Math.round((oneYearIncome - oneYearBeforeIncome) / oneYearBeforeIncome * 100)
            if(incomeComparationPercentage === Infinity) incomeComparationPercentage = 100

            // calcute income message
            let outcomeComparationPercentage = Math.round((oneYearOutcome - oneYearBeforeOutcome) / oneYearBeforeOutcome * 100)
            if(outcomeComparationPercentage === Infinity) outcomeComparationPercentage = 100

            // making chart data
            let chartNowBalance = 0
            let chartReadyData: {date: number, balance: number}[] = []
            last1Year.forEach((item) => {
                if(item.type === "income") chartNowBalance += item.income
                if(item.type === "outcome") chartNowBalance -= item.income

                chartReadyData.push({date: item.date, balance: chartNowBalance})
            })

            // making first and second message
            const arrayOneYearIncome: number[] = []
            const arrayOneYearOutcome: number[] = []
            last1Year.forEach((item) => {
                if(item.type === "income") arrayOneYearIncome.push(item.income)
                if(item.type === "outcome") arrayOneYearOutcome.push(item.income) 
            })

            let highestOneYearIncome: number | null = Math.max(...arrayOneYearIncome)
            if(highestOneYearIncome === -Infinity) highestOneYearIncome = null 

            let highestOneYearOutcome: number | null = Math.max(...arrayOneYearOutcome)
            if(highestOneYearOutcome === -Infinity) highestOneYearOutcome = null 

            setDisplayData({income: oneYearIncome, outcome: oneYearOutcome, incomePercentage: incomeComparationPercentage, outcomePercentage: outcomeComparationPercentage, chartData: chartReadyData, highestIncome: highestOneYearIncome, highestOutcome: highestOneYearOutcome, transactionsHistory: last1Year})
        }
    }

    const setHistory = () => {
        const size = 10
        const offset = (page - 1) * size

        const uncleanedData: any[] = (displayData.transactionsHistory).sort((a, b) => b.date - a.date)
        const cleanedData: any[] = []

        uncleanedData.forEach(item => {
            if(item.image) {
                const image = item.image
                const url = URL.createObjectURL(image)
                item.image = url
            }
            cleanedData.push(item)
        })

        // calculate last page
        const total = cleanedData.length
        const pages = Math.ceil(total / size)
        setLastPage(pages)

        // paginate
        const paginatedData = cleanedData.slice((offset), size * page)
        console.log("history Data", paginatedData)
        setHistoryData(paginatedData)
    }


    useEffect(() => {
        getTrackerData()
        
        const session = localStorage.getItem("session")
        if(session === null) window.location.href = "/access"
        
        setSession(session as "cloud" | "local")
        if(session === "cloud") cloudInitialize()
        if(session === "local") localInitialize()

    }, [])

    useEffect(() => {
        if(range === 7) parse7Days()
        if(range === 30) parse30Days()
        if(range === 365) parse1Year()
    }, [range, data])

    useEffect(() => {
        setHistory()
    }, [displayData, page])

    const changePage = (direction: "up" | "down" | "first" | "last") => {
        if(direction === "first") setPage(1)
        if(direction === "last") setPage(lastPage)
        if(direction === "down" && page !== 1) setPage(prev => prev -= 1) 
        if(direction === "up" && page !== lastPage) setPage(prev => prev += 1) 
    }

    const chartData = [
    { date: "11/2/25", desktop: 2200700 },
    { date: "11/3/25", desktop: 2300750 },
    { date: "11/2/25", desktop: 2320000 },
    { date: "11/2/25", desktop: 2100000 },
    { date: "11/2/25", desktop: 1950000 },
    ]
    
    const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "var(--chart-1)",
    },
    } satisfies ChartConfig

    return (
        <section className="flex flex-col items-center">
            <TrackerNavbar setIsOut={setIsOut} isOut={isOut} trackerName="My New Tracker" backLink={`/app/tracker/${id}`} />
            <AnimatePresence>
                {!isOut && <motion.div
                    className="w-full flex flex-col items-center"
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
                    <div className="mt-18 mb-3 flex flex-row justify-between w-fit gap-4 relative">
                        {[
                            { value: 7, label: "7 hari" },
                            { value: 30, label: "30 hari" },
                            { value: 365, label: "1 tahun" }
                        ].map(item => (
                            <button
                                key={item.value}
                                onClick={() => setRange(item.value)}
                                className="relative px-3 py-1 rounded-full backdrop-blur-[2px] text-sm font-medium text-neutral-800"
                            >
                                {range === item.value && (
                                    <motion.div
                                        className="absolute inset-0 bg-green-300/50 rounded-full"
                                        layoutId="active-pill"
                                    />
                                )}
                                <span className="relative z-10">{item.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-col items-center w-[87%] gap-3">
                        <div className="flex justify-between w-full">
                            <h3 className="text-sm font-regular">Laporan & Insight</h3>
                        </div>
                        <div className="w-full flex flex-col gap-3.5">
                            <div className="bg-white flex flex-col w-full justify-center items-start p-4 rounded-xl">
                                <p className="font-normal text-base">Saldo Akhir</p>
                                <p className="font-medium text-lg">Rp.3.796.105</p>
                            </div>
                            <div className="flex flex-row gap-3.5">
                                <div className="bg-white flex flex-col w-full justify-center items-start p-4 rounded-xl gap-1 h-fit">
                                    <div className="flex flex-col">
                                        <p className="font-normal text-base">Pemasukkan</p>
                                        <p className="font-medium text-lg">Rp.406.105</p>
                                    </div>
                                    <p className="text-sm font-normal text-neutral-600">- 12% dari bulan lalu</p>
                                </div>
                                <div className="bg-white flex flex-col w-full justify-center items-start p-4 rounded-xl gap-1 h-fit">
                                    <div className="flex flex-col">
                                        <p className="font-normal text-base">Pengeluaran</p>
                                        <p className="font-medium text-lg">Rp.738.067</p>
                                    </div>
                                    <p className="text-sm font-normal text-neutral-600">+ 6% dari bulan lalu</p>
                                </div>
                            </div>
                        </div>
                        <div className="w-full bg-white p-3 rounded-xl">
                            <ChartContainer config={chartConfig}>
                                <AreaChart
                                    accessibilityLayer
                                    data={chartData}
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
                                        tickFormatter={value => value}
                                    />
                                    <YAxis
                                        domain={['dataMin - 50000', 'dataMax + 50000']}
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
                                        dataKey="desktop"
                                        type='natural'
                                        fill="#16E716"
                                        fillOpacity={0.2}
                                        stroke="#16E716"
                                    />
                                </AreaChart>
                            </ChartContainer>
                            <div className="flex flex-col gap-3 px-3">
                                <div className="flex justify-start items-center gap-2">
                                    <FontAwesomeIcon icon={faDollar} className="text-green-600/70" />
                                    <p className="text-sm font-normal text-neutral-700">Pemasukkan terbanyak Rp.12.000 di hari sabtu</p>
                                </div>
                                <div className="flex justify-start items-center gap-2">
                                    <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-500/80" />
                                    <p className="text-sm font-normal text-neutral-700">Pengeluaran terbanyak ada di makanan</p>
                                </div>
                                <div className="flex justify-start items-center gap-2">
                                    <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-500/80" />
                                    <p className="text-sm font-normal text-neutral-700">Pengeluaran terbanyak Rp.35.000 di hari rabu</p>
                                </div>
                            </div>
                        </div>
                        <div className="w-full flex flex-col gap-2 mt-2">
                            <h3 className="text-sm font-regular">Riwayat dalam rentang 7 hari</h3>
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
                            <motion.div
                                className="w-full bg-background-primary flex justify-center items-center h-15"
                            >
                        <Pagination className="relative">
                            <PaginationContent className="relative">
                                <PaginationItem onClick={() => changePage("first")} className={`${page === 1 && "opacity-0"}`}>
                                    <PaginationPrevious />
                                </PaginationItem>
                                <PaginationItem onClick={() => changePage("down")} className={`${page === 1 && "opacity-0"}`}>
                                    <PaginationLink>1</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink isActive className="bg-green-400/60 text-white">
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
                            </motion.div>
                        </div>
                    </div>
                </motion.div>}
            </AnimatePresence>
        </section>
    )
}