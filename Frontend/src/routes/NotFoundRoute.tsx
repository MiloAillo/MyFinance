import { Navigate } from "react-router-dom";

const notFound = {
    path: "*",
    element: <Navigate to={"/app"} />
}

export default notFound;