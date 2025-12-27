import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BootLoaderRemover from '../components/BootLoaderRemover'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Tsa Kasi Deliveries - Fast. Local. Kasi to Kasi.',
  description: 'Township-focused delivery service for fast-food, groceries, alcohol, and parcels in Modimolle and Bela-Bela',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* Boot Loader Overlay: neutral "Loading" shown pre-hydration */}
        <div id="app-loader">
          <div className="loader-content">
            <div className="spinner" aria-hidden="true" />
            <div className="text" role="status" aria-live="polite">Loading</div>
          </div>
        </div>

        {/* Inline CSS ensures immediate styling without waiting for bundles */}
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
  #app-loader { position: fixed; inset: 0; display: grid; place-items: center; background: var(--loader-bg, #fafafa); z-index: 9999; transition: opacity .15s ease; }
  #app-loader .loader-content { display: flex; flex-direction: column; align-items: center; }
  #app-loader .spinner { width: 40px; height: 40px; border: 3px solid rgba(0,0,0,.12); border-top-color: rgba(0,0,0,.8); border-radius: 50%; animation: app-loader-spin .8s linear infinite; }
  #app-loader .text { margin-top: 12px; color: rgba(0,0,0,.6); font: 500 14px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif; text-align: center; }
  @keyframes app-loader-spin { to { transform: rotate(360deg); } }
  @media (prefers-color-scheme: dark) {
    #app-loader { background: var(--loader-bg, #0a0a0a); }
    #app-loader .spinner { border-color: rgba(255,255,255,.25); border-top-color: rgba(255,255,255,.85); }
    #app-loader .text { color: rgba(255,255,255,.7); }
  }
  @media (prefers-reduced-motion: reduce) {
    #app-loader .spinner { animation: none; }
    #app-loader { transition: none; }
  }
            `,
          }}
        />

        {/* Fallback: ensure overlay never sticks if app fails early */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
  (function(){
    function removeLoader(){
      var el = document.getElementById('app-loader');
      if (el) {
        el.style.opacity = '0';
        setTimeout(function(){ if (el) { el.style.display = 'none'; el.style.pointerEvents = 'none'; } }, 180);
      }
    }
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(removeLoader, 0);
    } else {
      document.addEventListener('DOMContentLoaded', removeLoader, { once: true });
    }
  })();
            `,
          }}
        />

        {/* Client-side removal right after hydration */}
        <BootLoaderRemover />

        {children}
      </body>
    </html>
  )
}
