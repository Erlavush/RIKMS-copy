import type { Sdg } from "../lib/api";

const STANDARD_SDG_DATA: Sdg[] = [
    { number: 1, title: "No Poverty", color: "#E5243B" },
    { number: 2, title: "Zero Hunger", color: "#DDA63A" },
    { number: 3, title: "Good Health and Well-being", color: "#4C9F38" },
    { number: 4, title: "Quality Education", color: "#C5192D" },
    { number: 5, title: "Gender Equality", color: "#FF3A21" },
    { number: 6, title: "Clean Water and Sanitation", color: "#26BDE2" },
    { number: 7, title: "Affordable and Clean Energy", color: "#FCC30B" },
    { number: 8, title: "Decent Work and Economic Growth", color: "#A21942" },
    { number: 9, title: "Industry, Innovation and Infrastructure", color: "#FD6925" },
    { number: 10, title: "Reduced Inequalities", color: "#DD1367" },
    { number: 11, title: "Sustainable Cities and Communities", color: "#FD9D24" },
    { number: 12, title: "Responsible Consumption and Production", color: "#BF8B2E" },
    { number: 13, title: "Climate Action", color: "#3F7E44" },
    { number: 14, title: "Life Below Water", color: "#0A97D9" },
    { number: 15, title: "Life on Land", color: "#56C02B" },
    { number: 16, title: "Peace, Justice and Strong Institutions", color: "#00689D" },
    { number: 17, title: "Partnerships for the Goals", color: "#19486A" },
];

// The upload wizard needs these standard labels synchronously. Repository records,
// counts, agencies, and statistics are always fetched from the sanitized API.
export const SDG_DATA = STANDARD_SDG_DATA;
