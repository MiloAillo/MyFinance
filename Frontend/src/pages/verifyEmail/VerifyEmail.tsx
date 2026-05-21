import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ApiUrl } from "@/lib/variable";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios, { isAxiosError } from "axios";
import { AlertCircleIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type JSX } from "react";
import { useLocation, useParams } from "react-router-dom";
import useTransition from "@/hooks/useTransition";

export function VerifyEmail(): JSX.Element {
    const { token } = useParams<{ token: string }>();
    const { search } = useLocation()

    const { render, transitionTo } = useTransition({initValue: true, transitionDelay: 600})
    const [status, setStatus] = useState<"none" | "loading" | "error" | "ok">("none")
    const [ errorMsg, setErrorMsg ] = useState<string>("")
    const [ redirectTime, setRedirectTime ] = useState<number>(5)

    if (!token || !search || search == "") window.location.href = "/"

    useEffect(() => {        
        if (status == "ok") {
            const timer = setTimeout(() => {
                    if (redirectTime <= 0) return
                    setRedirectTime(redirectTime - 1)
                }, 1000)
           
                return () => clearTimeout(timer)
        }
    }, [status, redirectTime])

    useEffect(() => {
        if (redirectTime <= 0) {
            transitionTo("/app")
        }
    }, [redirectTime])

    const handleVerification = async () => {
        setStatus("loading")
        setErrorMsg("")
        
        try {
            await axios.get(`${ApiUrl}/auth/email/verify/${token + search}`)

            setStatus("ok")
        } catch (error) {
            if(isAxiosError(error)) {
                if (error.status == 422) {
                    setErrorMsg("Token is expired.")
                    setStatus("error")
                } else {
                    setErrorMsg("Internal server error.")
                    setStatus("error")
                }
            }
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
                        <FontAwesomeIcon icon={faEnvelope} className="text-6xl text-stone-900"></FontAwesomeIcon>
                        <h1 className="text-2xl font-bold text-stone-900 dark:text-background-primary">Email Verification Request</h1>
                        <p className="text-base text-stone-600 dark:text-stone-400 text-center mb-3">
                            Someone with your email in our app has requested an email verification. <br/>
                            Verification is needed so we can reliably contact this email for any activity that require extra layer of security.
                        </p>


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
                                        <AlertTitle className="font-semibold tracking-normal">Failed to Verify Email</AlertTitle>
                                        <AlertDescription>
                                            <ul className="list-inside list-disc text-sm">
                                                <li>{errorMsg}</li>
                                            </ul>
                                        </AlertDescription>
                                    </Alert>
                                </motion.div>
                            }
                            { (status == "none" || status == "error") &&
                                <motion.button
                                    onClick={handleVerification}
                                    key="button"
                                    className="text-neutral-800 font-semibold w-40 sm:w-60 rounded-md h-9 flex justify-center items-center [background-image:var(--color-button-primary)]"
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
                                >
                                    Verify Email
                                </motion.button>
                            }
                            { status == "loading" &&
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
                                    Verifying email
                                    <Spinner color="black"/>
                                </motion.div>
                            }
                            { status == "ok" &&
                                <motion.div 
                                    key="ok"
                                    className="font-semibold text-center"
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
                                    Email verified.<br></br>Redirecting you to the app {`(${redirectTime})`}
                                </motion.div>
                            }
                        </AnimatePresence>


                    </div>
                </motion.div>}
            </AnimatePresence>
        </section>
    )
}