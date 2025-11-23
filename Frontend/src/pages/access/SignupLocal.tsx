import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import { Checkbox } from "@/components/ui/checkbox";

export function SignupLocal(): JSX.Element {
    const [show, setShow] = useState<boolean>(false)

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
        console.log(values)
    }

    return (
        <section className="w-full h-screen flex flex-col gap-12 justify-center items-center -mt-5">
            <h1 className="text-center justify-start text-stone-900 text-3xl font-bold tracking-wide">MyFinance</h1>
            <div className="flex flex-col gap-8 sm:w-85 w-[75%]">
                <Alert variant="destructive" className="w-full hidden">
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
                                <div className="flex flex-col items-start gap-3.5">
                                    <div className="flex flex-col gap-7 w-full">
                                        <FormField
                                            control={form.control}
                                            name="username"
                                            render={( { field } ) => {
                                                return (
                                                <FormItem>
                                                    <FormLabel>Username:</FormLabel>
                                                    <FormControl>
                                                        <Input type="text" {...field} />
                                                    </FormControl>
                                                    <FormDescription>This is your local display name</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <Checkbox id="tos" /> 
                                        <label htmlFor="tos" className="font-normal text-sm">I agree to the <span className="font-medium text-blue-500 underline">Terms of Services</span></label>
                                    </div>
                                    <Button type="submit" className="text-neutral-800 font-semibold [background-image:var(--color-button-primary)]">Create local account</Button>
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </section>
    )
}