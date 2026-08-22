import type { Metadata } from "next";
import { TeacherEditProvider } from "./components/TeacherEditProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "1st Grade Learning Games",
  description: "A colorful game hub for first grade CKLA and Math games.",
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "1st Grade Games",
  },
  icons: {
    icon: [
      {
        url: "/icons/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icons/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    shortcut: "/icons/favicon-32.png",
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TeacherEditProvider>{children}</TeacherEditProvider>
      </body>
    </html>
  );
}
