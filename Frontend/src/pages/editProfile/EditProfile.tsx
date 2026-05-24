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
import { ApiUrl } from "@/lib/variable";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import useTransition from "@/hooks/useTransition";
import { Loader2Icon } from "lucide-react";
import removeUserCache from "@/functions/remove-user-cache";

export function EditProfile(): JSX.Element {

    const { render, transitionTo, setRender } = useTransition({initValue: true, transitionDelay: 600})
    
    const userData = useRouteLoaderData("main")

    const [ usernameUsestate, setUsernameUsestate ] = useState<string>("")
    const [ emailUsestate, setEmailUsestate ] = useState<string>("")
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
    const [ loadingDeleteImage, setLoadingDeleteImage ] = useState<boolean>(false)
    const [ deleteImageStatus, setDeleteImageStatus ] = useState<"success" | "reject" | "null">("null")
    const [ verificationCooldown, setVerificationCooldown ] = useState<number>(0)
    const [ verificationLoading, setVerificationLoading ] = useState<boolean>(false)

    // for loading purposes 
    const [ sendingRequest, setSendingRequest ] = useState<boolean>(false)

    const username = useRef<HTMLInputElement | null>(null)
    const email = useRef<HTMLInputElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        console.log("userData :", userData)
        const session = localStorage.getItem("session")
        if(session === null) window.location.href = "/access"
        setSession(session as "cloud" | "local")
        
        // Initialize username and email based on session type
        if(session === "cloud") {
            setUsernameUsestate(userData.attributes.name)
            setEmailUsestate(userData.attributes.email)
        } else if(session === "local") {
            setUsernameUsestate(userData.name)
            setEmailUsestate(userData.email)
        }
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
        const originalName = session === "cloud" ? userData.attributes.name : userData.name
        const originalEmail = session === "cloud" ? userData.attributes.email : userData.email
        
        const sameUsername = usernameUsestate === originalName
        const sameEmail = emailUsestate === originalEmail

        if (sameUsername && sameEmail) {
            setIsCredentialDifferent(false)
            return
        }

        setIsCredentialDifferent(true)
    }, [usernameUsestate, emailUsestate, session])

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
        setSendingRequest(true)

        if(session === "local" && username.current?.value) {
            try {
                await DBchangename(username.current.value)

                setRender(false)
                setTimeout(() => window.location.href = "/app/editProfile", 500)
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

                removeUserCache()

                setRender(false)
                setTimeout(() => window.location.href = "/app/editProfile", 500)
            } catch (err) {
                setFailed(true)
            }
        }

        setSendingRequest(true)
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

            removeUserCache()

            setLoadingChangeImage(false)
            setChangeImageStatus("success")
        } catch (err) {
            console.log(err)
            setLoadingChangeImage(false)
            setChangeImageStatus("reject")
        } finally {
            handleDelete()
        }
    }

    const handleDeleteConfirm = async () => {
        if (loadingDeleteImage) return

        const formData = new FormData()
        formData.append("_method", "PATCH")
        formData.append("avatar", "null")

        try {
            setDeleteImageStatus("null")
            setLoadingDeleteImage(true)

            await axios.post(`${ApiUrl}/users/profile`, formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("Authorization")}`
                }
            })

            removeUserCache()

            setLoadingDeleteImage(false)
            setDeleteImageStatus("success")

            handleDelete()
        } catch (err) {
            console.log(err)
            setLoadingDeleteImage(false)
            setDeleteImageStatus("reject")
        }
    }

    const handleSendVerification = async () => {
        if (verificationLoading || verificationCooldown > 0) return

        try {
            setVerificationLoading(true)

            await axios.post(`${ApiUrl}/auth/email/send`, {}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("Authorization")}`      
                }
            })

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
        "w-10 cursor-pointer",
        isConfirmSuccess
            ? "bg-green-600 text-white hover:bg-green-700"
            : isConfirmReject
                ? "bg-red-600 text-white hover:bg-red-700"
                : isConfirmEnabled
                    ? "bg-neutral-800 text-white dark:bg-stone-200 dark:text-stone-800 dark:hover:bg-stone-400 dark:hover:text-stone-800"
                    : "border-3 border-neutral-400 bg-transparent text-neutral-400 hover:bg-neutral-100 bg-transparent border-3 border-stone-800 text-stone-800 hover:bg-stone-800 hover:text-stone-200"
    )

    const isDeleteSuccess = deleteImageStatus === "success"
    const isDeleteReject = deleteImageStatus === "reject"
    const deleteButtonClassName = cn(
        "flex-1 h-12 w-full",
        isDeleteSuccess
            ? "bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 cursor-pointer"
            : isDeleteReject
                ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 cursor-pointer"
                : "bg-red-600 hover:bg-red-500 dark:bg-red-500 dark:text-stone-200 dark:hover:bg-red-600 cursor-pointer"
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
                <div className="border-2 flex-3 rounded-md flex justify-center items-center truncate dark:bg-transparent dark:border-2 dark:text-stone-200 dark:border-stone-300/75 border-stone-800/75 text-stone-800 font-semibold">{imageName}</div>
                { imageExist &&
                    <Button className="border-3 border-red-500 bg-transparent text-red-500 w-10 dark:bg-transparent dark:border-3 dark:text-red-500 dark:border-red-500/75 dark:hover:bg-red-500/20 dark:hover:text-stone-200 cursor-pointer hover:bg-red-200" onClick={handleDelete}>
                        <FontAwesomeIcon icon={faTrash} className="text-[18px]"></FontAwesomeIcon>
                    </Button>
                }
                <Button className={`${!imageExist ? "flex-1 bg-neutral-800 dark:bg-stone-200 dark:text-stone-800 dark:hover:bg-stone-50 dark:hover:text-stone-800 cursor-pointer" : "w-10 border-3 bg-transparent text-neutral-800 border-neutral-800 dark:bg-transparent dark:border-3 dark:text-stone-200 dark:border-stone-300/75 dark:hover:bg-stone-200 dark:hover:text-stone-800 hover:bg-stone-200 cursor-pointer"}`} onClick={triggerPicker}>
                    <FontAwesomeIcon icon={faUpload} className={`text-[19px]`}></FontAwesomeIcon>
                    { !imageExist && <p>Upload</p> }
                </Button>
                <Button className={confirmButtonClassName} onClick={handleConfirm}>
                    {!loadingChangeImage && <FontAwesomeIcon icon={faCheck} className="text-[18px]"></FontAwesomeIcon>}
                    {loadingChangeImage && <Spinner className="text-[20px]" />}
                </Button>
            </div>
            <Button className="dark:bg-transparent dark:border-3 dark:text-stone-200 dark:border-stone-300/75 dark:hover:bg-stone-200 dark:hover:text-stone-800 bg-transparent border-3 border-stone-800 text-stone-800 hover:bg-stone-800 hover:text-stone-200 cursor-pointer" onClick={() => {setProfileState(false); setDeleteImageStatus("null")}}>Back</Button>
        </DrawerFooter>
    )

    const deleteConfirmationUI = (
        <DrawerFooter className="flex flex-col gap-8 w-full">
            <div className="flex flex-col justify-center items-center gap-3 h-20">
                <p className="font-semibold text-base">Are you sure want to delete your photo profile?</p>
                <Button onClick={() => handleDeleteConfirm()} className={deleteButtonClassName}>
                    {!loadingDeleteImage && <FontAwesomeIcon icon={faTrash} ></FontAwesomeIcon>}
                    {loadingDeleteImage && <Spinner className="text-[20px]" />}
                    <p>{isDeleteSuccess ? "Deleted" : isDeleteReject ? "Failed" : "Delete"}</p>
                </Button>
            </div>
            <Button className="w-full dark:bg-transparent dark:border-3 dark:text-stone-200 dark:border-stone-300/75 dark:hover:bg-stone-200 dark:hover:text-stone-800 bg-transparent border-3 border-stone-800 text-stone-800 hover:bg-stone-800 hover:text-stone-200 cursor-pointer" onClick={() => {setDeleteConfirmation(false); setDeleteImageStatus("null")}}>Back</Button>
        </DrawerFooter>
    )

    const menuProfileUI = (
        <DrawerFooter className="flex flex-col gap-8 w-full">
            <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => setProfileState(true)} className="flex-1 bg-neutral-800 h-12 dark:bg-stone-200 dark:hover:bg-stone-400 cursor-pointer">Change Photo Profile</Button>
                <Button onClick={() => setDeleteConfirmation(true)} className="flex-1 bg-neutral-800 h-12 dark:bg-stone-200 dark:hover:bg-stone-400 cursor-pointer">Delete Photo Profile</Button>
            </div>
            <DrawerClose className="w-full">
                <Button className="w-full bg-transparent border-3 border-stone-800 text-stone-800 hover:bg-stone-800 hover:text-stone-200 dark:bg-transparent dark:border-3 dark:text-stone-200 dark:border-stone-300/75 dark:hover:bg-stone-200 dark:hover:text-stone-800 cursor-pointer">Close</Button>
            </DrawerClose>
        </DrawerFooter>
    )



    return (
        <section className="flex flex-col items-center">
            <AnimatePresence>
                { render && <motion.div
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
                        <FontAwesomeIcon onClick={() => {transitionTo("/app")}} icon={faArrowLeft} className="w-10 h-10 text-xl text-neutral-800 dark:text-neutral-400" />
                        <h1 className={`font-medium text-base text-neutral-500 ${!isCredentialDifferent && "mr-5"} ${isCredentialDifferent && "mr-[-5px]"}`}>Edit Profile</h1>
                        {isCredentialDifferent && !sendingRequest && <FontAwesomeIcon onClick={() => edit()} icon={faCheck} className="text-xl dark:text-neutral-400" />}
                        {sendingRequest && <Loader2Icon className="animate-spin" />}
                        {!isCredentialDifferent && !sendingRequest && <div/>}
                    </div>
                </motion.div>}
                { render && <motion.div
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
                                <DrawerTrigger className="h-30 w-30 cursor-pointer">
                                    <img src={session === "cloud" ? userData.attributes.avatar : userData.avatar || ""} className="w-full h-full rounded-full object-cover" />
                                    <div className="flex justify-center items-center -translate-y-30 w-full h-full rounded-full bg-neutral-950 opacity-45">
                                        <FontAwesomeIcon icon={faCamera} className="text-5xl text-white" />
                                    </div>
                                </DrawerTrigger>
                                <DrawerContent className="w-screen md:w-[50%] md:absolute md:left-0 md:translate-x-[50%] dark:bg-stone-900">
                                    {!profileState && !deleteConfirmation && menuProfileUI}
                                    {deleteConfirmation && deleteConfirmationUI}
                                    {profileState && !deleteConfirmation && changeProfileUI}
                                </DrawerContent>
                            </Drawer>
                    }
                    <div className="flex flex-col gap-3 w-screen px-10 sm:px-0 sm:w-90">
                        <div className="border px-4 py-3 rounded-2xl">
                            <p className="text-base font-normal text-neutral-500">Username</p>
                            <Input className="font-semibold text-base! p-0 m-0 border-0 shadow-none focus-visible:ring-0 dark:bg-transparent" ref={username} onChange={(e) => {setUsernameUsestate(e.target.value); console.log(e.target.value)}} placeholder="fill your username..." defaultValue={session === "cloud" ? userData.attributes.name : userData.name}></Input>
                        </div>
                        {session === "cloud" &&
                            <div className="border px-4 py-3 rounded-2xl">
                                <p className="text-base font-normal text-neutral-500">Email</p>
                                <Input className="font-semibold text-base! p-0 m-0 border-0 shadow-none focus-visible:ring-0 dark:bg-transparent" ref={email} onChange={(e) => {setEmailUsestate(e.target.value); console.log(e.target.value)}} placeholder="fill your email..." defaultValue={session === "cloud" ? userData.attributes.email : userData.email}></Input>
                                { session === "cloud" && !userData.attributes.email_verified_at &&
                                    <div className="flex justify-center w-full "> 
                                        <div className="absolute flex gap-3 sm:gap-20 translate-y-5">
                                            <p className="text-sm">Email is unverified.</p>
                                            <Drawer>
                                                <DrawerTrigger className="text-sm text-right text-blue-500 dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-500 underline flex sm:flex-col cursor-pointer">send verification {verificationCooldown > 0 ? `(${verificationCooldown})` : ""}</DrawerTrigger>
                                                <DrawerContent className="w-screen md:w-[50%] md:absolute md:left-0 md:translate-x-[50%] dark:bg-stone-900">
                                                    <DrawerHeader>
                                                        <DrawerTitle className="text-xl">Send Verification?</DrawerTitle>
                                                        <DrawerDescription className="text-normal">We'll send you a verification through email. After verification, we can reliably contact the email incase anything bad happens.</DrawerDescription>
                                                    </DrawerHeader>
                                                    <DrawerFooter>
                                                        <Button onClick={handleSendVerification} className={`${verificationCooldown <= 0 ? "bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400" : "bg-transparent border-3 border-blue-600 text-blue-600 dark:text-blue-500 dark:hover:bg-transparent cursor-not-allowed"}`}>Send {verificationLoading ? <Spinner></Spinner> : ""} {verificationCooldown > 0 ? `(${verificationCooldown})` : ""}</Button>
                                                        <DrawerClose className="w-full">
                                                            <Button className="w-full bg-transparent border-2 border-neutral-800 dark:border-stone-200 text-neutral-800 dark:text-stone-200 dark:hover:bg-stone-200 dark:hover:text-stone-700 ">Close</Button>
                                                        </DrawerClose>
                                                    </DrawerFooter>
                                                </DrawerContent>
                                            </Drawer>
                                        </div>
                                    </div>
                                }
                            </div>
                        }
                        { emailUsestate !== (session === "cloud" ? userData.attributes.email : userData.email) && (session === "cloud" ? userData.attributes.email_verified_at : true) &&
                            <div className="relative w-full border-yellow-500/50 border px-3 py-2 rounded-xl">
                                <p className="font-semibold text-sm  w-full text-yellow-500">To complete email update, we'll send confirmation link to your verified email address.</p>
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