import { createSlice } from "@reduxjs/toolkit";

const AllCompanyNameSlice = createSlice({
  name: "AllCompanyNameSlice",
  initialState: [
    {
      id: 1,
      name: "Grameenphone",
      shortName: "GP",
      type: "Company",
      sector: "Telecommunication",
      location: "Dhaka",
      description: "One of the largest telecom companies in Bangladesh.",
      website: "https://www.grameenphone.com",
    },
    {
      id: 2,
      name: "Brain Station 23",
      shortName: "BS23",
      type: "Company",
      sector: "Software Development",
      location: "Dhaka",
      description:
        "One of the largest IT consulting and software development firms in Bangladesh.",
      website: "https://brainstation-23.com",
    },
    {
      id: 3,
      name: "Vivasoft",
      shortName: "Vivasoft",
      type: "Company",
      sector: "Software Development",
      location: "Dhaka",
      description:
        "A fast-growing software company focused on international clients and clean coding practices.",
      website: "https://www.vivasoftltd.com",
    },
    {
      id: 4,
      name: "Enosis Solutions",
      shortName: "Enosis",
      type: "Company",
      sector: "Software Development",
      location: "Dhaka",
      description:
        "A premier software development and testing company working mostly with US clients.",
      website: "https://www.enosisbd.com",
    },
    {
      id: 5,
      name: "Optimizely",
      shortName: "Optimizely",
      type: "Company",
      sector: "Software Development",
      location: "Dhaka",
      description:
        "US-based multinational company with a major engineering hub in Dhaka.",
      website: "https://www.optimizely.com",
    },
    {
      id: 6,
      name: "Cefalo Bangladesh",
      shortName: "Cefalo",
      type: "Company",
      sector: "Software Development",
      location: "Dhaka",
      description:
        "Norwegian IT company known for a great work-life balance and Scandinavian work culture.",
      website: "https://www.cefalo.com",
    },
    {
      id: 7,
      name: "bKash Limited",
      shortName: "bKash",
      type: "Company",
      sector: "FinTech",
      location: "Dhaka",
      description:
        "The largest mobile financial service provider in Bangladesh, handling massive transaction scales.",
      website: "https://www.bkash.com",
    },
    {
      id: 8,
      name: "Pathao",
      shortName: "Pathao",
      type: "Company",
      sector: "Ride-sharing & Logistics",
      location: "Dhaka",
      description:
        "A leading digital platform in Bangladesh offering ride-sharing, food delivery, and e-commerce logistics.",
      website: "https://pathao.com",
    },
    {
      id: 9,
      name: "Therap (BD) Ltd.",
      shortName: "Therap",
      type: "Company",
      sector: "Healthcare IT",
      location: "Dhaka",
      description:
        "A US-based company providing electronic documentation for organizations supporting people with developmental disabilities.",
      website: "https://www.therapbd.com",
    },
    {
      id: 10,
      name: "TigerIT Bangladesh",
      shortName: "TigerIT",
      type: "Company",
      sector: "IT Security & Identity",
      location: "Dhaka",
      description:
        "Specializes in biometric identity management systems and complex government IT infrastructure.",
      website: "https://www.tigerit.com",
    },
    {
      id: 11,
      name: "Kaz Software",
      shortName: "Kaz",
      type: "Company",
      sector: "Software Development",
      location: "Dhaka",
      description:
        "An award-winning custom software development company building products for global startups and enterprises.",
      website: "https://kaz.com.bd",
    },
    {
      id: 12,
      name: "Southtech Group",
      shortName: "Southtech",
      type: "Company",
      sector: "Software Development",
      location: "Dhaka",
      description:
        "One of the oldest CMMI Level 5 appraised software companies in Bangladesh.",
      website: "https://www.southtechgroup.com",
    },
    {
      id: 13,
      name: "Shohoz",
      shortName: "Shohoz",
      type: "Company",
      sector: "Ride-sharing & Ticketing",
      location: "Dhaka",
      description:
        "A major tech startup providing online ticketing, ride-sharing, and healthcare services.",
      website: "https://www.shohoz.com",
    },
    {
      id: 14,
      name: "Bangladesh Computer Council",
      shortName: "BCC",
      type: "Government",
      sector: "IT Infrastructure",
      location: "Dhaka",
      description:
        "The apex government body for managing national IT infrastructure, data centers, and e-governance.",
      website: "https://bcc.gov.bd",
    },
    {
      id: 15,
      name: "Bangladesh Bank",
      shortName: "BB",
      type: "Government",
      sector: "Finance (IT Wing)",
      location: "Dhaka",
      description:
        "The central bank of Bangladesh, employing CSE graduates for secure financial IT infrastructure and monitoring.",
      website: "https://www.bb.org.bd",
    },
    {
      id: 16,
      name: "Information and Communication Technology Division",
      shortName: "ICTD",
      type: "Government",
      sector: "IT Policy",
      location: "Dhaka",
      description:
        "The government division responsible for drafting IT policies and implementing 'Digital Bangladesh' initiatives.",
      website: "https://ictd.gov.bd",
    },
    {
      id: 17,
      name: "Bangladesh Telecommunication Regulatory Commission",
      shortName: "BTRC",
      type: "Government",
      sector: "Telecommunication",
      location: "Dhaka",
      description:
        "The independent commission that regulates telecommunication and internet services in the country.",
      website: "http://www.btrc.gov.bd",
    },
    {
      id: 18,
      name: "BRAC",
      shortName: "BRAC",
      type: "Non-Government",
      sector: "Development",
      location: "Dhaka",
      description:
        "The world's largest NGO, utilizing massive IT systems for microfinance, education, and health programs.",
      website: "https://www.brac.net",
    },
    {
      id: 19,
      name: "icddr,b",
      shortName: "icddr,b",
      type: "Non-Government",
      sector: "Health Research",
      location: "Dhaka",
      description:
        "An international health research institute that requires developers for bioinformatics and research databases.",
      website: "https://www.icddrb.org",
    },
    {
      id: 20,
      name: "Save the Children Bangladesh",
      shortName: "SCB",
      type: "Non-Government",
      sector: "Development",
      location: "Dhaka",
      description:
        "International NGO that hires IT professionals for data management and digital field tracking systems.",
      website: "https://bangladesh.savethechildren.net",
    },
    {
      id: 21,
      name: "ActionAid Bangladesh",
      shortName: "ActionAid",
      type: "Non-Government",
      sector: "Development",
      location: "Dhaka",
      description:
        "An international NGO focusing on social justice, requiring technical staff for digital advocacy and management.",
      website: "https://bangladesh.actionaid.org",
    },
  ],
});

export default AllCompanyNameSlice;
export const AllCompanyNameSliceactions = AllCompanyNameSlice.actions;
