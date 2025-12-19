# PostHog Analytics Guide

This guide walks you through creating dashboards and insights in PostHog for Canada Retire Calc.

---

## Our Events

We track 8 custom events:

| Event | Description |
|-------|-------------|
| `$pageview` | Automatic page views (built-in) |
| `calculator_page_viewed` | User opened the calculator |
| `planning_started` | User clicked "Start Planning" from homepage |
| `calculation_completed` | User ran a retirement calculation |
| `scenario_saved` | User saved a scenario |
| `scenario_loaded` | User loaded a saved scenario |
| `what_if_created` | User created a what-if variant |
| `share_link_created` | User created a share link |
| `account_created` | User signed up for an account |

---

## Quick Start: Create Your First Insight

### Step 1: Go to Insights

1. In the left sidebar, click **"Product Analytics"** (or **"Insights"**)
2. Click the **"+ New insight"** button (top right)

### Step 2: Select an Event

1. You'll see a **"Series"** section with a dropdown labeled **"Select event"**
2. Click the dropdown and search for your event (e.g., `calculation_completed`)
3. Select it - the chart will update automatically

### Step 3: Adjust Time Range

1. At the bottom left of the chart area, find the time selector (default: "Last 7 days")
2. Click it to change to "Last 30 days", "Last 90 days", etc.
3. Use "grouped by" dropdown to change granularity (hour, day, week, month)

### Step 4: Save the Insight

1. Click the **"Save"** button (top right)
2. Give it a name like "Calculations - Last 30 Days"
3. Click **"Save"**

---

## Create the Main Dashboard

### Step 1: Create a New Dashboard

1. In the left sidebar, click **"Dashboards"**
2. Click **"+ New dashboard"** (top right)
3. Name it **"Canada Retire Calc - Main"**
4. Click **"Save"**

### Step 2: Add Insights to Dashboard

You'll create 6 insights and add them to this dashboard.

---

## Insight 1: Funnel Overview (Most Important!)

This shows conversion through your main user journey.

1. Click **"+ New insight"**
2. Click the **"Funnels"** tab (next to "Trends")
3. Add these steps in order:
   - Step 1: Click dropdown → search `planning_started` → select it
   - Step 2: Click **"Add step"** → search `calculation_completed` → select it
   - Step 3: Click **"Add step"** → search `scenario_saved` → select it
   - Step 4: Click **"Add step"** → search `account_created` → select it
4. Set time range to **"Last 30 days"**
5. Click **"Save"** → name it **"Main Funnel: Start → Calculate → Save → Signup"**
6. Click the **"..."** menu → **"Add to dashboard"** → select your dashboard

---

## Insight 2: Daily Calculations

1. Click **"+ New insight"**
2. Stay on **"Trends"** tab
3. In Series, select `calculation_completed`
4. Set to **"Last 30 days"**, grouped by **"day"**
5. **Save** as **"Daily Calculations"**
6. **Add to dashboard**

---

## Insight 3: Calculations by Province

1. Click **"+ New insight"**
2. Select `calculation_completed`
3. In the **"Breakdown by"** section (right side), click **"+ Breakdown"**
4. Search for `province` and select it
5. Change chart type: Click **"Line chart"** dropdown (top right of chart) → select **"Bar chart"**
6. Set to **"Last 30 days"**
7. **Save** as **"Calculations by Province"**
8. **Add to dashboard**

---

## Insight 4: What-If Variant Popularity

1. Click **"+ New insight"**
2. Select `what_if_created`
3. Click **"+ Breakdown"** → search `variant_type` → select it
4. Change to **"Bar chart"**
5. Set to **"Last 30 days"**
6. **Save** as **"What-If Variants by Type"**
7. **Add to dashboard**

---

## Insight 5: Feature Adoption (Multi-Series)

Shows multiple events on one chart.

1. Click **"+ New insight"**
2. Select `scenario_saved`
3. Click **"+ Add graph series"** (below the first event)
4. Select `scenario_loaded`
5. Click **"+ Add graph series"** again
6. Select `share_link_created`
7. Set to **"Last 30 days"**, grouped by **"week"**
8. **Save** as **"Feature Adoption: Save, Load, Share"**
9. **Add to dashboard**

---

## Insight 6: Account Signups

1. Click **"+ New insight"**
2. Select `account_created`
3. Click **"+ Breakdown"** → search `had_anonymous_scenarios` → select it
4. Set to **"Last 30 days"**
5. **Save** as **"Account Signups"**
6. **Add to dashboard**

---

## Insight 7: Asset Range Distribution

1. Click **"+ New insight"**
2. Select `calculation_completed`
3. Click **"+ Breakdown"** → search `total_assets_range` → select it
4. Change to **"Pie chart"** or **"Bar chart"**
5. Set to **"Last 30 days"**
6. **Save** as **"Users by Asset Range"**
7. **Add to dashboard**

---

## Arrange Your Dashboard

1. Go to **"Dashboards"** → click your dashboard
2. Click **"Edit layout"** (top right)
3. Drag and resize the insight cards to arrange them
4. Recommended layout:
   - **Top row**: Funnel Overview (full width)
   - **Second row**: Daily Calculations | Calculations by Province
   - **Third row**: What-If Variants | Feature Adoption
   - **Bottom row**: Account Signups | Asset Range Distribution
5. Click **"Save layout"**

---

## Useful Tips

### Filter Out Test Data

If you're testing and want to exclude your own activity:

1. In any insight, find **"Filters"** section (right side)
2. Click **"+ Add filter group"**
3. You can filter by properties or create a cohort of test users to exclude

### Compare Time Periods

1. In any insight, find the **"No comparison"** dropdown (near time range)
2. Select **"Previous period"** to see week-over-week or month-over-month changes

### Set Default Dashboard

1. Go to your dashboard
2. Click **"..."** menu (top right)
3. Click **"Set as default"**
4. This dashboard will load when you open PostHog

### Share Dashboard

1. Go to your dashboard
2. Click **"Share"** button
3. You can share with team members or create a public link

---

## Event Properties Reference

### calculation_completed
- `province` - Two-letter province code (ON, BC, AB, etc.)
- `retirement_age` - User's planned retirement age
- `has_pension` - Boolean: does user have a pension?
- `total_assets_range` - Bucketed: under_100k, 100k_500k, 500k_1m, 1m_2m, over_2m

### scenario_saved
- `is_new` - Boolean: is this a new scenario (vs update)?
- `is_variant` - Boolean: is this a what-if variant?

### scenario_loaded
- `scenario_age_days` - How old is the scenario in days?

### share_link_created
- `is_variant` - Boolean: is this a what-if variant (true) or baseline (false)?

### what_if_created
- `variant_type` - Which variant: front_load, delay_benefits, exhaust, retire_early, legacy, lump_sum

### planning_started
- `is_returning_user` - Boolean: does user have a real account?

### account_created
- `had_anonymous_scenarios` - Boolean: did they have scenarios before signing up?

---

## Pre-Built Templates (Recommended!)

PostHog includes pre-built insights that are very useful. You can find these in **"Insights"** → look for a **"Templates"** tab or section.

### Which Templates to Use

| Template | Use It? | Why |
|----------|---------|-----|
| **Daily active users (DAUs)** | Yes | Core health metric - are people using the app daily? |
| **Weekly active users (WAUs)** | Yes | Smooths out daily noise - better for weekly trends |
| **Retention** | Yes | Critical - are users coming back? Shows week-over-week retention |
| **Growth accounting** | Yes | Shows new vs returning vs resurrected vs dormant users |
| **Referring domain** | Yes | Where is your traffic coming from? (Google, direct, social, etc.) |
| **Pageview funnel, by browser** | Maybe | Useful if you suspect browser-specific issues |

### How to Add Templates to Your Dashboard

1. Go to **"Insights"** in the left sidebar
2. Find the template you want (e.g., "Daily active users (DAUs)")
3. Click on it to open it
4. Click **"Save"** (top right) to save a copy to your account
5. Click **"..."** menu → **"Add to dashboard"** → select your main dashboard

### Recommended Templates to Add

Add these 4 templates to your dashboard for a complete picture:

#### 1. Daily Active Users (DAUs)
- Shows unique users per day
- Good for spotting traffic spikes or drops
- Add to your dashboard's top row

#### 2. Weekly Active Users (WAUs)
- Unique users per week
- Less noisy than DAUs, better for trends
- Good for reporting

#### 3. Retention
- Shows what % of users return in subsequent weeks
- **This is critical** - a retirement calculator should have good retention (users come back to refine plans)
- Example: "Week 0: 100%, Week 1: 25%, Week 2: 15%" means 25% come back after a week

#### 4. Growth Accounting
- Breaks down your users into:
  - **New**: First-time users this week
  - **Returning**: Used last week and this week
  - **Resurrecting**: Used before, skipped weeks, came back
  - **Dormant**: Used before but not this week
- Helps you understand if growth is from new users or retention

#### 5. Referring Domain
- Shows traffic sources: google.com, direct, facebook.com, etc.
- Useful if you do any marketing or SEO
- Helps you know where to focus effort

### Arrange Everything Together

After adding templates, your dashboard should have:

**Row 1** (full width):
- Main Funnel: Start → Calculate → Save → Signup

**Row 2**:
- Daily Active Users | Weekly Active Users

**Row 3**:
- Retention | Growth Accounting

**Row 4**:
- Daily Calculations | Calculations by Province

**Row 5**:
- What-If Variants | Feature Adoption

**Row 6**:
- Referring Domain | Account Signups

This gives you a complete view: traffic health, user behavior, feature usage, and conversion.

---

## Quick Links

- PostHog Docs: https://posthog.com/docs
- Trends Guide: https://posthog.com/docs/product-analytics/trends
- Funnels Guide: https://posthog.com/docs/product-analytics/funnels
- Dashboards Guide: https://posthog.com/docs/product-analytics/dashboards
