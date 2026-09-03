import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AXILER QUANTUM - AI Signal Engine',
  description: 'Live Market Data Signal Bot',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-[#0d0e12] text-white antialiased">{children}</body>
    </html>
  );
}
