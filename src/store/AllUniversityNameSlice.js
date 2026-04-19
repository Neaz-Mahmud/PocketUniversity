import { createSlice } from "@reduxjs/toolkit";

const AllUniversityNameSlice = createSlice({
  name: "AllUniversityNameSlice",
  initialState: [
    {
      id: 1,
      name: "University of Dhaka (DU)",
      shortName: "DU",
      city: "Dhaka",
      type: "Public",
      category: "General",
    },
    {
      id: 2,
      name: "Bangladesh University of Engineering & Technology (BUET)",
      shortName: "BUET",
      city: "Dhaka",
      type: "Public",
      category: "Engineering",
    },
    {
      id: 3,
      name: "Jahangirnagar University (JU)",
      shortName: "JU",
      city: "Savar",
      type: "Public",
      category: "General",
    },
    {
      id: 4,
      name: "North South University (NSU)",
      shortName: "NSU",
      city: "Dhaka",
      type: "Private",
      category: "General",
    },
    {
      id: 5,
      name: "BRAC University (BRACU)",
      shortName: "BRACU",
      city: "Dhaka",
      type: "Private",
      category: "General",
    },
    {
      id: 6,
      name: "Bangladesh Agricultural University (BAU)",
      shortName: "BAU",
      city: "Mymensingh",
      type: "Public",
      category: "Agricultural",
    },
    {
      id: 7,
      name: "Rajshahi University (RU)",
      shortName: "RU",
      city: "Rajshahi",
      type: "Public",
      category: "General",
    },
    {
      id: 8,
      name: "Daffodil International University (DIU)",
      shortName: "DIU",
      city: "Dhaka",
      type: "Private",
      category: "General",
    },
    {
      id: 9,
      name: "Shahjalal University of Science & Technology (SUST)",
      shortName: "SUST",
      city: "Sylhet",
      type: "Public",
      category: "Science & Technology",
    },
    {
      id: 10,
      name: "University of Chittagong (CU)",
      shortName: "CU",
      city: "Chittagong",
      type: "Public",
      category: "General",
    },
  ],
});

export default AllUniversityNameSlice;
export const AllUniversityNameSliceactions = AllUniversityNameSlice.actions;
