import { TrackerNavbar } from "@/components/TrackerNavbar";
import { faArrowLeft, faPencil, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion, spring } from "motion/react";
import { useEffect, useState, type JSX } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import { ApiUrl } from "@/lib/variable";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, CheckCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export function ChangePassword (): JSX.Element {
    const [ isOut, setIsOut ] = useState<boolean>(false)
    const [ showOldPassword, setShowOldPassword ] = useState<boolean>(false)
    const [ showNewPassword, setShowNewPassword ] = useState<boolean>(false)
    const [ showConfirmPassword, setShowConfirmPassword ] = useState<boolean>(false)
    const [ isLoading, setIsLoading ] = useState<boolean>(false)
    const [ isError, setIsError ] = useState<boolean>(false)
    const [ isSuccess, setIsSuccess ] = useState<boolean>(false)
    const [ errorMessage, setErrorMessage ] = useState<string>("")

    const changePasswordSchema = z.object({
        oldPassword: z.string()
            .min(1, "Old password is required"),
        newPassword: z.string()
            .min(8, "Password must be at least 8 characters long")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number")
            .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least one special character"),
        confirmPassword: z.string()
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    })

    const form = useForm<z.infer<typeof changePasswordSchema>>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            oldPassword: "",
            newPassword: "",
            confirmPassword: ""
        }
    })

    const handleChangePassword = async (values: z.infer<typeof changePasswordSchema>) => {
        setIsError(false)
        setErrorMessage("")
        setIsLoading(true)
        setIsSuccess(false)

        try {
            const token = localStorage.getItem("Authorization")
            await axios.patch(`${ApiUrl}/users/profile`, {
                old_password: values.oldPassword,
                new_password: values.newPassword,
                new_password_confirmation: values.confirmPassword
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            setIsLoading(false)
            setIsSuccess(true)
        } catch(err) {
            console.log(err)

            setIsLoading(false)
            setIsError(true)
            
            if(isAxiosError(err)) {
                if(err.response?.status === 422) {
                    setErrorMessage("Current password is incorrect")
                } else if(err.response?.status === 401) {
                    setErrorMessage("You are not authenticated. Please log in again.")
                } else {
                    setErrorMessage("Failed to change password. Please try again.")
                }
            } else {
                setErrorMessage("An unexpected error occurred")
            }
        }
    }

    return (
        <section className="flex flex-col items-center justify-center -mt-5 max-w-[650px] w-[85%]">
            <AnimatePresence>
                {!isOut && <motion.div
                    key={"navbar"}
                    className="flex justify-center z-10 w-full fixed top-0 left-0"
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
                    <div className="flex justify-between items-center gap-2 mt-5 max-w-[650px] w-[85%] z-10">
                        <FontAwesomeIcon onClick={() => {setIsOut(true); setTimeout(() => {window.location.href = "/app"}, 400)}} icon={faArrowLeft} className="w-10 h-10 text-xl text-neutral-800 dark:text-neutral-400" />
                        <h1 className={`font-medium text-base text-neutral-500`}>Change Password</h1>
                        <FontAwesomeIcon icon={faArrowLeft} className="w-10 h-10 text-xl text-neutral-800 dark:text-neutral-400 opacity-0" />
                    </div>
                </motion.div>}
                {!isOut && <motion.div
                    key={"form"}
                    className="flex justify-center z-10 w-full mt-24 pb-10 px-4"
                    initial={{
                        x: 30,
                        opacity: 0,
                    }}
                    animate={{
                        x: 0,
                        opacity: 100,
                        transition: {
                            delay: 0.5
                        }
                    }}
                    exit={{
                        x: -30,
                        opacity: 0
                    }}
                >
                    <div className="flex flex-col gap-8 sm:w-85 w-full max-w-md">
                        <div className="flex flex-col items-center gap-3">
                            <FontAwesomeIcon icon={faPencil} className="text-6xl text-stone-900"></FontAwesomeIcon>
                            <h1 className="text-2xl font-bold text-stone-900 dark:text-background-primary">Change Your Password</h1>
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
                                        <AlertTitle className="font-semibold tracking-normal">Password Change Failed</AlertTitle>
                                        <AlertDescription>
                                            <ul className="list-inside list-disc text-sm">
                                                <li>{errorMessage}</li>
                                            </ul>
                                        </AlertDescription>
                                    </Alert>
                                </motion.div>
                            }
                            {isSuccess &&
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
                                    <Alert variant="default" className="w-full bg-background-primary border-green-400 dark:bg-background-primary-dark">
                                        <CheckCircle color="green" />
                                        <AlertTitle className="font-semibold tracking-normal text-green-500">Password change successful</AlertTitle>
                                    </Alert>
                                </motion.div>
                            }
                        </AnimatePresence>

                        <div className="w-full flex flex-col gap-4">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleChangePassword)} className="w-full">
                                    <div className="flex flex-col gap-5 w-full justify-center">
                                        <div className="flex flex-col gap-3.5 w-full">
                                            <FormField
                                                control={form.control}
                                                name="oldPassword"
                                                render={( { field } ) => (
                                                    <FormItem className="flex flex-col items-center w-full select-none">
                                                        <FormLabel className="self-start">Current Password:</FormLabel>
                                                        <FormControl>
                                                            <motion.div className="flex items-center justify-end w-full" whileTap={{ scale: 0.95, width: "110%", y: 3, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 }}}>
                                                                <Input type={`${showOldPassword ? "text" : "password"}`} {...field} className="w-full" />
                                                                <FontAwesomeIcon icon={faEyeSlash} onClick={() => setShowOldPassword(!showOldPassword)} className="absolute pr-3 text-neutral-700 dark:text-neutral-300 cursor-pointer" />
                                                            </motion.div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="newPassword"
                                                render={( { field } ) => (
                                                    <FormItem className="flex flex-col items-center w-full select-none">
                                                        <FormLabel className="self-start">New Password:</FormLabel>
                                                        <FormControl>
                                                            <motion.div className="flex items-center justify-end w-full" whileTap={{ scale: 0.95, width: "110%", y: 3, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 }}}>
                                                                <Input type={`${showNewPassword ? "text" : "password"}`} {...field} className="w-full" />
                                                                <FontAwesomeIcon icon={faEyeSlash} onClick={() => setShowNewPassword(!showNewPassword)} className="absolute pr-3 text-neutral-700 dark:text-neutral-300 cursor-pointer" />
                                                            </motion.div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="confirmPassword"
                                                render={( { field } ) => (
                                                    <FormItem className="flex flex-col items-center w-full select-none">
                                                        <FormLabel className="self-start">Confirm New Password:</FormLabel>
                                                        <FormControl>
                                                            <motion.div className="flex items-center justify-end w-full" whileTap={{ scale: 0.95, width: "110%", y: 3, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 }}}>
                                                                <Input type={`${showConfirmPassword ? "text" : "password"}`} {...field} className="w-full" />
                                                                <FontAwesomeIcon icon={faEyeSlash} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute pr-3 text-neutral-700 dark:text-neutral-300 cursor-pointer" />
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
                                                    key={"button submit"}
                                                    className="w-full flex justify-center items-center self-center"
                                                    whileTap={{ scale: 0.95, width: "95%", y: 2, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 } }}
                                                    initial={{ x: 30, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 100 }}
                                                    exit={{ x: -30, opacity: 0 }}
                                                >
                                                    <Button type="submit" className="text-neutral-800 font-semibold [background-image:var(--color-button-primary)] w-full">Update Password</Button>
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
                                                    <p className="font-medium">Updating password...</p>
                                                </motion.div>
                                            }
                                        </AnimatePresence>
                                    </div>
                                </form>
                            </Form>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-sm text-stone-600/50 dark:text-stone-400/50">Account breached? Make sure your email is verified so we can send help incase you get locked out.</p>
                        </div>
                    </div>
                </motion.div>}
            </AnimatePresence>
        </section>
    )
}