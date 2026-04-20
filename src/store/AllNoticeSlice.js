import { createSlice } from "@reduxjs/toolkit";

const AllNoticeSlice = createSlice({
  name: "AllNoticeSlice",
  initialState: {
    notices: [
      {
        title: "Ct Hobe",
        description: "sombare amader datastructure ct hobe",
        noticeType: "Class Test",
        occurDate: "2026-04-22",
        teacherId: "2",
        teacherName: "Tanverlikhon",
      },
    ],
  },
  reducers: {
    pushNotices: (state, action) => {
      console.log(action.payload);
      state.notices.push(action.payload);
    },
    setNotices: (state, action) => {
      state.notices = action.payload;
    },
  },
});
export default AllNoticeSlice;
export const AllNoticeSliceactions = AllNoticeSlice.actions;
