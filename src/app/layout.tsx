import { Poppins } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/sidebar";
// import { Toaster } from "@/components/ui/toaster";

const fredoka = Poppins({ weight: "400", subsets: ["latin"] });

export const metadata = {
  title: "Prepbase - Study Smarter, Not Harder",
  description: "Transform your notes, lectures, and materials into personalized study guides. Practice, track, and ace your exams with AI-driven precision.",
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
