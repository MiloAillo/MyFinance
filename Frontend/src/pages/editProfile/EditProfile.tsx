import { useEffect, useRef, useState, type JSX } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck, faTrash, faUpload } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { faCamera } from "@fortawesome/free-regular-svg-icons";
import { useRouteLoaderData } from "react-router-dom";
import { DBchangename } from "@/lib/db";
import axios from "axios";
import { ApiUrl, StorageUrl } from "@/lib/variable";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function EditProfile(): JSX.Element {
    const userData = useRouteLoaderData("main")

    const [ isOut, setIsOut ] = useState<boolean>(false)

    const [ usernameUsestate, setUsernameUsestate ] = useState<string>(userData.attributes.name)
    const [ emailUsestate, setEmailUsestate ] = useState<string>(userData.attributes.email)
    const [ isCredentialDifferent, setIsCredentialDifferent ] = useState<boolean>(false)
    const [ session, setSession ] = useState<"cloud" | "local" | null>(null)
    const [ failed, setFailed ] = useState<boolean>(false)
    const [ profileState, setProfileState ] = useState<boolean>(false)
    const [ imageExist, setImageExist ] = useState<boolean>(false)
    const [ imageName, setImageName ] = useState<string>("No file chosen")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [ loadingChangeImage, setLoadingChangeImage ] = useState<boolean>(false)
    const [ changeImageStatus, setChangeImageStatus ] = useState<"success" | "reject" | "null">("null")
    const [ deleteConfirmation, setDeleteConfirmation ] = useState<boolean>(false)
    const [ verificationCooldown, setVerificationCooldown ] = useState<number>(0)
    const [ verificationLoading, setVerificationLoading ] = useState<boolean>(false)

    const username = useRef<HTMLInputElement | null>(null)
    const email = useRef<HTMLInputElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        console.log("userData :", userData)
        const session = localStorage.getItem("session")
        if(session === null) window.location.href = "/access"
        setSession(session as "cloud" | "local")
    }, [])

    // verification cooldown timer
    useEffect(() => {
        if (verificationCooldown <= 0) return

        const intervalId = window.setInterval(() => {
            setVerificationCooldown((prev) => Math.max(prev - 1, 0))
        }, 1000)

        return () => window.clearInterval(intervalId)
    }, [verificationCooldown > 0])

    useEffect(() => {
        const sameUsername = usernameUsestate === userData.attributes.name
        const sameEmail = emailUsestate === userData.attributes.email

        if (sameUsername && sameEmail) {
            setIsCredentialDifferent(false)
            return
        }

        setIsCredentialDifferent(true)
    }, [usernameUsestate, emailUsestate])

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setImageName(file.name);
            setImageExist(true);
        }
    };

    const handleDelete = () => {
        setImageName("No file chosen");
        setImageExist(false);
        setSelectedFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Clear the input value
        }
    };

    const triggerPicker = () => {
        setChangeImageStatus("null")
        fileInputRef.current?.click();
    };

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
                await axios.patch(`${ApiUrl}/users/profile`, {
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

    const handleConfirm = async () => {
        if (loadingChangeImage) return
        if (!selectedFile) return

        const formData = new FormData()
        formData.append("_method", "PATCH")
        formData.append("avatar", selectedFile)

        try {
            setChangeImageStatus("null")
            setLoadingChangeImage(true)

            await axios.post(`${ApiUrl}/users/profile`, formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("Authorization")}`
                }
            })

            setLoadingChangeImage(false)
            setChangeImageStatus("success")

            handleDelete()
        } catch (err) {
            console.log(err)
            setLoadingChangeImage(false)
            setChangeImageStatus("reject")
        }
    }

    // const handleDeleteConfirm = async () => {
    //     if (loadingChangeImage) return

    //     const formData = new FormData()
    //     formData.append("_method", "PATCH")
    //     formData.append("avatar", "")

    //     try {
    //         setChangeImageStatus("null")
    //         setLoadingChangeImage(true)

    //         await axios.post(`${ApiUrl}/users/profile`, formData, {
    //             headers: {
    //                 Authorization: `Bearer ${localStorage.getItem("Authorization")}`
    //             }
    //         })

    //         setLoadingChangeImage(false)
    //         setChangeImageStatus("success")

    //         handleDelete()
    //     } catch (err) {
    //         console.log(err)
    //         setLoadingChangeImage(false)
    //         setChangeImageStatus("reject")
    //     }
    // }

    const handleSendVerification = async () => {
        if (verificationLoading || verificationCooldown > 0) return

        try {
            setVerificationLoading(true)



            setVerificationCooldown(120)
            setVerificationLoading(false)
        } catch (err) {
            setVerificationLoading(false)
        }
    }

    const isConfirmSuccess = !imageExist && changeImageStatus === "success"
    const isConfirmReject = !imageExist && changeImageStatus === "reject"
    const isConfirmEnabled = imageExist
    const confirmButtonClassName = cn(
        "w-10",
        isConfirmSuccess
            ? "bg-green-600 text-white hover:bg-green-700"
            : isConfirmReject
                ? "bg-red-600 text-white hover:bg-red-700"
                : isConfirmEnabled
                    ? "bg-neutral-800 text-white"
                    : "border-3 border-neutral-400 bg-transparent text-neutral-400 hover:bg-neutral-100"
    )

    const changeProfileUI = (
        <DrawerFooter className="flex flex-col gap-8">
            <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept="image/*"
            />
            <div className="flex gap-3 w-full">
                <div className="border-2 border-neutral-400 flex-3 rounded-md flex justify-center items-center text-neutral-800 truncate">{imageName}</div>
                { imageExist &&
                    <Button className="border-3 border-red-500 bg-transparent text-red-500 hover:bg-neutral-100 w-10" onClick={handleDelete}>
                        <FontAwesomeIcon icon={faTrash} className="text-[18px] text-red-500"></FontAwesomeIcon>
                    </Button>
                }
                <Button className={`${!imageExist ? "flex-1 bg-neutral-800" : "w-10 border-3 bg-transparent text-neutral-800 border-neutral-800"}`} onClick={triggerPicker}>
                    <FontAwesomeIcon icon={faUpload} className={`text-[19px]`}></FontAwesomeIcon>
                    { !imageExist && <p>Upload</p> }
                </Button>
                <Button className={confirmButtonClassName} onClick={handleConfirm}>
                    {!loadingChangeImage && <FontAwesomeIcon icon={faCheck} className="text-[18px]"></FontAwesomeIcon>}
                    {loadingChangeImage && <Spinner className="text-[20px]" />}
                </Button>
            </div>
            <Button className="bg-neutral-800" onClick={() => setProfileState(false)}>Back</Button>
        </DrawerFooter>
    )

    const deleteConfirmationUI = (
        <DrawerFooter className="flex flex-col gap-8 w-full">
            <div className="flex flex-col justify-center items-center gap-3 h-20">
                <p className="font-semibold text-base">Are you sure want to delete your photo profile?</p>
                <Button className="flex-1 h-12 w-full bg-red-700">
                    <FontAwesomeIcon icon={faTrash} ></FontAwesomeIcon>
                    <p>Delete</p>
                </Button>
            </div>
            <Button className="w-full" onClick={() => setDeleteConfirmation(false)}>Back</Button>
        </DrawerFooter>
    )

    const menuProfileUI = (
        <DrawerFooter className="flex flex-col gap-8 w-full">
            <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => setProfileState(true)} className="flex-1 bg-neutral-800 h-12">Change Photo Profile</Button>
                <Button onClick={() => setDeleteConfirmation(true)} className="flex-1 bg-neutral-800 h-12">Delete Photo Profile</Button>
            </div>
            <DrawerClose className="w-full">
                <Button className="w-full">Close</Button>
            </DrawerClose>
        </DrawerFooter>
    )



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
                    className="flex flex-col items-center mt-18 w-full gap-10"
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
                                    <img src={`${StorageUrl}/${userData.attributes.avatar}`} className="w-full h-full rounded-full" />
                                    <div className="flex justify-center items-center -translate-y-30 w-full h-full rounded-full bg-neutral-950 opacity-45">
                                        <FontAwesomeIcon icon={faCamera} className="text-5xl text-white" />
                                    </div>
                                </DrawerTrigger>
                                <DrawerContent className="w-screen md:w-[50%] md:absolute md:left-0 md:translate-x-[50%]">
                                    {!profileState && !deleteConfirmation && menuProfileUI}
                                    {deleteConfirmation && deleteConfirmationUI}
                                    {profileState && !deleteConfirmation && changeProfileUI}
                                </DrawerContent>
                            </Drawer>
                    }
                    <div className="flex flex-col gap-3 w-screen px-10 sm:px-0 sm:w-90">
                        <div className="border px-4 py-3 rounded-2xl">
                            <p className="text-base font-normal text-neutral-500">Username</p>
                            <Input className="font-semibold text-base! p-0 m-0 border-0 shadow-none focus-visible:ring-0" ref={username} onChange={(e) => {setUsernameUsestate(e.target.value); console.log(e.target.value)}} placeholder="fill your username..." defaultValue={session === "cloud" ? userData.attributes.name : userData.name}></Input>
                        </div>
                        {session === "cloud" &&
                            <div className="border px-4 py-3 rounded-2xl">
                                <p className="text-base font-normal text-neutral-500">Email</p>
                                <Input className="font-semibold text-base! p-0 m-0 border-0 shadow-none focus-visible:ring-0" ref={email} onChange={(e) => {setEmailUsestate(e.target.value); console.log(e.target.value)}} placeholder="fill your email..." defaultValue={userData.attributes.email}></Input>
                                { session === "cloud" && !userData.attributes.email_verified_at &&
                                    <div className="flex justify-center w-full "> 
                                        <div className="absolute flex gap-3 sm:gap-20 translate-y-5">
                                            <p className="text-sm">Email is unverified.</p>
                                            <Drawer>
                                                <DrawerTrigger className="text-sm text-right text-blue-500 underline flex sm:flex-col">send verification {verificationCooldown > 0 ? `(${verificationCooldown})` : ""}</DrawerTrigger>
                                                <DrawerContent className="w-screen md:w-[50%] md:absolute md:left-0 md:translate-x-[50%]">
                                                    <DrawerHeader>
                                                        <DrawerTitle className="text-xl">Send Verification?</DrawerTitle>
                                                        <DrawerDescription className="text-normal">We'll send you a verification through email. After verification, we can reliably contact the email incase anything bad happens.</DrawerDescription>
                                                    </DrawerHeader>
                                                    <DrawerFooter>
                                                        <Button onClick={handleSendVerification} className={`${verificationCooldown <= 0 ? "bg-blue-600" : "bg-transparent border-2 border-blue-600 text-blue-600"}`}>Send {verificationLoading ? <Spinner></Spinner> : ""} {verificationCooldown > 0 ? `(${verificationCooldown})` : ""}</Button>
                                                        <DrawerClose className="w-full">
                                                            <Button className="w-full bg-transparent border-2 border-neutral-800 text-neutral-800">Close</Button>
                                                        </DrawerClose>
                                                    </DrawerFooter>
                                                </DrawerContent>
                                            </Drawer>
                                        </div>
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