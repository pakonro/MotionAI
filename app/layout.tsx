import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server'
import './globals.css'
import { AppLayout } from '@/components/layout/app-layout'
import { ConvexClientProvider } from '@/components/ConvexClientProvider'

const inter = Inter({ subsets: ['latin'] })

// Convex hooks require client context; avoid SSG to prevent useQuery returning undefined
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'MotionAI - Generate Videos from Images',
  description: 'Transform your images into stunning videos with AI',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const storageNamespace =
    process.env.NEXT_PUBLIC_CONVEX_URL ?? 'motionai_demo'
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexAuthNextjsServerProvider storageNamespace={storageNamespace}>
          <ConvexClientProvider>
            <AppLayout>{children}</AppLayout>
          </ConvexClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  )
}
