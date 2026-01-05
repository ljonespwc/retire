# PRD: Contact Page + Calculator Feedback Widget

## Overview

Two features to add to The Ultimate 🇨🇦 Retirement Calculator:

1. **Contact Page** (`/contact`) — Personal story about why the calculator exists, plus a contact form that stores submissions in Supabase and sends email notifications
2. **Calculator Feedback Widget** — Floating button that appears after the user runs their first calculation, opens a modal to capture satisfaction, issues, and feature requests

**Tech Stack:** React/Next.js frontend, Supabase backend

---

## Feature 1: Contact Page

### Route
`/contact`

### Page Structure

```
/contact
├── Hero section
│   └── Photo + headline
├── Story section
│   └── Personal, conversational copy about why this exists
├── Differentiator section
│   └── Why this beats bank/insurance calculators (concise)
└── Contact form
    └── Name, Email, Message → Submit
```

### Design Notes
- Use existing site header (login, light/dark mode toggle)
- Follow existing branding and styling
- Mobile responsive
- Tone: personal, approachable, not corporate

---

### Contact Page Copy (Draft)

**Hero Section:**

```
Hi, I'm Lance.
I built this calculator because the existing ones aren't good enough.
```

**Story Section:**

```
I like building things that solve real problems. A few years ago, I started 
digging into retirement planning for myself and hit the same wall everyone 
hits: the calculators from banks and insurance companies are... not great.

They're either too simplistic (plug in three numbers, get a vague answer) or 
they're designed to funnel you toward buying their products. None of them 
let you actually explore the questions that keep you up at night:

What if I retire at 60 instead of 65? What if I take CPP early? What happens 
if the market drops right before I retire? What if I live to 95?

So I built something better.
```

**Differentiator Section:**

```
## What's different about this calculator

Most retirement calculators give you one number and call it a day. This one 
lets you run up to 12 scenarios side by side—so you can actually see what 
happens when you change the variables.

No product pitches. No "talk to an advisor" upsells. Just math, visualized, 
so you can make your own informed decisions.

The banks want to sell you mutual funds. The insurance companies want to sell 
you annuities. I just want to help you see your numbers clearly.
```

**Contact Form Section:**

```
## Get in touch

Have feedback? Found a bug? Want to suggest a feature? I'd love to hear from you.

[Name]
[Email]
[Message]

[Send Message]
```

**Success State:**
```
Thanks for reaching out! I'll get back to you soon.
```

---

### Database: `contact_submissions`

```sql
-- Create table
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.contact_submissions enable row level security;

-- Policy: anyone can insert (no auth required)
create policy "Anyone can submit contact form"
  on public.contact_submissions
  for insert
  with check (true);

-- No select/update/delete policies = submissions not readable from client
```

---

### Email Notification (Supabase Edge Function + Resend)

**Trigger:** Database webhook on `contact_submissions` insert

**Edge Function: `notify-contact-submission`**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  const payload = await req.json();
  const { name, email, message } = payload.record;

  await resend.emails.send({
    from: "Calculator Contact <noreply@yourdomain.com>",
    to: "your-email@example.com", // Replace with your email
    subject: `New contact from ${name}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Environment Variable Required:**
- `RESEND_API_KEY` — from your Resend account

**Database Webhook Setup:**
1. Go to Supabase Dashboard → Database → Webhooks
2. Create webhook triggered on INSERT to `contact_submissions`
3. Point to the Edge Function URL

---

## Feature 2: Calculator Feedback Widget

### Behavior

1. **Floating button** appears in bottom-right corner of calculator page
2. **Appears after first calculation** — hook into whatever state/event fires when user runs their first scenario
3. **Click opens modal** with feedback form
4. **After submission:** button changes to "Thanks!" or hides for the session
5. **Dismissal:** if user closes modal without submitting, don't show again for that session (use sessionStorage)

### Feedback Modal Content

```
┌─────────────────────────────────────────┐
│  How was your experience?          [X]  │
├─────────────────────────────────────────┤
│                                         │
│  Rate your experience:                  │
│  ☆ ☆ ☆ ☆ ☆  (1-5 stars)               │
│                                         │
│  Did you get the answers you needed?    │
│  [Yes]  [No]                            │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ What didn't work? (optional)    │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│  (Show this field if "No" selected)     │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Feature requests? (optional)    │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Email (optional, if you'd like a       │
│  response):                             │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│           [Submit Feedback]             │
│                                         │
└─────────────────────────────────────────┘
```

### Floating Button

```
┌──────────────────┐
│  💬 Feedback     │
└──────────────────┘
```

Position: fixed, bottom-right corner (e.g., `bottom: 24px, right: 24px`)

### UX Details

- Use existing modal component for consistency with calculator modals
- Stars component: 5 clickable stars, filled/unfilled states
- "Got answers" toggle: two buttons, one selected state
- Conditional field: "What didn't work?" only shows if "No" is selected
- sessionStorage key: `feedback_submitted` or `feedback_dismissed` to prevent repeat prompts
- Optional: capture `page_url` or scenario count for context

---

### Database: `calculator_feedback`

```sql
-- Create table
create table public.calculator_feedback (
  id uuid primary key default gen_random_uuid(),
  satisfaction int not null check (satisfaction between 1 and 5),
  got_answers boolean,
  what_didnt_work text,
  feature_request text,
  email text,
  page_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.calculator_feedback enable row level security;

-- Policy: anyone can insert
create policy "Anyone can submit feedback"
  on public.calculator_feedback
  for insert
  with check (true);

-- No select/update/delete policies = feedback not readable from client
```

---

## Implementation Phases

### Phase 1: Database Setup
1. Run SQL to create `contact_submissions` table with RLS policy
2. Run SQL to create `calculator_feedback` table with RLS policy
3. Test that inserts work from client (use Supabase client library)

### Phase 2: Contact Page
1. Create `/contact` route in Next.js
2. Build page layout:
   - Hero with photo placeholder (user will add their photo)
   - Story section (use copy draft above)
   - Differentiator section
   - Contact form
3. Wire form submission to Supabase insert
4. Add loading, success, and error states
5. Style to match existing site branding

### Phase 3: Email Notification
1. Confirm Resend account is set up
2. Add `RESEND_API_KEY` to Supabase Edge Function secrets
3. Create `notify-contact-submission` Edge Function
4. Set up database webhook on `contact_submissions` insert
5. Test end-to-end: submit form → email received

### Phase 4: Feedback Widget
1. Create `FeedbackButton` component (floating button)
2. Create `FeedbackModal` component (using existing modal patterns)
3. Create star rating component
4. Add trigger logic:
   - Listen for "first calculation complete" event/state
   - Show button when triggered
   - Hide/change after submission or dismissal
5. Wire modal submission to Supabase insert
6. Add sessionStorage logic to prevent repeat prompts
7. Style to match existing site

---

## Component Structure (Suggested)

```
components/
├── contact/
│   ├── ContactForm.tsx
│   └── ContactPage.tsx (or use pages/contact.tsx)
├── feedback/
│   ├── FeedbackButton.tsx
│   ├── FeedbackModal.tsx
│   └── StarRating.tsx
```

---

## Notes for Implementation

- **Photo:** The contact page includes a placeholder for Lance's photo. He'll provide the actual image file.
- **First calculation trigger:** Hook into existing calculator state that indicates a scenario has been run. If there's a state like `scenariosRun > 0` or an event that fires on calculation, use that.
- **Existing modals:** The calculator already has modals—reuse that component/pattern for the feedback modal.
- **Branding:** Follow existing color scheme, typography, and component styling. The site uses light/dark mode toggle, so ensure both modes work.

---

## Success Criteria

- [ ] `/contact` page loads with story, differentiators, and working form
- [ ] Form submissions appear in `contact_submissions` table
- [ ] Email notification sent on new submission
- [ ] Feedback button appears after first calculation
- [ ] Feedback modal opens, submits to `calculator_feedback` table
- [ ] Button doesn't reappear after submission/dismissal (same session)
- [ ] Both features work in light and dark mode
- [ ] Mobile responsive
