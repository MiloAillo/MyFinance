import { useEffect, useState, type JSX } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDollar, faQuestion, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { TrackerNavbar } from "@/components/TrackerNavbar";
import { useParams } from "react-router-dom";
import { DBgetalltransactions, DBgetonetracker } from "@/lib/db";
import axios from "axios";
import { ApiUrl } from "@/lib/variable";

export function Report(): JSX.Element {
    const { id } = useParams()

    const [ session, setSession ] = useState<"cloud" | "local" | null>(null)
    const [ data, setData ] = useState<any[]>()
    const [ displayData, setDisplayData ] = useState<{income: number, outcome: number, incomePercentage: number, outcomePercentage: number, chartData: any[], highestIncome: number | null, highestOutcome: number | null, transactionsHistory: any[]}>({income: 0, outcome: 0, incomePercentage: 0, outcomePercentage: 0, chartData: [], highestIncome: null, highestOutcome: null, transactionsHistory: []})
    const [ historyData, setHistoryData ] = useState<any[]>([])
    const [ _theme, setTheme ] = useState<"light" | "dark" | "system">("system")
    const [ _trackerData, setTrackerData ] = useState<{ name: string; id: number; initialBalance: number } | null>(null)

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
        console.log("cloud initialize triggered!")
        try {
            const res = await axios.get(`${ApiUrl}/api/trackers/${id}/all/transactions`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("Authorization")}`
                }
            })
            const data = await res.data
            const transactions = data.data.tracker.transactions

            // change everything to real date
            transactions.map((item: {amount: any, description: null | string, image: null | string, name: string, type: "income" | "expense", transaction_date: string | Date}) => {
                const realDate = new Date(item.transaction_date)
                const realAmount = parseInt(item.amount, 10)
                item.transaction_date = realDate
                item.amount = realAmount
                return item
            })
            console.log("cloud initialize data", transactions)
            setData(transactions)
        } catch(err) {
            console.log(err)
        }
    }

    //get the tracker data for local
    const getLocalTrackerData = async () => {
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
        if(data && session === "local") {
            const now = new Date()
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
            // count the 7 days 
            const last7Days = (data.filter(item => item.date >= sevenDaysAgo)).sort((a, b) => a.date - b.date)
            
            let sevenDaysIncome = 0
            let SevenDaysOutcome = 0
            last7Days.forEach((item) => {
                if(item.type === "income") sevenDaysIncome += item.income
                if(item.type === "outcome") SevenDaysOutcome += item.income
            });
            
            // count the 7 days before
            const last7DaysBefore = (data.filter(item => item.date >= fourteenDaysAgo && item.date < sevenDaysAgo)).sort((a, b) => a.date - b.date)

            let sevenDaysBeforeIncome = 0
            let sevenDaysBeforeOutcome = 0
            last7DaysBefore.forEach((item) => {
                if(item.type === "income") sevenDaysBeforeIncome += item.income
                if(item.type === "outcome") sevenDaysBeforeOutcome += item.income            
            })

            // calcute income message
            let incomeComparationPercentage = Math.round((sevenDaysIncome - sevenDaysBeforeIncome) / sevenDaysBeforeIncome * 100)
            if(incomeComparationPercentage === Infinity || Number.isNaN(incomeComparationPercentage)) incomeComparationPercentage = NaN

            // calcute income message
            let outcomeComparationPercentage = Math.round((SevenDaysOutcome - sevenDaysBeforeOutcome) / sevenDaysBeforeOutcome * 100)
            if(outcomeComparationPercentage === Infinity || Number.isNaN(outcomeComparationPercentage)) outcomeComparationPercentage = NaN

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

        if(data && session === "cloud") {
            const now = new Date()
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
            // count the 7 days 
            const last7Days = (data.filter(item => item.transaction_date >= sevenDaysAgo)).sort((a, b) => a.transaction_date - b.transaction_date)
            console.log("last 7 days data", last7Days)
            
            let sevenDaysIncome = 0
            let SevenDaysOutcome = 0
            last7Days.forEach((item) => {
                if(item.type === "income") sevenDaysIncome += item.amount
                if(item.type === "expense") SevenDaysOutcome += item.amount
            });
            console.log("seven days income outcome", sevenDaysIncome, SevenDaysOutcome)
            
            // // count the 7 days before
            const last7DaysBefore = (data.filter(item => item.transaction_date >= fourteenDaysAgo && item.transaction_date < sevenDaysAgo)).sort((a, b) => a.date - b.date)
            console.log("last 7 days before data", last7DaysBefore)

            let sevenDaysBeforeIncome = 0
            let sevenDaysBeforeOutcome = 0
            last7DaysBefore.forEach((item) => {
                if(item.type === "income") sevenDaysBeforeIncome += item.amount
                if(item.type === "expense") sevenDaysBeforeOutcome += item.amount            
            })
            console.log("seven days before income outcome", sevenDaysBeforeIncome, sevenDaysBeforeOutcome)

            // calcute income message
            let incomeComparationPercentage = Math.round((sevenDaysIncome - sevenDaysBeforeIncome) / sevenDaysBeforeIncome * 100)
            if(incomeComparationPercentage === Infinity || Number.isNaN(incomeComparationPercentage)) incomeComparationPercentage = NaN

            // calcute income message
            let outcomeComparationPercentage = Math.round((SevenDaysOutcome - sevenDaysBeforeOutcome) / sevenDaysBeforeOutcome * 100)
            if(outcomeComparationPercentage === Infinity || Number.isNaN(outcomeComparationPercentage)) outcomeComparationPercentage = NaN

            // making chart data
            let chartNowBalance = 0
            let chartReadyData: {date: number, balance: number}[] = []
            last7Days.forEach((item) => {
                if(item.type === "income") chartNowBalance += item.amount
                if(item.type === "expense") chartNowBalance -= item.amount

                chartReadyData.push({date: item.transaction_date.getTime(), balance: chartNowBalance})
            })
            // making first and second message
            const arraySevenDaysIncome: number[] = []
            const arraySevenDaysOutcome: number[] = []
            last7Days.forEach((item) => {
                if(item.type === "income") arraySevenDaysIncome.push(item.amount)
                if(item.type === "expense") arraySevenDaysOutcome.push(item.amount) 
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
        if(data && session === "local") {
            const now = new Date()
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    
            // count the 30 days 
            const last30Days = (data.filter(item => item.date >= thirtyDaysAgo)).sort((a, b) => a.date - b.date)
            
            let thirtyDaysIncome = 0
            let thirtyDaysOutcome = 0
            last30Days.forEach((item) => {
                if(item.type === "income") thirtyDaysIncome += item.income
                if(item.type === "outcome") thirtyDaysOutcome += item.income
            });
            
            // count the 30 days before
            const last30DaysBefore = (data.filter(item => item.date >= sixtyDaysAgo && item.date < thirtyDaysAgo)).sort((a, b) => a.date - b.date)

            let thirtyDaysBeforeIncome = 0
            let thirtyDaysBeforeOutcome = 0
            last30DaysBefore.forEach((item) => {
                if(item.type === "income") thirtyDaysBeforeIncome += item.income
                if(item.type === "outcome") thirtyDaysBeforeOutcome += item.income            
            })
            
            // calcute income message
            let incomeComparationPercentage = Math.round((thirtyDaysIncome - thirtyDaysBeforeIncome) / thirtyDaysBeforeIncome * 100)
            if(incomeComparationPercentage === Infinity || Number.isNaN(incomeComparationPercentage)) incomeComparationPercentage = NaN

            // calcute income message
            let outcomeComparationPercentage = Math.round((thirtyDaysOutcome - thirtyDaysBeforeOutcome) / thirtyDaysBeforeOutcome * 100)
            if(outcomeComparationPercentage === Infinity || Number.isNaN(incomeComparationPercentage)) outcomeComparationPercentage = NaN

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

        if(data && session === "cloud") {
            const now = new Date()
            const sevenDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            const fourteenDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    
            // count the 7 days 
            const last7Days = (data.filter(item => item.transaction_date >= sevenDaysAgo)).sort((a, b) => a.transaction_date - b.transaction_date)
            console.log("last 7 days data", last7Days)
            
            let sevenDaysIncome = 0
            let SevenDaysOutcome = 0
            last7Days.forEach((item) => {
                if(item.type === "income") sevenDaysIncome += item.amount
                if(item.type === "expense") SevenDaysOutcome += item.amount
            });
            console.log("seven days income outcome", sevenDaysIncome, SevenDaysOutcome)
            
            // // count the 7 days before
            const last7DaysBefore = (data.filter(item => item.transaction_date >= fourteenDaysAgo && item.transaction_date < sevenDaysAgo)).sort((a, b) => a.date - b.date)
            console.log("last 7 days before data", last7DaysBefore)

            let sevenDaysBeforeIncome = 0
            let sevenDaysBeforeOutcome = 0
            last7DaysBefore.forEach((item) => {
                if(item.type === "income") sevenDaysBeforeIncome += item.amount
                if(item.type === "expense") sevenDaysBeforeOutcome += item.amount            
            })
            console.log("seven days before income outcome", sevenDaysBeforeIncome, sevenDaysBeforeOutcome)

            // calcute income message
            let incomeComparationPercentage = Math.round((sevenDaysIncome - sevenDaysBeforeIncome) / sevenDaysBeforeIncome * 100)
            if(incomeComparationPercentage === Infinity || Number.isNaN(incomeComparationPercentage)) incomeComparationPercentage = NaN

            // calcute income message
            let outcomeComparationPercentage = Math.round((SevenDaysOutcome - sevenDaysBeforeOutcome) / sevenDaysBeforeOutcome * 100)
            if(outcomeComparationPercentage === Infinity || Number.isNaN(outcomeComparationPercentage)) outcomeComparationPercentage = NaN

            // making chart data
            let chartNowBalance = 0
            let chartReadyData: {date: number, balance: number}[] = []
            last7Days.forEach((item) => {
                if(item.type === "income") chartNowBalance += item.amount
                if(item.type === "expense") chartNowBalance -= item.amount

                chartReadyData.push({date: item.transaction_date.getTime(), balance: chartNowBalance})
            })
            // making first and second message
            const arraySevenDaysIncome: number[] = []
            const arraySevenDaysOutcome: number[] = []
            last7Days.forEach((item) => {
                if(item.type === "income") arraySevenDaysIncome.push(item.amount)
                if(item.type === "expense") arraySevenDaysOutcome.push(item.amount) 
            })

            let highestSevenDaysIncome: number | null = Math.max(...arraySevenDaysIncome)
            if(highestSevenDaysIncome === -Infinity) highestSevenDaysIncome = null 

            let highestSevenDaysOutcome: number | null = Math.max(...arraySevenDaysOutcome)
            if(highestSevenDaysOutcome === -Infinity) highestSevenDaysOutcome = null 

            // set data
            setDisplayData({income: sevenDaysIncome, outcome: SevenDaysOutcome, incomePercentage: incomeComparationPercentage, outcomePercentage: outcomeComparationPercentage, chartData: chartReadyData, highestIncome: highestSevenDaysIncome, highestOutcome: highestSevenDaysOutcome, transactionsHistory: last7Days})
        }
    }

    const parse1Year = () => {
        if(data && session === "local") {
            const now = new Date()
            const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)
    
            // count the 1 year 
            const last1Year = (data.filter(item => item.date >= oneYearAgo)).sort((a, b) => a.date - b.date)
            
            let oneYearIncome = 0
            let oneYearOutcome = 0
            last1Year.forEach((item) => {
                if(item.type === "income") oneYearIncome += item.income
                if(item.type === "outcome") oneYearOutcome += item.income
            });
            
            // count the 1 year before
            const last1YearBefore = (data.filter(item => item.date >= twoYearsAgo && item.date < oneYearAgo)).sort((a, b) => a.date - b.date)

            let oneYearBeforeIncome = 0
            let oneYearBeforeOutcome = 0
            last1YearBefore.forEach((item) => {
                if(item.type === "income") oneYearBeforeIncome += item.income
                if(item.type === "outcome") oneYearBeforeOutcome += item.income            
            })
            
            // calcute income message
            let incomeComparationPercentage = Math.round((oneYearIncome - oneYearBeforeIncome) / oneYearBeforeIncome * 100)
            if(incomeComparationPercentage === Infinity || Number.isNaN(incomeComparationPercentage)) incomeComparationPercentage = NaN

            // calcute income message
            let outcomeComparationPercentage = Math.round((oneYearOutcome - oneYearBeforeOutcome) / oneYearBeforeOutcome * 100)
            if(outcomeComparationPercentage === Infinity || Number.isNaN(incomeComparationPercentage)) outcomeComparationPercentage = NaN

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

        if(data && session === "cloud") {
            const now = new Date()
            const sevenDaysAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            const fourteenDaysAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)
    
            // count the 7 days 
            const last7Days = (data.filter(item => item.transaction_date >= sevenDaysAgo)).sort((a, b) => a.transaction_date - b.transaction_date)
            console.log("last 7 days data", last7Days)
            
            let sevenDaysIncome = 0
            let SevenDaysOutcome = 0
            last7Days.forEach((item) => {
                if(item.type === "income") sevenDaysIncome += item.amount
                if(item.type === "expense") SevenDaysOutcome += item.amount
            });
            console.log("seven days income outcome", sevenDaysIncome, SevenDaysOutcome)
            
            // // count the 7 days before
            const last7DaysBefore = (data.filter(item => item.transaction_date >= fourteenDaysAgo && item.transaction_date < sevenDaysAgo)).sort((a, b) => a.date - b.date)
            console.log("last 7 days before data", last7DaysBefore)

            let sevenDaysBeforeIncome = 0
            let sevenDaysBeforeOutcome = 0
            last7DaysBefore.forEach((item) => {
                if(item.type === "income") sevenDaysBeforeIncome += item.amount
                if(item.type === "expense") sevenDaysBeforeOutcome += item.amount            
            })
            console.log("seven days before income outcome", sevenDaysBeforeIncome, sevenDaysBeforeOutcome)

            // calcute income message
            let incomeComparationPercentage = Math.round((sevenDaysIncome - sevenDaysBeforeIncome) / sevenDaysBeforeIncome * 100)
            if(incomeComparationPercentage === Infinity || Number.isNaN(incomeComparationPercentage)) incomeComparationPercentage = NaN

            // calcute income message
            let outcomeComparationPercentage = Math.round((SevenDaysOutcome - sevenDaysBeforeOutcome) / sevenDaysBeforeOutcome * 100)
            if(outcomeComparationPercentage === Infinity || Number.isNaN(outcomeComparationPercentage)) outcomeComparationPercentage = NaN

            // making chart data
            let chartNowBalance = 0
            let chartReadyData: {date: number, balance: number}[] = []
            last7Days.forEach((item) => {
                if(item.type === "income") chartNowBalance += item.amount
                if(item.type === "expense") chartNowBalance -= item.amount

                chartReadyData.push({date: item.transaction_date.getTime(), balance: chartNowBalance})
            })
            // making first and second message
            const arraySevenDaysIncome: number[] = []
            const arraySevenDaysOutcome: number[] = []
            last7Days.forEach((item) => {
                if(item.type === "income") arraySevenDaysIncome.push(item.amount)
                if(item.type === "expense") arraySevenDaysOutcome.push(item.amount) 
            })

            let highestSevenDaysIncome: number | null = Math.max(...arraySevenDaysIncome)
            if(highestSevenDaysIncome === -Infinity) highestSevenDaysIncome = null 

            let highestSevenDaysOutcome: number | null = Math.max(...arraySevenDaysOutcome)
            if(highestSevenDaysOutcome === -Infinity) highestSevenDaysOutcome = null 

            // set data
            setDisplayData({income: sevenDaysIncome, outcome: SevenDaysOutcome, incomePercentage: incomeComparationPercentage, outcomePercentage: outcomeComparationPercentage, chartData: chartReadyData, highestIncome: highestSevenDaysIncome, highestOutcome: highestSevenDaysOutcome, transactionsHistory: last7Days})
        }
    }

    const setHistory = () => {
        if(session === "local") {
            const size = 5
            const offset = (page - 1) * size
    
            const uncleanedData: any[] = (displayData.transactionsHistory).sort((a, b) => b.date - a.date)
            const cleanedData: any[] = []
    
            uncleanedData.forEach(item => {
                if(item.image) {
                    const image = item.image
                    const url = URL.createObjectURL(image)
                    item.imageUrl = url
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

        if(session === "cloud") {
            const size = 5
            const offset = (page - 1) * size
    
            const cleanedData: any[] = (displayData.transactionsHistory).sort((a, b) => b.transaction_date - a.transaction_date)
    
            // calculate last page
            const total = cleanedData.length
            const pages = Math.ceil(total / size)
            setLastPage(pages)
    
            // paginate
            const paginatedData = cleanedData.slice((offset), size * page)
            console.log("history Data", paginatedData)
            setHistoryData(paginatedData)
        }
    }


    useEffect(() => {
        
        const session = localStorage.getItem("session")
        if(session === null) window.location.href = "/access"
        
        setSession(session as "cloud" | "local")
        if(session === "cloud") cloudInitialize()
        if(session === "local") {
            localInitialize()
            getLocalTrackerData()
        }

        getTheme()
    }, [])

    useEffect(() => {
        if(range === 7) parse7Days()
        if(range === 30) parse30Days()
        if(range === 365) parse1Year()

        setPage(1)
    }, [range, data])

    useEffect(() => {
        setHistory()
        console.log(displayData)
    }, [displayData, page])

    const changePage = (direction: "up" | "down" | "first" | "last") => {
        if(direction === "first") setPage(1)
        if(direction === "last") setPage(lastPage)
        if(direction === "down" && page !== 1) setPage(prev => prev -= 1) 
        if(direction === "up" && page !== lastPage) setPage(prev => prev += 1) 
    }

    const getTheme = () => {
        setTheme(localStorage.getItem("vite-ui-theme") as "light" | "dark" | "system")
    }
    
    const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "var(--chart-1)",
    },
    } satisfies ChartConfig

    return (
        <section className="flex flex-col items-center">
            <TrackerNavbar setIsOut={setIsOut} isOut={isOut} trackerName="My New Tracker" backLink={`/app/tracker/${id}`} getTheme={getTheme}/>
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
                    {session === "local" && displayData.transactionsHistory.length >= 3 && <div className="flex flex-col items-center w-[87%] gap-3">
                        <div className="flex justify-between w-full">
                            <h3 className="text-sm font-regular">Report & Insight</h3>
                        </div>
                        <div className="w-full flex flex-col gap-3.5">
                            {/* <div className="bg-white flex flex-col w-full justify-center items-start p-4 rounded-xl">
                                <p className="font-normal text-base">Saldo Akhir</p>
                                <p className="font-medium text-lg">Rp.3.796.105</p>
                            </div> */}
                            <div className="flex flex-row gap-3.5">
                                <div className="bg-white flex flex-col w-full justify-center items-start p-4 rounded-xl gap-1 h-fit dark:dark:bg-black/5 dark:ring dark:ring-white/10">
                                    <div className="flex flex-col">
                                        <p className="font-normal text-base">Income</p>
                                        <p className="font-medium text-lg">Rp.{displayData.income.toLocaleString("ID")}</p>
                                    </div>
                                    {Number.isNaN(displayData.incomePercentage) && null}
                                    {!Number.isNaN(displayData.incomePercentage) && 
                                        <div>
                                            <p className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
                                                {displayData.incomePercentage}% from {range === 7 ? "last week" : range === 30 ? "last month" : "last year"}
                                            </p>
                                        </div>
                                    }
                                </div>
                                <div className="bg-white flex flex-col w-full justify-center items-start p-4 rounded-xl gap-1 h-fit dark:dark:bg-black/5 dark:ring dark:ring-white/10">
                                    <div className="flex flex-col">
                                        <p className="font-normal text-base">Expense</p>
                                        <p className="font-medium text-lg">Rp.{displayData.outcome.toLocaleString("ID")}</p>
                                    </div>
                                    {Number.isNaN(displayData.outcomePercentage) && null}
                                    {!Number.isNaN(displayData.outcomePercentage) && 
                                        <div>
                                            <p className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
                                                {displayData.outcomePercentage}% from {range === 7 ? "last week" : range === 30 ? "last month" : "last year"}
                                            </p>
                                        </div>
                                    }                                
                                </div>
                            </div>
                        </div>
                        <div className="w-full bg-white p-3 rounded-xl dark:dark:bg-black/5 dark:ring dark:ring-white/10">
                            <ChartContainer config={chartConfig}>
                                <AreaChart
                                    accessibilityLayer
                                    data={displayData.chartData}
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
                                    <Area
                                        dataKey="balance"
                                        type='natural'
                                        fill={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                        fillOpacity={0.2}
                                        stroke={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                    />
                                </AreaChart>
                            </ChartContainer>
                            <div className="flex flex-col gap-3 px-3">
                                {displayData.highestIncome &&                                
                                    <div className="flex justify-start items-center gap-2">
                                        <FontAwesomeIcon icon={faDollar} className="text-green-600/70" />
                                        <p className="text-sm font-normal text-neutral-700 dark:text-neutral-300">Your biggest income {range === 7 ? "this week" : range === 30 ? "this month" : "this year"} is Rp.{displayData.highestIncome?.toLocaleString("ID")}</p>
                                    </div>
                                }
                                {displayData.highestOutcome &&                                
                                    <div className="flex justify-start items-center gap-2">
                                        <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-500/80" />
                                        <p className="text-sm font-normal text-neutral-700 dark:text-neutral-300">Your biggest outcome {range === 7 ? "this week" : range === 30 ? "this month" : "this year"} is Rp.{displayData.highestOutcome?.toLocaleString("ID")}</p>
                                    </div>
                                }
                            </div>
                        </div>
                        <div className="w-full flex flex-col gap-2 mt-2">
                            <h3 className="text-sm font-regular">Transaction History Within {range === 7 ? "7 Days" : range === 30 ? "1 Month" : "1 Year"}</h3>
                            {historyData.map(item => (
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
                                        {item.date.toLocaleDateString("ENG", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric"
                                        })}
                                    </p>
                                </DialogContent>
                            </Dialog>
                            ))}
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
                        </div>
                    </div>}
                    {session === "cloud" && displayData.transactionsHistory.length >= 3 && <div className="flex flex-col items-center w-[87%] gap-3">
                        <div className="flex justify-between w-full">
                            <h3 className="text-sm font-regular">Report & Insight</h3>
                        </div>
                        <div className="w-full flex flex-col gap-3.5">
                            {/* <div className="bg-white flex flex-col w-full justify-center items-start p-4 rounded-xl">
                                <p className="font-normal text-base">Saldo Akhir</p>
                                <p className="font-medium text-lg">Rp.3.796.105</p>
                            </div> */}
                            <div className="flex flex-row gap-3.5">
                                <div className="bg-white flex flex-col w-full justify-center items-start p-4 rounded-xl gap-1 h-fit dark:dark:bg-black/5 dark:ring dark:ring-white/10">
                                    <div className="flex flex-col">
                                        <p className="font-normal text-base">Income</p>
                                        <p className="font-medium text-lg">Rp.{displayData.income.toLocaleString("ID")}</p>
                                    </div>
                                    {Number.isNaN(displayData.incomePercentage) && null}
                                    {!Number.isNaN(displayData.incomePercentage) && 
                                        <div>
                                            <p className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
                                                {displayData.incomePercentage}% from {range === 7 ? "last week" : range === 30 ? "last month" : "last year"}
                                            </p>
                                        </div>
                                    }
                                </div>
                                <div className="bg-white flex flex-col w-full justify-center items-start p-4 rounded-xl gap-1 h-fit dark:dark:bg-black/5 dark:ring dark:ring-white/10">
                                    <div className="flex flex-col">
                                        <p className="font-normal text-base">Expense</p>
                                        <p className="font-medium text-lg">Rp.{displayData.outcome.toLocaleString("ID")}</p>
                                    </div>
                                    {Number.isNaN(displayData.outcomePercentage) && null}
                                    {!Number.isNaN(displayData.outcomePercentage) && 
                                        <div>
                                            <p className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
                                                {displayData.outcomePercentage}% from {range === 7 ? "last week" : range === 30 ? "last month" : "last year"}
                                            </p>
                                        </div>
                                    }                                
                                </div>
                            </div>
                        </div>
                        <div className="w-full bg-white p-3 rounded-xl dark:dark:bg-black/5 dark:ring dark:ring-white/10">
                            <ChartContainer config={chartConfig}>
                                <AreaChart
                                    accessibilityLayer
                                    data={displayData.chartData}
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
                                    <Area
                                        dataKey="balance"
                                        type='natural'
                                        fill={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                        fillOpacity={0.2}
                                        stroke={localStorage.getItem("vite-ui-theme") === "light" ? "#16E716" : "#6703DC"}
                                    />
                                </AreaChart>
                            </ChartContainer>
                            <div className="flex flex-col gap-3 px-3">
                                {displayData.highestIncome &&                                
                                    <div className="flex justify-start items-center gap-2">
                                        <FontAwesomeIcon icon={faDollar} className="text-green-600/70" />
                                        <p className="text-sm font-normal text-neutral-700 dark:text-neutral-300">Your biggest income {range === 7 ? "this week" : range === 30 ? "this month" : "this year"} is Rp.{displayData.highestIncome?.toLocaleString("ID")}</p>
                                    </div>
                                }
                                {displayData.highestOutcome &&                                
                                    <div className="flex justify-start items-center gap-2">
                                        <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-500/80" />
                                        <p className="text-sm font-normal text-neutral-700 dark:text-neutral-300">Your biggest outcome {range === 7 ? "this week" : range === 30 ? "this month" : "this year"} is Rp.{displayData.highestOutcome?.toLocaleString("ID")}</p>
                                    </div>
                                }
                            </div>
                        </div>
                        <div className="w-full flex flex-col gap-2 mt-2">
                            <h3 className="text-sm font-regular">Transactions History Within {range === 7 ? "7 Days" : range  === 30 ? "1 Month" : "1 Year"}</h3>
                            {historyData?.map(item => (
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
                                        {(new Date(item.transaction_date)).toLocaleDateString("ENG", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric"
                                        })}
                                    </p>
                                </DialogContent>
                            </Dialog>
                            ))}
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
                        </div>
                    </div>}
                    {displayData.transactionsHistory.length < 3 && <div className="flex flex-col items-center gap-5 justify-center h-50 px-5">
                        <FontAwesomeIcon icon={faQuestion} className="text-7xl text-black/40" />
                        <p className="text-center font-medium text-base text-black/50">You have very few transactions <br /> <span className="font-normal">Unfortunately, we cannot generate your report.</span></p>
                    </div>}
                </motion.div>}
            </AnimatePresence>
        </section>
    )
}