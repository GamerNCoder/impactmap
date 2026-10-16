import { Suspense } from 'react'
import CompleteProfileForm from './CompleteProfileForm'

export const metadata = {
  title: 'Complete your profile | ImpactMap',
  description: 'Add your birthday so we can apply our age and guardian-consent rules.',
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}>
      <CompleteProfileForm />
    </Suspense>
  )
}
