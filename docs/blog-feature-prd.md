# Blog Feature - Product Requirements Document

## Product Overview

Add a content marketing blog to the retirement calculator platform. The blog will publish educational articles about retirement planning, CPP, and financial literacy to drive SEO traffic and convert readers into calculator users.

## User Personas

**Primary Reader**: Canadians aged 45-65 researching retirement planning, looking for practical guidance and tools.

**Content Administrator**: Lance Jones (lance.jones@precisionnutrition.com) - single admin who creates and publishes articles.

## Core Features

### 1. Article Listings Page

**Route**: `/articles` or `/blog`

**Layout**:
- Grid of article cards
- Responsive grid: 
  - Mobile: 1 column
  - Tablet: 2 columns  
  - Desktop: 3 columns
  - Uses existing app breakpoints
- Cards have rounded corners with colorful gradient backgrounds
- Gradients use lighter colors to ensure text readability
- Each card displays:
  - Article title (overlaid on gradient)
  - Short excerpt/hook (first 150-200 characters)
  - Publish date (formatted as "Nov 5, 2024")
  - Reading time estimate (e.g., "5 min read")
  - Like count with heart icon
  - Optional: Featured image if article has one

**Sorting**: Most recent articles first (by publish_date DESC)

**Visual Design**:
- Gradient backgrounds: randomly assigned from a palette of 8-10 light gradients
- Consistent with existing brand aesthetics
- Supports light and dark mode
- Hover states on cards (subtle elevation/shadow)

### 2. Article Detail Page

**Route**: `/articles/[slug]`

**Layout**:
- Uses existing site header (with login button and theme toggle)
- Full-width article container with max-width for readability (similar to existing app content width)
- Clean typography optimized for long-form reading

**Components**:

**Article Header**:
- Title (large, prominent)
- Publish date
- Reading time estimate  
- Like button and count
- Featured image (if present)

**Article Body**:
- Markdown content rendered with proper formatting
- Headings (H2, H3), paragraphs, lists, bold, italic
- Blockquotes styled distinctly
- Code blocks (if needed)
- Links styled consistently with existing app
- Proper spacing and line-height for readability

**Article Footer**:
- Like button (if not already liked)
- Divider
- Call-to-action section

**CTA Section**:
- Prominent, visually distinct section at bottom of article
- Compelling copy that connects article topic to calculator
- Large button linking to calculator (e.g., "See Your Retirement Numbers")
- Optional: Quick value props (e.g., "No signup required • Run unlimited scenarios • Free forever")

**Navigation**:
- "Back to Articles" link
- Breadcrumbs: Home > Articles > [Article Title]
- Related articles section (optional for MVP - could show 2-3 recent articles)

### 3. Content Management System

**Route**: `/admin/articles` (protected route)

**Access**: Only lance.jones@precisionnutrition.com can access

**Article Creation/Editing Form**:
- Title (text input)
- Slug (auto-generated from title, but editable)
- Excerpt (textarea, 150-200 chars, used for listings page)
- Featured image:
  - Drag-and-drop or file upload
  - Image preview
  - Optional (articles can use gradient backgrounds if no image)
- Content (large textarea for markdown)
- Markdown preview (side-by-side or toggle view)
- Status selector: Draft / Published
- Publish date (defaults to current date/time, but editable)

**Actions**:
- Save as Draft
- Preview (shows article as it will appear live)
- Publish (makes article public)
- Unpublish (reverts to draft)
- Delete (with confirmation)

**Article List View** (`/admin/articles`):
- Table showing: Title, Status, Publish Date, Likes
- Filter by status (All / Draft / Published)
- Sort by publish date or title
- Edit and Delete actions

### 4. Like System

**Functionality**:
- Anonymous likes (no login required)
- Each visitor/browser can give up to 50 likes per article
- Likes tracked per browser/device using localStorage or cookie
- Like count displayed on listings and article pages
- Heart icon button:
  - Empty heart = not liked or can add more likes
  - Clicking adds a like (animates)
  - Shows remaining likes available (e.g., "49 left" on hover)
  - When maxed out, button disabled with message "You've used all your likes"

**Technical**:
- Store total like count in database per article
- Store visitor's like count per article in browser storage
- Simple API endpoint to increment likes with validation

### 5. Navigation Integration

**Main Header**:
- Add "Articles" menu item to existing navigation
- Position: between existing menu items (wherever makes sense)
- Highlighted when on article pages

**Footer** (if exists):
- Link to articles listings

## Technical Requirements

### Database Schema

**articles table**:
```
- id (uuid, primary key)
- title (text, required)
- slug (text, unique, required)
- excerpt (text, required)
- content (text, required) - stores markdown
- featured_image_url (text, nullable)
- status (text, required) - 'draft' or 'published'
- publish_date (timestamp, required)
- created_at (timestamp)
- updated_at (timestamp)
- author_id (uuid, foreign key to auth.users)
- reading_time_minutes (integer) - calculated from content length
```

**article_likes table**:
```
- id (uuid, primary key)
- article_id (uuid, foreign key to articles)
- like_count (integer) - total likes for this article
- created_at (timestamp)
- updated_at (timestamp)
```

**Indexes**:
- articles.slug (unique)
- articles.status + publish_date (for efficient queries)
- article_likes.article_id

### RLS Policies

**articles table**:
- `SELECT`: Public can read where status = 'published'
- `SELECT`: Authenticated user (lance.jones@precisionnutrition.com) can read all
- `INSERT/UPDATE/DELETE`: Only authenticated user (lance.jones@precisionnutrition.com)

**article_likes table**:
- `SELECT`: Public read access
- `UPDATE`: Public can update (with rate limiting in application logic)

### Frontend Components

**Key Pages**:
1. `/articles` - Listings page
2. `/articles/[slug]` - Article detail page
3. `/admin/articles` - Admin list view (protected)
4. `/admin/articles/new` - Create article (protected)
5. `/admin/articles/[id]/edit` - Edit article (protected)

**Shared Components**:
- ArticleCard (for listings grid)
- ArticleContent (markdown renderer)
- LikeButton (with animation and tracking)
- CTASection (reusable CTA block)

**Utilities**:
- Markdown parser (use existing library like react-markdown or marked)
- Reading time calculator (estimate based on word count)
- Slug generator (from title)
- Image upload handler

### Design System

**Colors**:
- Uses existing brand colors
- Gradient palette for article cards (8-10 variations):
  - Light, readable backgrounds
  - Works in both light and dark mode
  - Examples: light blue to light purple, light pink to light orange, etc.

**Typography**:
- Article titles: Large, bold (existing heading styles)
- Body text: Optimized for reading (16-18px, good line-height)
- Uses existing font stack

**Spacing & Layout**:
- Consistent with existing app spacing scale
- Article content max-width: ~720px for readability
- Generous whitespace around content

**Dark Mode**:
- All components support dark mode
- Gradients adjust for dark backgrounds
- Ensure text contrast meets accessibility standards

### SEO Optimization

**Meta Tags** (for each article):
- Title tag: Article title + site name
- Meta description: Article excerpt
- OpenGraph tags:
  - og:title
  - og:description  
  - og:image (featured image or default)
  - og:url
  - og:type: article
- Twitter Card tags
- Canonical URL

**Technical SEO**:
- Semantic HTML (proper heading hierarchy)
- Alt text for images
- Generate sitemap.xml including all published articles
- robots.txt allows crawling
- Structured data (Article schema):
  - headline
  - datePublished
  - dateModified
  - author
  - image

**URLs**:
- Clean, readable slugs
- Format: /articles/retirement-anxiety-peak
- Lowercase, hyphens between words

### Performance

**Optimizations**:
- Featured images: optimized, compressed, responsive sizes
- Lazy loading for images
- Static generation for published articles (if using Next.js)
- Cache article listings

**Reading Time Calculation**:
- Average reading speed: ~200-250 words per minute
- Calculate from markdown word count
- Round to nearest minute
- Store in database to avoid recalculating

## User Flows

### Reader Flow

1. User discovers article via Google search or social media
2. Lands on article detail page
3. Reads article content
4. Sees CTA section at bottom
5. Clicks "Try Calculator" button → goes to calculator
6. Optional: Likes article before leaving
7. Optional: Clicks "Back to Articles" to see more content

### Admin Flow

1. Lance logs into app (existing auth)
2. Navigates to `/admin/articles`
3. Clicks "New Article"
4. Fills in title, excerpt, content (markdown)
5. Optionally uploads featured image
6. Previews article
7. Saves as draft (can return later)
8. When ready, publishes article
9. Article appears on public listings page
10. Can edit or unpublish later if needed

## Out of Scope (Future Considerations)

- Comments section
- Social sharing buttons (could add easily later)
- Article categories/tags
- Search functionality
- Newsletter signup
- Multiple authors
- Analytics dashboard
- A/B testing CTAs
- Related articles algorithm (MVP: just show recent)

## Success Metrics (Not Implemented in MVP)

Track these manually or add later:
- Article views
- Time on page
- Click-through rate to calculator
- Likes per article
- Bounce rate

## Implementation Notes

**Image Storage**:
- Use Supabase Storage for featured images
- Create public bucket: `article-images`
- File naming: `{article-id}-{timestamp}.{ext}`

**Markdown Rendering**:
- Use a proven library (react-markdown recommended)
- Sanitize HTML if allowing raw HTML in markdown
- Style markdown elements to match brand

**Like Tracking**:
- localStorage key: `article_likes_{article_id}`
- Value: number of likes given (0-50)
- Check on page load, disable button if >= 50

**Authentication Check**:
- Middleware or route protection for `/admin/*`
- Verify user email matches lance.jones@precisionnutrition.com
- Redirect to login if not authenticated

**Slug Generation**:
- Convert title to lowercase
- Replace spaces with hyphens
- Remove special characters
- Ensure uniqueness (check database)

## MVP Launch Checklist

- [ ] Database tables created with RLS policies
- [ ] Admin article creation/editing interface
- [ ] Markdown preview in admin
- [ ] Image upload functionality
- [ ] Article listings page with gradient cards
- [ ] Article detail page with proper formatting
- [ ] CTA section at bottom of articles
- [ ] Like button functionality (50 max per visitor)
- [ ] Reading time calculation
- [ ] SEO meta tags on all article pages
- [ ] Sitemap generation
- [ ] Dark mode support
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Navigation menu item added
- [ ] Breadcrumbs on article pages
- [ ] Draft/publish workflow working
- [ ] Admin protected routes working

## Open Questions / Decisions Needed

1. Exact gradient color values (provide palette or generate randomly?)
2. Default featured image if none uploaded?
3. Article card aspect ratio preference?
4. CTA copy variations by article topic, or single CTA?
5. Show author name on articles? (Could be "Precision Nutrition Team" or hide entirely)
6. Archive/unpublish vs hard delete for articles?
