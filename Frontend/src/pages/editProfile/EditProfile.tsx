import { useEffect, useRef, useState, type JSX } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck, faEraser, faImage } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { faCamera } from "@fortawesome/free-regular-svg-icons";
import { Card } from "@/components/ui/card";
import { useRouteLoaderData } from "react-router-dom";
import { DBchangename } from "@/lib/db";
import axios from "axios";
import { ApiUrl } from "@/lib/variable";
import { tr } from "date-fns/locale";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

export function EditProfile(): JSX.Element {
    const userData = useRouteLoaderData("main")

    const [ isOut, setIsOut ] = useState<boolean>(false)
    const [ _isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
    const [isChangePhoto, setIsChangePhoto] = useState<boolean>(false)
    const [isRemovePhoto, setIsRemovePhoto] = useState<boolean>(false)

    const [ usernameUsestate, setUsernameUsestate ] = useState<string>(userData.attributes.name)
    const [ emailUsestate, setEmailUsestate ] = useState<string>(userData.attributes.email)
    const [ isCredentialDifferent, setIsCredentialDifferent ] = useState<boolean>(false)
    const [ session, setSession ] = useState<"cloud" | "local" | null>(null)
    const [ failed, setFailed ] = useState<boolean>(false)

    const username = useRef<HTMLInputElement | null>(null)
    const email = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        console.log("userData :", userData)
        const session = localStorage.getItem("session")
        if(session === null) window.location.href = "/access"
        setSession(session as "cloud" | "local")
    }, [])

    useEffect(() => {
        const sameUsername = usernameUsestate === userData.attributes.name
        const sameEmail = emailUsestate === userData.attributes.email

        if (sameUsername && sameEmail) {
            setIsCredentialDifferent(false)
            return
        }

        setIsCredentialDifferent(true)
    }, [usernameUsestate, emailUsestate])

    const edit = async () => {
        if(session === "local" && username.current?.value) {
            try {
                await DBchangename(username.current.value)
                setIsOut(true)
                setTimeout(() => {
                    window.location.href = "/app/editProfile"
                }, 400)
            } catch(err) {
                setFailed(true)
            }
        }

        if(session === "cloud" && username.current?.value && email.current?.value) {
            try {
                const res = await axios.patch(`${ApiUrl}/users/profile`, {
                    "name": username.current?.value,
                    "email": email.current?.value
                }, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("Authorization")}`
                    }
                })
                setIsOut(true)
                setTimeout(() => {
                    window.location.href = "/app/editProfile"
                }, 400)
            } catch (err) {
                setFailed(true)
            }
        }
    }

    return (
        <section className="flex flex-col items-center">
            <AnimatePresence>
                {!isOut && <motion.div
                    key={"navbar"}
                    className="flex justify-center z-10 w-full"
                    initial={{
                        x: 30,
                        opacity: 0,
                        // filter: "blur(5px)"
                    }}
                    animate={{
                        x: 0,
                        opacity: 100,
                        // filter: "blur(0px)",
                        transition: {
                            delay: 0.3
                        }
                    }}
                    exit={{
                        x: -30,
                        opacity: 0
                    }}
                >
                    <div className="fixed z-0 bg-background-primary w-full h-15 dark:bg-background-primary-dark" />
                    <div className="flex justify-between items-center gap-2 mt-5 w-[85%] z-10 fixed">
                        <FontAwesomeIcon onClick={() => {setIsOut(true); setTimeout(() => {window.location.href = "/app"}, 400)}} icon={faArrowLeft} className="w-10 h-10 text-xl text-neutral-800 dark:text-neutral-400" />
                        <h1 className={`font-medium text-base text-neutral-500 ${!isCredentialDifferent && "mr-5"} ${isCredentialDifferent && "mr-[-5px]"}`}>Edit Profile</h1>
                        {isCredentialDifferent && <FontAwesomeIcon onClick={() => edit()} icon={faCheck} className="text-xl dark:text-neutral-400" />}
                        {!isCredentialDifferent && <div/>}
                    </div>
                </motion.div>}
                {!isOut && <motion.div
                    key={"main"}
                    className="flex flex-col items-center mt-18 w-[87%] gap-10"
                    initial={{
                        x: 30,
                        opacity: 0,
                        // filter: "blur(5px)"
                    }}
                    animate={{
                        x: 0,
                        opacity: 100,
                        // filter: "blur(0px)",
                        transition: {
                            delay: 0.4
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
                    {session === "cloud" &&
                            <Drawer>
                                <DrawerTrigger className="h-30 w-30">
                                <img src={userData.attributes.avatar} className="w-full h-full rounded-full" />
                                <div className="flex justify-center items-center -translate-y-30 w-full h-full rounded-full bg-neutral-950 opacity-45">
                                <FontAwesomeIcon icon={faCamera} className="text-5xl text-white" />
                            </div>
                                </DrawerTrigger>
                                <DrawerContent className="w-screen md:w-[50%] md:absolute md:left-0 md:translate-x-[50%]"> 
                                    <DrawerFooter>
                                        <Button>Change Photo Profile</Button>
                                        <Button>Delete Photo Profile</Button>
                                        <DrawerClose className="w-full">
                                            <Button className="w-full">Close</Button>
                                        </DrawerClose>
                                    </DrawerFooter>
                                </DrawerContent>
                            </Drawer>
                    }
                    <div className="flex flex-col gap-3 w-full sm:w-90">
                        <div className="border px-4 py-3 rounded-2xl">
                            <p className="text-base font-normal text-neutral-500">Username</p>
                            <Input className="font-semibold text-base! p-0 m-0 border-0 shadow-none focus-visible:ring-0" ref={username} onChange={(e) => {setUsernameUsestate(e.target.value); console.log(e.target.value)}} placeholder="fill your username..." defaultValue={session === "cloud" ? userData.attributes.name : userData.name}></Input>
                        </div>
                        {session === "cloud" &&
                            <div className="border px-4 py-3 rounded-2xl">
                                <p className="text-base font-normal text-neutral-500">Email</p>
                                <Input className="font-semibold text-base! p-0 m-0 border-0 shadow-none focus-visible:ring-0" ref={email} onChange={(e) => {setEmailUsestate(e.target.value); console.log(e.target.value)}} placeholder="fill your email..." defaultValue={userData.attributes.email}></Input>
                                { session === "cloud" && !userData.attributes.email_verified_at &&
                                    <div className="absolute flex gap-23 translate-y-5">
                                        <p className="text-sm">Email is unverified.</p>
                                        <Drawer>
                                            <DrawerTrigger className="text-sm text-right text-blue-500 underline">send verification</DrawerTrigger>
                                            <DrawerContent className="w-screen md:w-[50%] md:absolute md:left-0 md:translate-x-[50%]">
                                                <DrawerHeader>
                                                    <DrawerTitle className="text-xl">Send Verification?</DrawerTitle>
                                                    <DrawerDescription className="text-normal">We'll send you a verification through email. After verification, we can reliably contact the email incase anything bad happens.</DrawerDescription>
                                                </DrawerHeader>
                                                <DrawerFooter>
                                                    <Button>Send</Button>
                                                    <DrawerClose className="w-full">
                                                        <Button className="w-full">Close</Button>
                                                    </DrawerClose>
                                                </DrawerFooter>
                                            </DrawerContent>
                                        </Drawer>
                                    </div>
                                }
                            </div>
                        }
                        {failed &&
                            <p className="font-medium text-sm text-center self-center text-black/50">{session === "local" ? "Attempt failed, reopen the app and try again" : "Internal server error. Try again later"}</p>
                        }
                    </div>
                </motion.div>}
            </AnimatePresence>
        </section>
    )
}