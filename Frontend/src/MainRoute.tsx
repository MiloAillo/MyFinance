import { createBrowserRouter } from "react-router-dom";
import notFound from "./routes/NotFoundRoute";
import { MainPage } from "./MainPage";
import dashboard from "./routes/DashboardRoute";
import access from "./routes/AccessRoute";
import transfer from "./routes/TransferRoute";
import signup from "./routes/SignupRoute";
import signupLocal from "./routes/SignupLocal";
import tracker from "./routes/TrackerRoute";
import trackerHistory from "./routes/TrackerHistoryRoute";
import editProfile from "./routes/EditProfile";
import report from "./routes/ReportRoute";

const routes = createBrowserRouter([
    {path: "/app", element: <MainPage />, children: [
        dashboard,
        access,
        transfer,
        signup,
        signupLocal,
        tracker,
        trackerHistory,
        editProfile,
        report
    ]},
    notFound
])

export default routes