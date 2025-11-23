import { useState, type JSX } from "react";
import { AnimatePresence, motion, spring } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRightFromBracket, faLock, faMagnifyingGlass, faSun, faUserPen } from "@fortawesome/free-solid-svg-icons";
import { Input } from "@/components/ui/input";
import { userData } from "@/lib/userData";
import { XIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";


export function Tracker(): JSX.Element {
    const [ isAccountOpen, setIsAccountOpen ] = useState<boolean>(false)


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
            <div className="flex flex-col items-center mt-15 w-[87%] gap-8">
                <div className="w-full flex flex-col gap-3">
                    <div className="w-full">
                        <p className="font-normal text-sm">Saldo kamu:</p>
                        <p className="font-semibold text-xl">Rp.3.750.000</p>
                    </div>
                    <div className="w-full">
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
                    </div>
                    <div className="flex justify-between w-full gap-5">
                        <Button className="flex-1 bg-white border-2 border-green-300 text-neutral-800">+ Pendapatan</Button>
                        <Button className="flex-1 bg-white border-2 border-red-300 text-neutral-800">- Pengeluaran</Button>
                    </div>
                </div>
                <div className="w-full">
                    <div className="w-full flex flex-col gap-7">
                        <div className="flex flex-col w-full">
                            <div className="flex justify-between items-center w-full">
                                <p className="font-medium text-base">Riwayat Pengeluaran</p>
                                <Button className="bg-white border-2 border-neutral-200 text-neutral-800 font-medium h-8">Lihat</Button>
                            </div>
                            <div className="flex justify-between items-center border-b py-3">
                                <div className="flex flex-col">
                                    <p className="font-normal text-[15px]">Gajian</p>
                                    <p className="font-normal text-sm text-neutral-600">2 hari lalu</p>
                                </div>
                                <div>
                                    <p className="font-medium text-sm">+ Rp.2.500.000</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-b py-3">
                                <div className="flex flex-col">
                                    <p className="font-normal text-[15px]">Jajan</p>
                                    <p className="font-normal text-sm text-neutral-600">5 hari lalu</p>
                                </div>
                                <div>
                                    <p className="font-medium text-sm">- Rp.100.000</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-b py-3">
                                <div className="flex flex-col">
                                    <p className="font-normal text-[15px]">Nemu duit</p>
                                    <p className="font-normal text-sm text-neutral-600">2 minggu lalu</p>
                                </div>
                                <div>
                                    <p className="font-medium text-sm">- Rp.2.000</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col w-full gap-4 h-full">
                            <div className="flex justify-between items-center w-full">
                                <p className="font-medium text-base">Laporan & Insight</p>
                                <Button className="bg-white border-2 border-neutral-200 text-neutral-800 font-medium h-8">Lihat</Button>
                            </div>
                            <div className="flex flex-row gap-2 h-full">
                                <div className="flex flex-row gap-2 overflow-hidden w-full">
                                    <div className="bg-white w-fit px-4 py-3 border rounded-lg flex-1">
                                        <p className="font-normal text-sm">Pemasukkan</p>
                                        <p className="font-medium text-lg">Rp. 235.000</p>
                                    </div>
                                    <div className="bg-white w-fit px-4 py-3 border rounded-lg flex-1">
                                        <p className="font-normal text-sm">Pengeluaran</p>
                                        <p className="font-medium text-lg">Rp. 450.350</p>
                                    </div>
                                    <div className="bg-white w-fit px-4 py-3 border rounded-lg flex-1">
                                        <p className="font-normal text-sm text-nowrap">Saldo akhir</p>
                                        <p className="font-medium text-lg text-nowrap">Rp. 450.350</p>
                                    </div>
                                    <div className="absolute w-20 h-25 left-[calc(100vw-100px)] bg-linear-to-l from-background-primary to-transparent" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>  
        </section>
    )
}