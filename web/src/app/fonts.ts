import { Montserrat, Barlow, Cinzel, Bricolage_Grotesque } from "next/font/google";

export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  variable: "--next-font-montserrat",
  display: "swap",
});

export const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--next-font-barlow",
  display: "swap",
});

export const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--next-font-cinzel",
  display: "swap",
});

export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--next-font-bricolage",
  display: "swap",
});

export const fontVariables = [
  montserrat.variable,
  barlow.variable,
  cinzel.variable,
  bricolage.variable,
].join(" ");
