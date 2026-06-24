/** Silent product analytics — surfaced only via existing analytics dashboards. */

export const APP_EVENT_CATEGORIES = [
  'navigation',
  'auth',
  'profile',
  'volunteer',
  'organization',
  'social',
  'ai',
  'admin',
] as const

export type AppEventCategory = (typeof APP_EVENT_CATEGORIES)[number]

export const APP_EVENTS = {
  PAGE_VIEW: 'page.view',
  AUTH_LOGIN: 'auth.login',
  AUTH_SIGNUP: 'auth.signup',
  ONBOARDING_COMPLETE: 'onboarding.complete',
  PROFILE_UPDATE: 'profile.update',
  APPLICATION_SUBMIT: 'application.submit',
  APPLICATION_ACCEPT: 'application.accept',
  APPLICATION_REJECT: 'application.reject',
  HOURS_LOG: 'hours.log',
  HOURS_VERIFY: 'hours.verify',
  COMPLETION_VERIFY: 'completion.verify',
  COMPETENCY_START: 'competency.start',
  COMPETENCY_COMPLETE: 'competency.complete',
  OPPORTUNITY_VIEW: 'opportunity.view',
  OPPORTUNITY_JOIN: 'opportunity.join',
  MATCHES_VIEW: 'matches.view',
  PASSPORT_VIEW: 'passport.view',
  PUBLIC_PASSPORT_VIEW: 'public_passport.view',
  ID_SUBMIT: 'id.submit',
  ID_REVIEW: 'id.review',
  ORG_EXPORT: 'org.export',
  ORG_EXPORT_ESG: 'org.export_esg',
  ORG_COORDINATOR_REQUEST: 'org.coordinator_request',
  ORG_COORDINATOR_APPROVE: 'org.coordinator_approve',
  ORG_COORDINATOR_REJECT: 'org.coordinator_reject',
  ORG_SETTINGS: 'org.settings',
  ORG_VERIFY: 'org.verify',
  ORG_EVENT_CREATE: 'org.event_create',
  AI_REQUEST: 'ai.request',
  MESSAGE_SEND: 'message.send',
  GROUP_JOIN: 'group.join',
  GROUP_CREATE: 'group.create',
  FORUM_POST: 'forum.post',
  SHARE_POST: 'share.post',
  TRANSFER_CREATE: 'transfer.create',
  TRANSFER_RESPOND: 'transfer.respond',
  REVIEW_SUBMIT: 'review.submit',
  API_KEY_CREATE: 'api.key_create',
  WEBHOOK_REGISTER: 'webhook.register',
  ORG_API_CALL: 'org.api_call',
} as const

export type AppEventName = (typeof APP_EVENTS)[keyof typeof APP_EVENTS]

const EVENT_CATEGORY: Record<AppEventName, AppEventCategory> = {
  [APP_EVENTS.PAGE_VIEW]: 'navigation',
  [APP_EVENTS.AUTH_LOGIN]: 'auth',
  [APP_EVENTS.AUTH_SIGNUP]: 'auth',
  [APP_EVENTS.ONBOARDING_COMPLETE]: 'profile',
  [APP_EVENTS.PROFILE_UPDATE]: 'profile',
  [APP_EVENTS.APPLICATION_SUBMIT]: 'volunteer',
  [APP_EVENTS.APPLICATION_ACCEPT]: 'organization',
  [APP_EVENTS.APPLICATION_REJECT]: 'organization',
  [APP_EVENTS.HOURS_LOG]: 'volunteer',
  [APP_EVENTS.HOURS_VERIFY]: 'organization',
  [APP_EVENTS.COMPLETION_VERIFY]: 'organization',
  [APP_EVENTS.COMPETENCY_START]: 'volunteer',
  [APP_EVENTS.COMPETENCY_COMPLETE]: 'volunteer',
  [APP_EVENTS.OPPORTUNITY_VIEW]: 'volunteer',
  [APP_EVENTS.OPPORTUNITY_JOIN]: 'volunteer',
  [APP_EVENTS.MATCHES_VIEW]: 'volunteer',
  [APP_EVENTS.PASSPORT_VIEW]: 'volunteer',
  [APP_EVENTS.PUBLIC_PASSPORT_VIEW]: 'navigation',
  [APP_EVENTS.ID_SUBMIT]: 'profile',
  [APP_EVENTS.ID_REVIEW]: 'admin',
  [APP_EVENTS.ORG_EXPORT]: 'organization',
  [APP_EVENTS.ORG_EXPORT_ESG]: 'organization',
  [APP_EVENTS.ORG_COORDINATOR_REQUEST]: 'organization',
  [APP_EVENTS.ORG_COORDINATOR_APPROVE]: 'organization',
  [APP_EVENTS.ORG_COORDINATOR_REJECT]: 'organization',
  [APP_EVENTS.ORG_SETTINGS]: 'organization',
  [APP_EVENTS.ORG_VERIFY]: 'admin',
  [APP_EVENTS.ORG_EVENT_CREATE]: 'organization',
  [APP_EVENTS.AI_REQUEST]: 'ai',
  [APP_EVENTS.MESSAGE_SEND]: 'social',
  [APP_EVENTS.GROUP_JOIN]: 'social',
  [APP_EVENTS.GROUP_CREATE]: 'social',
  [APP_EVENTS.FORUM_POST]: 'social',
  [APP_EVENTS.SHARE_POST]: 'social',
  [APP_EVENTS.TRANSFER_CREATE]: 'social',
  [APP_EVENTS.TRANSFER_RESPOND]: 'social',
  [APP_EVENTS.REVIEW_SUBMIT]: 'organization',
  [APP_EVENTS.API_KEY_CREATE]: 'organization',
  [APP_EVENTS.WEBHOOK_REGISTER]: 'organization',
  [APP_EVENTS.ORG_API_CALL]: 'organization',
}

export function categoryForEvent(event: AppEventName): AppEventCategory {
  return EVENT_CATEGORY[event]
}

export function isAppEventName(value: string): value is AppEventName {
  return Object.values(APP_EVENTS).includes(value as AppEventName)
}

export type TrackEventInput = {
  event: AppEventName
  userId?: string | null
  organizationId?: string | null
  path?: string | null
  resourceType?: string | null
  resourceId?: string | null
  metadata?: Record<string, unknown>
}
