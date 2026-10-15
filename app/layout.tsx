import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { createClient } from "@/lib/supabaseServer";
import SiteHeader from "./components/SiteHeader";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "PRISM POP — AI Meme Studio & Daily Fortune",
  description:
    "Drop a photo for razor-sharp AI captions or crack open your 24-hour Meme Fortune Cookie.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${jakarta.variable} ${spaceGrotesk.variable} h-full`}>
      <body className={`${jakarta.className} min-h-full`}>
        <div className="ambient-bg" aria-hidden="true">
          <div className="aurora-blob blob-1" />
          <div className="aurora-blob blob-2" />
          <div className="aurora-blob blob-3" />
          <div className="grid-mesh" />
        </div>
        <div className="site-shell">
          <SiteHeader user={user} />
          {children}
        </div>
      </body>
    </html>
  );
}
