import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./STYLES/index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import Body from "./COMPONENTS/mainbody/body.jsx";
import Uploadmaterial from "./COMPONENTS/Uploadmaterial.jsx";

const route = createBrowserRouter([

  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Body />
      }, {
        path: "Personal",
        element: <Uploadmaterial />
      }
    ]
  },




])

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={route}></RouterProvider>
  </StrictMode>,
);
