import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ReviewIdCard from '@/components/ReviewIdCard'
import { isPlatformAdmin } from '@/lib/platform-admin'

export const metadata = {
  title: 'ID Verification Review | ImpactMap',
}

export default async function AdminIdVerificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/admin/id-verifications')
  }

  if (!(await isPlatformAdmin(user.id))) {
    notFound()
  }

  const { data: pending } = await supabase
    .from('id_verification_submissions')
    .select(`
      *,
      profiles(full_name, email, date_of_birth)
    `)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ID verification review</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Approve or decline volunteer identity documents. Only platform admins can access this page.
          </p>
        </div>

        {pending && pending.length > 0 ? (
          <div className="space-y-4">
            {pending.map((submission) => {
              const raw = submission as {
                id: string
                user_id: string
                document_type: string
                legal_first_name: string
                legal_last_name: string
                document_path: string
                selfie_path: string | null
                attestation_text: string | null
                submitted_at: string | null
                profiles: { full_name: string | null; email: string | null; date_of_birth: string | null } | { full_name: string | null; email: string | null; date_of_birth: string | null }[] | null
              }
              const profile = Array.isArray(raw.profiles) ? raw.profiles[0] ?? null : raw.profiles
              return (
                <ReviewIdCard
                  key={submission.id}
                  submission={{
                    id: raw.id,
                    user_id: raw.user_id,
                    document_type: raw.document_type,
                    legal_first_name: raw.legal_first_name,
                    legal_last_name: raw.legal_last_name,
                    document_path: raw.document_path,
                    selfie_path: raw.selfie_path ?? null,
                    attestation_text: raw.attestation_text ?? null,
                    submitted_at: raw.submitted_at,
                    profiles: profile,
                  }}
                />
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500 bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-800">
            No pending ID verifications.
          </p>
        )}
      </div>
    </div>
  )
}
