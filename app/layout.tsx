import type { Metadata } from "next";
import { TeacherEditProvider } from "./components/TeacherEditProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "1st Grade Learning Games",
  description: "A colorful game hub for first grade CKLA and Math games.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
