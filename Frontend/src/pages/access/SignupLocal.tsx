import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertCircleIcon } from "lucide-react";
import { useState, type JSX } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox } from "@/components/ui/checkbox";
import { spring } from "motion-dom";
import { DBcreate } from "@/lib/db";

export function SignupLocal(): JSX.Element {
    const [ isOut, setIsOut ] = useState<boolean>(false)

    const [ isConsentError, setIsConsentError ] = useState<boolean>(false)
    const [ consent, setConsent ] = useState<boolean>(false)

    const signupSchema = z.object({
        username: z.string(),
    })

    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            username: ""
        }
    })



    const login = async (values: z.infer<typeof signupSchema>): Promise<void> => {
        setIsConsentError(false)
        if(!consent) {
            setIsConsentError(true)
            return
        }

        if(values.username === "") {
            return
        }

        try {
            const res = await DBcreate(values.username)
            if(res) {
                setIsOut(true)
                setTimeout(() => {window.location.href = "/app"}, 550)
            }
        } catch(err) {
            console.log(err)
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
                    {isConsentError && <Alert variant="destructive" className="w-full bg-background-primary dark:bg-background-primary-dark">
                        <AlertCircleIcon />
                        <AlertTitle className="font-semibold tracking-normal">Sign In Failed</AlertTitle>
                        <AlertDescription>
                            <ul className="list-inside list-disc text-sm">
                                <li>You must agree to the terms to use our service</li>
                            </ul>
                        </AlertDescription>
                    </Alert>}
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
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                            <Checkbox id="tos" onCheckedChange={(e) => setConsent(e as any)} />
                                            <label htmlFor="tos" className="font-normal text-sm">I agree to the <span className="font-medium text-blue-500 underline" onClick={() => {setIsOut(true); setTimeout(() => window.location.href = "/tos", 600)}}>Terms of Services</span></label>
                                        </div>
                                    <motion.div className="w-full flex justify-center items-center self-center " whileTap={{ scale: 0.95, width: "95%", y: 2, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 }}} animate={{ transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 } }}>
                                        <Button type="submit" className="text-neutral-800 font-semibold [background-image:var(--color-button-primary)] w-full">Create local account</Button>
                                    </motion.div>
                                    <p className="w-full text-center font-medium text-sm">Already have an account? <span onClick={() => {setIsOut(true); setTimeout(() => window.location.href = "/access", 700) }} className="text-blue-500 hover:text-blue-400 underline">Sign in</span></p>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </div>
                </motion.div>}
            </AnimatePresence>
        </section>
    )
}