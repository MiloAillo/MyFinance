import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import { useState, type JSX } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion, spring } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import { ApiUrl } from "@/lib/variable";
import { OrbitProgress } from "react-loading-indicators";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

export function ForgotPassword(): JSX.Element {
    const navigate = useNavigate()
    const [isOut, setIsOut] = useState<boolean>(false)
    const [isError, setIsError] = useState<boolean>(false)
    const [isNotFound, setIsNotFound] = useState<boolean>(false)
    const [isInternalServerError, setIsInternalServerError] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isSuccess, setIsSuccess] = useState<boolean>(false)

    const forgotPasswordSchema = z.object({
        email: z.email()
    })

    const form = useForm<z.infer<typeof forgotPasswordSchema>>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: ""
        }
    })

    const submit = async (values: z.infer<typeof forgotPasswordSchema>): Promise<void> => {
        setIsNotFound(false)
        setIsInternalServerError(false)
        setIsError(false)
        setIsLoading(true)

        try {
            const res = await axios.post(`${ApiUrl}/auth/password-resets`, {
                email: values.email
            })
            setIsLoading(false)
            setIsSuccess(true)

            setIsOut(true)
            setTimeout(() => {
                navigate(`/forgot-password/email-sent/${encodeURIComponent(values.email)}`)
            }, 400)

        } catch (err) {
            setIsLoading(false)

            console.log(err)

            if (isAxiosError(err)) {
                if (err.response?.status === 422) {
                    setIsNotFound(true)
                    setIsError(true)
                } else {
                    setIsInternalServerError(true)
                    setIsError(true)
                }
            }
        }
    }

    return (
        <section className="w-full h-screen flex flex-col gap-12 justify-center items-center -mt-5 bg-background-primary dark:bg-background-primary-dark">
            <AnimatePresence>
                {!isOut && <motion.div
                    className="flex flex-col gap-8 sm:w-85 w-[75%]"
                    initial={{
                        x: 30,
                        opacity: 0,
                        filter: "blur(5px)"
                    }}
                    animate={{
                        x: 0,
                        opacity: 100,
                        filter: "blur(0px)",
                        transition: {
                            type: spring,
                            stiffness: 120,
                            damping: 15,
                            mass: 0.5,
                            delay: 0.7
                        }
                    }}
                    exit={{
                        x: -30,
                        opacity: 0,
                        transition: {
                            type: spring,
                            stiffness: 120,
                            damping: 15,
                            mass: 0.5
                        }
                    }}
                >
                    <div className="flex flex-col items-center gap-5">
                        <FontAwesomeIcon icon={faLock} className="text-6xl! text-stone-900"></FontAwesomeIcon>
                        <div className="flex flex-col gap-1.5">
                            <p className="text-stone-900 text-2xl font-semibold tracking-wide dark:text-background-primary text-center">Trouble Logging In?</p>
                            <p className="text-base  text-center text-stone-900">Enter your email, and we'll send you a link to reset your account password.</p>
                        </div>
                    </div>
                    <AnimatePresence>
                        {isError &&
                            <motion.div
                                initial={{
                                    x: 30,
                                    opacity: 0
                                }}
                                animate={{
                                    x: 0,
                                    opacity: 100,
                                    transition: {
                                        delay: 0.1
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
                                <Alert variant="destructive" className="w-full bg-background-primary dark:bg-background-primary-dark">
                                    <AlertCircleIcon />
                                    <AlertTitle className="font-semibold tracking-normal">Request Failed</AlertTitle>
                                    <AlertDescription>
                                        <ul className="list-inside list-disc text-sm">
                                            {isNotFound &&
                                                <li>No account found with that email address.</li>
                                            }
                                            {isInternalServerError &&
                                                <li>Internal server error. Please wait and try again.</li>
                                            }
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            </motion.div>
                        }
                        {isSuccess &&
                            <motion.div
                                key="success"
                                initial={{
                                    x: 30,
                                    opacity: 0
                                }}
                                animate={{
                                    x: 0,
                                    opacity: 100,
                                    transition: {
                                        delay: 0.1
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
                                <Alert className="w-full bg-background-primary border-green-500 dark:bg-background-primary-dark">
                                    <CheckCircleIcon className="text-green-500" />
                                    <AlertTitle className="font-semibold tracking-normal text-green-600 dark:text-green-400">Email Sent</AlertTitle>
                                    <AlertDescription className="text-sm text-neutral-600 dark:text-neutral-400">
                                        If an account with that email exists, a password reset link has been sent.
                                    </AlertDescription>
                                </Alert>
                            </motion.div>
                        }
                    </AnimatePresence>
                    <div className="w-full flex flex-col gap-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(submit)} className="w-full">
                                <div className="flex flex-col gap-5 w-full justify-center">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col items-center w-full">
                                                <FormLabel className="self-start w-full">Email:</FormLabel>
                                                <FormControl>
                                                    <motion.div whileTap={{ scale: 0.95, width: "110%", y: 3, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 } }} className="w-full">
                                                        <Input type="text" {...field} className="w-full" />
                                                    </motion.div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <AnimatePresence mode="wait">
                                        {!isLoading &&
                                            <motion.div
                                                key={"submit"}
                                                className="w-full flex justify-center items-center self-center"
                                                whileTap={{ scale: 0.95, width: "95%", y: 2, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 } }}
                                                initial={{ x: 30, opacity: 0 }}
                                                animate={{ x: 0, opacity: 100 }}
                                                exit={{ x: -30, opacity: 0 }}
                                            >
                                                <Button type="submit" className="text-neutral-800 font-semibold [background-image:var(--color-button-primary)] w-full">Send reset link</Button>
                                            </motion.div>
                                        }
                                        {isLoading &&
                                            <motion.div
                                                key={"loading"}
                                                className="w-full flex justify-center items-center self-center"
                                                initial={{ x: 30, opacity: 0 }}
                                                animate={{ x: 0, opacity: 100 }}
                                                exit={{ x: -30, opacity: 0 }}
                                            >
                                                <OrbitProgress variant="track-disc" speedPlus={2} easing="ease-in-out" style={{ fontSize: 5 }} />
                                            </motion.div>
                                        }
                                    </AnimatePresence>
                                </div>
                            </form>
                        </Form>
                        <p className="w-full text-center font-medium text-sm">Remembered your password? <span onClick={() => { setIsOut(true); setTimeout(() => window.location.href = "/access", 700) }} className="text-blue-500 hover:text-blue-400 underline cursor-pointer">Sign in</span></p>
                    </div>
                </motion.div>}
            </AnimatePresence>
        </section>
    )
}
