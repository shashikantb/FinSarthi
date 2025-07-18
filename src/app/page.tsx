import { redirect } from 'next/navigation';

// Redirect to the new public home page
export default function RootPage() {
  redirect('/home');
}
