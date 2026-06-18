import { useEffect, useState, type JSX } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDollar, faQuestion, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { TrackerNavbar } from "@/components/TrackerNavbar";
import { useParams, useSearchParams } from "react-router-dom";
import { DBgetalltransactions, DBgetonetracker } from "@/lib/db";
import axios from "axios";
import { ApiUrl } from "@/lib/variable";
import useTransition from "@/hooks/useTransition";
import { Loader2Icon } from "lucide-react";

export type displayDataTypes = {
    present_expenses_max: number
    present_incomes_max: number
    old_expenses_max: number
    old_incomes_max: number
    present_incomes_total: number
    present_expenses_total: number
    old_incomes_total: number
    old_expenses_total: number
    incomes_percentage_change: number
    expenses_percentage_change: number
    chart_data: {date: Date, balance: number}[]
    present_incomes_chart: {date: Date, balance: number}[]
    present_expenses_chart: {date: Date, balance: number}[]
    old_incomes_chart: {date: Date, balance: number}[]
    old_expenses_chart: {date: Date, balance: number}[]
    transactionHistory: any[]
}

export function ReportCloud(): JSX.Element {
    const { id } = useParams()
    const [ searchParams ] = useSearchParams() 

    const { render, transitionTo } = useTransition({initValue: true, transitionDelay: 600})

    const [ trackerName, setTrackerName ] = useState<string>("")

    const [ displayData, setDisplayData ] = useState<displayDataTypes>({
        present_expenses_max: 0,
        present_incomes_max: 0,
        old_expenses_max: 0,
        old_incomes_max: 0,
        present_incomes_total: 0,
        present_expenses_total: 0,
        old_incomes_total: 0,
        old_expenses_total: 0,
        incomes_percentage_change: NaN,
        expenses_percentage_change: NaN,
        chart_data: [],
        present_incomes_chart: [],
        present_expenses_chart: [],
        old_incomes_chart: [],
        old_expenses_chart: [],
        transactionHistory: []
    })
    // when transactionHistory populated, useEffect should catch it and populate paginated data here for display
    const [ transactionsDisplay, setTransactionsDisplay ] = useState<any[]>([])
    
    const [ loading, setLoading ] = useState<boolean>(false)
    const [ historyLoading, setHistoryLoading ] = useState<boolean>(false)
    
    const [ range, setRange ] = useState<number>(7)
    const [ page, setPage ] = useState<number>(1)
    const [ lastPage, setLastPage ] = useState<number>(1)

    useEffect(() => {
        // fetch name so it doesnt wait for backend response
        setTrackerName(searchParams.get("name") ?? "")
        
        // kick if user dont have proper session
        const session = localStorage.getItem("session")
        if(session !== "cloud") window.location.href = "/access"
        
        // initialize 
        cloudInitialize()
    }, [])

    // re-fetch when user change time range
    useEffect(() => {
        cloudInitialize()
        setPage(1)
    }, [range])

    // populate paginated transaction (useState transactionsDisplay)
    useEffect(() => {
        console.log("triggered")

        setTransactionsDisplay([])

        if(displayData.transactionHistory.length !== 0) {
            const size = 5
            const lastPage = Math.ceil(displayData.transactionHistory.length / size)
            const sliceFrom = (page - 1) * size
            const sliceTo = page * size

            const transactionsDisplayData = displayData.transactionHistory.slice(sliceFrom, sliceTo)

            console.log(transactionsDisplayData)
            
            setLastPage(lastPage)
            setTransactionsDisplay(transactionsDisplayData)
        }

    }, [displayData, page])
    
    const cloudInitialize = async () => {
        setLoading(true)

        try {

            const res = await axios.get(`${ApiUrl}/trackers/${id}/reports?range[days]=${range}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("Authorization")}`
                }
            })  

            const fetchedData = await res.data.data

            parseCloudRequest(fetchedData)
        } catch(err) {
            console.log(err)
        }
    }

    const parseCloudRequest = (fetchedData: any) => {        
        // Step 1. buat array isinya chart compatible -> ex: {date, type, amounts}
        let chartArray = []

        // Step 2. mapping semua variable dari response
        const present_expenses = fetchedData?.present?.expenses.transactions as {id: string, amount: string, date: string}[] | null
        const present_incomes = fetchedData?.present?.income.transactions as {id: string, amount: string, date: string}[] | null
        const old_expenses = fetchedData?.old?.expenses.transactions as {id: string, amount: string, date: string}[] | null
        const old_incomes = fetchedData?.old?.income.transactions as {id: string, amount: string, date: string}[] | null

        let present_expenses_max = fetchedData?.present?.expenses.max
        let present_incomes_max = fetchedData?.present?.income.max
        let old_expenses_max = fetchedData?.old?.expenses.max
        let old_incomes_max = fetchedData?.old?.income.max

        if(present_expenses_max) present_expenses_max = parseInt(present_expenses_max, 10)
        if(present_incomes_max) present_incomes_max = parseInt(present_incomes_max, 10)
        if(old_expenses_max) old_expenses_max = parseInt(old_expenses_max, 10)
        if(old_incomes_max) old_incomes_max = parseInt(old_incomes_max, 10)
        
        let present_expenses_total = fetchedData?.present?.expenses.total
        let present_incomes_total = fetchedData?.present?.income.total
        let old_expenses_total = fetchedData?.old?.expenses.total
        let old_incomes_total = fetchedData?.old?.income.total

        if(present_expenses_total) present_expenses_total = parseInt(present_expenses_total, 10)
        if(present_incomes_total) present_incomes_total = parseInt(present_incomes_total, 10)
        if(old_expenses_total) old_expenses_total = parseInt(old_expenses_total, 10)
        if(old_incomes_total) old_incomes_total = parseInt(old_incomes_total, 10)

        // step 2.5: Hitung Percentage Change buat income sama expense
        let income_percentage_change = NaN
        let expense_percentage_change = NaN
        
        // there must be an IF here to check if the variable down is not null but somehow it broke when i add it so yh
        income_percentage_change = ((present_incomes_total - old_incomes_total) / old_incomes_total) * 100
        expense_percentage_change = ((present_expenses_total - old_expenses_total) / old_expenses_total) * 100

        console.log(income_percentage_change, expense_percentage_change)

        if(income_percentage_change === Infinity || Number.isNaN(income_percentage_change)) income_percentage_change = NaN
        if(expense_percentage_change === Infinity || Number.isNaN(expense_percentage_change)) expense_percentage_change = NaN

        if(!Number.isNaN(income_percentage_change)) income_percentage_change = Math.round(income_percentage_change)
        if(!Number.isNaN(expense_percentage_change)) expense_percentage_change = Math.round(expense_percentage_change)

        // step 2.6: Merge semua transaction jadi satu dan sorting ke paling old dan fix tanggal nya
        chartArray = []

        if (present_incomes && present_expenses) {
            chartArray.push(
                ...present_incomes.map((t: any) => ({...t, type: "income"})),
                ...present_expenses.map((t: any) => ({...t, type: "expense"})),
            )
        }
        
        chartArray.forEach(transactions => {
            const realDate = new Date(transactions.date)
            transactions.date = realDate

            const realAmount = parseInt(transactions.amount, 10)
            transactions.amount = realAmount
        })

        chartArray.sort((a, b) => a.date - b.date)


        // step 3: Calculate cumulative balance for chart data
        let chartNowBalance = 0
        let chartReadyData: {date: Date, balance: number}[] = []

        chartArray.forEach((transaction: any) => {
            if(transaction.type === "income") chartNowBalance += transaction.amount
            if(transaction.type === "expense") chartNowBalance -= transaction.amount
            
            chartReadyData.push({date: transaction.date, balance: chartNowBalance})
        })


        // step 4: Generate income present & old chart and expense present & old chart
        // incomes present
        let incomesPresentChart: {date: Date, balance: number}[] = []

        if(present_incomes && present_incomes.length !== 0) {
            let nowBalance = 0

            present_incomes.forEach((transaction: {id: string, amount: string, date: string}) => {
                const amount = parseInt(transaction.amount, 10)
                const date = new Date(transaction.date)
                nowBalance += amount

                incomesPresentChart.push({date: date, balance: nowBalance})
            })
        }
        
        // expenses present
        let expensesPresentChart: {date: Date, balance: number}[] = []

        if(present_expenses && present_expenses.length !== 0) {
            let nowBalance = 0

            present_expenses.forEach((transaction: {id: string, amount: string, date: string}) => {
                const amount = parseInt(transaction.amount, 10)
                const date = new Date(transaction.date)
                nowBalance += amount

                expensesPresentChart.push({date: date, balance: nowBalance})
            })
        }

        // incomes old
        let incomesOldChart: {date: Date, balance: number}[] = []

        if(old_incomes && old_incomes.length !== 0) {
            let nowBalance = 0

            old_incomes.forEach((transaction: {id: string, amount: string, date: string}) => {
                const amount = parseInt(transaction.amount, 10)
                const date = new Date(transaction.date)
                nowBalance += amount

                incomesOldChart.push({date: date, balance: nowBalance})
            })
        }

        // expenses old
        let expensesOldChart: {date: Date, balance: number}[] = []

        if(old_expenses && old_expenses.length !== 0) {
            let nowBalance = 0

            old_expenses.forEach((transaction: {id: string, amount: string, date: string}) => {
                const amount = parseInt(transaction.amount, 10)
                const date = new Date(transaction.date)
                nowBalance += amount

                expensesOldChart.push({date: date, balance: nowBalance})
            })
        }

        // step 5. Append append ke variable buat useState
        let displayData: displayDataTypes = {
            present_expenses_max: present_expenses_max,
            present_incomes_max: present_incomes_max,
            old_expenses_max: old_expenses_max,
            old_incomes_max: old_incomes_max,
            present_incomes_total: present_incomes_total,
            present_expenses_total: present_expenses_total,
            old_incomes_total: old_incomes_total,
            old_expenses_total: old_expenses_total,
            incomes_percentage_change: income_percentage_change,
            expenses_percentage_change: expense_percentage_change,
            chart_data: chartReadyData,
            present_incomes_chart: incomesPresentChart,
            present_expenses_chart: expensesPresentChart,
            old_incomes_chart: incomesOldChart,
            old_expenses_chart: expensesOldChart,
            transactionHistory: chartArray
        }
        // displayData.income = parseInt(present_incomes_total, 10)
        // displayData.outcome = parseInt(present_expenses_total, 10)
        // displayData.incomePercentage = income_percentage_change
        // displayData.outcomePercentage = expense_percentage_change
        // displayData.highestIncome = parseInt(present_incomes_max, 10)
        // displayData.highestOutcome = parseInt(present_expenses_max, 10)
        // displayData.chartData = chartReadyData
        // displayData.transactionsHistory = chartArray

        
        setDisplayData(displayData)
        setLoading(false)
        
        // DEBUGGING PURPOSES
        console.log("")
        console.log("===[START: All Parsing Variable Data]===")
        console.log("present_expenses :", present_expenses)
        console.log("present_incomes :", present_incomes)
        console.log("old_expenses :", old_expenses)
        console.log("old_incomes :", old_incomes)
        console.log("present_expenses_max :", present_expenses_max)
        console.log("present_incomes_max :", present_incomes_max)
        console.log("old_expenses_max :", old_expenses_max)
        console.log("old_incomes_max :", old_incomes_max)
        console.log("present_expenses_total :", present_expenses_total)
        console.log("present_incomes_total :", present_incomes_total)
        console.log("old_expenses_total :", old_expenses_total)
        console.log("old_incomes_total :", old_incomes_total)
        console.log("income_percentage_change :", income_percentage_change)
        console.log("expense_percentage_change :", expense_percentage_change)
        console.log("chartReadyData :", chartReadyData)
        console.log("expensesPresentChart :", expensesPresentChart)
        console.log("incomesPresentChart :", incomesPresentChart)
        console.log("expensesOldChart :", expensesOldChart)
        console.log("incomesOldChart :", incomesOldChart)
        console.log("===[END: All Parsing Variable Data]===")
        console.log("")
    }

    // page change system
    const changePage = (direction: "up" | "down" | "first" | "last") => {
        if(direction === "first") setPage(1)
            if(direction === "last") setPage(lastPage)
                if(direction === "down" && page !== 1) setPage(prev => prev -= 1) 
        if(direction === "up" && page !== lastPage) setPage(prev => prev += 1) 
    }

    const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "var(--chart-1)",
    },
    } satisfies ChartConfig

    return (
        <section className="flex flex-col items-center w-full md:max-w-[650px] sm:px-15 px-10">
            <TrackerNavbar render={render} trackerName={trackerName} backLink={`/app/tracker/${id}`} onBackClick={() => transitionTo(`/app/tracker/${id}`)}/>
                    { (loading || historyLoading) &&
                        <motion.div
                            key={"loading-div"}
                            layout
                            className="fixed mt-29 z-999 shadow my-2 bg-white p-1.5 rounded-full overflow-hidden dark:bg-stone-700"
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
                                { loading && !historyLoading &&
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
                                { historyLoading &&
                                    <motion.p
                                        key={"history-loading"}
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
                                        getting transactions...
                                    </motion.p>
                                }
                            </AnimatePresence>
                        </motion.div>  
                    }            
            <AnimatePresence>
                {render && <motion.div
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

                    {/* range pill */}
                    <div className="mt-18 mb-3 flex flex-row justify-between w-fit gap-4 relative">
                        {[
                            { value: 7, label: "7 days" },
                            { value: 30, label: "30 days" },
                            { value: 365, label: "1 year" }
                        ].map(item => (
                            <button
                                key={item.value}
                                onClick={() => setRange(item.value)}
                                className="relative px-3 py-1 rounded-full backdrop-blur-[2px] text-sm font-medium text-neutral-800 dark:text-neutral-200"
                            >
                                {range === item.value && (
                                    <motion.div
                                        className="absolute inset-0 bg-green-300/50 dark:bg-violet-600 rounded-full"
                                        layoutId="active-pill"
                                    />
                                )}
                                <span className="relative z-10">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* render if chart data more than 3, else it will fallback plain text error */}
                    {displayData.chart_data.length >= 3 && 
                        <div className="flex flex-col items-center w-[87%] gap-3">

                            <div className="flex justify-between w-full">
                                <h3 className="text-sm font-regular">Report & Insight</h3>
                            </div>

                            <div className="flex flex-row gap-3.5 w-full">

                                <Dialog>
                                    
                                    {/* Income Card */}
                                    <DialogTrigger className="bg-white flex flex-col w-full justify-center items-start p-4 rounded-xl gap-1 h-fit dark:dark:bg-black/5 dark:ring dark:ring-white/10 text-start">
                                        <div className="flex flex-col items-start">
                                            <p className="font-normal text-base">Income</p>
                                            <p className="font-medium text-lg">Rp.{displayData.present_incomes_total.toLocaleString("ID")}</p>
                                        </div>
                                        {!Number.isNaN(displayData.incomes_percentage_change) && 
                                            <div>
                                                <p className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
                                                    {displayData.incomes_percentage_change}% from {range === 7 ? "last week" : range === 30 ? "last month" : "last year"}
                                                </p>
                                            </div>
                                        }
                                    </DialogTrigger>
                                    
                                    {/* Income Popout */}
                                    <DialogContent className="bg-white/85 dark:bg-stone-600/10 backdrop-blur-2xl max-h-[80%] overflow-y-scroll">

                                        <div>
                                            { displayData.present_incomes_chart.length !== 0 && 
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <p className="font-normal opacity-85">
                                                            {range === 7 ? "This week incomes"
                                                                : range === 30 ? "This month incomes"
                                                                : range === 365 ? "This year incomes"
                                                                : "present incomes"     
                                                            }
                                                        </p>

                                                        <p className="font-semibold text-xl opacity-75">
                                                            Rp.{displayData.present_incomes_total.toLocaleString("ID")}
                                                        </p>
                                                    </div>

                                                    <ChartContainer config={chartConfig}>
                                                        <LineChart
                                                            accessibilityLayer
                                                            data={displayData.present_incomes_chart}
                                                            margin={{
                                                            left: 20,
                                                            right: 20,
                                                            top: 10 ,
                                                            bottom: 10
                                                            }}
                                        
                                                        >
                                                            <CartesianGrid vertical={false} />
                                                            <XAxis
                                                                dataKey="date"
                                                                tickLine={true}
                                                                axisLine={true}
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
                                                            <Line
                                                                dataKey="balance"
                                                                type='linear'
                                                                fill={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                                                fillOpacity={0.2}
                                                                stroke={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                                            />
                                                        </LineChart>
                                                    </ChartContainer>
                                                </div>
                                            }
                                            { displayData.present_incomes_chart.length === 0 &&
                                                <div className="w-full flex justify-center items-center h-10 opacity-30">
                                                    <p>No data to show</p>
                                                </div>
                                            }
                                        </div>
                                        
                                        <div className="flex flex-row justify-center relative my-2 items-center gap-3">
                                            
                                            <div className="w-full h-0.5 bg-black/30 dark:bg-white/30 rounded-full" />

                                            <p className="-translate-y-1 font-semibold text-nowrap opacity-90">
                                                {
                                                    displayData.incomes_percentage_change >= 0 && "+ "
                                                }
                                                {
                                                    Number.isNaN(displayData.incomes_percentage_change) 
                                                    ? "0%"
                                                    : displayData.incomes_percentage_change + "%"
                                                }
                                                {" "}
                                                {
                                                    range === 7 ? "from last week"
                                                        : range === 30 ? "from last month"
                                                        : range === 365 ? "from last year"
                                                        : "from last time range"
                                                }
                                            </p>

                                            <div className="w-full h-0.5 bg-black/30 dark:bg-white/30 rounded-full" />

                                        </div>
                                        
                                        <div className="">
                                            { displayData.old_incomes_chart.length !== 0 && 
                                                <div className="-mb-4">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <p className="font-normal opacity-85">
                                                            {range === 7 ? "Last week incomes"
                                                                : range === 30 ? "Last month incomes"
                                                                : range === 365 ? "Last year incomes"
                                                                : "present incomes"     
                                                            }
                                                        </p>

                                                        <p className="font-semibold text-xl opacity-75">
                                                            Rp.{displayData.old_incomes_total.toLocaleString("ID")}
                                                        </p>
                                                    </div>

                                                    <ChartContainer config={chartConfig}>
                                                        <LineChart
                                                            accessibilityLayer
                                                            data={displayData.old_incomes_chart}
                                                            margin={{
                                                            left: 20,
                                                            right: 20,
                                                            top: 10 ,
                                                            bottom: 10
                                                            }}
                                        
                                                        >
                                                            <CartesianGrid vertical={false} />
                                                            <XAxis
                                                                dataKey="date"
                                                                tickLine={true}
                                                                axisLine={true}
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
                                                            <Line
                                                                dataKey="balance"
                                                                type='linear'
                                                                fill={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                                                fillOpacity={0.2}
                                                                stroke={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                                            />
                                                        </LineChart>
                                                    </ChartContainer>
                                                </div>
                                            }
                                            { displayData.old_incomes_chart.length === 0 &&
                                                <div className="w-full flex justify-center items-center h-10 opacity-30">
                                                    <p>No data to show</p>
                                                </div>
                                            }
                                        </div>

                                    </DialogContent>
                                
                                </Dialog>
                                
                                <Dialog>

                                    {/* Expense Card */}
                                    <DialogTrigger className="bg-white flex flex-col w-full justify-center items-start p-4 rounded-xl gap-1 h-fit dark:dark:bg-black/5 dark:ring dark:ring-white/10">
                                        <div className="flex flex-col">
                                            <p className="font-normal text-base">Expense</p>
                                            <p className="font-medium text-lg">Rp.{displayData.present_expenses_total.toLocaleString("ID")}</p>
                                        </div>
                                        {!Number.isNaN(displayData.expenses_percentage_change) && 
                                            <div>
                                                <p className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
                                                    {displayData.expenses_percentage_change}% from {range === 7 ? "last week" : range === 30 ? "last month" : "last year"}
                                                </p>
                                            </div>
                                        }                                
                                    </DialogTrigger>

                                    {/* Expense Popout */}
                                    <DialogContent className="bg-white/85 dark:bg-stone-600/10 backdrop-blur-2xl">

                                        <div>
                                            { displayData.present_expenses_chart.length !== 0 && 
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <p className="font-normal opacity-85">
                                                            {range === 7 ? "This week expenses"
                                                                : range === 30 ? "This month expenses"
                                                                : range === 365 ? "This year expenses"
                                                                : "present expenses"     
                                                            }
                                                        </p>

                                                        <p className="font-semibold text-xl opacity-75">
                                                            Rp.{displayData.present_expenses_total.toLocaleString("ID")}
                                                        </p>
                                                    </div>

                                                    <ChartContainer config={chartConfig}>
                                                        <LineChart
                                                            accessibilityLayer
                                                            data={displayData.present_expenses_chart}
                                                            margin={{
                                                            left: 20,
                                                            right: 20,
                                                            top: 10 ,
                                                            bottom: 10
                                                            }}
                                        
                                                        >
                                                            <CartesianGrid vertical={false} />
                                                            <XAxis
                                                                dataKey="date"
                                                                tickLine={true}
                                                                axisLine={true}
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
                                                            <Line
                                                                dataKey="balance"
                                                                type='linear'
                                                                fill={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                                                fillOpacity={0.2}
                                                                stroke={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                                            />
                                                        </LineChart>
                                                    </ChartContainer>
                                                </div>
                                            }
                                            { displayData.present_expenses_chart.length === 0 &&
                                                <div className="w-full flex justify-center items-center h-10 opacity-30">
                                                    <p>No data to show</p>
                                                </div>
                                            }
                                        </div>
                                        
                                        <div className="flex flex-row justify-center relative my-2 items-center gap-3">
                                            
                                            <div className="w-full h-0.5 bg-black/30 dark:bg-white/30 rounded-full" />

                                            <p className="-translate-y-1 font-semibold text-nowrap opacity-90">
                                                {
                                                    displayData.expenses_percentage_change >= 0 && "+ "
                                                }
                                                {
                                                    Number.isNaN(displayData.expenses_percentage_change) 
                                                    ? "0%"
                                                    : displayData.expenses_percentage_change + "%"
                                                }
                                                {" "}
                                                {
                                                    range === 7 ? "from last week"
                                                        : range === 30 ? "from last month"
                                                        : range === 365 ? "from last year"
                                                        : "from last time range"
                                                }
                                            </p>

                                            <div className="w-full h-0.5 bg-black/30 dark:bg-white/30 rounded-full" />

                                        </div>
                                        
                                        <div className="">
                                            { displayData.old_expenses_chart.length !== 0 && 
                                                <div className="-mb-4">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <p className="font-normal opacity-85">
                                                            {range === 7 ? "Last week expenses"
                                                                : range === 30 ? "Last month expenses"
                                                                : range === 365 ? "Last year expenses"
                                                                : "present expenses"     
                                                            }
                                                        </p>

                                                        <p className="font-semibold text-xl opacity-75">
                                                            Rp.{displayData.old_expenses_total.toLocaleString("ID")}
                                                        </p>
                                                    </div>

                                                    <ChartContainer config={chartConfig}>
                                                        <LineChart
                                                            accessibilityLayer
                                                            data={displayData.old_expenses_chart}
                                                            margin={{
                                                            left: 20,
                                                            right: 20,
                                                            top: 10 ,
                                                            bottom: 10
                                                            }}
                                        
                                                        >
                                                            <CartesianGrid vertical={false} />
                                                            <XAxis
                                                                dataKey="date"
                                                                tickLine={true}
                                                                axisLine={true}
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
                                                            <Line
                                                                dataKey="balance"
                                                                type='linear'
                                                                fill={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                                                fillOpacity={0.2}
                                                                stroke={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                                            />
                                                        </LineChart>
                                                    </ChartContainer>
                                                </div>
                                            }
                                            { displayData.old_expenses_chart.length === 0 &&
                                                <div className="w-full flex justify-center items-center h-10 opacity-30">
                                                    <p>No data to show</p>
                                                </div>
                                            }
                                        </div>

                                    </DialogContent>

                                </Dialog>


                            </div>
                            
                            {/* Chart Card */}
                            <div className="w-full bg-white p-3 rounded-xl dark:bg-black/5 dark:ring dark:ring-white/10">
                                
                                {/* Chart */}
                                <ChartContainer config={chartConfig}>
                                    <LineChart
                                        accessibilityLayer
                                        data={displayData.chart_data}
                                        margin={{
                                        left: 20,
                                        right: 20,
                                        top: 10 ,
                                        bottom: 10
                                        }}
                    
                                    >
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickLine={true}
                                            axisLine={true}
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
                                        <Line
                                            dataKey="balance"
                                            type='linear'
                                            fill={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                            fillOpacity={0.2}
                                            stroke={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                        />
                                    </LineChart>
                                </ChartContainer>

                                {/* Alert Strings under chart */}
                                <div className="flex flex-col gap-3 px-3">
                                    {displayData.present_incomes_max &&                                
                                        <div className="flex justify-start items-center gap-2">
                                            <FontAwesomeIcon icon={faDollar} className="text-green-600/70" />
                                            <p className="text-sm font-normal text-neutral-700 dark:text-neutral-300">Your biggest income {range === 7 ? "this week" : range === 30 ? "this month" : "this year"} is Rp.{displayData.present_incomes_max?.toLocaleString("ID")}</p>
                                        </div>
                                    }
                                    {displayData.present_expenses_max &&                                
                                        <div className="flex justify-start items-center gap-2">
                                            <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-500/80" />
                                            <p className="text-sm font-normal text-neutral-700 dark:text-neutral-300">Your biggest outcome {range === 7 ? "this week" : range === 30 ? "this month" : "this year"} is Rp.{displayData.present_expenses_max?.toLocaleString("ID")}</p>
                                        </div>
                                    }
                                </div>

                            </div>

                            {/* transactions */}
                            <div className="w-full flex flex-col gap-2 mt-2">
                                <h3 className="text-sm font-regular">Transactions History Within {range === 7 ? "7 Days" : range  === 30 ? "1 Month" : "1 Year"}</h3>
                                
                                {/* render transaction display when there is more than 1 data */}
                                { transactionsDisplay.length !== 0 && transactionsDisplay?.map((item: any) => (
                                    <Dialog key={item.id}>
                                        <DialogTrigger className="flex w-full bg-white rounded-md dark:bg-black/5 dark:border">
                                            <div className="flex w-full text-start justify-between flex-1 p-3">
                                                <div className="flex flex-col w-full pb-5 gap-0.5">
                                                    <div className="flex w-full flex-col flex-1">
                                                        <p className="text-sm font-normal">{item.name}</p>
                                                        <p className="font-semibold text-base">{item.type === "income" ? "+ " : "- "} Rp.{item.amount.toLocaleString("ID")}</p>
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
                                            <div className="flex w-full flex-row justify-between items-end">
                                                <h4 className="font-medium text-xl">{item.name}</h4>
                                                <p className="font-semibold text-2xl text-neutral-600 dark:text-neutral-400">{item.type === "income" ? "+ " : "- "} Rp.{item.amount.toLocaleString("ID")}</p>
                                            </div>
                                            <p className="text-base font-normal self-start -mt-2">{item.description}</p>
                                            <p className="text-sm font-normal text-neutral-400 self-end">
                                                {item.date.toLocaleDateString("en-US", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric"
                                                })}
                                            </p>
                                        </DialogContent>
                                    </Dialog>
                                ))}

                                { transactionsDisplay.length !== 0 &&
                                    <motion.div
                                        className="w-full bg-background-primary flex justify-center items-center h-15 dark:bg-background-primary-dark"
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
                                    </motion.div>
                                }

                                { transactionsDisplay.length === 0 &&
                                    <div className="w-full text-dark/40 dark:text-white/30 flex justify-center mt-3">
                                        <p className="font-normal text-sm">No transactions to show</p>
                                    </div>
                                }

                            </div>

                        </div>
                    }
                    {displayData.chart_data.length < 3 && <div className="flex flex-col items-center gap-5 justify-center h-50 px-5">
                        <FontAwesomeIcon icon={faQuestion} className="text-7xl text-black/40 dark:text-stone-300/65" />
                        <p className="text-center font-medium text-base text-black/50 dark:text-stone-200/75">You have very few transactions <br /> <span className="font-normal">Unfortunately, we cannot generate your report.</span></p>
                    </div>}
                </motion.div>}
            </AnimatePresence>
        </section>

        // <div>

        // </div>
    )
}