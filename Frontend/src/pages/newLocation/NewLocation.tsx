import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ApiUrl } from "@/lib/variable";
import { faPencil } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios, { isAxiosError } from "axios";
import { AlertCircleIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type JSX } from "react";
import { useLocation, useParams } from "react-router-dom";
import useTransition from "@/hooks/useTransition";

export function NewLocation(): JSX.Element {
    const { token } = useParams<{token: string }>();
    const { search } = useLocation()
    const { render, transitionTo } = useTransition({initValue: true, transitionDelay: 600})
    const [ isLoading, setIsLoading ] = useState<boolean>(false)
    const [ status, setStatus ] = useState<"none" | "error" | "ok">("none")
    const [ errorMsg, setErrorMsg ] = useState<string>("")

    if (!token || !search || search == "") window.location.href = "/"

    useEffect(() => {
        console.log("token :", token)
        console.log("search :", search)
    }, [])

    const allowLoginHandler = async () => {
        setIsLoading(true)
        setStatus("none")
        setErrorMsg("")

        try {
            await axios.get(`${ApiUrl}/auth/tokens/new-device/${token+search}`)
            setStatus("ok")
        } catch (err) {
            console.log(err)

            if (isAxiosError(err)) {
                setStatus("error")
                if (err.status == 403) {
                    setErrorMsg("Token is expired.")
                } else {
                    setErrorMsg("Internal server error.")
                }
            }

        } finally {
            setIsLoading(false)
        }
    }

    return (
        <section>
            <AnimatePresence>
                {render && <motion.div
                    key={"navbar"}
                    className="w-full h-screen flex justify-center items-center z-10 top-0 left-0"
                    initial={{
                        x: 30,
                        opacity: 0,
                    }}
                    animate={{
                        x: 0,
                        opacity: 100,
                        transition: {
                            delay: 0.3
                        }
                    }}
                    exit={{
                        x: -30,
                        opacity: 0
                    }}
                >
                    <div className="flex flex-col items-center gap-3 -mt-5 px-5">
                        <FontAwesomeIcon icon={faPencil} className="text-6xl text-stone-900"></FontAwesomeIcon>
                        <h1 className="text-2xl font-bold text-stone-900 dark:text-background-primary">Device Login Request</h1>
                        <p className="text-base text-stone-600 dark:text-stone-400 text-center mb-3">We receive a new device login request. <br/> If this isn't you, change your password immediately.</p>

                        <AnimatePresence mode="wait">            
                            { status == "error" &&
                                <motion.div
                                    key="error"
                                    initial={{
                                        x: 30,
                                        opacity: 0,
                                    }}
                                    animate={{
                                        x: 0,
                                        opacity: 100,
                                        transition: {
                                            delay: 0.6
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
                                    <Alert variant="destructive" className="w-fit">
                                        <AlertCircleIcon />
                                        <AlertTitle className="font-semibold tracking-normal">Allow New Device Login Failed</AlertTitle>
                                        <AlertDescription>
                                            <ul className="list-inside list-disc text-sm">
                                                <li>{errorMsg}</li>
                                            </ul>
                                        </AlertDescription>
                                    </Alert>
                                </motion.div>
                            }   
                            { status == "ok" &&
                                <motion.div
                                    key="ok"
                                    className="flex flex-col items-center"
                                    initial={{
                                        x: 30,
                                        opacity: 0,
                                    }}
                                    animate={{
                                        x: 0,
                                        opacity: 100,
                                        transition: {
                                            delay: 0.6
                                        }
                                    }}
                                    exit={{
                                        x: -30,
                                        opacity: 0,
                                    }}
                                >
                                    <p className="text-green-600 font-semibold text-center">Request allowed, you can now login with your new device. </p>
                                    <p className="underline text-blue-500 text-center" onClick={() => transitionTo("/access")}>Go back to login page</p>
                                </motion.div>
                            }
                            { !isLoading && status != "ok" &&
                                <motion.button 
                                    onClick={allowLoginHandler}
                                    key="button"
                                    className="bg-transparent border-red-500 border-3 text-red-500 font-semibold w-40 sm:w-60 rounded-md h-9 flex justify-center items-center"
                                    type="button"
                                    initial={{
                                        x: 30,
                                        opacity: 0,
                                    }}
                                    animate={{
                                        x: 0,
                                        opacity: 100,
                                        transition: {
                                            delay: 0.3
                                        }
                                    }}
                                    exit={{
                                        x: -30,
                                        opacity: 0
                                    }}
                                >Allow Login</motion.button>
                            }
                            { isLoading &&                                
                                <motion.div 
                                    key="loading"
                                    className="flex gap-2 items-center justify-center h-9 w-40 sm:w-60 font-semibold"
                                    initial={{
                                        x: 30,
                                        opacity: 0,
                                    }}
                                    animate={{
                                        x: 0,
                                        opacity: 100,
                                        transition: {
                                            delay: 0.3
                                        }
                                    }}
                                    exit={{
                                        x: -30,
                                        opacity: 0
                                    }}
                                >
                                    Allowing request
                                    <Spinner color="black"/>
                                </motion.div>
                            }
                        </AnimatePresence>


                    </div>
                </motion.div>}
            </AnimatePresence>
        </section>
    )
}