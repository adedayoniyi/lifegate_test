import { Poppins } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/sidebar";
// import { Toaster } from "@/components/ui/toaster";

const fredoka = Poppins({ weight: "400", subsets: ["latin"] });

export const metadata = {
  title: "Lifegate",
  description: "Hello",
  image: "/thumbnail.png",
  icons: "/favicon.ico",
  noIndex: false
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={fredoka.className}>
        <Sidebar />
        <main> {children}</main>

      </body>
    </html>
  );
}
