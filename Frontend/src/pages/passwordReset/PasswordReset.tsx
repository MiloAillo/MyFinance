import { useState, useEffect, type JSX } from "react";
import { useLocation, useParams } from "react-router-dom";
import { AnimatePresence, motion, spring } from "motion/react";
import { Spinner } from "@/components/ui/spinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChainBroken, faPencil } from "@fortawesome/free-solid-svg-icons"
import { faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { ApiUrl } from "@/lib/variable";
import axios from "axios";

export function PasswordReset(): JSX.Element {
    const { email, token } = useParams<{ email: string; token: string }>();
    const { search } = useLocation()
    const [isOut, setIsOut] = useState<boolean>(false);
    const [status, setStatus] = useState<"none" | "checking" | "expired" | "ok">("none")
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);

    const passwordResetSchema = z.object({
        password: z.string()
            .min(8, "Password must be at least 8 characters long")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number")
            .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least one special character"),
        confirmPassword: z.string()
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

    const form = useForm<z.infer<typeof passwordResetSchema>>({
        resolver: zodResolver(passwordResetSchema),
        defaultValues: {
            password: "",
            confirmPassword: ""
        }
    })

    if (!email || !token || !search || search == "") window.location.href = "/"

    const checkValidityAndSetStatus = async () => {
        try {
            await axios.get(`${ApiUrl}/auth/password-resets/${email}/${token + search}`);
            setStatus("ok")
        } catch (err) {
            setStatus("expired")
        }
    }

    const handlePasswordReset = async (values: z.infer<typeof passwordResetSchema>) => {
        setIsError(false);
        setIsLoading(true);

        try {
            // TODO: Call API to reset password with email, token, and password
            await axios.put(`${ApiUrl}/auth/password-resets/${email}/${token + search}`, {
                password: values.password,
                password_confirmation: values.confirmPassword
            })
            
            setIsOut(true);
            setTimeout(() => {
                window.location.href = "/access";
            }, 500);
        } catch (err) {
            console.error(err);
            setIsError(true);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        console.log("Email:", email)
        console.log("Token:", token)
        console.log("search :", search)

        setStatus("ok")
        // checkValidityAndSetStatus()
    }, []);

    return (
        <section className="w-full h-screen flex flex-col gap-12 justify-center items-center -mt-5 bg-background-primary dark:bg-background-primary-dark">
            <AnimatePresence mode="popLayout">
                {!isOut && status === "checking" && (
                    <motion.div
                        key="checkUI"
                        className="flex flex-row items-center gap-3"
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
                        <Spinner className="w-8 h-8"></Spinner>
                        <p className="text-xl font-semibold">Checking token validity...</p>
                    </motion.div>
                )}
                {!isOut && status === "expired" && (
                    <motion.div
                        key="expiredUI"
                        className="flex flex-col items-center gap-5"
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
                        <FontAwesomeIcon icon={faChainBroken} className="text-6xl"></FontAwesomeIcon>
                        <p className="text-stone-900 text-2xl font-semibold dark:text-background-primary text-center">Link Has Expired</p>
                        <p onClick={() => {setIsOut(true); setTimeout(() => {window.location.href = "/access"}, 400)}} className="text-sm underline text-blue-500">Go back to login page</p>
                    </motion.div>
                )}
                {!isOut && status === "ok" && (
                    <motion.div
                        key="formUI"
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
                        <div className="flex flex-col items-center gap-3">
                            <FontAwesomeIcon icon={faPencil} className="text-6xl text-stone-900"></FontAwesomeIcon>
                            <h1 className="text-2xl font-bold text-stone-900 dark:text-background-primary">Create New Password</h1>
                            <p className="text-base text-stone-600 dark:text-stone-400">Make sure to remember this one!</p>
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
                                        <AlertTitle className="font-semibold tracking-normal">Password Reset Failed</AlertTitle>
                                        <AlertDescription>
                                            <ul className="list-inside list-disc text-sm">
                                                <li>Failed to reset password. Please try again.</li>
                                            </ul>
                                        </AlertDescription>
                                    </Alert>
                                </motion.div>
                            }
                        </AnimatePresence>

                        <div className="w-full flex flex-col gap-4">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handlePasswordReset)} className="w-full">
                                    <div className="flex flex-col gap-5 w-full justify-center">
                                        <div className="flex flex-col gap-3.5 w-full">
                                            <FormField
                                                control={form.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col items-center w-full select-none">
                                                        <FormLabel className="self-start">Password:</FormLabel>
                                                        <FormControl>
                                                            <motion.div className="flex items-center justify-end w-full" whileTap={{ scale: 0.95, width: "110%", y: 3, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 } }}>
                                                                <Input type={showPassword ? "text" : "password"} {...field} disabled={isLoading} className="w-full" />
                                                                <FontAwesomeIcon icon={faEyeSlash} onClick={() => setShowPassword(!showPassword)} className="absolute pr-3 text-neutral-700 dark:text-neutral-300 cursor-pointer" />
                                                            </motion.div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="confirmPassword"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col items-center w-full select-none">
                                                        <FormLabel className="self-start">Confirm Password:</FormLabel>
                                                        <FormControl>
                                                            <motion.div className="flex items-center justify-end w-full" whileTap={{ scale: 0.95, width: "110%", y: 3, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 } }}>
                                                                <Input type={showPassword ? "text" : "password"} {...field} disabled={isLoading} className="w-full" />
                                                                <FontAwesomeIcon icon={faEyeSlash} onClick={() => setShowPassword(!showPassword)} className="absolute pr-3 text-neutral-700 dark:text-neutral-300 cursor-pointer" />
                                                            </motion.div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <AnimatePresence mode="popLayout">
                                            {!isLoading &&
                                                <motion.div
                                                    key={"button register"}
                                                    className="w-full flex justify-center items-center self-center"
                                                    whileTap={{ scale: 0.95, width: "95%", y: 2, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 } }}
                                                    initial={{ x: 30, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 100 }}
                                                    exit={{ x: -30, opacity: 0 }}
                                                >
                                                    <Button type="submit" className="text-neutral-800 font-semibold [background-image:var(--color-button-primary)] w-full">Save Changes</Button>
                                                </motion.div>
                                            }
                                            {isLoading &&
                                                <motion.div
                                                    key={"loading"}
                                                    className="w-full flex justify-center items-center self-center gap-2"
                                                    initial={{ x: 30, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 100 }}
                                                    exit={{ x: -30, opacity: 0 }}
                                                >
                                                    <Spinner className="w-5 h-5"></Spinner>
                                                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">Saving Changes...</span>
                                                </motion.div>
                                            }
                                        </AnimatePresence>
                                    </div>
                                </form>
                            </Form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
