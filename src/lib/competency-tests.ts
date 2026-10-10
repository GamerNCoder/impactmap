import { VOLUNTEER_SKILLS, type VolunteerSkill } from '@/lib/skills'

export const PASS_THRESHOLD_PERCENT = 80
export const QUESTIONS_PER_TEST = 5

export type CompetencyQuestion = {
  id: string
  question: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  explanation: string
}

export type PublicQuestion = {
  id: string
  question: string
  options: string[]
}

const Q = (
  skill: string,
  n: number,
  question: string,
  options: [string, string, string, string],
  correctIndex: 0 | 1 | 2 | 3,
  explanation: string
): CompetencyQuestion => ({
  id: `${skill.toLowerCase().replace(/\s+/g, '-')}-${n}`,
  question,
  options,
  correctIndex,
  explanation,
})

/** Question banks — at least 5 per skill; tests draw 5 randomly. */
export const COMPETENCY_BANKS: Record<VolunteerSkill, CompetencyQuestion[]> = {
  Communication: [
    Q('Communication', 1, 'A volunteer misunderstands task instructions. Best first step?', ['Repeat louder', 'Ask clarifying questions and paraphrase back', 'Switch tasks', 'Leave early'], 1, 'Clarifying prevents errors and shows active listening.'),
    Q('Communication', 2, 'When emailing a coordinator, you should:', ['Use slang', 'Be clear, polite, and state your ask', 'Write one word', 'CC everyone'], 1, 'Professional clarity builds trust.'),
    Q('Communication', 3, 'Nonverbal communication includes:', ['Only words', 'Tone, eye contact, and body language', 'Written notes only', 'Ignoring others'], 1, 'Volunteers represent orgs in person.'),
    Q('Communication', 4, 'A conflict between volunteers should be:', ['Ignored', 'Escalated immediately to police', 'Addressed calmly or raised to a coordinator', 'Posted online'], 2, 'De-escalation protects everyone.'),
    Q('Communication', 5, 'Active listening means:', ['Planning your reply while they talk', 'Hearing words only', 'Giving full attention and reflecting back', 'Interrupting'], 2, 'Reflection confirms understanding.'),
  ],
  Leadership: [
    Q('Leadership', 1, 'A good volunteer leader:', ['Does everything alone', 'Delegates and supports the team', 'Avoids decisions', 'Criticizes publicly'], 1, 'Leadership multiplies impact.'),
    Q('Leadership', 2, 'When volunteers are unsure what to do, you should:', ['Wait silently', 'Suggest a clear next step and check in', 'Leave', 'Blame the coordinator'], 1, 'Initiative helps events run smoothly.'),
    Q('Leadership', 3, 'Leading by example means:', ['Telling others what you won\'t do', 'Modeling the behavior you expect', 'Skipping orientation', 'Arriving late'], 1, 'Actions set team culture.'),
    Q('Leadership', 4, 'After an event, a leader should:', ['Disappear', 'Help wrap up and thank volunteers', 'Only take credit', 'Complain'], 1, 'Closure matters for retention.'),
    Q('Leadership', 5, 'Inclusive leadership invites:', ['Only friends', 'Diverse perspectives and roles for all', 'Competition only', 'Silence'], 1, 'Inclusion strengthens teams.'),
  ],
  Teaching: [
    Q('Teaching', 1, 'When explaining a task to a new volunteer, start with:', ['Advanced jargon', 'The goal and simple steps', 'A long lecture', 'Assumptions'], 1, 'Goals anchor learning.'),
    Q('Teaching', 2, 'If a learner struggles, you should:', ['Mock them', 'Try a different explanation or demo', 'Give up', 'Replace them'], 1, 'Multiple approaches help different learners.'),
    Q('Teaching', 3, 'Checking for understanding looks like:', ['A final exam', 'Asking them to repeat key steps', 'Never asking questions', 'Rushing'], 1, 'Teach-back confirms retention.'),
    Q('Teaching', 4, 'Patience while teaching is important because:', ['Learners are always slow', 'People learn at different speeds', 'Events have no schedule', 'Coordinators require it'], 1, 'Pace adapts to the learner.'),
    Q('Teaching', 5, 'Safety when teaching physical tasks requires:', ['Skipping warnings', 'Demonstrating hazards and PPE', 'Speed only', 'Letting them guess'], 1, 'Safety first in volunteer training.'),
  ],
  Writing: [
    Q('Writing', 1, 'Volunteer shift notes should be:', ['Vague', 'Clear, factual, and dated', 'Emotional rants', 'Empty'], 1, 'Records help coordinators.'),
    Q('Writing', 2, 'A good subject line for volunteer email:', ['"Hi"', 'Specific topic + event name', 'BLANK', 'ALL CAPS ONLY'], 1, 'Specific subjects get faster replies.'),
    Q('Writing', 3, 'When writing for the public on behalf of an org:', ['Share private data', 'Follow org voice and proofread', 'Use unverified claims', 'Plagiarize'], 1, 'Accuracy protects reputation.'),
    Q('Writing', 4, 'Bullet points help when:', ['Writing novels', 'Listing tasks or outcomes', 'Hiding information', 'Avoiding structure'], 1, 'Scannable text aids busy readers.'),
    Q('Writing', 5, 'Before submitting written work, you should:', ['Never review', 'Proofread for clarity and errors', 'Add typos', 'Remove dates'], 1, 'Proofreading shows professionalism.'),
  ],
  'Social media': [
    Q('Social media', 1, 'Before posting about a volunteer event:', ['Post faces without consent', 'Get coordinator approval and respect privacy', 'Share donor lists', 'Livestream minors secretly'], 1, 'Consent and policy matter.'),
    Q('Social media', 2, 'A strong volunteer recruitment post includes:', ['Vague date', 'Clear call-to-action and impact', 'Only hashtags', 'Negative comments'], 1, 'CTAs drive sign-ups.'),
    Q('Social media', 3, 'Hashtags should be:', ['Random spam', 'Relevant and limited', '500 per post', 'Hidden'], 1, 'Relevant tags improve reach.'),
    Q('Social media', 4, 'If someone attacks your org online, you should:', ['Flame back', 'Follow org crisis protocol / escalate', 'Delete the account', 'Ignore safety'], 1, 'Escalation protects the org.'),
    Q('Social media', 5, 'Accessibility in posts means:', ['Images only', 'Alt text and readable contrast when possible', 'Tiny fonts', 'No captions on video'], 1, 'Accessibility includes more volunteers.'),
  ],
  Organization: [
    Q('Organization', 1, 'Arriving prepared for a shift means:', ['Winging it', 'Knowing time, place, and materials', 'Skipping briefing', 'Bringing unrelated items'], 1, 'Preparation reduces chaos.'),
    Q('Organization', 2, 'Tracking supplies during an event helps:', ['Waste resources', 'Prevent loss and restock needs', 'Ignore inventory', 'Speed exits only'], 1, 'Inventory supports nonprofits.'),
    Q('Organization', 3, 'A simple checklist is useful because:', ['It slows work', 'It reduces missed steps', 'Coordinators forbid plans', 'Only CEOs use lists'], 1, 'Checklists improve reliability.'),
    Q('Organization', 4, 'When managing multiple tasks, prioritize by:', ['Random order', 'Safety and deadlines first', 'Easiest gossip', 'Personal preference only'], 1, 'Safety and time sensitivity come first.'),
    Q('Organization', 5, 'Handing off to the next shift requires:', ['Silence', 'Brief notes on status and open items', 'Leaving mess', 'Taking supplies home'], 1, 'Handoffs prevent dropped work.'),
  ],
  'Customer service': [
    Q('Customer service', 1, 'A frustrated beneficiary should be met with:', ['Arguing', 'Empathy and calm listening', 'Sarcasm', 'Ignoring them'], 1, 'Empathy de-escalates.'),
    Q('Customer service', 2, 'If you don\'t know an answer:', ['Guess', 'Say you\'ll find out from a coordinator', 'Walk away', 'Blame them'], 1, 'Honesty builds trust.'),
    Q('Customer service', 3, 'Volunteer-facing "customers" may include:', ['Only donors', 'Beneficiaries, guests, and partners', 'No one', 'Only staff'], 1, 'Many stakeholders matter.'),
    Q('Customer service', 4, 'Professional tone means:', ['Cold and robotic', 'Respectful and helpful', 'Overly casual insults', 'Shouting'], 1, 'Respect is universal.'),
    Q('Customer service', 5, 'After resolving an issue, you should:', ['Leave abruptly', 'Confirm they feel helped', 'Demand tips', 'Post their story'], 1, 'Confirmation closes the loop.'),
  ],
  'Physical stamina': [
    Q('Physical stamina', 1, 'Before heavy physical volunteering:', ['Skip water', 'Hydrate and wear appropriate gear', 'Eat nothing all day', 'Ignore weather'], 1, 'Hydration prevents injury.'),
    Q('Physical stamina', 2, 'If you feel dizzy during labor:', ['Push through silently', 'Stop and tell a coordinator', 'Drive home dizzy', 'Hide symptoms'], 1, 'Safety overrides pride.'),
    Q('Physical stamina', 3, 'Pacing yourself on long shifts means:', ['Sprint entire time', 'Steady effort with breaks as allowed', 'Sit entire event', 'Skip safety'], 1, 'Pacing sustains output.'),
    Q('Physical stamina', 4, 'Proper lifting technique includes:', ['Bending back only', 'Lifting with legs, not back', 'Twisting while heavy', 'One-hand loads'], 1, 'Leg drive protects your back.'),
    Q('Physical stamina', 5, 'Footwear for outdoor service should be:', ['Fashion heels', 'Closed-toe, supportive shoes', 'Sandals on rocks', 'Barefoot'], 1, 'Foot protection matters outdoors.'),
  ],
  'Outdoor work': [
    Q('Outdoor work', 1, 'Sun safety includes:', ['No sunscreen ever', 'Sunscreen, hat, and breaks in shade', 'Staring at sun', 'Dark clothes only at noon'], 1, 'UV exposure is real.'),
    Q('Outdoor work', 2, 'Trail or park cleanup requires:', ['Leaving sharp trash', 'Gloves and proper disposal', 'Burning plastic', 'Wildlife feeding'], 1, 'PPE and disposal protect everyone.'),
    Q('Outdoor work', 3, 'Weather changes mean you should:', ['Ignore forecasts', 'Follow coordinator weather calls', 'Stay in lightning', 'Work in tornado'], 1, 'Coordinators monitor safety.'),
    Q('Outdoor work', 4, 'Protecting plants/wildlife means:', ['Trampling habitats', 'Staying on paths and following guidance', 'Removing protected species', 'Littering'], 1, 'Stewardship is part of outdoor service.'),
    Q('Outdoor work', 5, 'Insect-heavy areas, you should:', ['Use approved repellent if needed', 'Ignore bites always', 'Spray others', 'Wear perfume only'], 0, 'Repellent reduces disease risk when appropriate.'),
  ],
  'Data entry': [
    Q('Data entry', 1, 'Entering donor/volunteer data requires:', ['Sharing passwords', 'Accuracy and confidentiality', 'Public spreadsheets', 'Guesswork'], 1, 'PII must stay private.'),
    Q('Data entry', 2, 'Double-checking entries helps:', ['Waste time only', 'Catch typos that break records', 'Slow grants', 'Avoid all work'], 1, 'Errors harm reporting.'),
    Q('Data entry', 3, 'If a field is unclear, you should:', ['Invent data', 'Ask a coordinator', 'Leave blank without asking', 'Delete rows'], 1, 'Ask rather than corrupt data.'),
    Q('Data entry', 4, 'Spreadsheet best practice:', ['Merge random cells', 'One piece of info per cell', 'No headers', 'Color only'], 1, 'Structure enables analysis.'),
    Q('Data entry', 5, 'After data entry sessions:', ['Leave screen unlocked', 'Log out / lock devices', 'Email exports to strangers', 'Post screenshots'], 1, 'Device security protects PII.'),
  ],
  Photography: [
    Q('Photography', 1, 'Before photographing beneficiaries:', ['Snap secretly', 'Get consent per org policy', 'Always use flash in eyes', 'Sell photos'], 1, 'Consent is ethical and often legal.'),
    Q('Photography', 2, 'Good event photos show:', ['Empty rooms only', 'Impact and dignity of subjects', 'Blur only', 'Private documents'], 1, 'Dignity-centered storytelling works.'),
    Q('Photography', 3, 'Lighting for volunteers often means:', ['Backlight subjects into silhouette', 'Face subjects toward light when possible', 'Shoot only at night', 'Ignore exposure'], 1, 'Basic lighting improves usability.'),
    Q('Photography', 4, 'Photo files for nonprofits should be:', ['Deleted immediately', 'Organized with date/event labels', 'Unlabeled', 'Only on personal phone forever'], 1, 'Organization helps marketing teams.'),
    Q('Photography', 5, 'If equipment fails:', ['Stop helping', 'Notify coordinator and assist other ways', 'Hide damage', 'Borrow without asking'], 1, 'Flexibility still serves the event.'),
  ],
  Cooking: [
    Q('Cooking', 1, 'Food safety: wash hands:', ['Never', 'Before handling food and after raw meat', 'Only at end', 'With chemicals'], 1, 'Hand hygiene prevents illness.'),
    Q('Cooking', 2, 'Cross-contamination is avoided by:', ['Same board for raw chicken and salad', 'Separate utensils and surfaces', 'Room temperature meat hours', 'Tasting with dirty spoon'], 1, 'Separation prevents bacteria spread.'),
    Q('Cooking', 3, 'Allergen awareness means:', ['Hide ingredients', 'Label major allergens when serving', 'Assume none exist', 'Ignore requests'], 1, 'Allergies can be life-threatening.'),
    Q('Cooking', 4, 'Volunteer kitchen cleanup requires:', ['Leaving pots overnight', 'Sanitizing surfaces and storing food properly', 'Feeding pets first', 'Open flames unsupervised'], 1, 'Cleanup prevents next-day risk.'),
    Q('Cooking', 5, 'Serving hot food safely means:', ['Hold in danger zone for hours', 'Keep hot food hot and cold food cold', 'Serve expired goods', 'No gloves ever'], 1, 'Temperature control limits bacteria.'),
  ],
  'First aid': [
    Q('First aid', 1, 'First priority at an incident scene:', ['Post on social media', 'Check scene safety', 'Move patient blindly', 'Give water to unconscious person'], 1, 'Scene safety protects rescuers.'),
    Q('First aid', 2, 'For severe bleeding, you should:', ['Remove embedded objects', 'Apply direct pressure and call for help', 'Use tourniquet always first', 'Ignore shock'], 1, 'Pressure controls bleeding; escalate per training.'),
    Q('First aid', 3, 'CPR should only be done if:', ['You are trained/certified', 'You saw it on TV once', 'Someone asks for coffee', 'Scene is unsafe'], 0, 'Volunteers act within their training level.'),
    Q('First aid', 4, 'A volunteer first aider should:', ['Diagnose beyond scope', 'Support until professionals arrive', 'Leave without handoff', 'Give random medicines'], 1, 'Scope limits protect patients.'),
    Q('First aid', 5, 'Calling emergency services is needed when:', ['Minor paper cut', 'Life-threatening or uncertain serious injury', 'Volunteer is bored', 'Shift ends'], 1, 'When in doubt, escalate.'),
  ],
  Mentoring: [
    Q('Mentoring', 1, 'A mentor\'s role is to:', ['Control every decision', 'Guide, listen, and empower', 'Judge harshly', 'Replace parents'], 1, 'Mentoring builds autonomy.'),
    Q('Mentoring', 2, 'Boundaries with mentees include:', ['Secret meetings', 'Clear appropriate times and channels', 'Gifts of large money', 'Sharing passwords'], 1, 'Boundaries keep programs safe.'),
    Q('Mentoring', 3, 'If a mentee shares abuse risk, you should:', ['Promise secrecy', 'Follow mandated reporting / org protocol', 'Ignore it', 'Post online'], 1, 'Safety protocols protect youth.'),
    Q('Mentoring', 4, 'Good mentoring goals are:', ['Vague wishes', 'Specific, achievable, and mentee-led', 'Only mentor\'s goals', 'Illegal activities'], 1, 'SMART goals support growth.'),
    Q('Mentoring', 5, 'Consistency as a mentor means:', ['Cancel often', 'Showing up reliably on schedule', 'Ghosting', 'Changing rules weekly'], 1, 'Reliability builds trust.'),
  ],
  Teamwork: [
    Q('Teamwork', 1, 'Effective teams:', ['Never communicate', 'Share information and coordinate', 'Compete internally', 'Hide mistakes'], 1, 'Coordination multiplies impact.'),
    Q('Teamwork', 2, 'When a teammate struggles, offer:', ['Public criticism', 'Specific help or coordinator alert', 'Silence', 'Gossip'], 1, 'Support strengthens outcomes.'),
    Q('Teamwork', 3, 'Role clarity means:', ['Everyone does same task', 'Knowing your assignment and backups', 'Ignoring briefing', 'Refusing swaps'], 1, 'Clarity avoids gaps.'),
    Q('Teamwork', 4, 'Diverse teams benefit from:', ['One voice only', 'Different skills and perspectives', 'Exclusion', 'Uniform opinions'], 1, 'Diversity improves problem-solving.'),
    Q('Teamwork', 5, 'End-of-shift teamwork includes:', ['Leaving mess for others', 'Collective cleanup and debrief', 'Taking shared tools home', 'Blame game'], 1, 'Shared closure respects staff.'),
  ],
  Spanish: [
    Q('Spanish', 1, '"¿Cómo puedo ayudar?" means:', ['Where is bathroom?', 'How can I help?', 'Goodbye', 'I am lost'], 1, 'Core phrase for volunteer greeting.'),
    Q('Spanish', 2, 'When language barrier exists, use:', ['Louder English only', 'Simple Spanish + patience + gestures', 'Ignore them', 'Walk away'], 1, 'Effort and patience matter.'),
    Q('Spanish', 3, '"Gracias" means:', ['Please', 'Thank you', 'Sorry', 'Tomorrow'], 1, 'Basic courtesy builds rapport.'),
    Q('Spanish', 4, 'If unsure of medical Spanish, you should:', ['Guess symptoms', 'Get bilingual staff/interpreter', 'Translate via unverified app only', 'Shout'], 1, 'Accuracy matters in health contexts.'),
    Q('Spanish', 5, '"¿Habla inglés?" asks:', ['Do you speak English?', 'What is your name?', 'Where are you?', 'How old?'], 0, 'Useful intake question.'),
  ],
  Fundraising: [
    Q('Fundraising', 1, 'Ethical fundraising avoids:', ['Pressure and false claims', 'Transparency', 'Thanking donors', 'Receipts when required'], 0, 'Ethics protect nonprofit status.'),
    Q('Fundraising', 2, 'Donor data must be:', ['Sold to marketers', 'Kept confidential per policy', 'Posted publicly', 'Shared on social'], 1, 'Donor privacy is legal/ethical duty.'),
    Q('Fundraising', 3, 'A clear fundraising ask includes:', ['Vague mission only', 'Specific impact of their gift', 'Guilt only', 'No follow-up'], 1, 'Impact links motivate giving.'),
    Q('Fundraising', 4, 'Volunteers asking for donations should:', ['Keep cash personally', 'Follow org procedures and receipts', 'Promise tax advice', 'Door-dash without ID'], 1, 'Procedures prevent fraud.'),
    Q('Fundraising', 5, 'After a donation, thank donors:', ['Never', 'Promptly and sincerely', 'In five years', 'With insults'], 1, 'Gratitude retains supporters.'),
  ],
  Design: [
    Q('Design', 1, 'Flyers for nonprofits should have:', ['Cluttered tiny text', 'Clear hierarchy and readable fonts', 'Neon only', 'No contact info'], 1, 'Hierarchy guides the eye.'),
    Q('Design', 2, 'Brand colors/logos should:', ['Be invented randomly', 'Follow org brand guidelines', 'Violate trademarks', 'Ignore contrast'], 1, 'Consistency builds recognition.'),
    Q('Design', 3, 'Accessibility in design means:', ['Low contrast gray on gray', 'Sufficient contrast and legible type', 'Images only', 'No alt text'], 1, 'Accessible design reaches more people.'),
    Q('Design', 4, 'Before publishing graphics:', ['Skip review', 'Get coordinator approval', 'Add unverified stats', 'Use copyrighted photos'], 1, 'Approval catches errors.'),
    Q('Design', 5, 'White space in layouts:', ['Is wasted', 'Improves readability', 'Must be eliminated', 'Only for print'], 1, 'Whitespace reduces cognitive load.'),
  ],
  Coding: [
    Q('Coding', 1, 'Before changing nonprofit website code:', ['Edit production directly', 'Use test/staging and version control', 'Delete backups', 'Share admin passwords'], 1, 'Staging prevents outages.'),
    Q('Coding', 2, 'User passwords in databases should be:', ['Plain text', 'Hashed with modern algorithms', 'Emailed in CSV', 'On sticky notes'], 1, 'Hashing is security baseline.'),
    Q('Coding', 3, 'A bug in volunteer signup flow — first step:', ['Hide it', 'Reproduce and document steps', 'Blame users', 'Ignore'], 1, 'Reproduction enables fixes.'),
    Q('Coding', 4, 'Open-source volunteer work should:', ['Violate licenses', 'Respect licenses and attribution', 'Remove copyright', 'Sell charity code'], 1, 'License compliance matters.'),
    Q('Coding', 5, 'PII in logs should be:', ['Maximized', 'Minimized/redacted', 'Tweeted', 'Sold'], 1, 'Logs are attack surfaces.'),
  ],
  Patience: [
    Q('Patience', 1, 'Long lines at food distribution require:', ['Rushing people', 'Calm pacing and clear signage', 'Yelling', 'Closing early without notice'], 1, 'Calm reduces stress for guests.'),
    Q('Patience', 2, 'When teaching seniors tech, you should:', ['Mock slowness', 'Repeat calmly without condescension', 'Take their phone', 'Give up'], 1, 'Respect preserves dignity.'),
    Q('Patience', 3, 'If a child volunteer is distracted:', ['Shame them', 'Redirect gently with short tasks', 'Expel immediately', 'Ignore safety'], 1, 'Age-appropriate redirection works.'),
    Q('Patience', 4, 'Patience with yourself means:', ['Perfection day one', 'Learning curves are normal', 'Never ask questions', 'Quit first mistake'], 1, 'Self-compassion sustains service.'),
    Q('Patience', 5, 'Waiting for coordinator decisions:', ['Demand instant answers', 'Use wait time productively', 'Leave mid-task', 'Complain loudly'], 1, 'Productive waiting helps teams.'),
  ],
}

export function isValidSkillKey(skill: string): skill is VolunteerSkill {
  return (VOLUNTEER_SKILLS as readonly string[]).includes(skill)
}

export function pickQuestions(skill: VolunteerSkill, seed?: number): CompetencyQuestion[] {
  const bank = COMPETENCY_BANKS[skill]
  const shuffled = [...bank]
  // Simple seeded shuffle for stable tests per session id optional
  if (seed !== undefined) {
    let s = seed
    for (let i = shuffled.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff
      const j = s % (i + 1)
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
  } else {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
  }
  return shuffled.slice(0, QUESTIONS_PER_TEST)
}

export function toPublicQuestions(questions: CompetencyQuestion[]): PublicQuestion[] {
  return questions.map(({ id, question, options }) => ({
    id,
    question,
    options: [...options],
  }))
}

export function gradeAnswers(
  questions: CompetencyQuestion[],
  answers: Record<string, number>
): { scorePercent: number; passed: boolean; results: { id: string; correct: boolean; explanation: string }[] } {
  let correct = 0
  const results = questions.map((q) => {
    const selected = answers[q.id]
    const isCorrect = selected === q.correctIndex
    if (isCorrect) correct++
    return { id: q.id, correct: isCorrect, explanation: q.explanation }
  })
  const scorePercent = Math.round((correct / questions.length) * 100)
  return {
    scorePercent,
    passed: scorePercent >= PASS_THRESHOLD_PERCENT,
    results,
  }
}

export function encodeQuestionSet(skill: VolunteerSkill, questions: CompetencyQuestion[]): string {
  return Buffer.from(JSON.stringify({ skill, ids: questions.map((q) => q.id) })).toString('base64url')
}

export function decodeQuestionSet(token: string): { skill: VolunteerSkill; ids: string[] } | null {
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as {
      skill: string
      ids: string[]
    }
    if (!isValidSkillKey(parsed.skill)) return null
    return { skill: parsed.skill, ids: parsed.ids }
  } catch {
    return null
  }
}

export function questionsFromToken(token: string): CompetencyQuestion[] | null {
  const decoded = decodeQuestionSet(token)
  if (!decoded) return null
  const bank = COMPETENCY_BANKS[decoded.skill]
  const byId = new Map(bank.map((q) => [q.id, q]))
  const questions = decoded.ids.map((id) => byId.get(id)).filter(Boolean) as CompetencyQuestion[]
  if (questions.length !== decoded.ids.length) return null
  return questions
}
