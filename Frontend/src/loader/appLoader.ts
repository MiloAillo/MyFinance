import { DBcheck, DBgetname } from "@/lib/db"
import { ApiUrl } from "@/lib/variable"
import axios, { isAxiosError } from "axios"

const appLoader = async () => {
    // get Auth token (MyCloud)
    const authToken = localStorage.getItem("Authorization")
    console.log("auth token:", authToken)

    // get existing local db
    const localDb = await DBcheck()
    console.log("localDb", localDb)

    // =[bug prevent]=
    if(!authToken && !localDb) window.location.href = "/access"

    // =[Output 1: when both exist]=
    if(authToken && localDb) {
        try {
            await axios.get(`${ApiUrl}/api/user/profile`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            })
            window.location.href = "/transfer"
        } catch(err) {
            if(isAxiosError(err)) {
                console.log(err)
                if(err.response?.status === 401) {
                    // delete outdated authToken
                    localStorage.removeItem("Authorization")

                    try {
                        const res = await DBgetname()
                        console.log(res)
                        // =[Output 4: entering as local account]=
                        localStorage.setItem("session", "local")
                        return res
                    } catch(err) {
                        // =[Output 5: kicked because DB error]=
                        window.location.href = "/access"
                    }
                }
                // need a cather for server error
            }
        }
    }

    if(authToken) {
        try {
            const res = await axios.get(`${ApiUrl}/api/user/profile`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            })
    
            const data = await res.data

            // =[Output 2: entering as cloud account]=
            localStorage.setItem("session", "cloud")
            return data.data
        } catch(err) {
            if(isAxiosError(err)) {
                console.log(err)
                if(err.response?.status === 401) {
                    // =[Output 3: kicked because has no valid AuthToken]=
                    window.location.href = "/access"
                }
                // need a cather for server error
            }
        }
    }

    if(localDb) {
        try {
            const res = await DBgetname()
            console.log(res)
            // =[Output 4: entering as local account]=
            localStorage.setItem("session", "local")
            return res
        } catch(err) {
            // =[Output 5: kicked because DB error]=
            window.location.href = "/access"
        }
    }

}

export default appLoader