import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./STYLES/index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import Body from "./COMPONENTS/mainbody/body.jsx";
import Uploadmaterial from "./COMPONENTS/mainbody/Uploadmaterial/Uploadmaterial.jsx";
import NoticePostBox, {
  action,
} from "./COMPONENTS/mainbody/Notice/NoticePostBox/NoticePostBox.jsx";
import { store } from "./store/store.js";
import { Provider } from "react-redux";
import AllNotice from "./COMPONENTS/mainbody/Notice/AllNotice/AllNotice.jsx";

import WorkCalendar from "./COMPONENTS/mainbody/Notice/WorkCalender/WorkCalendar.jsx";
import NoticeBoardPage from "./COMPONENTS/mainbody/Notice/NoticeBoardPage/NoticeBoardPage.jsx";
import UniversityList from "./COMPONENTS/mainbody/central segment/Best Material/UniversityList.jsx";
import JobQueries from "./COMPONENTS/mainbody/central segment/Job Queries/JobQueries.jsx";
import CourseList from "./COMPONENTS/mainbody/central segment/Visualizer Tools/CourseList.jsx";
import TopicList from "./COMPONENTS/mainbody/central segment/Visualizer Tools/Topics List/TopicList.jsx";
import SingleTopics from "./COMPONENTS/mainbody/central segment/Visualizer Tools/Each Single Topics/SingleTopics.jsx";
import ProfilePage from "./COMPONENTS/Account/ProfilePage.jsx";

const route = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Body />,
      },
      {
        path: "Personal",
        element: <Uploadmaterial />,
      },
      {
        path: "crsegment",
        element: <Uploadmaterial />,
      },
      {
        path: "postnotice",
        element: <NoticePostBox />,
        action: action,
      },
      {
        path: "allnotice",
        element: <AllNotice />,
      },
      {
        path: "workingcalender",
        element: <NoticeBoardPage />,
      },
      {
        path: "bestmaterial",
        element: <UniversityList />,
      },
      {
        path: "jobqueries",
        element: <JobQueries />,
      },
      {
        path: "visualizertools",
        element: <CourseList />,
      },
      {
        path: `visualizertools/:courseSlug`,

        element: <TopicList />,
      },
      {
        path: `visualizertools/:courseSlug/:topicsSlug`,

        element: <SingleTopics />,
      },

      /*Account Section */
      {
        path: `profile`,

        element: <ProfilePage />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={route} />
    </Provider>
  </StrictMode>,
);
