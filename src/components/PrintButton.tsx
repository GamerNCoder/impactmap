'use client'

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-800"
    >
      Print or save as PDF
    </button>
  )
}
