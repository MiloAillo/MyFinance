import { useState, type JSX } from "react";
import { AnimatePresence, motion, MotionConfig, spring } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRightFromBracket, faDollar, faFilter, faLock, faSun, faTriangleExclamation, faUserPen } from "@fortawesome/free-solid-svg-icons";
import { userData } from "@/lib/userData";
import { XIcon } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export function Report(): JSX.Element {
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
            <div className="flex flex-col items-center mt-18 w-[87%] gap-3">
                <div className="flex justify-between w-full">
                    <h3 className="text-sm font-regular">Riwayat finansial</h3>
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
            </div>
        </section>
    )
}