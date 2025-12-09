import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertCircleIcon } from "lucide-react";
import { useState, type JSX } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEyeSlash } from "@fortawesome/free-regular-svg-icons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox } from "@/components/ui/checkbox";
import { spring } from "motion-dom";
import axios, { isAxiosError } from "axios";
import { OrbitProgress } from "react-loading-indicators";


export function Signup(): JSX.Element {
    const [show, setShow] = useState<boolean>(false)
    const [ isOut, setIsOut ] = useState<boolean>(false)

    // error 
    const [ isPasswordError, setIsPasswordError ] = useState<boolean>(false)
    const [ isNameError, setIsNameError ] = useState<boolean>(false)
    const [ isEmailError, setIsEmailError ] = useState<boolean>(false)
    const [ isError, setIsError ] = useState<boolean>(false)
    const [ isUnknownError, setIsUnknownError ] = useState<boolean>(false)
    const [ isLoading, setIsLoading ] = useState<boolean>(false)
    
    const [ isConsentError, setIsConsentError ] = useState<boolean>(false)
    const [ consent, setConsent ] = useState<boolean>(false)

    const signupSchema = z.object({
        username: z.string(),
        email: z.email(),
        password: z.string()
    })

    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            username: "",
            email: "",
            password: ""
        }
    })



    const login = async (values: z.infer<typeof signupSchema>): Promise<void> => {
        console.log("login values:", values)
        // reset error
        setIsError(false)
        setIsPasswordError(false)
        setIsUnknownError(false)
        setIsEmailError(false)
        setIsNameError(false)
        setIsConsentError(false)

        if(!consent) {
            setIsError(true)
            setIsConsentError(true)
            return
        }

        try {
            setIsLoading(true)
            const res = await axios.post("http://127.0.0.1:8000/api/auth/register", {
                name: values.username,
                email: values.email,
                password: values.password,
                password_confirmation: values.password
            })

            const data = await res.data
            console.log(data.data.token)
            if(data.data.token) {
                localStorage.setItem("Authorization", data.data.token)
                setIsOut(true)
                setTimeout(() => {
                    window.location.href = "/app"
                }, 600)
            } else {
                setIsUnknownError(true)
            }
        } catch(err) {
            setIsError(true)

            if(isAxiosError(err)) {
                const status = err.status

                if(status === 422) {
                    const errors = err.response?.data.errors
                    console.log(err.response?.data.errors)
                    if (errors.password) {
                        setIsPasswordError(true)
                    }
                    if(errors.name) {
                        setIsNameError(true)
                    }
                    if(errors.email) {
                        setIsEmailError(true)
                    }
                } else {
                    setIsUnknownError(true)
                }
                
            } else {
                setIsUnknownError(true)
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <section className="w-full h-screen flex flex-col gap-12 justify-center items-center -mt-5 bg-background-primary dark:bg-background-primary-dark">
            <AnimatePresence>
                {!isOut && <motion.h1
                    className="text-center justify-start text-stone-900 text-3xl font-bold tracking-wide dark:text-background-primary"
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
                {!isOut && <motion.div
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
                                    <AlertTitle className="font-semibold tracking-normal">Sign In Failed</AlertTitle>
                                    <AlertDescription>
                                        <ul className="list-inside list-disc text-sm">
                                        {isNameError && 
                                            <li>Username must be 3+ characters and no more than 50.</li>
                                        }
                                        {isPasswordError && 
                                            <li>Password needs 8+ characters, uppercase, lowercase, a letter, and a symbol.</li>
                                        }
                                        {isEmailError &&
                                            <li>Email already exist.</li>
                                        }
                                        {isUnknownError &&
                                            <li>Received an unknown error. Please try again in a few moment.</li>
                                        }
                                        {isConsentError &&
                                            <li>You must agree to the terms to use our service</li>
                                        }
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            </motion.div>
                        }
                    </AnimatePresence>
                    <div className="w-full flex flex-col gap-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(login)}>
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col items-start gap-3.5">
                                        <div className="flex flex-col gap-7 w-full">
                                            <FormField
                                                control={form.control}
                                                name="username"
                                                render={( { field } ) => {
                                                    return (
                                                    <FormItem className="flex flex-col items-center w-full">    
                                                        <FormLabel className="self-start w-full">Username:</FormLabel>
                                                        <FormControl>
                                                            <motion.div whileTap={{ scale: 0.95, width: "110%", y: 3, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 }}} className="w-full">
                                                                <Input type="text" {...field} className="w-full" />
                                                            </motion.div>
                                                        </FormControl>
                                                        <FormDescription className="text-left self-start">This is your public display name</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}}
                                            />
                                            <div className="flex flex-col gap-5">
                                                <FormField
                                                    control={form.control}
                                                    name="email"
                                                    render={( { field } ) => {
                                                        return (
                                                            <FormItem className="flex flex-col items-center w-full">    
                                                                <FormLabel className="self-start w-full">Email:</FormLabel>
                                                                <FormControl>
                                                                    <motion.div whileTap={{ scale: 0.95, width: "110%", y: 3, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 }}} className="w-full">
                                                                        <Input type="text" {...field} className="w-full" />
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
                                                                <motion.div className="flex items-center justify-end w-full" whileTap={{ scale: 0.95, width: "110%", y: 3, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 }}}>
                                                                    <Input type={`${show ? "text" : "password"}`} {...field} className="w-full" />
                                                                    <FontAwesomeIcon icon={faEyeSlash} onClick={() => setShow(!show)} className="absolute pr-3 text-neutral-700 dark:text-neutral-300" />
                                                                </motion.div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox id="tos" onCheckedChange={(e) => setConsent(e as any)} />
                                            <label htmlFor="tos" className="font-normal text-sm">I agree to the <span className="font-medium text-blue-500 underline" onClick={() => {setIsOut(true); setTimeout(() => window.location.href = "/tos", 600)}}>Terms of Services</span></label>
                                        </div>
                                    </div>
                                    <AnimatePresence mode="popLayout">
                                        {!isLoading &&
                                            <motion.div 
                                                key={"button register"}
                                                className="w-full flex justify-center items-center self-center " 
                                                whileTap={{ scale: 0.95, width: "95%", y: 2, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 }}} 
                                                initial={{ x: 30, opacity: 0 }}
                                                animate={{ x: 0, opacity: 100 }}
                                                exit={{ x: -30, opacity: 0 }}
                                            >
                                                <Button type="submit" className="text-neutral-800 font-semibold [background-image:var(--color-button-primary)] w-full">Create account</Button>
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
                                                <OrbitProgress variant="track-disc" speedPlus={2} easing="ease-in-out" style={{fontSize: 5}} />
                                            </motion.div>
                                        }
                                    </AnimatePresence>
                                    <p className="w-full text-center font-medium text-sm">Already have an account? <span onClick={() => {setIsOut(true); setTimeout(() => window.location.href = "/access", 700) }} className="text-blue-500 hover:text-blue-400 underline">Sign in</span></p>
                                </div>
                            </form>
                        </Form>
                    </div>
                </motion.div>}
            </AnimatePresence>
        </section>
    )
}