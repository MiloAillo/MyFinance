import { DBcheck, DBgetname } from "@/lib/db"
import { ApiUrl } from "@/lib/variable"
import axios, { isAxiosError } from "axios"

const appLoader = async () => {
    // get Auth token (MyCloud)
    const authToken = localStorage.getItem("Authorization")
    const user_cache = localStorage.getItem("user-cache")

    console.log("auth token:", authToken)

    // get existing local db
    const localDb = await DBcheck()
    console.log("localDb", localDb)

    // =[bug prevent]=
    if(!authToken && authToken == undefined && !localDb) window.location.href = "/access"

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
        if (user_cache) {
            const data = JSON.parse(user_cache)
            const TTL = 3600000


            // =[OUTPUT 6: allowed from user cache]=
            if (data?.authorization === authToken && (Date.now() - data.timestamp) < TTL) return data

            // if doesnt match then remove the cache and fetch a new one
            else localStorage.removeItem("user-cache")
        }

        try {
            const res = await axios.get(`${ApiUrl}/users/profile`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            })
    
            const data = await res.data.data

            // prep for user cache
            data.authorization = authToken
            data.timestamp = Date.now()

            const stringified_data = JSON.stringify(data)
            localStorage.setItem("user-cache", stringified_data)

            // =[Output 2: entering as cloud account]=
            localStorage.setItem("session", "cloud")
            return data
        } catch(err) {
            if(isAxiosError(err)) {
                console.log(err)
                    // =[Output 3: kicked because has no valid AuthToken]=
                    localStorage.removeItem("Authorization")
                    window.location.href = "/access"
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