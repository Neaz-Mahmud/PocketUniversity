import { configureStore } from "@reduxjs/toolkit";

import AllteacherSlice from "./AllteacherSlice";
import AllNoticeSlice from "./AllNoticeSlice";

export const store = configureStore({
  reducer: {
    AllNoticeSlice: AllNoticeSlice.reducer,
    AllteacherSlice: AllteacherSlice.reducer,
  },
});
