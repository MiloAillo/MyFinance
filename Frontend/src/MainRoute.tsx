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
import appLoader from "./loader/appLoader";
import TermsOfServiceRoute from "./routes/TermsOfServiceRoute";
import PrivacyPolicyRoute from "./routes/PrivacyPolicyRoute";
import FAQRoute from "./routes/FAQRoute";

const routes = createBrowserRouter([
    {path: "/app", element: <MainPage />, id: "main", loader: appLoader, children: [
        dashboard,
        tracker,
        trackerHistory,
        editProfile,
        report
    ]},
    transfer,
    access,
    signup,
    signupLocal,
    notFound,
    TermsOfServiceRoute,
    PrivacyPolicyRoute,
    FAQRoute
])

export default routes