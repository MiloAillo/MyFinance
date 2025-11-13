import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AlertCircleIcon, FormInput } from "lucide-react";
import { useState, type JSX } from "react";
import { useForm, useWatch } from "react-hook-form";
import { email, z } from "zod"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEyeSlash } from "@fortawesome/free-regular-svg-icons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";

export function Access(): JSX.Element {
    const [show, setShow] = useState<boolean>(false)

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
    }

    return (
        <section className="w-full h-screen flex flex-col gap-12 justify-center items-center -mt-5">
            <h1 className="text-center justify-start text-stone-900 text-3xl font-bold tracking-wide">MyFinance</h1>
            <div className="flex flex-col gap-8 sm:w-85 w-[75%]">
                <Alert variant="destructive" className="w-full">
                    <AlertCircleIcon />
                    <AlertTitle className="font-semibold tracking-normal">Sign In Failed</AlertTitle>
                    <AlertDescription>
                        Your attempt to sign in has failed due to reasons below
                        <ul className="list-inside list-disc text-sm">
                            <li>Email or password is wrong</li>
                        </ul>
                    </AlertDescription>
                </Alert>
                <div className="w-full flex flex-col gap-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(login)}>
                            <div className="flex flex-col gap-5">
                                <div className="flex flex-col items-end gap-1.5">
                                    <div className="flex flex-col gap-3.5 w-full">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={( { field } ) => {
                                                return (
                                                <FormItem>
                                                    <FormLabel>Email:</FormLabel>
                                                    <FormControl>
                                                        <Input type="text" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={( field ) => (
                                                <FormItem className="select-none">
                                                    <FormLabel>Password:</FormLabel>
                                                    <FormControl>
                                                        <div className="flex items-center justify-end">
                                                            <Input type={`${show ? "text" : "password"}`} {...field} />
                                                            <FontAwesomeIcon icon={faEyeSlash} onClick={() => setShow(!show)} className="absolute pr-3 text-neutral-700" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <p className="font-medium text-sm text-blue-500 hover:text-blue-400">Forgot password?</p>
                                </div>
                                <Button type="submit" className="text-neutral-800 font-semibold [background-image:var(--color-button-primary)]">Sign in</Button>
                            </div>
                        </form>
                    </Form>
                    <div className="flex flex-col justify-center items-center w-full">
                        <div className="w-full h-px bg-neutral-300" />
                        <p className="absolute bg-white w-fit h-fit px-2 font-medium text-sm text-neutral-600">or</p>
                    </div>
                
                    <div className="flex flex-col justify-center gap-5">
                        <Button className="bg-transparent border-3 border-neutral-800 text-neutral-800 font-semibold text-[14px] hover:text-neutral-100 tracking-normal py-4">Create account</Button>
                        <p className="text-center font-medium text-sm text-blue-500 hover:text-blue-400">Sign in without an account</p>
                    </div>
                </div>
            </div>
        </section>
    )
}