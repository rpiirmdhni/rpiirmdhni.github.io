import type { Metadata } from "next";
import "@splidejs/splide/css";
import "./globals.css";

export const metadata: Metadata = {
  title: "rpiirmdhni",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-olive-50 text-taupe-950 h-dvh flex flex-col overflow-hidden">
        {children}
      </body>
    </html>
  );
}
