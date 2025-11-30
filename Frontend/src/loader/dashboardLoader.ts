import ApiUrl from "@/lib/variable"
import axios, { isAxiosError } from "axios"

const dashboardLoader = async () => {
    const authToken = localStorage.getItem("Authorization")

    try {
        const res = await axios.get(`${ApiUrl}/api/trackers`, {
            headers: {
                Authorization: `Bearer ${authToken}`
            }
        })

        const data = await res.data
        return data.data.trackers
    } catch(err) {
        if(isAxiosError(err)) {
            console.log("dashboardLoader", err)
        }
    }
}

export default dashboardLoader