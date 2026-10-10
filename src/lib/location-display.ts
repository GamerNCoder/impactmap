/** Display helpers — online/remote is never shown as a map pin location. */

export function formatEventLocation(location: string | null | undefined, remote?: boolean | null) {
  const place = location?.trim()
  return {
    place: place || null,
    isOnline: Boolean(remote),
    /** Pin row only when there is a real place */
    showPin: Boolean(place),
  }
}

export function formatEventLocationLabel(location: string | null | undefined): string | null {
  const place = location?.trim()
  return place || null
}
