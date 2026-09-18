import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Newsreader, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-serif-latin",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

const notoSerif = Noto_Serif_SC({
  variable: "--font-serif-sc",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const archivo = Archivo({
  variable: "--font-sans-latin",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const notoSans = Noto_Sans_SC({
  variable: "--font-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const plex = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fly.voidvision.ai"),
  title: "蝇审 FLY VERDICT · 果蝇颜值鉴定",
  description:
    "今天由一只果蝇给你的颜值打分。817 个复眼像素，一颗迷你果蝇脑，看看你在它眼里值几分。照片不会离开你的设备，一个字节都不上传。",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  appleWebApp: {
    capable: true,
    title: "蝇审",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    url: "/",
    title: "蝇审 FLY VERDICT",
    description: "今天由一只果蝇给你的颜值打分。你在果蝇眼里值几分？",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      data-theme="dark"
      className={`${newsreader.variable} ${notoSerif.variable} ${archivo.variable} ${notoSans.variable} ${plex.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply the stored theme before paint so light-mode visitors don't see a dark flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("fly-verdict-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
