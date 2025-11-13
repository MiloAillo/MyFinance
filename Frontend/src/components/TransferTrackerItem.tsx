import { useState, type JSX } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Key } from "lucide-react";

interface transferTrackerItemInterface {
    tittle: string,
    desc: string,
    id: number,
    addItem: (id: number) => void
    removeItem: (id: number) => void
}

export function TransferTrackerItem({ id, tittle, desc, addItem, removeItem }: transferTrackerItemInterface): JSX.Element {

    tittle = tittle ? tittle : ""
    desc = desc ? desc : ""

    const [clicked, setClicked] = useState<boolean>(false)

    const animation = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    }

    const notClickedItem = (
        <motion.div 
            className="select-none w-full h-18 border-3 rounded-md border-stone-300 text-left flex justify-between items-center px-3 py-3"
            onClick={() => {setClicked(true); addItem(id)}}
            key="not-clicked3"
            {...animation}
        >
            <div className="flex flex-col">
                {!clicked && <motion.p className="text-stone-900/60 font-medium text-lg" key="not-clicked1" {...animation}>
                {
                    tittle.split("").map((char, i) => (
                        i < 20 ? char : null
                    ))
                }
                {
                    tittle.length > 20 && "..."
                }
                </motion.p>}
                {clicked && <motion.p className="text-stone-700 font-medium text-lg" key="clicked1" {...animation}>
                {
                    tittle.split("").map((char, i) => (
                        i < 20 ? char : null
                    ))
                }
                {
                    tittle.length > 20 && "..."
                }
                </motion.p>}

                {!clicked && <motion.p className="font-normal text-base text-zinc-600/60" key="not-clicked2" {...animation}>
                    {
                        desc.split("").map((char, i) => (
                            i < 29 ? char : null
                        ))
                    }
                    {
                        desc.length > 27 && "..."
                    }
                </motion.p>}
                {clicked && <motion.p className="font-normal text-base text-zinc-900/60" key="clicked2" {...animation}>
                    {
                        desc.split("").map((char, i) => (
                            i < 29 ? char : null
                        ))
                    }
                    {
                        desc.length > 27 && "..."
                    }
                </motion.p>}
            </div>
            <div className="h-full">
                {!clicked && <motion.div className={`h-3.5 w-3.5 border-3 rounded-full border-stone-300`} key="not-clicked" {...animation} />}
                {clicked && <motion.div className={`h-3.5 w-3.5 border-3 rounded-full border-stone-600`} key="clicked" {...animation} />}
            </div>
        </motion.div>
    )

    const clickedItem = (
        <motion.div 
            className="select-none w-full h-18 border-3 rounded-md border-stone-600 text-left flex justify-between items-center px-3 py-3"
            onClick={() => {setClicked(false); removeItem(id)}}
            key="clicked3"
            {...animation}
        >
            <div className="flex flex-col">
                {!clicked && <motion.p className="text-stone-900/60 font-medium text-lg" key="not-clicked1" {...animation}>
                {
                    tittle.split("").map((char, i) => (
                        i < 20 ? char : null
                    ))
                }
                {
                    tittle.length > 20 && "..."
                }
                </motion.p>}
                {clicked && <motion.p className="text-stone-700 font-medium text-lg" key="clicked1" {...animation}>
                {
                    tittle.split("").map((char, i) => (
                        i < 20 ? char : null
                    ))
                }
                {
                    tittle.length > 20 && "..."
                }
                </motion.p>}

                {!clicked && <motion.p className="font-normal text-base text-zinc-600/60" key="not-clicked2" {...animation}>
                    {
                        desc.split("").map((char, i) => (
                            i < 29 ? char : null
                        ))
                    }
                    {
                        desc.length > 27 && "..."
                    }
                </motion.p>}
                {clicked && <motion.p className="font-normal text-base text-zinc-900/60" key="clicked2" {...animation}>
                    {
                        desc.split("").map((char, i) => (
                            i < 29 ? char : null
                        ))
                    }
                    {
                        desc.length > 27 && "..."
                    }
                </motion.p>}
            </div>
            <div className="h-full">
                {!clicked && <motion.div className={`h-3.5 w-3.5 border-3 rounded-full border-stone-300`} key="not-clicked" {...animation} />}
                {clicked && <motion.div className={`h-3.5 w-3.5 border-3 rounded-full border-stone-600 bg-stone-600`} key="clicked" {...animation} />}
            </div>
        </motion.div>
    )

    return (
        clicked ? clickedItem : notClickedItem
    )
}