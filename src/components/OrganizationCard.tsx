import Link from 'next/link'

type OrganizationCardProps = {
  id: string
  name: string
  description: string | null
  location: string | null
  verified: boolean
  opportunityCount?: number
}

export default function OrganizationCard({
  id,
  name,
  description,
  location,
  verified,
  opportunityCount = 0,
}: OrganizationCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
        {verified && (
          <span className="shrink-0 bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded">
            Verified
          </span>
        )}
      </div>
      {description && (
        <p className="text-gray-600 mb-4 line-clamp-3">{description}</p>
      )}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{location || 'Multiple locations'}</span>
        <span>{opportunityCount} open role{opportunityCount !== 1 ? 's' : ''}</span>
      </div>
      <Link
        href={`/organizations/${id}`}
        className="inline-block mt-4 text-indigo-600 font-medium hover:text-indigo-800"
      >
        View organization →
      </Link>
    </article>
  )
}
