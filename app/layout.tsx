import type { Metadata } from "next";
import { Bebas_Neue, Oswald, Newsreader } from "next/font/google";
import { createClient } from "@/lib/supabaseServer";
import SiteHeader from "./components/SiteHeader";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "LAST NITE",
  description: "Upload a photo. Gemini writes the caption that only works on that picture.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${bebas.variable} ${oswald.variable} ${newsreader.variable} h-full`}
    >
      <body className={`${newsreader.className} min-h-full`}>
        <div className="site-shell">
          <SiteHeader user={user} />
          {children}
        </div>
      </body>
    </html>
  );
}
