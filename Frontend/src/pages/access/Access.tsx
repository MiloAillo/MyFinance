import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertCircleIcon } from "lucide-react";
import { useEffect, useState, type JSX } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEyeSlash } from "@fortawesome/free-regular-svg-icons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion, spring } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import { ApiUrl } from "@/lib/variable";
import { DBSupportCheck } from "@/lib/db";
import useTransition from "@/hooks/useTransition";
import { OrbitProgress } from "react-loading-indicators";

export function Access(): JSX.Element {

    const { render, transitionTo } = useTransition({initValue: true, transitionDelay: 700})
    const [show, setShow] = useState<boolean>(false)
    const [ isInvalidCredentials, setIsInvalidCredentials ] = useState<boolean>(false)
    const [ isInternalServerError, setIsInternalServerError ] = useState<boolean>(false)
    const [ isNewDeviceDetected, setIsNewDeviceDetected ] = useState<boolean>(false)
    const [ isError, setIsError ] = useState<boolean>(false)
    const [ isLocalSupported, setIsLocalSupported ] = useState<boolean>(false)
    const [ isLoading, setIsLoading ] = useState<boolean>(false)

    

    const loginSchema = z.object({
        email: z.email(),
        password: z.string()
    })

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: ""
        }
    })

    const login = async (values: z.infer<typeof loginSchema>): Promise<void> => {
        console.log(values)
        console.log(ApiUrl)
        setIsInternalServerError(false)
        setIsInvalidCredentials(false)
        setIsNewDeviceDetected(false)
        setIsError(false)

        try {
            setIsLoading(true)

            const res = await axios.post(`${ApiUrl}/auth/tokens`, {
                email: values.email,
                password: values.password
            })
    
            const data = await res.data
            console.log("response :", data)
            localStorage.setItem("Authorization", data.data.meta.token)

            transitionTo("/app")

        } catch(err) {

            if(isAxiosError(err)) {

                console.log("error", err)
                if(err.response?.status === 422) {
                    setIsInvalidCredentials(true)
                    setIsError(true)
                } else if(err.response?.status === 403 && err.response?.data?.status === 'NEW_DEVICE_LOGIN_DETECTED') {
                    setIsNewDeviceDetected(true)
                    setIsError(true)
                } else {
                    setIsError(true)
                    setIsInternalServerError(true)
                }

            }
        } finally {
            setIsLoading(false)
        }
    }
    
    useEffect(() => {
        (async () => {
            const status = await DBSupportCheck()
            setIsLocalSupported(status)
        })()
    }, [])

    return (
        <section className="w-full h-screen flex flex-col gap-12 justify-center items-center -mt-5 bg-background-primary dark:bg-background-primary-dark">
            <AnimatePresence>
                { render && <motion.h1
                    className="text-center justify-start text-stone-900 text-3xl font-bold tracking-wide dark:text-background-primary cursor-default"
                    initial={{
                        x: 30,
                        opacity: 0,
                        filter: "blur(5px)"
                    }}
                    animate={{
                        x:0,
                        opacity: 100,
                        filter: "blur(0px)",
                        transition: {
                            type: spring,
                            stiffness: 120,
                            damping: 15,
                            mass: 0.5,
                            delay: 0.5
                        }
                    }}
                    exit={{
                        x: -30,
                        opacity: 0,
                        transition: {
                            type: spring,
                            stiffness: 120,
                            damping: 15,
                            mass: 0.5,
                            delay: 0.2
                        }
                    }}
                >
                    MyFinance
                </motion.h1>}
            </AnimatePresence>
            <AnimatePresence>
                { render && <motion.div 
                    layout
                    className="flex flex-col gap-8 sm:w-85 w-[75%]"
                    initial={{
                        x: 30,
                        opacity: 0,
                        filter: "blur(5px)"
                    }}
                    animate={{
                        x:0,
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

                    <AnimatePresence>
                        {isError &&
                            <motion.div
                                layout
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
                                <Alert variant={isNewDeviceDetected ? "default" : "destructive"} className={`w-full ${isNewDeviceDetected ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800" : "bg-background-primary dark:bg-background-primary-dark"} cursor-not-allowed`}>
                                    <AlertCircleIcon />
                                    <AlertTitle className="font-semibold tracking-normal">{isNewDeviceDetected ? "New Device Detected" : "Sign In Failed"}</AlertTitle>
                                    <AlertDescription>
                                        <ul className="list-inside list-disc text-sm">
                                        {isInvalidCredentials && 
                                            <li>Email or password is wrong.</li>
                                        }
                                        {isNewDeviceDetected && 
                                            <li>We detected a login from a new device. Please check your email to verify and continue.</li>
                                        }
                                        {isInternalServerError && 
                                            <li>Internal server error. Please wait and try again.</li>
                                        }
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            </motion.div>
                        }
                    </AnimatePresence>
                    <motion.div layout className="w-full flex flex-col gap-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(login)} className="w-full">
                                <motion.div layout className="flex flex-col gap-5 w-full justify-center">
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className="flex flex-col gap-3.5 w-full">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={( { field } ) => {
                                                    return (
                                                    <FormItem className="flex flex-col items-center w-full">    
                                                        <FormLabel className="self-start w-full">Email:</FormLabel>
                                                        <FormControl>
                                                            <motion.div whileTap={{ scale: isLoading ? 1 : 0.95, width: "110%", y: 3, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 }}} className="w-full">
                                                                <Input type="text" {...field} className="w-full" disabled={isLoading} />
                                                            </motion.div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="password"
                                                render={( { field } ) => (
                                                    <FormItem className="flex flex-col items-center w-full select-none">
                                                        <FormLabel className="self-start">Password:</FormLabel>
                                                        <FormControl>
                                                            <motion.div className="flex items-center justify-end w-full" whileTap={{ scale: isLoading ? 1 : 0.95, width: "110%", y: 3, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 }}}>
                                                                <Input type={`${show ? "text" : "password"}`} {...field} className="w-full" disabled={isLoading} />
                                                                <FontAwesomeIcon icon={faEyeSlash} onClick={() => !isLoading && setShow(!show)} className={`absolute pr-3 ${isLoading ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed' : 'text-neutral-700 dark:text-neutral-300 cursor-pointer'}`} />
                                                            </motion.div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <p onClick={() => {transitionTo("/forgot-password")}} className="font-medium text-sm text-blue-500 hover:text-blue-400 cursor-pointer dark:text-blue-400 dark:hover:text-blue-500">Forgot password?</p>
                                    </div>
                                    <AnimatePresence mode="wait">
                                        {!isLoading ? (
                                            <motion.div
                                                key="sign-in-button"
                                                layout
                                                className="w-full flex justify-center items-center self-center"
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ type: spring, stiffness: 120, damping: 15 }}
                                            >
                                                <motion.div
                                                    whileTap={{ scale: 0.95, width: "95%", y: 2, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 } }}
                                                    animate={{ transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 } }}
                                                    className="w-full"
                                                >
                                                    <Button type="submit" className="text-neutral-800 font-semibold [background-image:var(--color-button-primary)] dark:[background-image:var(--color-button-primary-dark)] w-full cursor-pointer">Sign in</Button>
                                                </motion.div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="signing-in"
                                                layout
                                                className="w-full flex flex-col gap-3 justify-center items-center self-center py-3 cursor-progress"
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ type: spring, stiffness: 120, damping: 15 }}
                                            >
                                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Signing in...</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </form>
                        </Form>
                        <motion.div layout className="flex flex-col justify-center items-center w-full">
                            <div className="w-full h-px bg-neutral-300 dark:bg-neutral-300/40" />
                            <p className="absolute bg-background-primary w-fit h-fit px-2 font-medium text-sm text-neutral-600 dark:bg-background-primary-dark dark:text-neutral-300/40">or</p>
                        </motion.div>
                        <div className="flex flex-col justify-center gap-5 w-full">
                            <motion.div className="w-full self-center" onClick={() => {transitionTo("/access/signup")}} whileTap={{ scale: 0.95, width: "95%", y: 2, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 }}} animate={{ transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 } }}><Button className="bg-transparent border-3 border-neutral-800 text-neutral-800 font-semibold text-[14px] hover:text-neutral-100 tracking-normal py-4 w-full dark:border-neutral-400 dark:text-white/90 cursor-pointer dark:hover:bg-white/10">Create account</Button></motion.div>
                            {isLocalSupported && <p onClick={() => {transitionTo("/access/signup/local")}} className="text-center font-medium text-sm text-blue-500 hover:text-blue-400 w-full cursor-pointer dark:text-blue-400 dark:hover:text-blue-500">Sign in without an account</p>}
                            {!isLocalSupported && 
                                <div>
                                    <p className="text-center font-medium text-sm text-red-500/60 line-through w-full">Sign in without an account</p>
                                    <p className="font-medium text-sm text-black/50 text-center dark:text-white/50">Your browser doesnt support this feature, for more information please read our <span className="font-medium text-sm text-blue-500/60 hover:text-blue-400/60 underline" onClick={() => {transitionTo("/faq")}}>FAQ</span></p>
                                </div>
                            }
                        </div>
                    </motion.div>
                </motion.div>}
            </AnimatePresence>
        </section>
    )
}