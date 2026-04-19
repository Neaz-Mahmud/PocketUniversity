import { createSlice } from "@reduxjs/toolkit";

const AllteacherSlice = createSlice({
  name: "AllteacherSlice",
  initialState: [
    { id: 1, name: "Tanver Likhon" },
    { id: 2, fullname: "Tanver Likhon" },
  ],

  reducers: {},
});

export default AllteacherSlice;

export const AllteacherSliceactions = AllteacherSlice.actions;
