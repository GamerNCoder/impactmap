TASK: rm-ai-draft - remove the leftover AI "draft description" feature from ImpactMap (the app must have no AI features).
OWNER / MODEL: one writer.
BASE: this worktree, HEAD.
SCOPE: delete src/components/AiEventDraftButton.tsx, src/lib/ai-client.ts, src/lib/ai.ts, src/app/api/ai/route.ts, src/app/api/ai/context/route.ts. Edit only src/components/CreateEventForm.tsx. Read nothing else unless the check fails.
CONTEXT: CreateEventForm.tsx line 9 imports AiEventDraftButton; around line 227 the Description label sits in `<div className="flex flex-wrap items-center justify-between gap-2 mb-1">` next to `<AiEventDraftButton .../>`. Replace that wrapper div with just the label, giving the label `mb-1`. Remove any state/vars that become unused.
ACCEPT: the five files are gone; no reference to them remains (grep -r "AiEventDraft\|ai-client\|@/lib/ai'\|api/ai" src finds nothing); the check passes.
DELIVER: changes in this worktree. Do not commit.
BUDGET: 1 attempt, 10 min.
STOP: if something else imports these files, reply BLOCKED naming it.
Reply: TASK / STATUS / ARTIFACT / CHECK / USAGE / NEXT, one line each.
