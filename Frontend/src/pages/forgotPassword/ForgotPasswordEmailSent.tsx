import { Button } from "@/components/ui/button";
import { AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import { useState, type JSX } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion, spring } from "motion/react";
import axios from "axios";
import { ApiUrl } from "@/lib/variable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "react-router-dom";
import useTransition from "@/hooks/useTransition";

export function ForgotPasswordEmailSent(): JSX.Element {
    const { email } = useParams<{ email: string }>();
    const { render, transitionTo } = useTransition({initValue: true, transitionDelay: 600})
    
    const [isError, setIsError] = useState<boolean>(false);
    const [isResending, setIsResending] = useState<boolean>(false);
    const [isResendSuccess, setIsResendSuccess] = useState<boolean>(false);

    const handleResendEmail = async (): Promise<void> => {
        if (!email) return;

        setIsError(false);
        setIsResendSuccess(false);
        setIsResending(true);

        try {
            await axios.post(`${ApiUrl}/auth/password-resets`, {
                email: decodeURIComponent(email)
            });
            setIsResending(false);
            setIsResendSuccess(true);

            setTimeout(() => {
                setIsResendSuccess(false);
            }, 3000);
        } catch (err) {
            setIsResending(false);
            setIsError(true);
            console.log(err);
        }
    };

    const handleBackToLogin = (): void => {
        transitionTo("/access");
    };

    return (
        <section className="w-full h-screen flex flex-col gap-12 justify-center items-center -mt-5 bg-background-primary dark:bg-background-primary-dark">
            <AnimatePresence>
                {render && (
                    <motion.div
                        layout
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
                            <FontAwesomeIcon icon={faEnvelope} className="text-6xl! text-stone-900 dark:text-background-primary/75"></FontAwesomeIcon>
                            <div className="flex flex-col gap-1.5">
                                <p className="text-stone-900 text-2xl font-semibold tracking-wide dark:text-background-primary text-center">Open Your Mail App</p>
                                <p className="text-base text-center text-stone-900 dark:text-neutral-300/90">We have sent you an email to reset your password. If its not there, kindly wait for a minute or check the spam folder.</p>
                            </div>
                        </div>

                        <AnimatePresence>
                            {isError && (
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
                                    <Alert variant="destructive" className="w-full bg-background-primary dark:bg-background-primary-dark dark:border-purple-500/50">
                                        <AlertCircleIcon />
                                        <AlertTitle className="font-semibold tracking-normal dark:text-purple-400">Resend Failed</AlertTitle>
                                        <AlertDescription>
                                            Failed to resend email. Please try again later.
                                        </AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}
                            {isResendSuccess && (
                                <motion.div
                                    key="resend-success"
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
                                    <Alert className="w-full bg-background-primary border-green-500 dark:bg-background-primary-dark dark:border-purple-500/50">
                                        <CheckCircleIcon className="text-green-500" />
                                        <AlertTitle className="font-semibold tracking-normal text-green-600 dark:text-purple-400">Email Resent</AlertTitle>
                                        <AlertDescription className="text-sm text-neutral-600 dark:text-neutral-400">
                                            Password reset email has been resent successfully.
                                        </AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div layout className="w-full flex flex-col gap-4">
                            <AnimatePresence mode="wait">
                                {!isResending && (
                                    <motion.div
                                        key="resend-button"
                                        layout
                                        className="w-full flex justify-center items-center self-center"
                                        whileTap={{ scale: 0.95, width: "95%", y: 2, transition: { type: spring, stiffness: 120, damping: 2, mass: 0.5 } }}
                                        initial={{ x: 30, opacity: 0 }}
                                        animate={{ x: 0, opacity: 100 }}
                                        exit={{ x: -30, opacity: 0 }}
                                    >
                                        <Button
                                            onClick={handleResendEmail}
                                            className="text-neutral-800 font-semibold [background-image:var(--color-button-primary)] dark:[background-image:var(--color-button-primary-dark)]  w-full cursor-pointer"
                                        >
                                            Re-send Email
                                        </Button>
                                    </motion.div>
                                )}
                                {isResending && (
                                    <motion.div
                                        key="resending"
                                        layout
                                        className="w-full flex justify-center items-center self-center"
                                        initial={{ x: 30, opacity: 0 }}
                                        animate={{ x: 0, opacity: 100 }}
                                        exit={{ x: -30, opacity: 0 }}
                                    >
                                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Requesting a link...</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <p className="w-full text-center font-medium text-sm">
                                <span
                                    onClick={handleBackToLogin}
                                    className="text-blue-500 hover:text-blue-400 underline cursor-pointer dark:text-blue-400 dark:hover:text-blue-500"
                                >
                                    Go back to login page
                                </span>
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
