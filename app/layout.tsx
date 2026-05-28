import type { Metadata } from "next";
import "./globals.css";
import NavBar from "./components/NavBar";

export const metadata: Metadata = {
  title: "エンタメ観劇手帳",
  description: "映画・舞台・LIVEの鑑賞記録を管理する、自分専用のデジタル手帳",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col">
        <NavBar />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-24 pt-4">
          {children}
        </main>
      </body>
    </html>
  );
}
