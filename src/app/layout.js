// src/app/login/layout.js
import "@/app/globals.css";
import { Sarabun } from "next/font/google";

const sarabun = Sarabun({
  subsets: ["thai"],
  weight: ["400", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata = {
  title: "ระบบลงทะเบียน",
  description: "Login page for Thai students",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className="font-sarabun bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
