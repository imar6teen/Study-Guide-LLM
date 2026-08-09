import { createBrowserRouter } from "react-router";
import { Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Signin, Signup, Chat } from "./pages";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Navigate to="/app/chat" replace />,
    },
    {
      path: "/app/chat",
      Component: Chat,
    },
    {
      path: "/app/signin",
      Component: Signin,
    },
    {
      path: "/app/signup",
      Component: Signup,
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
