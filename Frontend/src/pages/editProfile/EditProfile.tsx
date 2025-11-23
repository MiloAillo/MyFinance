import { useEffect, useRef, useState, type JSX } from "react";
import { AnimatePresence, motion, spring } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRightFromBracket, faCheck, faEraser, faFilter, faImage, faLock, faSun, faUserPen } from "@fortawesome/free-solid-svg-icons";
import { userData } from "@/lib/userData";
import { XIcon } from "lucide-react";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { faCamera } from "@fortawesome/free-regular-svg-icons";
import { Card } from "@/components/ui/card";

export function EditProfile(): JSX.Element {
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
    const [isChangePhoto, setIsChangePhoto] = useState<boolean>(false)
    const [isRemovePhoto, setIsRemovePhoto] = useState<boolean>(false)

    const [ usernameUsestate, setUsernameUsestate ] = useState<string>(userData.username)
    const [ emailUsestate, setEmailUsestate ] = useState<string>(userData.email)
    const [ isCredentialDifferent, setIsCredentialDifferent ] = useState<boolean>(false)

    const username = useRef<HTMLInputElement | null>(null)
    const email = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        if(username.current && email.current) {
            // set the initial input
            username.current.value = userData.username
            email.current.value = userData.email
        } 
    }, [])

    useEffect(() => {
        const sameUsername = usernameUsestate === userData.username
        const sameEmail = emailUsestate === userData.email

        if (sameUsername && sameEmail) {
            setIsCredentialDifferent(false)
            return
        }

        setIsCredentialDifferent(true)
    }, [usernameUsestate, emailUsestate])

    return (
        <section className="flex flex-col items-center">
            <div className="flex justify-center z-10">
                <div className="fixed z-0 bg-background-primary w-full h-15" />
                <div className="flex justify-between items-center gap-2 mt-5 w-[85%] z-10 fixed">
                    <FontAwesomeIcon icon={faArrowLeft} className="w-10 h-10 text-xl text-neutral-800" />
                    <h1 className="mr-[7px] font-medium text-base text-neutral-500">Edit Profile</h1>
                    {isCredentialDifferent && <FontAwesomeIcon icon={faCheck} className="text-xl" />}
                    {!isCredentialDifferent && <div/>}
                </div>
            </div>
            <div className="flex flex-col items-center mt-18 w-[87%] gap-10">
                <Dialog>
                    <DialogTrigger
                        onClick={() => setIsDialogOpen(true)}
                    >
                        <div className="h-30 w-30">
                            <img src={userData.userImages} alt={userData.username} className="w-full h-full rounded-full" />
                            <div className="flex justify-center items-center -translate-y-30 w-full h-full rounded-full bg-neutral-950 opacity-45">
                                <FontAwesomeIcon icon={faCamera} className="text-5xl text-white" />
                            </div>
                        </div> 
                    </DialogTrigger>
                    <DialogContent className="w-150">
                        <motion.div className="flex flex-col gap-4"
                            layout
                        >
                            {!isRemovePhoto ? <motion.div
                                initial = {{
                                    y: -20,
                                    opacity: 0
                                }}
                                animate = {{
                                    y: 0,
                                    opacity: 100
                                }}
                                whileHover={{
                                    scale: 1.2
                                }}
                                whileTap={{
                                    scale: 1.1
                                }}
                                onClick={() => setIsChangePhoto(prev => !prev)}
                            >
                                <Card className="flex flex-row items-center w-full h-fit p-5 rounded-md">
                                    <FontAwesomeIcon icon={faImage} className="text-2xl" />
                                    <p className="w-full text-lg">Change Photo</p>
                                </Card>
                            </motion.div> : null}
                            {isChangePhoto ? <motion.div
                                initial = {{
                                    y: -20,
                                    opacity: 0
                                }}
                                animate = {{
                                    y: 0,
                                    opacity: 100
                                }}
                                whileHover={{
                                    scale: 1.2
                                }}
                                whileTap={{
                                    scale: 1.1
                                }}               
                            >
                                <Input type="file" id="photo" />
                            </motion.div> : null}
                            {!isChangePhoto ? <motion.div
                                onClick={() => setIsRemovePhoto(prev => !prev)}
                                initial = {{
                                    y: 20,
                                    opacity: 0
                                }}
                                animate = {{
                                    y: 0,
                                    opacity: 100
                                }}
                                whileHover={{
                                    scale: 1.2
                                }}
                                whileTap={{
                                    scale: 1.1
                                }}
                            >
                                <Card className="flex flex-row items-center w-full h-fit p-5 rounded-md">
                                    <FontAwesomeIcon icon={faEraser} className="text-2xl" />
                                    <p className="w-full text-lg">{!isRemovePhoto ? "Remove Photo" : "Are You Sure?"}</p>
                                </Card>
                            </motion.div> : null}
                            {!isChangePhoto ? !isRemovePhoto ? <motion.div
                                initial = {{
                                    y: 20,
                                    opacity: 0
                                }}
                                animate = {{
                                    y: 0,
                                    opacity: 100
                                }}
                                whileHover={{
                                    scale: 1.07
                                }}
                            >
                                <DialogClose className="w-full"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    <Button className="w-full">Nevermind</Button>
                                </DialogClose>
                            </motion.div> : null : null}
                            {isChangePhoto ? <motion.div
                                initial = {{
                                    y: -20,
                                    opacity: 0
                                }}
                                animate = {{
                                    y: 0,
                                    opacity: 100,
                                    transition: {
                                        delay: 0.2
                                    }
                                }}
                                whileHover={{
                                    scale: 1.07
                                }}
                            >
                                <Button className="w-full"
                                    onClick={() => setIsChangePhoto(false)}
                                >
                                    <Button className="w-full">Nevermind, Go Back</Button>
                                </Button>
                            </motion.div> : null}
                            {isChangePhoto ? <motion.div
                                initial = {{
                                    y: -20,
                                    opacity: 0
                                }}
                                animate = {{
                                    y: 0,
                                    opacity: 100,
                                    transition: {
                                        delay: 0.4
                                    }
                                }}
                                whileHover={{
                                    scale: 1.07
                                }}
                            >
                                <Button className="w-full"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    <Button className="w-full">Upload</Button>
                                </Button>
                            </motion.div> : null}
                            {isRemovePhoto ? <motion.div
                                initial = {{
                                    y: -20,
                                    opacity: 0
                                }}
                                animate = {{
                                    y: 0,
                                    opacity: 100,
                                }}
                                whileHover={{
                                    scale: 1.07
                                }}
                            >
                                <Button className="w-full"
                                    onClick={() => setIsRemovePhoto(false)}
                                >No, Go Back</Button>
                            </motion.div> : null}
                            {isRemovePhoto ? <motion.div
                                initial = {{
                                    y: -20,
                                    opacity: 0
                                }}
                                animate = {{
                                    y: 0,
                                    opacity: 100,
                                    transition: {
                                        delay: 0.2
                                    }
                                }}
                                whileHover={{
                                    scale: 1.07
                                }}
                            >
                                <Button className="w-full bg-red-300">Remove Photo</Button>
                            </motion.div> : null}
                        </motion.div>
                    </DialogContent>
                </Dialog>
                <div className="flex flex-col gap-3 w-full sm:w-90">
                    <div className="border px-4 py-3 rounded-2xl">
                        <p className="text-base font-normal text-neutral-500">Username</p>
                        <Input className="font-semibold text-base p-0 m-0 border-0 shadow-none focus-visible:ring-0" ref={username} onChange={(e) => {setUsernameUsestate(e.target.value); console.log(e.target.value)}} placeholder="fill your username..."></Input>
                    </div>
                    <div className="border px-4 py-3 rounded-2xl">
                        <p className="text-base font-normal text-neutral-500">Email</p>
                        <Input className="font-semibold text-base p-0 m-0 border-0 shadow-none focus-visible:ring-0" ref={email} onChange={(e) => {setEmailUsestate(e.target.value); console.log(e.target.value)}} placeholder="fill your email..."></Input>
                    </div>
                </div>
            </div>
        </section>
    )
}