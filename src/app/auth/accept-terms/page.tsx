import { Suspense } from 'react'
import AcceptTermsForm from './AcceptTermsForm'

export const metadata = {
  title: 'Accept Terms | ImpactMap',
}

export default function AcceptTermsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}>
      <AcceptTermsForm />
    </Suspense>
  )
}
