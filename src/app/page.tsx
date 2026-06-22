import { redirect } from 'next/navigation'

export default function RootPage() {
  // In development we land on the login screen (with the dev-prefilled
  // credentials) and sign in manually, rather than being dropped on the
  // dashboard by a still-valid session. Production goes straight in.
  redirect(process.env.NODE_ENV === 'development' ? '/login' : '/dashboard')
}
