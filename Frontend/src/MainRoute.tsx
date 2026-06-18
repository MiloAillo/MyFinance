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
import appLoader from "./loader/appLoader";
import forgotPassword from "./routes/ForgotPasswordRoute";
import forgotPasswordEmailSent from "./routes/ForgotPasswordEmailSentRoute";
import passwordReset from "./routes/PasswordResetRoute";
import changePassword from "./routes/ChangePasswordRoute";
import newLocation from "./routes/NewLocationRoute";
import frequentlyAskedQuestions from "./routes/FAQRoute";
import privacyPolicy from "./routes/PrivacyPolicyRoute";
import termsOfService from "./routes/TermsOfServiceRoute";
import verifyNewEmail from "./routes/VerifyNewEmailRoute";
import verifyEmail from "./routes/VerifyEmailRoute";
import reportLocal from "./routes/ReportLocalRoute";
import reportCloud from "./routes/ReportCloudRoute";

const routes = createBrowserRouter([
    {path: "/app", element: <MainPage />, id: "main", loader: appLoader, children: [
        dashboard,
        tracker,
        trackerHistory,
        editProfile,
        reportLocal,
        reportCloud,
        changePassword
    ]},
    access,
    signup,
    signupLocal,
    newLocation,
    transfer,
    forgotPassword,
    forgotPasswordEmailSent,
    passwordReset,
    verifyEmail,
    verifyNewEmail,
    termsOfService,
    privacyPolicy,
    frequentlyAskedQuestions,
    notFound,
])

export default routes