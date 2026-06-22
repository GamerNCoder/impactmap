type MatchReasonsProps = {
  reasons: string[]
  matchedSkills?: string[]
  missingSkills?: string[]
}

export default function MatchReasons({
  reasons,
  matchedSkills = [],
  missingSkills = [],
}: MatchReasonsProps) {
  if (reasons.length === 0 && matchedSkills.length === 0) return null

  return (
    <div className="space-y-3">
      {reasons.length > 0 && (
        <ul className="space-y-1.5 text-sm text-gray-600">
          {reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}

      {matchedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {matchedSkills.map((skill) => (
            <span
              key={skill}
              className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {missingSkills.length > 0 && (
        <p className="text-xs text-gray-500">
          Skills to develop: {missingSkills.join(', ')}
        </p>
      )}
    </div>
  )
}
