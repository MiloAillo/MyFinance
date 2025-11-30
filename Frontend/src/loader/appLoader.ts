import ApiUrl from "@/lib/variable"
import axios, { isAxiosError } from "axios"

const appLoader = async () => {
    const authToken = localStorage.getItem("Authorization")
    console.log("auth token:", authToken)
    const indexedDB = await window.indexedDB.databases()

    console.log("indexedDB", indexedDB)

    if(!authToken) {
        window.location.href = "/access"
    }

    // fetch user credential or fail
    try {
        const res = await axios.get(`${ApiUrl}/api/user/profile`, {
            headers: {
                Authorization: `Bearer ${authToken}`
            }
        })

        const data = await res.data
        return data.data
    } catch(err) {
        if(isAxiosError(err)) {
            console.log(err)
            if(err.response?.status === 401) {
                window.location.href = "/access"
            }
            // need a cather for server error
        }
    }

}

export default appLoader