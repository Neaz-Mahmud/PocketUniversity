import { createSlice } from "@reduxjs/toolkit";

const AccountHolderInfoSlice = createSlice({
  name: "AccountHolderInfoSlice",
  initialState: {
    name: "Shariar Siam",
    semister: "8th",
    section: "F",
    Facebook: "https://www.facebook.com/shariar.siam",
    email: "shariar@gmail.com",
    phone: "01700000000",
    University: "Varendra University",
    role: "Class Representative",

    photo: "/AccountHolderImage/crphoto.jpg",

    department: "CSE",
    batch: "31st",
    studentId: "223311238",
  },
});

export default AccountHolderInfoSlice;
