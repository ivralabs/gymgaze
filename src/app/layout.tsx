import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GymGaze — Gym Advertising Platform",
  description: "Manage gym advertising screens, campaigns, and partner portals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            backgroundImage: 'url(/hero-object.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1,
            background: 'rgba(10,10,10,0.80)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 2 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
