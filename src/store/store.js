import { configureStore } from "@reduxjs/toolkit";

import AllteacherSlice from "./AllteacherSlice";
import AllNoticeSlice from "./AllNoticeSlice";
import AllUniversityNameSlice from "./AllUniversityNameSlice";
import AllCompanyNameSlice from "./AllCompanyNameSlice";

export const store = configureStore({
  reducer: {
    AllNoticeSlice: AllNoticeSlice.reducer,
    AllteacherSlice: AllteacherSlice.reducer,
    AllUniversityNameSlice: AllUniversityNameSlice.reducer,
    AllCompanyNameSlice: AllCompanyNameSlice.reducer,
  },
});
