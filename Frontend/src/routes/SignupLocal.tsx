import localDBCheckLoader from "@/loader/localDBCheckLoader";
import { SignupLocal } from "@/pages/access/SignupLocal";

const signupLocal = {
    path: "access/signup/local",
    element: <SignupLocal />,
    loader: localDBCheckLoader
}

export default signupLocal