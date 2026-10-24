# Pilot playbook

The app is built; the remaining gap is a real group using it once. This is the shortest path to
that evidence. One group, one event, one counselor is enough for an honest pilot.

## Who to ask (in order)

1. Your school's NHS or Key Club advisor.
2. A school counselor who signs service-hour forms.
3. The teen services librarian at the public library.
4. A local nonprofit that already runs weekend volunteer events.

## The ask (keep it this small)

> Could we run one event through ImpactMap? You post the event, students scan the QR when they
> arrive, you approve their hours with one tap, and the counselor checks one code. Setup is about
> 15 minutes. I will do the setup and the follow-up.

Do not ask them to replace their whole process. Replace one paper cycle.

## Three-email sequence

**1 — Ask**

Subject: One volunteer event, one code, 15 minutes

> Hi [Name], I built ImpactMap, a free tool that turns one volunteer event into a verified service
> record. Students scan a QR at the event, the organizer approves hours with one tap, and a
> counselor checks an IMP- code without an account. Could we run one event through it? I will set
> up the organization and the event; you only approve the hours. It takes about 15 minutes.

**2 — Follow up (3 days later)**

Subject: Re: One volunteer event, one code, 15 minutes

> Hi [Name], following up on the pilot. If it helps, the one-page guide is here:
> [link to /pilot/guide]. I can also do a 10-minute screen share and post the event for you.
> Would [date] work for a first event?

**3 — Close the loop (after the event)**

Subject: ImpactMap pilot: what we learned

> Thank you for trying it. [N] students logged [H] hours; the organizer spent [M] minutes approving,
> and the counselor checked a code in [S] seconds. Here is the one thing that was confusing:
> [issue]. Would you be willing to let me quote the group (name, number of students, hours) on the
> site?

## The 15-minute setup

1. Create the organizer account (email + password).
2. Post the event: title, date, place, capacity, category.
3. Open the event page, print the check-in QR, put it at the sign-in table.
4. Students join and scan on arrival; they log hours afterwards.
5. Organizer opens **Manage → Hours to approve** and approves.
6. Counselor opens `/verify`, enters the IMP- code, and sees the record.

## What counts as evidence

Collect these after the pilot; they are the only claims worth putting on the site:

- number of students and verified hours
- organizer minutes spent approving vs. paper
- counselor seconds to check a code
- one quote, with written permission to use the group's name
- one concrete thing that broke or confused people

Do not invent a quote, a partner, or a number. `/about` currently says there has been no real
pilot; update that sentence only after a real one happens.

## Where requests land

The `/pilot` form inserts into `public.pilot_requests`. It is insert-only for the public API.
Read requests with the service role or the Supabase dashboard:

```sql
select organization_name, contact_name, email, role, message, created_at
from public.pilot_requests
order by created_at desc;
```

## Privacy and consent

- Do not put student names, emails or hours in the outreach emails.
- Ask before quoting the group or using its name.
- The pilot guide's privacy paragraph is the short version you can paste into a reply.
- If a guardian or counselor asks, point them at `/safety` and `/privacy`.
