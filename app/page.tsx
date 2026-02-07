import { redirect } from 'next/navigation'

export default async function Home() {
  // Redirect to dashboard; middleware handles auth for protected routes
  redirect('/dashboard')
}
