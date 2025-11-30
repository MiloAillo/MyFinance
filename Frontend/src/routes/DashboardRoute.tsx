import dashboardLoader from "@/loader/dashboardLoader"
import { Dashboard } from "@/pages/dashboard/Dashboard"

const dashboard = {
    index: true,
    element: <Dashboard />,
    loader: dashboardLoader
}

export default dashboard