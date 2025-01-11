import type { Metadata } from "next";
import localFont from "next/font/local";
import { EdgeStoreProvider } from '@/lib/edgestore'
import { getServerSession } from "next-auth";
import SessionProvider from "./components/SessionProvider"
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Booky",
  description: "One Stop Book Shop",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await getServerSession();

  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Makes the sesion available to any client component and the edgestore as well*/}
        <SessionProvider session={session}><EdgeStoreProvider>{children}</EdgeStoreProvider></SessionProvider>
      </body>
    </html>
  );
}
