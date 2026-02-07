import { redirect } from 'next/navigation'
import { isAuthenticatedNextjs } from '@convex-dev/auth/nextjs/server'

export default async function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authenticated = await isAuthenticatedNextjs()
  if (authenticated) redirect('/dashboard')
  return <>{children}</>
}
