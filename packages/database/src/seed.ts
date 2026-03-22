import { PrismaClient, PromptCategory, AIModel, UserRole } from '../generated/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PASSWORD_HASH = '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmKLCSTAs3kQu.NLtFseTEZVwECKrm' // Password123!

// ─── Cleanup ──────────────────────────────────────────────────────────────────

async function cleanup() {
  console.log('🧹 Cleaning up old data...')
  await prisma.userBadge.deleteMany()
  await prisma.battleVote.deleteMany()
  await prisma.battleSession.deleteMany()
  await prisma.apiKey.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.purchase.deleteMany()
  await prisma.collectionItem.deleteMany()
  await prisma.collection.deleteMany()
  await prisma.promptExecution.deleteMany()
  await prisma.upvote.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.promptTag.deleteMany()
  await prisma.promptModelSupport.deleteMany()
  await prisma.promptVersion.deleteMany()
  await prisma.prompt.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(daysBack: number) {
  return new Date(Date.now() - Math.random() * daysBack * 24 * 60 * 60 * 1000)
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Prompt Data ──────────────────────────────────────────────────────────────

const PROMPT_DATA: Array<{
  title: string
  description: string
  category: PromptCategory
  authorKey: string
  upvoteCount: number
  viewCount: number
  forkCount: number
  downloadCount: number
  tags: string[]
  versions: Array<{ content: string; changelog: string; variables: Array<{name:string;description:string;default?:string}> }>
}> = [
  // ── CODING ──────────────────────────────────────────────────────────────────
  {
    title: 'Code Reviewer Pro',
    description: 'Senior engineer-level code review covering security, performance, architecture, and bugs. Provides prioritized, actionable feedback with code examples.',
    category: PromptCategory.CODING,
    authorKey: 'alex_chen',
    upvoteCount: 847, viewCount: 12400, forkCount: 89, downloadCount: 340,
    tags: ['coding', 'refactoring', 'gpt-4', 'claude'],
    versions: [
      {
        content: 'Review this {{language}} code for bugs and improvements:\n\n{{code}}',
        changelog: 'Initial version',
        variables: [{ name: 'language', description: 'Programming language', default: 'TypeScript' }, { name: 'code', description: 'Code to review' }]
      },
      {
        content: 'You are a senior software engineer. Review this {{language}} code:\n\n{{code}}\n\nCheck for: bugs, security issues, performance problems, code style.',
        changelog: 'Added structured checklist',
        variables: [{ name: 'language', description: 'Programming language', default: 'TypeScript' }, { name: 'code', description: 'Code to review' }]
      },
      {
        content: `You are a senior software engineer conducting a thorough code review. Analyze the following {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

Provide a structured review covering:

## 🔒 Security Issues
List any security vulnerabilities (injection, XSS, CSRF, auth bypasses, secrets exposure).

## ⚡ Performance
Identify bottlenecks: N+1 queries, unnecessary re-renders, memory leaks, O(n²) algorithms, missing caching.

## 🏗️ Architecture & Design
- SOLID principle violations
- Missing abstractions or over-engineering
- Coupling and cohesion issues
- Naming and readability concerns

## 🐛 Bugs & Edge Cases
- Logic errors
- Null/undefined handling
- Race conditions
- Missing error handling
- Off-by-one errors

## ✅ What's Done Well
Acknowledge good patterns and practices to reinforce them.

## 📋 Prioritized Action Items
List fixes in order of importance:
- P0 (Critical — fix before merge)
- P1 (Important — fix soon)
- P2 (Nice-to-have — tech debt)

For each P0 and P1 issue, provide a specific code fix example.`,
        changelog: 'Added security, architecture sections and prioritized action items',
        variables: [
          { name: 'language', description: 'Programming language', default: 'TypeScript' },
          { name: 'code', description: 'Code to review' }
        ]
      }
    ]
  },
  {
    title: 'SQL Query Optimizer',
    description: 'Database performance expert that analyzes your SQL queries, identifies bottlenecks, rewrites them for speed, and generates the exact indexes you need.',
    category: PromptCategory.CODING,
    authorKey: 'sarah_kim',
    upvoteCount: 623, viewCount: 8900, forkCount: 45, downloadCount: 210,
    tags: ['coding', 'sql', 'data-science'],
    versions: [
      {
        content: 'Optimize this SQL query:\n\n{{query}}',
        changelog: 'Initial version',
        variables: [{ name: 'query', description: 'SQL query to optimize' }]
      },
      {
        content: `You are a database performance expert. Analyze and optimize this SQL query:

**Database**: {{database}}
**Query**:
\`\`\`sql
{{query}}
\`\`\`

**Table schemas** (if provided):
{{schemas}}

Provide:
1. **Query Analysis**: Explain what the query does and identify performance issues (full table scans, missing indexes, N+1, etc.)
2. **Optimized Query**: Rewrite with improvements — use CTEs, proper JOINs, window functions where appropriate
3. **Indexes Recommended**: Exact CREATE INDEX statements with rationale
4. **Explanation**: Why your version is faster (with estimated improvement %)
5. **EXPLAIN ANALYZE**: What to look for in the execution plan output`,
        changelog: 'Added schema input, index recommendations, and EXPLAIN guidance',
        variables: [
          { name: 'database', description: 'Database type', default: 'PostgreSQL' },
          { name: 'query', description: 'SQL query to optimize' },
          { name: 'schemas', description: 'Table schemas (optional)', default: 'Not provided' }
        ]
      }
    ]
  },
  {
    title: 'Test Suite Generator',
    description: 'Generate comprehensive test suites with happy path, edge cases, error handling, and integration scenarios. Works with Jest, Vitest, PyTest, and more.',
    category: PromptCategory.CODING,
    authorKey: 'alex_chen',
    upvoteCount: 512, viewCount: 7200, forkCount: 38, downloadCount: 180,
    tags: ['coding', 'testing', 'gpt-4'],
    versions: [
      {
        content: 'Write tests for this {{language}} code using {{framework}}:\n\n{{code}}',
        changelog: 'Initial version',
        variables: [{ name: 'language', description: 'Language' }, { name: 'framework', description: 'Test framework' }, { name: 'code', description: 'Code to test' }]
      },
      {
        content: `You are a testing expert specializing in {{framework}}. Generate a comprehensive test suite for:

**Function/Component**:
\`\`\`{{language}}
{{code}}
\`\`\`

**Testing Framework**: {{framework}}

Create tests covering:
1. **Happy path** — normal expected behavior with typical inputs
2. **Edge cases** — boundary values (empty arrays, null, undefined, max values, zero)
3. **Error cases** — invalid inputs, thrown exceptions, rejected promises, network failures
4. **Integration scenarios** — how it interacts with dependencies

Format each test with:
- A clear, behavior-describing test name ("should return empty array when input is null")
- Arrange/Act/Assert structure
- Helpful failure messages
- Setup/teardown as needed

Include a brief comment explaining WHY each edge case test matters (what real bug it prevents).`,
        changelog: 'Added edge cases, integration scenarios, and WHY comments',
        variables: [
          { name: 'language', description: 'Programming language', default: 'TypeScript' },
          { name: 'framework', description: 'Test framework', default: 'Jest + React Testing Library' },
          { name: 'code', description: 'Code to test' }
        ]
      }
    ]
  },
  {
    title: 'Debug Assistant',
    description: 'Diagnose tricky bugs with expert root cause analysis, exact fixes, and prevention strategies. Works with any language or framework.',
    category: PromptCategory.CODING,
    authorKey: 'dev_marcus',
    upvoteCount: 445, viewCount: 6800, forkCount: 29, downloadCount: 198,
    tags: ['coding', 'gpt-4', 'productivity'],
    versions: [
      {
        content: 'Help me debug this error:\n\n{{error}}\n\nCode:\n{{code}}',
        changelog: 'Initial version',
        variables: [{ name: 'error', description: 'Error message' }, { name: 'code', description: 'Code' }]
      },
      {
        content: `You are an expert debugger. Help diagnose this issue:

**Error message / Stack trace**:
\`\`\`
{{error}}
\`\`\`

**Code context**:
\`\`\`{{language}}
{{code}}
\`\`\`

**Environment**: {{environment}}
**What I expected**: {{expected}}
**What actually happened**: {{actual}}

Provide:
1. **Root cause** — Exactly what is causing this error and why
2. **Fix** — The exact code change to resolve it (show before/after)
3. **Why this works** — Brief explanation of the fix
4. **Prevention** — How to avoid this class of bugs in the future
5. **Related issues** — Other potential problems to check nearby`,
        changelog: 'Added context fields, before/after fix format, and prevention tips',
        variables: [
          { name: 'error', description: 'Error message or stack trace' },
          { name: 'language', description: 'Language', default: 'TypeScript' },
          { name: 'code', description: 'Relevant code snippet' },
          { name: 'environment', description: 'Environment info', default: 'Node.js v20, macOS' },
          { name: 'expected', description: 'Expected behavior' },
          { name: 'actual', description: 'Actual behavior' }
        ]
      }
    ]
  },
  {
    title: 'API Endpoint Designer',
    description: 'Design complete RESTful APIs with endpoints, request/response schemas, error codes, authentication, rate limiting, and OpenAPI spec.',
    category: PromptCategory.CODING,
    authorKey: 'nina_web',
    upvoteCount: 389, viewCount: 5600, forkCount: 24, downloadCount: 145,
    tags: ['coding', 'api-design', 'documentation'],
    versions: [
      {
        content: `Design a RESTful API for: {{feature_description}}

**Tech Stack**: {{stack}}
**Auth**: {{auth_method}}

Provide:
1. **Endpoints** — Complete list with HTTP method, path, description
2. **Request/Response schemas** — JSON examples for each endpoint
3. **Error responses** — Standard error format with status codes
4. **Authentication** — How to secure each endpoint
5. **OpenAPI snippet** — YAML spec for the most important endpoint
6. **Rate limiting** — Suggested limits per endpoint type`,
        changelog: 'Initial version',
        variables: [
          { name: 'feature_description', description: 'What the API does' },
          { name: 'stack', description: 'Tech stack', default: 'Node.js + Express' },
          { name: 'auth_method', description: 'Authentication method', default: 'JWT Bearer tokens' }
        ]
      }
    ]
  },
  {
    title: 'PR Description Writer',
    description: 'Generate clear, comprehensive pull request descriptions with summary, motivation, changes, testing notes, and reviewer guidance.',
    category: PromptCategory.CODING,
    authorKey: 'alex_chen',
    upvoteCount: 334, viewCount: 4900, forkCount: 18, downloadCount: 167,
    tags: ['coding', 'documentation', 'productivity'],
    versions: [
      {
        content: `Write a pull request description for these changes:

**Changes made**:
{{changes}}

**Issue/ticket**: {{issue}}
**Type**: {{type}} (feature/bug/refactor/chore)

Create a PR description with:
## Summary
What this PR does in 2-3 sentences. Why it exists.

## Motivation
The problem or requirement that drove this change.

## Changes
Bullet list of specific changes made. Group by area if large.

## Testing
- How to test this change manually
- What automated tests were added/modified
- Any edge cases to verify

## Screenshots (if UI changes)
[Placeholder: Add before/after screenshots]

## Reviewer Notes
- Things reviewers should focus on
- Known limitations or follow-up work
- Dependencies or rollout considerations`,
        changelog: 'Initial version',
        variables: [
          { name: 'changes', description: 'git diff summary or description of changes' },
          { name: 'issue', description: 'Related issue/ticket', default: 'N/A' },
          { name: 'type', description: 'Change type', default: 'feature' }
        ]
      }
    ]
  },
  {
    title: 'Architecture Advisor',
    description: 'Get expert advice on system architecture, technology choices, and design patterns for your specific use case, scale, and constraints.',
    category: PromptCategory.CODING,
    authorKey: 'alex_chen',
    upvoteCount: 312, viewCount: 4400, forkCount: 15, downloadCount: 134,
    tags: ['coding', 'api-design', 'documentation'],
    versions: [
      {
        content: `You are a principal software architect. Help me design the architecture for:

**System**: {{system_description}}
**Scale**: {{scale}} (users/requests per day)
**Tech constraints**: {{constraints}}
**Budget**: {{budget}}

Provide:
1. **Recommended architecture** — Diagram description and component breakdown
2. **Technology choices** — Specific tools/services with rationale
3. **Data model** — Key entities and relationships
4. **API design** — How components communicate
5. **Scalability plan** — How to grow from day 1 to 10x scale
6. **Trade-offs** — What you're optimizing for and what you're giving up
7. **Phased implementation** — What to build first vs. later`,
        changelog: 'Initial version',
        variables: [
          { name: 'system_description', description: 'What you are building' },
          { name: 'scale', description: 'Expected scale', default: '1,000 users/day' },
          { name: 'constraints', description: 'Tech constraints', default: 'Team knows TypeScript and React' },
          { name: 'budget', description: 'Infrastructure budget', default: '<$100/month' }
        ]
      }
    ]
  },
  {
    title: 'Code Documentation Generator',
    description: 'Generate comprehensive, accurate documentation — JSDoc, docstrings, README sections, and inline comments — for any function or module.',
    category: PromptCategory.CODING,
    authorKey: 'alex_chen',
    upvoteCount: 276, viewCount: 3900, forkCount: 12, downloadCount: 98,
    tags: ['coding', 'documentation'],
    versions: [
      {
        content: `Generate complete documentation for this {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

**Documentation style**: {{style}} (JSDoc/docstring/TypeDoc/plain)

Include:
1. **Function/class description** — What it does, when to use it
2. **Parameters** — Name, type, description, constraints, defaults
3. **Return value** — Type, description, possible values
4. **Throws/Errors** — What can go wrong and when
5. **Example usage** — 2-3 realistic code examples
6. **Notes** — Edge cases, performance considerations, thread safety

Write documentation a new team member could use without asking questions.`,
        changelog: 'Initial version',
        variables: [
          { name: 'language', description: 'Programming language', default: 'TypeScript' },
          { name: 'code', description: 'Code to document' },
          { name: 'style', description: 'Documentation style', default: 'JSDoc' }
        ]
      }
    ]
  },
  // ── WRITING ──────────────────────────────────────────────────────────────────
  {
    title: 'Blog Post Writer',
    description: 'SEO-optimized blog posts with A/B headline variants, structured sections, statistics, expert quotes, and CTAs. Used by 3,000+ content creators.',
    category: PromptCategory.WRITING,
    authorKey: 'jake_morrison',
    upvoteCount: 756, viewCount: 11200, forkCount: 67, downloadCount: 290,
    tags: ['creative-writing', 'seo', 'marketing', 'productivity'],
    versions: [
      {
        content: 'Write a blog post about "{{topic}}" for {{target_audience}}.',
        changelog: 'Initial version',
        variables: [{ name: 'topic', description: 'Topic' }, { name: 'target_audience', description: 'Audience' }]
      },
      {
        content: `Write a compelling, SEO-optimized blog post about "{{topic}}" for {{target_audience}}.

**Tone**: {{tone}}
**Word count**: {{word_count}} words
**Goal**: {{goal}}
**Primary keyword**: {{primary_keyword}}

## Structure to follow:

### Headline Options (give 3 A/B test variants)
- Version A: How-to format
- Version B: Question format
- Version C: Surprising fact/number

### Introduction (150-200 words)
Open with a hook (surprising stat, bold claim, or relatable pain point). Clearly state what the reader will learn and why it matters.

### Main Body
Use 5-7 H2 sections. For each section:
- Clear, benefit-driven heading
- 2-3 paragraphs of valuable content
- At least 1 statistic or data point
- 1 expert insight or quote
- 1 practical example or case study

### Key Takeaways Box
3-5 bullet points summarizing the most actionable insights

### Conclusion + CTA
Summarize value delivered. End with a specific, low-friction call to action.

## SEO Notes
- Include {{primary_keyword}} naturally in H1, first paragraph, one H2, conclusion
- Suggest 3 internal linking opportunities
- Meta description (150-160 chars)`,
        changelog: 'Added A/B headlines, SEO structure, meta description',
        variables: [
          { name: 'topic', description: 'Blog post topic' },
          { name: 'target_audience', description: 'Who you\'re writing for', default: 'SaaS founders and developers' },
          { name: 'tone', description: 'Writing tone', default: 'Conversational but authoritative' },
          { name: 'word_count', description: 'Target word count', default: '1500' },
          { name: 'goal', description: 'Primary goal', default: 'Drive newsletter signups' },
          { name: 'primary_keyword', description: 'SEO keyword to target' }
        ]
      }
    ]
  },
  {
    title: 'Cold Email Writer',
    description: 'High-converting cold emails with 3 variants (direct, problem-first, warm intro), tight subject lines, and proven CTAs. Under 150 words each.',
    category: PromptCategory.WRITING,
    authorKey: 'raj_patel',
    upvoteCount: 534, viewCount: 7800, forkCount: 42, downloadCount: 234,
    tags: ['business', 'marketing', 'productivity'],
    versions: [
      {
        content: `Write a cold email to {{recipient_role}} at {{company_type}} companies.

**My offer**: {{offer}}
**Their pain point**: {{pain_point}}
**My social proof**: {{proof}}
**CTA**: {{desired_action}}

Write 3 variations:
1. **Direct Value** — Lead with the specific result you deliver
2. **Problem-First** — Open by naming their pain precisely
3. **Referral Intro** — Warm it up with a mutual connection or observation

For each:
- Subject line (under 50 chars, no spam words)
- Email body (under 150 words)
- P.S. line (optional but powerful)

Avoid: buzzwords, "I hope this email finds you well", lengthy intros, vague CTAs.`,
        changelog: 'Initial version',
        variables: [
          { name: 'recipient_role', description: 'Job title of recipient', default: 'Head of Engineering' },
          { name: 'company_type', description: 'Type of company', default: 'Series A-C SaaS' },
          { name: 'offer', description: 'What you\'re offering' },
          { name: 'pain_point', description: 'Their key pain point' },
          { name: 'proof', description: 'Social proof or credentials' },
          { name: 'desired_action', description: 'What you want them to do', default: '15-minute call' }
        ]
      }
    ]
  },
  {
    title: 'Tweet Thread Generator',
    description: 'Viral-optimized Twitter/X threads with hooks, value, story, and CTAs. Includes engagement tactics and optimal posting format.',
    category: PromptCategory.WRITING,
    authorKey: 'raj_patel',
    upvoteCount: 423, viewCount: 6200, forkCount: 31, downloadCount: 178,
    tags: ['creative-writing', 'marketing', 'productivity'],
    versions: [
      {
        content: `Write a Twitter/X thread about {{topic}} targeting {{audience}}.

**Goal**: {{goal}} (educate/inspire/sell/entertain)
**Length**: {{length}} tweets
**My angle**: {{unique_angle}}

Thread structure:
- **Tweet 1 (Hook)**: Bold claim or surprising stat. Make them NEED to read more. Under 240 chars. Include a number.
- **Tweets 2-{{length_minus_2}} (Value)**: Each tweet = one clear insight. Start with "→" or a number. Short paragraphs. Each should stand alone if screenshot.
- **Second to last tweet**: The "so what" — why this matters to the reader
- **Last tweet (CTA)**: Follow, retweet, or link. Be specific.

Rules:
- Every tweet must be standalone-worthy
- Use line breaks for white space
- End key tweets with a teaser for the next
- Include 1-2 examples or data points
- Vary sentence length`,
        changelog: 'Initial version',
        variables: [
          { name: 'topic', description: 'Thread topic' },
          { name: 'audience', description: 'Target audience', default: 'startup founders' },
          { name: 'goal', description: 'Thread goal', default: 'educate' },
          { name: 'length', description: 'Number of tweets', default: '10' },
          { name: 'unique_angle', description: 'Your unique perspective or hook' },
          { name: 'length_minus_2', description: 'Length minus 2', default: '8' }
        ]
      }
    ]
  },
  {
    title: 'LinkedIn Post Generator',
    description: 'High-engagement LinkedIn posts with proven hooks, storytelling structure, and CTAs. Optimized for the algorithm and professional audiences.',
    category: PromptCategory.WRITING,
    authorKey: 'jake_morrison',
    upvoteCount: 489, viewCount: 7100, forkCount: 36, downloadCount: 201,
    tags: ['marketing', 'creative-writing', 'business'],
    versions: [
      {
        content: `Write a LinkedIn post about {{topic}} for {{audience}}.

**Goal**: {{goal}}
**Tone**: {{tone}}
**Call to action**: {{cta}}

LinkedIn post structure:
**Hook (line 1)**: Make this impossible to scroll past. Use a provocative question, counterintuitive statement, or personal revelation. Under 200 chars (shows before "see more").

**Story/Insight (3-5 short paragraphs)**:
- Each paragraph = 1-3 sentences max
- Line breaks between every paragraph
- Real numbers, specific outcomes, honest vulnerability

**Lesson/Takeaway**:
The one thing readers should remember tomorrow.

**CTA**:
A specific question or invitation. Avoid generic "What do you think?"

Format rules:
- Emoji used sparingly (1-2 max, only if natural)
- No corporate buzzwords
- No hashtag spam (max 3, at bottom)
- White space is your friend`,
        changelog: 'Initial version',
        variables: [
          { name: 'topic', description: 'Post topic or story' },
          { name: 'audience', description: 'Target audience', default: 'startup founders and product people' },
          { name: 'goal', description: 'Post goal', default: 'build thought leadership' },
          { name: 'tone', description: 'Tone', default: 'authentic and direct' },
          { name: 'cta', description: 'Call to action', default: 'engage in comments' }
        ]
      }
    ]
  },
  // ── BUSINESS ──────────────────────────────────────────────────────────────────
  {
    title: 'Pitch Deck Script',
    description: 'Slide-by-slide investor pitch content with compelling narratives, market sizing, competitive positioning, and a clear ask. Used to raise $40M+.',
    category: PromptCategory.BUSINESS,
    authorKey: 'raj_patel',
    upvoteCount: 678, viewCount: 9800, forkCount: 56, downloadCount: 267,
    tags: ['business', 'productivity'],
    versions: [
      {
        content: 'Create an investor pitch for {{company_name}} in {{industry}}. They are raising {{raise_amount}} at {{valuation}}.',
        changelog: 'Initial version',
        variables: [{ name: 'company_name', description: 'Company' }, { name: 'industry', description: 'Industry' }, { name: 'raise_amount', description: 'Amount' }, { name: 'valuation', description: 'Valuation' }]
      },
      {
        content: `Create a compelling investor pitch deck script for {{company_name}}.

**Company**: {{company_name}}
**Industry**: {{industry}}
**Stage**: {{stage}}
**Ask**: \${{raise_amount}} at {{valuation}} valuation
**Traction**: {{traction}}

Generate slide-by-slide content:

**Slide 1: Title** — Company name, tagline (under 10 words), your name/role, date

**Slide 2: Problem** — The specific pain point with a compelling story or shocking statistic. Make investors feel the pain viscerally.

**Slide 3: Solution** — Your product in one sentence. Show don't tell — describe the "aha moment" for the user.

**Slide 4: Market Size** — TAM/SAM/SOM with credible sources. Bottom-up calculation preferred.

**Slide 5: Product** — 3 key features with screenshot descriptions. Focus on differentiation over features.

**Slide 6: Business Model** — Revenue streams, pricing tiers, unit economics (CAC, LTV, payback period)

**Slide 7: Traction** — {{traction}} visualized. Show growth momentum, not just absolute numbers.

**Slide 8: Competition** — 2x2 matrix. Why you win on the axes that matter most.

**Slide 9: Team** — Key backgrounds and why this team is uniquely qualified to win.

**Slide 10: Ask** — \${{raise_amount}} breakdown with 18-month milestones.

For each slide: headline, 3-5 bullet points, suggested visual, speaker notes (60 seconds max).`,
        changelog: 'Added speaker notes, unit economics, bottom-up market sizing',
        variables: [
          { name: 'company_name', description: 'Company name' },
          { name: 'industry', description: 'Industry/vertical' },
          { name: 'stage', description: 'Funding stage', default: 'Seed' },
          { name: 'raise_amount', description: 'Amount raising (USD)' },
          { name: 'valuation', description: 'Target valuation' },
          { name: 'traction', description: 'Key traction metrics' }
        ]
      }
    ]
  },
  {
    title: 'SWOT Analysis',
    description: 'Deep, actionable SWOT analyses with strategic implications for each quadrant. Goes beyond surface observations to uncover non-obvious insights.',
    category: PromptCategory.BUSINESS,
    authorKey: 'elena_v',
    upvoteCount: 445, viewCount: 6400, forkCount: 22, downloadCount: 189,
    tags: ['business', 'productivity'],
    versions: [
      {
        content: `Conduct a comprehensive SWOT analysis for {{company}} in {{context}}.

**Company/Product**: {{company}}
**Industry**: {{industry}}
**Context**: {{context}} (new market entry/competitive response/strategic planning)
**Time horizon**: {{time_horizon}}

For each quadrant, go 3 levels deep:
1. Surface observation
2. Root cause / underlying dynamic
3. Strategic implication

## Strengths
Internal advantages that are hard to replicate. Focus on defensible moats.

## Weaknesses
Internal vulnerabilities. Be brutally honest. Include things often overlooked.

## Opportunities
External factors to exploit. Prioritize by size × timing × fit.

## Threats
External risks. Include second-order effects and industry disruptions.

## Strategic Priorities
Top 3 SO (leverage), WO (improve), ST (defend), WT (avoid) moves.`,
        changelog: 'Initial version',
        variables: [
          { name: 'company', description: 'Company or product to analyze' },
          { name: 'industry', description: 'Industry context' },
          { name: 'context', description: 'Strategic context', default: 'strategic planning' },
          { name: 'time_horizon', description: 'Planning horizon', default: '12 months' }
        ]
      }
    ]
  },
  {
    title: 'OKR Writer',
    description: 'Write measurable OKRs that actually work — clear objectives, 3-5 quantifiable key results, and anti-patterns to avoid.',
    category: PromptCategory.BUSINESS,
    authorKey: 'elena_v',
    upvoteCount: 334, viewCount: 4900, forkCount: 19, downloadCount: 145,
    tags: ['business', 'productivity'],
    versions: [
      {
        content: `Write OKRs for {{team}} to achieve {{goal}} this {{period}}.

**Team**: {{team}}
**Goal**: {{goal}}
**Period**: {{period}} (Q1/Q2/Q3/Q4/H1/Annual)
**Context**: {{context}}

For each objective:

**Objective**: Qualitative, inspirational, memorable (verb + outcome + timeframe)
- NOT "Improve customer satisfaction" → YES "Delight customers so much they become our best salespeople"

**Key Results** (3-5 per objective):
- Measurable with a specific number
- Outcome-based (not output-based)
- Format: "[verb] [metric] from [baseline] to [target] by [date]"
- 70% achievement = success (stretch goals)

**Leading indicators**: Metrics to watch weekly to predict KR achievement

**Anti-patterns to avoid**: Common mistakes for this specific KR set

Write 2-3 objectives for {{team}}.`,
        changelog: 'Initial version',
        variables: [
          { name: 'team', description: 'Team or department' },
          { name: 'goal', description: 'High-level goal' },
          { name: 'period', description: 'OKR period', default: 'Q2 2025' },
          { name: 'context', description: 'Company context', default: 'Series A startup, 25 employees' }
        ]
      }
    ]
  },
  // ── EDUCATION ────────────────────────────────────────────────────────────────
  {
    title: 'Socratic Tutor',
    description: 'A Socratic tutor that guides students to discover answers through questions rather than telling them. Adapts to any subject and student level.',
    category: PromptCategory.EDUCATION,
    authorKey: 'elena_v',
    upvoteCount: 523, viewCount: 7600, forkCount: 34, downloadCount: 198,
    tags: ['education', 'productivity'],
    versions: [
      {
        content: `Act as a Socratic tutor for {{subject}}.

**Topic**: {{topic}}
**Student level**: {{level}}
**Student's current understanding**: {{current_understanding}}

Guide the student to discover the answer to: "{{student_question}}"

Never give the answer directly. Use questions to lead them there. If stuck after 3 attempts, give a hint, not the solution. Celebrate moments of insight.`,
        changelog: 'Initial version',
        variables: [
          { name: 'subject', description: 'Subject area', default: 'Mathematics' },
          { name: 'topic', description: 'Specific topic' },
          { name: 'level', description: 'Student level', default: 'High school' },
          { name: 'current_understanding', description: 'What they know' },
          { name: 'student_question', description: 'Student\'s question' }
        ]
      }
    ]
  },
  {
    title: 'Concept Explainer',
    description: 'Explains complex concepts at any level using analogies, examples, and the Feynman technique. From 5-year-old to PhD expert.',
    category: PromptCategory.EDUCATION,
    authorKey: 'sarah_kim',
    upvoteCount: 445, viewCount: 6400, forkCount: 28, downloadCount: 176,
    tags: ['education', 'productivity'],
    versions: [
      {
        content: `Explain "{{concept}}" to someone with {{expertise_level}} knowledge of {{subject}}.

**Concept**: {{concept}}
**Audience expertise**: {{expertise_level}} (beginner/intermediate/expert/child)
**Subject domain**: {{subject}}
**Use case**: {{use_case}} (why they need to understand this)

Structure your explanation:

1. **One-sentence definition** — The core of what this is, in plain language

2. **The analogy** — Connect it to something they already understand deeply. Choose an analogy from their domain: {{use_case}}.

3. **How it works** — Step by step, with no assumed knowledge beyond {{expertise_level}} level

4. **Concrete example** — Walk through a specific, real example

5. **Common misconceptions** — 2-3 things people often get wrong

6. **When to use it / when not to** — The practical guidance

7. **Check your understanding** — 2 questions the reader can answer to verify they understood`,
        changelog: 'Initial version',
        variables: [
          { name: 'concept', description: 'Concept to explain' },
          { name: 'expertise_level', description: 'Audience expertise', default: 'beginner' },
          { name: 'subject', description: 'Subject domain' },
          { name: 'use_case', description: 'Why they need to understand this' }
        ]
      }
    ]
  },
  {
    title: 'Quiz Generator',
    description: 'Generate comprehensive quizzes with multiple choice, true/false, and short answer questions. Includes answer keys with explanations.',
    category: PromptCategory.EDUCATION,
    authorKey: 'tom_analyst',
    upvoteCount: 312, viewCount: 4500, forkCount: 18, downloadCount: 134,
    tags: ['education', 'productivity'],
    versions: [
      {
        content: `Create a {{difficulty}} quiz on {{topic}} for {{audience}}.

**Topic**: {{topic}}
**Audience**: {{audience}}
**Difficulty**: {{difficulty}} (beginner/intermediate/advanced)
**Number of questions**: {{num_questions}}
**Question types**: {{types}} (multiple choice/true-false/short answer/mixed)

For each question:
- **Question**: Clear, unambiguous phrasing
- **Options** (if multiple choice): 4 options, 3 plausible distractors
- **Correct answer**: Clearly marked
- **Explanation**: Why this answer is correct AND why the wrong answers are wrong
- **Bloom's level**: (Remember/Understand/Apply/Analyze/Evaluate/Create)

After the quiz, include:
- Learning objectives being assessed
- Suggested passing score
- Common mistakes to watch for`,
        changelog: 'Initial version',
        variables: [
          { name: 'topic', description: 'Quiz topic' },
          { name: 'audience', description: 'Target audience' },
          { name: 'difficulty', description: 'Difficulty level', default: 'intermediate' },
          { name: 'num_questions', description: 'Number of questions', default: '10' },
          { name: 'types', description: 'Question types', default: 'mixed' }
        ]
      }
    ]
  },
  // ── CREATIVITY ───────────────────────────────────────────────────────────────
  {
    title: 'Story Generator',
    description: 'Compelling short stories with professional narrative structure: in media res openings, escalating tension, and resonant endings. Any genre.',
    category: PromptCategory.CREATIVITY,
    authorKey: 'jake_morrison',
    upvoteCount: 634, viewCount: 9200, forkCount: 48, downloadCount: 234,
    tags: ['creative-writing', 'productivity'],
    versions: [
      {
        content: 'Write a {{genre}} story about {{character}} who must {{conflict}}.',
        changelog: 'Initial version',
        variables: [{ name: 'genre', description: 'Genre' }, { name: 'character', description: 'Main character' }, { name: 'conflict', description: 'Conflict' }]
      },
      {
        content: `Write a compelling {{genre}} short story.

**Genre**: {{genre}}
**Setting**: {{setting}}
**Main character**: {{character}}
**Core conflict**: {{conflict}}
**Tone**: {{tone}}
**Length**: {{length}} words

Structure:
- **Hook (first sentence)**: In media res, surprising detail, or compelling question. Grab attention immediately.
- **Setup (15%)**: Establish character and world efficiently. Every detail should serve the story.
- **Rising Action (50%)**: Three escalating obstacles. Each raises the stakes.
- **Climax (20%)**: Maximum tension. Character must make a choice that reveals who they are.
- **Resolution (15%)**: Show the consequence. Leave something to think about.

Writing rules:
- Show don't tell ("she clenched her jaw" not "she was angry")
- Vary sentence length for rhythm
- Concrete sensory details — what can be seen, heard, smelled, touched
- Subtext in dialogue — characters rarely say exactly what they mean
- Every scene must either reveal character or advance plot (ideally both)`,
        changelog: 'Added narrative structure, showing vs telling rules, dialogue guidance',
        variables: [
          { name: 'genre', description: 'Story genre', default: 'Sci-fi thriller' },
          { name: 'setting', description: 'Where and when', default: 'Near-future Tokyo, 2045' },
          { name: 'character', description: 'Protagonist description', default: 'A jaded AI ethicist' },
          { name: 'conflict', description: 'Central conflict' },
          { name: 'tone', description: 'Tone/mood', default: 'Tense, cerebral' },
          { name: 'length', description: 'Target length in words', default: '800' }
        ]
      }
    ]
  },
  {
    title: 'Brand Voice Creator',
    description: 'Define your brand\'s unique voice and tone with personality archetypes, vocabulary guidelines, dos/don\'ts, and sample copy.',
    category: PromptCategory.CREATIVITY,
    authorKey: 'raj_patel',
    upvoteCount: 312, viewCount: 4500, forkCount: 22, downloadCount: 134,
    tags: ['business', 'marketing', 'creative-writing'],
    versions: [
      {
        content: `Create a comprehensive brand voice guide for {{company}}.

**Company**: {{company}}
**Industry**: {{industry}}
**Target audience**: {{audience}}
**Brand adjectives**: {{adjectives}} (e.g., bold, warm, expert, playful)
**Competitors to differentiate from**: {{competitors}}

Deliver:

## Brand Personality
Primary archetype + secondary archetype (from: Hero, Sage, Explorer, Outlaw, Creator, Ruler, Caregiver, Innocent, Magician, Jester, Lover, Everyman)

## Voice Dimensions
Rate each on a 1-5 scale with explanation:
- Formal ←→ Casual
- Serious ←→ Playful
- Complex ←→ Simple
- Conservative ←→ Bold
- Reserved ←→ Expressive

## Vocabulary Guide
- Words we use (50+ brand words)
- Words we avoid (with replacements)
- Industry jargon: when to use it vs. explain it

## Do / Don't Examples
5 pairs showing the right/wrong way to write as this brand

## Sample Copy
- Homepage hero headline: 3 options
- Tweet: 2 options
- Email subject line: 3 options
- Error message: 1 option (often overlooked but reveals brand)`,
        changelog: 'Initial version',
        variables: [
          { name: 'company', description: 'Company or product name' },
          { name: 'industry', description: 'Industry' },
          { name: 'audience', description: 'Primary audience' },
          { name: 'adjectives', description: 'Brand personality adjectives', default: 'bold, expert, approachable' },
          { name: 'competitors', description: 'Key competitors' }
        ]
      }
    ]
  },
  // ── ANALYSIS ─────────────────────────────────────────────────────────────────
  {
    title: 'EDA Assistant',
    description: 'Expert data scientist EDA framework: data quality checks, univariate/bivariate analysis, insight templates, and ready-to-run Python code.',
    category: PromptCategory.ANALYSIS,
    authorKey: 'sarah_kim',
    upvoteCount: 456, viewCount: 6600, forkCount: 26, downloadCount: 189,
    tags: ['data-science', 'coding', 'sql'],
    versions: [
      {
        content: `You are a senior data scientist performing exploratory data analysis.

**Dataset**: {{dataset_description}}
**Shape**: {{rows}} rows × {{columns}} columns
**Goal**: {{analysis_goal}}

Provide a complete EDA plan:

## 1. Data Quality Check
- Missing values: detection and imputation strategies by column type
- Outlier detection: IQR method, z-score, visual inspection
- Data type validation and coercion
- Duplicate detection and resolution

## 2. Univariate Analysis
- Numeric columns: distribution (histogram/KDE), box plot, key statistics (mean, median, std, skewness, kurtosis, percentiles)
- Categorical columns: value counts, top-N, cardinality assessment

## 3. Bivariate Analysis
- Numeric vs numeric: correlation matrix (Pearson/Spearman), scatter plots
- Numeric vs categorical: box plots, violin plots, t-tests
- Categorical vs categorical: cross-tabulations, chi-square

## 4. Key Insights Template
For each significant finding: "We found that [observation] which suggests [interpretation] and could impact [business outcome] — confidence: [high/medium/low]"

## 5. Python Code
Ready-to-run pandas/matplotlib/seaborn code for the 5 most important visualizations.`,
        changelog: 'Initial version',
        variables: [
          { name: 'dataset_description', description: 'What the dataset contains' },
          { name: 'rows', description: 'Number of rows' },
          { name: 'columns', description: 'Number of columns' },
          { name: 'analysis_goal', description: 'What you\'re trying to learn' }
        ]
      }
    ]
  },
  {
    title: 'A/B Test Analyzer',
    description: 'Statistical analysis of A/B test results with significance testing, effect size, confidence intervals, and practical recommendations.',
    category: PromptCategory.ANALYSIS,
    authorKey: 'tom_analyst',
    upvoteCount: 289, viewCount: 4200, forkCount: 14, downloadCount: 112,
    tags: ['data-science', 'business', 'productivity'],
    versions: [
      {
        content: `Analyze the results of this A/B test:

**Test name**: {{test_name}}
**Hypothesis**: {{hypothesis}}
**Metric**: {{primary_metric}}
**Control**: {{control_results}}
**Variant**: {{variant_results}}
**Duration**: {{duration}}
**Sample size**: {{sample_size}}

Provide:
1. **Statistical significance** — Z-test or chi-square. Is the result significant at p<0.05?
2. **Effect size** — Relative lift %, absolute difference, confidence interval
3. **Practical significance** — Is the lift meaningful for the business? (distinguish statistical vs. practical)
4. **Power analysis** — Was the test underpowered? Minimum detectable effect?
5. **Segmentation** — Which user segments drove the result?
6. **Recommendation** — Ship/rollback/extend, with rationale
7. **Follow-up tests** — What to test next based on these results`,
        changelog: 'Initial version',
        variables: [
          { name: 'test_name', description: 'Name/description of the test' },
          { name: 'hypothesis', description: 'What you hypothesized' },
          { name: 'primary_metric', description: 'Primary success metric' },
          { name: 'control_results', description: 'Control group results (e.g., 100/1000 conversions)' },
          { name: 'variant_results', description: 'Variant group results' },
          { name: 'duration', description: 'Test duration', default: '14 days' },
          { name: 'sample_size', description: 'Total users in test' }
        ]
      }
    ]
  },
  // ── RESEARCH ─────────────────────────────────────────────────────────────────
  {
    title: 'Research Paper Summarizer',
    description: 'Distill academic papers into actionable summaries: key findings, methodology, limitations, implications, and practical takeaways.',
    category: PromptCategory.RESEARCH,
    authorKey: 'sarah_kim',
    upvoteCount: 423, viewCount: 6100, forkCount: 28, downloadCount: 167,
    tags: ['education', 'productivity', 'data-science'],
    versions: [
      {
        content: `Summarize this research paper for {{audience}}:

{{paper_content}}

**Audience**: {{audience}} (academic peer / practitioner / executive / general public)
**Focus area**: {{focus}} (methods/findings/implications/all)

Structure:
## TL;DR (2 sentences)
The single most important thing this paper says.

## Background & Motivation
Why this research was done and what gap it fills.

## Methodology
Research design, sample, and key decisions. Note any limitations.

## Key Findings
3-5 bullet points. Lead with effect sizes and confidence levels, not just "significant."

## What This Means
For {{audience}}: practical implications and action items.

## Limitations & Caveats
What the paper cannot claim. Common misinterpretations to avoid.

## Related Work
2-3 papers that complement or challenge these findings.`,
        changelog: 'Initial version',
        variables: [
          { name: 'paper_content', description: 'Paper abstract and key sections (or full text)' },
          { name: 'audience', description: 'Target audience', default: 'practitioner' },
          { name: 'focus', description: 'Focus area', default: 'all' }
        ]
      }
    ]
  },
  // ── OTHER (Career + DevOps) ──────────────────────────────────────────────────
  {
    title: 'Interview Coach',
    description: 'STAR-method interview coaching for behavioral, technical, system design, and case interviews. Get feedback on your specific answers.',
    category: PromptCategory.OTHER,
    authorKey: 'elena_v',
    upvoteCount: 567, viewCount: 8200, forkCount: 41, downloadCount: 212,
    tags: ['career', 'productivity'],
    versions: [
      {
        content: `You are an expert interview coach preparing me for a {{interview_type}} interview at {{company}}.

**Role**: {{job_title}}
**My background**: {{background}}
**Interview type**: {{interview_type}}

For behavioral interviews, use the STAR framework:
- **Situation**: Set the scene (2 sentences max)
- **Task**: Your specific responsibility
- **Action**: What YOU did (use "I" not "we")
- **Result**: Quantified outcome + what you learned

Practice questions for {{job_title}} at {{company}}:
1. Craft my "Tell me about yourself" (2-minute pitch)
2. Generate the 5 most likely behavioral questions for this role
3. Predict 2 hard questions specific to {{company}}'s known culture/values
4. Suggest 5 strong questions for me to ask the interviewer

For each answer I draft, give feedback on:
- Specificity (replace vague words with concrete details)
- Impact (add metrics — "improved latency by 40%" not "made it faster")
- Conciseness (target 90-120 seconds spoken)
- Relevance (does it answer what was actually asked?)`,
        changelog: 'Initial version',
        variables: [
          { name: 'interview_type', description: 'Type of interview', default: 'Behavioral' },
          { name: 'company', description: 'Company name', default: 'a top tech company' },
          { name: 'job_title', description: 'Role you\'re applying for' },
          { name: 'background', description: 'Your relevant experience (2-3 sentences)' }
        ]
      }
    ]
  },
  {
    title: 'Resume Optimizer',
    description: 'Rewrite and optimize your resume for a specific job description. Improve impact, ATS compatibility, and recruiter appeal.',
    category: PromptCategory.OTHER,
    authorKey: 'elena_v',
    upvoteCount: 489, viewCount: 7100, forkCount: 33, downloadCount: 201,
    tags: ['career', 'productivity'],
    versions: [
      {
        content: `Optimize my resume for this job application:

**Job title**: {{job_title}}
**Company**: {{company}}
**Job description key requirements**: {{jd_requirements}}

**My current resume bullet points**:
{{current_bullets}}

For each bullet point, rewrite it to:
1. **Lead with impact** — Start with a metric or outcome, not a duty
2. **Use strong verbs** — Spearheaded, architected, reduced, grew (not "responsible for" or "helped with")
3. **Quantify everything** — Add numbers, percentages, timeframes, scale
4. **Match keywords** — Mirror language from the job description naturally
5. **Show relevance** — Connect your experience to what this role requires

After the bullets, provide:
- **Missing keywords** — Terms from the JD not in my resume (add them)
- **ATS score estimate** — Approximate match % and how to improve
- **Tailoring suggestion** — One change to the resume summary for this specific role`,
        changelog: 'Initial version',
        variables: [
          { name: 'job_title', description: 'Job title applying for' },
          { name: 'company', description: 'Company name' },
          { name: 'jd_requirements', description: 'Key requirements from the job description' },
          { name: 'current_bullets', description: 'Your current resume bullet points' }
        ]
      }
    ]
  },
  {
    title: 'Docker Compose Generator',
    description: 'Generate production-ready Docker Compose configurations with networking, volumes, environment variables, health checks, and security best practices.',
    category: PromptCategory.OTHER,
    authorKey: 'dev_marcus',
    upvoteCount: 389, viewCount: 5600, forkCount: 24, downloadCount: 156,
    tags: ['devops', 'coding', 'automation'],
    versions: [
      {
        content: `Generate a Docker Compose configuration for:

**Application**: {{app_description}}
**Services needed**: {{services}}
**Environment**: {{environment}} (development/staging/production)

Create a complete docker-compose.yml with:

1. **Service definitions** for each: {{services}}
   - Official images with pinned versions
   - Environment variables (use .env file references)
   - Port mappings
   - Volume mounts (named volumes for persistence)
   - Depends_on with health check conditions
   - Resource limits (memory, CPU)

2. **Networks**: Custom bridge network, service isolation

3. **Health checks** for each service: appropriate command, interval, timeout, retries

4. **Volumes**: Named volumes with appropriate drivers

5. **.env.example**: All required environment variables with descriptions

6. **Security**: Non-root users, read-only filesystems where possible, no latest tags

7. **Makefile shortcuts**: up, down, logs, shell, build, clean`,
        changelog: 'Initial version',
        variables: [
          { name: 'app_description', description: 'What your application does' },
          { name: 'services', description: 'Services to include (e.g., postgres, redis, nginx, app)' },
          { name: 'environment', description: 'Target environment', default: 'development' }
        ]
      }
    ]
  },
  {
    title: 'Incident Postmortem',
    description: 'Write blameless postmortems that drive real improvement: timeline reconstruction, root cause analysis, contributing factors, and concrete action items.',
    category: PromptCategory.OTHER,
    authorKey: 'dev_marcus',
    upvoteCount: 278, viewCount: 4000, forkCount: 16, downloadCount: 112,
    tags: ['devops', 'automation', 'documentation'],
    versions: [
      {
        content: `Write a blameless postmortem for this incident:

**Incident summary**: {{summary}}
**Duration**: {{duration}}
**Impact**: {{impact}}
**Timeline**: {{timeline}}
**Contributing factors**: {{factors}}

Generate a postmortem document:

## Incident Summary
One paragraph: what happened, when, impact on users.

## Timeline
Chronological reconstruction with timestamps. Include: first alert, escalation, key decisions, mitigations, resolution.

## Root Cause Analysis
Use 5 Whys or Fishbone. Find the systemic cause, not just the proximate one.

## Contributing Factors
Not causes, but conditions that made the incident worse or harder to detect.

## Impact Assessment
- Users affected (number and %)
- Duration of degradation
- Business impact (revenue, SLA violations)
- Data loss or corruption: yes/no

## What Went Well
Detection, response, communication wins.

## Action Items
Table with: Item | Owner | Priority | Due Date | Success Criteria
Focus on preventing this class of incident, not just this specific one.

## Detection & Alerting Improvements
What monitoring should have caught this earlier?`,
        changelog: 'Initial version',
        variables: [
          { name: 'summary', description: 'Brief incident description' },
          { name: 'duration', description: 'Total incident duration' },
          { name: 'impact', description: 'User and business impact' },
          { name: 'timeline', description: 'Key events with timestamps' },
          { name: 'factors', description: 'Known contributing factors' }
        ]
      }
    ]
  },
  {
    title: 'Salary Negotiation Script',
    description: 'Data-driven salary negotiation scripts and counteroffers. Includes anchoring strategies, objection responses, and equity negotiation.',
    category: PromptCategory.OTHER,
    authorKey: 'elena_v',
    upvoteCount: 445, viewCount: 6400, forkCount: 29, downloadCount: 189,
    tags: ['career', 'business'],
    versions: [
      {
        content: `Help me negotiate my {{role}} offer at {{company}}.

**Role**: {{role}}
**Location**: {{location}}
**Current offer**: {{current_offer}}
**My competing offers**: {{competing_offers}}
**Market data**: {{market_data}}
**My target**: {{target}}

Provide:

## Negotiation Strategy
- Anchoring approach (should I name a number first?)
- Framing (collaborative vs. assertive tone for this company)
- Leverage assessment (how strong is my position?)

## Opening Script
Exact words to say when they call with the offer. Enthusiastic but not accepting.

## Counter-Offer Script
Specific counter with justification. Include: market data reference, competing offers, your unique value.

## Objection Responses
- "This is our standard offer for all candidates"
- "We don't have flexibility on base salary"
- "The equity makes up for the lower base"
- "We need an answer by [tomorrow]"

## Equity Negotiation
If applicable: vesting cliff, acceleration clause, preferred vs. common, strike price

## Walk-Away Point
How to professionally decline if they don't meet your minimum.`,
        changelog: 'Initial version',
        variables: [
          { name: 'role', description: 'Job title' },
          { name: 'company', description: 'Company name' },
          { name: 'location', description: 'Location', default: 'San Francisco, CA' },
          { name: 'current_offer', description: 'Current offer details' },
          { name: 'competing_offers', description: 'Competing offers if any', default: 'None yet' },
          { name: 'market_data', description: 'Market data (Levels.fyi, Glassdoor, etc.)' },
          { name: 'target', description: 'Your target compensation' }
        ]
      }
    ]
  },
  // ── ROLEPLAY ─────────────────────────────────────────────────────────────────
  {
    title: 'Dungeon Master',
    description: 'An immersive D&D-style Dungeon Master that crafts dynamic narratives, manages NPCs with distinct voices, tracks inventory, and adapts the world to your choices.',
    category: PromptCategory.ROLEPLAY,
    authorKey: 'jake_morrison',
    upvoteCount: 712, viewCount: 10300, forkCount: 58, downloadCount: 267,
    tags: ['creative-writing', 'roleplay'],
    versions: [
      {
        content: 'Run a D&D adventure set in {{setting}}. I am a {{character_class}} named {{character_name}}.',
        changelog: 'Initial version',
        variables: [{ name: 'setting', description: 'World/setting' }, { name: 'character_class', description: 'Class' }, { name: 'character_name', description: 'Name' }]
      },
      {
        content: `You are an expert Dungeon Master running a {{genre}} tabletop RPG adventure.

**World**: {{setting}}
**My character**: {{character_name}}, a {{character_class}} with {{character_background}}
**Party size**: {{party_size}}
**Tone**: {{tone}} (gritty/heroic/humorous/horror)

**Your rules**:
- Describe scenes vividly using all five senses (2-3 paragraphs per scene)
- Give NPCs distinct voices, motivations, and secrets — they have lives beyond the players
- Always end with 2-3 clear action choices AND leave space for creative solutions
- Track consequences — choices have lasting effects on the world
- Use dramatic tension: rising action, complications, unexpected twists
- When combat occurs: describe it cinematically, not just mechanically
- Reward creative thinking over brute force

**Session start**: Set the scene for our adventure. Include: immediate environment, a hook that creates urgency, and an NPC we've just met who needs something.`,
        changelog: 'Added immersive narrative rules, NPC depth, consequence tracking',
        variables: [
          { name: 'genre', description: 'RPG genre', default: 'high fantasy' },
          { name: 'setting', description: 'World and location', default: 'The kingdom of Valdris, a crumbling empire' },
          { name: 'character_name', description: 'Your character name' },
          { name: 'character_class', description: 'Class/role', default: 'rogue' },
          { name: 'character_background', description: 'Brief backstory', default: 'a troubled past and a debt to repay' },
          { name: 'party_size', description: 'Number of players', default: '1 (solo)' },
          { name: 'tone', description: 'Tone', default: 'heroic' }
        ]
      }
    ]
  },
  {
    title: 'Historical Character Chat',
    description: 'Have a conversation with any historical figure — Cleopatra, Einstein, Marcus Aurelius — who responds authentically based on their documented beliefs, era, and personality.',
    category: PromptCategory.ROLEPLAY,
    authorKey: 'elena_v',
    upvoteCount: 534, viewCount: 7800, forkCount: 43, downloadCount: 198,
    tags: ['education', 'roleplay', 'creative-writing'],
    versions: [
      {
        content: `You are {{historical_figure}} ({{years_lived}}).

Respond to my questions as this person would, based on documented writings, speeches, and historical accounts.

**Character rules**:
- Use first person, present tense (as if you are living in your era, but you can understand modern concepts through analogies)
- Reference real events from your life when relevant
- Maintain your documented personality, philosophy, and known opinions
- If asked about something you couldn't know historically, speculate from your worldview
- Occasionally use phrases or metaphors characteristic of your era/culture
- If challenged with contradictions to your historical record, respond thoughtfully

**Opening**: Introduce yourself briefly and ask what the visitor seeks to discuss.

Historical figure: {{historical_figure}}
Era: {{era}}
Key context: {{context}}`,
        changelog: 'Initial version',
        variables: [
          { name: 'historical_figure', description: 'Historical person to roleplay', default: 'Marcus Aurelius' },
          { name: 'years_lived', description: 'Life dates', default: '121-180 AD' },
          { name: 'era', description: 'Historical era', default: 'Roman Empire, 2nd century AD' },
          { name: 'context', description: 'Key context about the person', default: 'Roman Emperor and Stoic philosopher' }
        ]
      }
    ]
  },
  {
    title: 'AI Debate Partner',
    description: 'A Socratic debate partner that argues any position with evidence and logic. Perfect for stress-testing ideas, preparing for debates, and sharpening your thinking.',
    category: PromptCategory.ROLEPLAY,
    authorKey: 'tom_analyst',
    upvoteCount: 423, viewCount: 6100, forkCount: 32, downloadCount: 167,
    tags: ['education', 'productivity', 'roleplay'],
    versions: [
      {
        content: `You are a skilled debate partner. Argue {{position}} on the topic: "{{topic}}".

**Debate rules**:
- Use real evidence, studies, and logical arguments (not strawmen)
- Anticipate and preempt my likely counterarguments
- Steelman my position before attacking it
- Push back hard when I make weak arguments — don't let me win easily
- When I make a genuinely good point, acknowledge it, then find the strongest response
- Use: statistics, historical examples, logical frameworks (Occam's razor, slippery slope analysis, etc.)

**Stance**: {{position}} on "{{topic}}"
**Difficulty**: {{difficulty}} (Socratic gentle / Standard / Ruthless devil's advocate)
**Format**: Short paragraphs, max 200 words per response. Ask a probing question at the end of each turn.`,
        changelog: 'Initial version',
        variables: [
          { name: 'topic', description: 'Debate topic' },
          { name: 'position', description: 'Position to argue (for/against)', default: 'for' },
          { name: 'difficulty', description: 'Debate intensity', default: 'Standard' }
        ]
      }
    ]
  },
  // ── PREMIUM PROMPTS (for marketplace) ────────────────────────────────────────
  {
    title: 'Startup GTM Strategy Builder',
    description: 'Generate a complete go-to-market strategy for your startup: ICP definition, positioning, channel strategy, messaging hierarchy, launch sequencing, and 90-day action plan.',
    category: PromptCategory.BUSINESS,
    authorKey: 'priya_nair',
    upvoteCount: 891, viewCount: 13200, forkCount: 74, downloadCount: 412,
    tags: ['business', 'marketing', 'productivity'],
    versions: [
      {
        content: `You are a world-class GTM strategist who has launched 50+ products. Build a complete GTM strategy for:

**Product**: {{product_name}}
**What it does**: {{product_description}}
**Target customers**: {{target_customers}}
**Price point**: {{price}}
**Stage**: {{stage}} (pre-launch/early traction/scaling)
**Budget for GTM**: {{budget}}
**Differentiator**: {{key_differentiator}}

Deliver a comprehensive GTM strategy:

## 1. Ideal Customer Profile (ICP)
- Primary ICP: firmographics, job titles, company size, industry, pain profile
- Secondary ICP: where to expand after initial traction
- Anti-ICP: who to explicitly avoid (and why)

## 2. Positioning & Messaging
- Category: what category do you own or create?
- Primary positioning statement (use Geoffrey Moore template)
- Message hierarchy: headline → sub-headline → proof points → CTA
- Competitive positioning matrix: 3 competitors, 2×2 grid, your white space

## 3. Channel Strategy (rank by ROI × speed)
For each recommended channel: channel name, why it fits, CAC estimate, how to start, 30-day target

Recommended channels from: Content SEO, LinkedIn outreach, Product Hunt, cold email, partnerships, paid search, community-led, developer advocacy, influencer, event marketing

## 4. Launch Sequence (90 days)
- Week 1-2: Pre-launch (building the list, teaser)
- Week 3-4: Soft launch (beta users, case studies)
- Month 2: Full launch (PR, Product Hunt, paid)
- Month 3: Optimization (double down on what's working)

## 5. Metrics & OKRs
North star metric + 5 weekly leading indicators to track

## 6. 90-Day Action Plan
Table: Week | Action | Owner | Success criteria`,
        changelog: 'Complete GTM framework with ICP, positioning, channels, and 90-day plan',
        variables: [
          { name: 'product_name', description: 'Your product or company name' },
          { name: 'product_description', description: 'What your product does (1-2 sentences)' },
          { name: 'target_customers', description: 'Who you think you\'re building for' },
          { name: 'price', description: 'Pricing model and price point', default: 'SaaS, $99/month' },
          { name: 'stage', description: 'Company stage', default: 'pre-launch' },
          { name: 'budget', description: 'GTM budget', default: '$10K/month' },
          { name: 'key_differentiator', description: 'Your main competitive advantage' }
        ]
      }
    ]
  },
  {
    title: 'Full-Stack Feature Planner',
    description: 'Transform a feature request into a complete engineering spec: user stories, API design, database schema, component breakdown, test plan, and sprint tickets ready for Jira.',
    category: PromptCategory.CODING,
    authorKey: 'alex_chen',
    upvoteCount: 967, viewCount: 14100, forkCount: 88, downloadCount: 478,
    tags: ['coding', 'documentation', 'productivity', 'api-design'],
    versions: [
      {
        content: `You are a principal engineer and technical product manager. Transform this feature request into a complete engineering spec:

**Feature**: {{feature_name}}
**User story**: As a {{user_type}}, I want to {{user_action}} so that {{user_benefit}}
**Tech stack**: {{stack}}
**Timeline**: {{timeline}}
**Constraints**: {{constraints}}

Generate:

## 1. Refined User Stories
Break down into 3-7 granular stories. Format: "As a [user], I want to [action] so that [benefit]". Add acceptance criteria for each.

## 2. API Design
For each endpoint needed:
- Method + path
- Request body schema (JSON)
- Response schema (JSON)
- Auth required?
- Error cases (4xx, 5xx)

## 3. Database Changes
- New tables/collections with column names, types, indexes, constraints
- Migrations needed
- Impact on existing data

## 4. Frontend Components
- Component tree (parent → children)
- Props interface for each component
- State management approach
- Loading/error/empty states

## 5. Test Plan
- Unit tests: what to test, expected coverage
- Integration tests: critical paths
- Edge cases: the 5 scenarios most likely to cause bugs

## 6. Sprint Tickets (Jira-ready)
For each ticket:
- Title
- Type (Story/Task/Bug/Spike)
- Story points (1/2/3/5/8)
- Description
- Acceptance criteria
- Dependencies

## 7. Risk & Open Questions
Top 3 risks with mitigation. Questions that need answers before dev starts.`,
        changelog: 'Complete feature planning framework',
        variables: [
          { name: 'feature_name', description: 'Feature name (short)' },
          { name: 'user_type', description: 'User type', default: 'logged-in user' },
          { name: 'user_action', description: 'What the user wants to do' },
          { name: 'user_benefit', description: 'Why they want it' },
          { name: 'stack', description: 'Tech stack', default: 'Next.js, TypeScript, Prisma, PostgreSQL' },
          { name: 'timeline', description: 'Available time', default: '2-week sprint' },
          { name: 'constraints', description: 'Technical or business constraints', default: 'Must be backward compatible' }
        ]
      }
    ]
  },
  {
    title: 'Viral Content Framework',
    description: 'The exact framework used to create content with 1M+ views. Covers hooks, structure, emotional triggers, distribution strategy, and repurposing for 7 platforms.',
    category: PromptCategory.WRITING,
    authorKey: 'raj_patel',
    upvoteCount: 1203, viewCount: 17800, forkCount: 112, downloadCount: 567,
    tags: ['creative-writing', 'marketing', 'seo', 'productivity'],
    versions: [
      {
        content: `Create viral content about "{{topic}}" for {{primary_platform}}.

**Topic**: {{topic}}
**Primary platform**: {{primary_platform}}
**Target audience**: {{audience}}
**Content goal**: {{goal}} (awareness/engagement/conversion/virality)
**Unique angle**: {{unique_angle}}

## Step 1: Viral Hook Analysis
Generate 5 hook variations using different psychological triggers:
1. **Curiosity gap**: "The reason [X] actually happens is..."
2. **Controversy**: "[Common belief] is wrong. Here's the data."
3. **Identity**: "If you're a [identity], you need to hear this."
4. **FOMO**: "99% of people don't know this about [X]"
5. **Story**: Start mid-action, in the most dramatic moment

Score each on: scroll-stop probability (1-10), relevance to {{audience}} (1-10), originality (1-10)

## Step 2: Content Structure
Build the winning hook into a full piece:
- Opening (hook + promise — first 3 seconds must hold attention)
- Body (3-5 value-packed sections, each shareable standalone)
- Pattern interrupts (where to insert surprise, humor, or pivot)
- Closing (memorable takeaway + clear next action)

## Step 3: Emotional Architecture
Map the emotional journey: curiosity → investment → reward → sharing impulse
Identify 3 moments to insert shareable lines/screenshots

## Step 4: Platform Optimization for {{primary_platform}}
- Format: optimal length, structure, hashtags, mentions
- Timing: best posting time and day
- Engagement hacks: specific to this platform

## Step 5: Repurposing Matrix
Adapt for 6 other platforms (table format):
| Platform | Format | Key Adaptation | Expected Reach Multiplier |`,
        changelog: 'Complete viral content framework with platform repurposing',
        variables: [
          { name: 'topic', description: 'Content topic' },
          { name: 'primary_platform', description: 'Main platform', default: 'LinkedIn' },
          { name: 'audience', description: 'Target audience', default: 'startup founders and marketers' },
          { name: 'goal', description: 'Content goal', default: 'virality' },
          { name: 'unique_angle', description: 'Your unique perspective or data' }
        ]
      }
    ]
  },
]

// ─── Tag Data ─────────────────────────────────────────────────────────────────

const TAGS = [
  { name: 'gpt-4', slug: 'gpt-4' },
  { name: 'claude', slug: 'claude' },
  { name: 'llama', slug: 'llama' },
  { name: 'coding', slug: 'coding' },
  { name: 'productivity', slug: 'productivity' },
  { name: 'creative-writing', slug: 'creative-writing' },
  { name: 'business', slug: 'business' },
  { name: 'data-science', slug: 'data-science' },
  { name: 'devops', slug: 'devops' },
  { name: 'education', slug: 'education' },
  { name: 'marketing', slug: 'marketing' },
  { name: 'seo', slug: 'seo' },
  { name: 'testing', slug: 'testing' },
  { name: 'refactoring', slug: 'refactoring' },
  { name: 'documentation', slug: 'documentation' },
  { name: 'api-design', slug: 'api-design' },
  { name: 'sql', slug: 'sql' },
  { name: 'career', slug: 'career' },
  { name: 'prompt-engineering', slug: 'prompt-engineering' },
  { name: 'automation', slug: 'automation' },
  { name: 'roleplay', slug: 'roleplay' },
  { name: 'ai-tools', slug: 'ai-tools' },
  { name: 'gtm', slug: 'gtm' },
  { name: 'startup', slug: 'startup' },
]

// ─── Main Seed ───────────────────────────────────────────────────────────────

async function main() {
  await cleanup()

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('👤 Creating users...')
  const users = await Promise.all([
    prisma.user.create({ data: { email: 'alex@promptforge.dev', username: 'alex_chen', displayName: 'Alex Chen', passwordHash: PASSWORD_HASH, bio: 'Full-stack developer obsessed with AI tooling. Building the future one prompt at a time.', website: 'https://alexchen.dev', isPremium: true, role: UserRole.CREATOR, eloRating: 1450 } }),
    prisma.user.create({ data: { email: 'priya@promptforge.dev', username: 'priya_nair', displayName: 'Priya Nair', passwordHash: PASSWORD_HASH, bio: 'AI consultant helping Fortune 500s leverage LLMs. $2.4K/mo from prompt sales.', website: 'https://priyanair.ai', isPremium: true, role: UserRole.CREATOR, eloRating: 1380, totalEarnings: 7200 } }),
    prisma.user.create({ data: { email: 'jake@promptforge.dev', username: 'jake_morrison', displayName: 'Jake Morrison', passwordHash: PASSWORD_HASH, bio: 'Content strategist & copywriter. I turn prompts into revenue.', isPremium: true, role: UserRole.CREATOR, eloRating: 1320 } }),
    prisma.user.create({ data: { email: 'sarah@promptforge.dev', username: 'sarah_kim', displayName: 'Sarah Kim', passwordHash: PASSWORD_HASH, bio: 'Data scientist @ fintech startup. Love building EDA and ML prompts.', role: UserRole.CREATOR, eloRating: 1290 } }),
    prisma.user.create({ data: { email: 'marcus@promptforge.dev', username: 'dev_marcus', displayName: 'Dev Marcus', passwordHash: PASSWORD_HASH, bio: 'DevOps engineer. Automate everything, document nothing (until I found PromptForge).', role: UserRole.CREATOR, eloRating: 1240 } }),
    prisma.user.create({ data: { email: 'elena@promptforge.dev', username: 'elena_v', displayName: 'Elena Vasquez', passwordHash: PASSWORD_HASH, bio: 'Product manager turned AI enthusiast. Building prompts for the non-technical.', role: UserRole.USER, eloRating: 1180 } }),
    prisma.user.create({ data: { email: 'raj@promptforge.dev', username: 'raj_patel', displayName: 'Raj Patel', passwordHash: PASSWORD_HASH, bio: 'Serial entrepreneur. Using AI to 10x my startup\'s content output.', isPremium: true, role: UserRole.CREATOR, eloRating: 1260, totalEarnings: 3400 } }),
    prisma.user.create({ data: { email: 'nina@promptforge.dev', username: 'nina_web', displayName: 'Nina Weber', passwordHash: PASSWORD_HASH, bio: 'Frontend dev. I make prompts that write better code than me.', role: UserRole.USER, eloRating: 1150 } }),
    prisma.user.create({ data: { email: 'tom@promptforge.dev', username: 'tom_analyst', displayName: 'Tom Anderson', passwordHash: PASSWORD_HASH, bio: 'Business analyst. Excel wizard turned prompt engineer.', role: UserRole.USER, eloRating: 1120 } }),
    prisma.user.create({ data: { email: 'admin@promptforge.dev', username: 'admin_forge', displayName: 'PromptForge Team', passwordHash: PASSWORD_HASH, role: UserRole.ADMIN } }),
  ])

  const userMap = Object.fromEntries(users.map(u => [u.username, u]))

  // ── Tags ──────────────────────────────────────────────────────────────────
  console.log('🏷️  Creating tags...')
  const tagRecords = await Promise.all(
    TAGS.map(t => prisma.tag.create({ data: { name: t.name, slug: t.slug, count: 0 } }))
  )
  const tagMap = Object.fromEntries(tagRecords.map(t => [t.slug, t]))

  // ── Prompts ──────────────────────────────────────────────────────────────
  console.log('📝 Creating prompts...')
  const createdPrompts: Array<{ id: string; authorId: string; upvoteCount: number }> = []

  for (const pd of PROMPT_DATA) {
    const author = userMap[pd.authorKey]
    if (!author) continue

    const prompt = await prisma.prompt.create({
      data: {
        title: pd.title,
        description: pd.description,
        category: pd.category,
        isPublic: true,
        authorId: author.id,
        upvoteCount: pd.upvoteCount,
        viewCount: pd.viewCount,
        forkCount: pd.forkCount,
        downloadCount: pd.downloadCount,
        createdAt: randomDate(180),
      }
    })

    // Create versions
    let latestVersionId = ''
    for (let i = 0; i < pd.versions.length; i++) {
      const v = pd.versions[i]
      const version = await prisma.promptVersion.create({
        data: {
          promptId: prompt.id,
          version: i + 1,
          content: v.content,
          changelog: v.changelog,
          variables: v.variables,
          authorId: author.id,
          createdAt: randomDate(180 - i * 30),
        }
      })
      latestVersionId = version.id
    }

    // Set currentVersionId
    await prisma.prompt.update({ where: { id: prompt.id }, data: { currentVersionId: latestVersionId } })

    // Connect tags
    for (const tagSlug of pd.tags) {
      if (tagMap[tagSlug]) {
        await prisma.promptTag.create({ data: { promptId: prompt.id, tagId: tagMap[tagSlug].id } })
        await prisma.tag.update({ where: { id: tagMap[tagSlug].id }, data: { count: { increment: 1 } } })
      }
    }

    createdPrompts.push({ id: prompt.id, authorId: author.id, upvoteCount: pd.upvoteCount })
  }

  console.log(`   Created ${createdPrompts.length} prompts`)

  // ── Upvotes ───────────────────────────────────────────────────────────────
  console.log('❤️  Creating upvotes...')
  const allUserIds = users.filter(u => u.role !== UserRole.ADMIN).map(u => u.id)

  for (const p of createdPrompts) {
    const numUpvotes = Math.min(p.upvoteCount, allUserIds.length)
    const voters = [...allUserIds].sort(() => Math.random() - 0.5).slice(0, numUpvotes)
    for (const userId of voters) {
      if (userId !== p.authorId) {
        try {
          await prisma.upvote.create({ data: { userId, promptId: p.id, createdAt: randomDate(90) } })
        } catch { /* skip duplicates */ }
      }
    }
  }

  // ── Comments ──────────────────────────────────────────────────────────────
  console.log('💬 Creating comments...')
  const COMMENT_TEXTS = [
    'This prompt saved me 2 hours on my last sprint. The structured output makes it super easy to act on.',
    'Been using this daily for 3 months. My team\'s code quality metrics have improved significantly.',
    'Works great with Claude 3.5 Sonnet. I set temperature to 0.2 for more consistent output.',
    'The v3 update is a huge improvement. The prioritized action items are exactly what I needed.',
    'I forked this and added an accessibility section for frontend reviews. Highly recommend.',
    'This is the first AI prompt that actually caught a production bug before it shipped.',
    'Combined this with the SQL Optimizer prompt — absolute power combo for backend dev.',
    'As a junior dev, this is like having a senior engineer review my code 24/7.',
    'I\'ve tried 10+ code review prompts. This is the only one I kept using.',
    'The security section alone is worth it. Caught an XSS vulnerability in our auth flow.',
    'My clients love the structured format. I send them the output directly.',
    'Would love a version focused on TypeScript specifics — type safety section.',
    'The ROI on this prompt is insane. $20/month subscription paid back in the first day.',
    'Brilliant. Simple to use, powerful output. The {{variable}} system is perfect.',
    'This prompt + GPT-4 Turbo is an unbeatable stack for rapid prototyping.',
  ]

  const topPrompts = createdPrompts.slice(0, 15)
  for (const p of topPrompts) {
    const numComments = randomBetween(3, 8)
    const commenters = allUserIds.filter(id => id !== p.authorId)
    for (let i = 0; i < Math.min(numComments, commenters.length); i++) {
      await prisma.comment.create({
        data: {
          promptId: p.id,
          authorId: commenters[i],
          content: pick(COMMENT_TEXTS),
          upvotes: randomBetween(0, 24),
          createdAt: randomDate(60),
        }
      })
    }
  }

  // ── Follows ───────────────────────────────────────────────────────────────
  console.log('👥 Creating follows...')
  const followPairs = [
    ['elena_v', 'alex_chen'], ['elena_v', 'priya_nair'], ['elena_v', 'jake_morrison'],
    ['elena_v', 'sarah_kim'], ['elena_v', 'dev_marcus'], ['elena_v', 'raj_patel'],
    ['nina_web', 'alex_chen'], ['nina_web', 'priya_nair'], ['nina_web', 'jake_morrison'],
    ['tom_analyst', 'priya_nair'], ['tom_analyst', 'sarah_kim'], ['tom_analyst', 'raj_patel'],
    ['alex_chen', 'sarah_kim'], ['sarah_kim', 'alex_chen'],
    ['jake_morrison', 'raj_patel'], ['raj_patel', 'jake_morrison'],
    ['dev_marcus', 'alex_chen'], ['dev_marcus', 'sarah_kim'],
    ['priya_nair', 'alex_chen'], ['alex_chen', 'priya_nair'],
    ['raj_patel', 'priya_nair'], ['raj_patel', 'elena_v'],
  ]
  for (const [followerKey, followingKey] of followPairs) {
    if (userMap[followerKey] && userMap[followingKey]) {
      try {
        await prisma.follow.create({
          data: { followerId: userMap[followerKey].id, followingId: userMap[followingKey].id, createdAt: randomDate(180) }
        })
      } catch { /* skip duplicates */ }
    }
  }

  // ── Collections ───────────────────────────────────────────────────────────
  console.log('📚 Creating collections...')
  const codingPrompts = createdPrompts.slice(0, 8)
  const writingPrompts = createdPrompts.filter((_, i) => i >= 8 && i < 12)
  const bizPrompts = createdPrompts.filter((_, i) => i >= 12 && i < 15)

  const collections = [
    { name: 'Full-Stack Dev Toolkit', description: 'Essential prompts for modern web development', ownerId: userMap['alex_chen'].id, prompts: codingPrompts.slice(0, 6) },
    { name: 'AI Consulting Essentials', description: 'Prompts I use with every Fortune 500 client', ownerId: userMap['priya_nair'].id, prompts: [...bizPrompts, ...codingPrompts.slice(0, 3)] },
    { name: 'Content Creator Bundle', description: 'Everything you need to create compelling content at scale', ownerId: userMap['jake_morrison'].id, prompts: writingPrompts },
    { name: 'Startup Founder Pack', description: 'From pitch deck to product launch — AI-assisted', ownerId: userMap['raj_patel'].id, prompts: [...bizPrompts, ...writingPrompts.slice(0, 2)] },
    { name: 'Data Science Workflow', description: 'EDA, ML selection, A/B testing, and reporting prompts', ownerId: userMap['sarah_kim'].id, prompts: createdPrompts.filter(p => p.id).slice(16, 20) },
  ]

  for (const c of collections) {
    const collection = await prisma.collection.create({
      data: { name: c.name, description: c.description, isPublic: true, ownerId: c.ownerId, createdAt: randomDate(120) }
    })
    for (let i = 0; i < c.prompts.length; i++) {
      await prisma.collectionItem.create({
        data: { collectionId: collection.id, promptId: c.prompts[i].id, order: i }
      })
    }
  }

  // ── Executions ────────────────────────────────────────────────────────────
  console.log('⚡ Creating execution records...')
  const AI_MODELS = [AIModel.GPT4O, AIModel.GPT4, AIModel.CLAUDE_3_5_SONNET, AIModel.CLAUDE_3_OPUS, AIModel.GEMINI_1_5_PRO, AIModel.MISTRAL_LARGE]
  const MODEL_COSTS: Record<string, number> = {
    GPT4O: 0.000005, GPT4: 0.00003, CLAUDE_3_5_SONNET: 0.000015,
    CLAUDE_3_OPUS: 0.000075, GEMINI_1_5_PRO: 0.000007, MISTRAL_LARGE: 0.000008,
  }

  // Build all execution records in memory then batch insert per prompt
  let execCount = 0
  for (const p of createdPrompts) {
    const numExecs = Math.min(Math.floor(p.upvoteCount / 5) + randomBetween(3, 12), 20)
    const userIds = [...allUserIds, null, null]
    const records = []
    for (let i = 0; i < numExecs; i++) {
      const model = pick(AI_MODELS)
      const inputTokens = randomBetween(200, 1500)
      const outputTokens = randomBetween(300, 2500)
      const totalTokens = inputTokens + outputTokens
      records.push({
        promptId: p.id,
        userId: pick(userIds),
        model,
        inputContent: 'Sample input content for prompt execution',
        outputContent: 'Sample AI-generated output for this prompt execution',
        inputTokens,
        outputTokens,
        latencyMs: randomBetween(600, 8000),
        cost: totalTokens * (MODEL_COSTS[model] ?? 0.000010),
        success: Math.random() > 0.04,
        createdAt: randomDate(90),
      })
    }
    try {
      const result = await prisma.promptExecution.createMany({ data: records })
      execCount += result.count
    } catch { /* skip errors */ }
  }
  console.log(`   Created ${execCount} execution records`)

  // ── Mark premium prompts ──────────────────────────────────────────────────
  console.log('💎 Marking premium prompts...')
  // Last 3 prompts in PROMPT_DATA are the premium ones (Startup GTM, Full-Stack Feature Planner, Viral Content)
  const premiumPrompts = createdPrompts.slice(-3)
  const premiumPrices = [4900, 3900, 5900] // in cents (represents dollars: $49, $39, $59)
  for (let i = 0; i < premiumPrompts.length; i++) {
    await prisma.prompt.update({
      where: { id: premiumPrompts[i].id },
      data: { isPremium: true, price: premiumPrices[i] }
    })
  }

  // ── Forks ─────────────────────────────────────────────────────────────────
  console.log('🍴 Creating forks...')
  const forkPairs = [
    { original: createdPrompts[0], forker: userMap['nina_web'] },
    { original: createdPrompts[0], forker: userMap['tom_analyst'] },
    { original: createdPrompts[1], forker: userMap['dev_marcus'] },
    { original: createdPrompts[7], forker: userMap['raj_patel'] },
    { original: createdPrompts[8], forker: userMap['sarah_kim'] },
  ]
  for (const { original, forker } of forkPairs) {
    if (!forker) continue
    const origPrompt = await prisma.prompt.findUnique({
      where: { id: original.id },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
    })
    if (!origPrompt || !origPrompt.versions[0]) continue
    const fork = await prisma.prompt.create({
      data: {
        title: `${origPrompt.title} (Forked)`,
        description: origPrompt.description,
        category: origPrompt.category,
        isPublic: true,
        authorId: forker.id,
        forkedFromId: original.id,
        upvoteCount: randomBetween(10, 80),
        viewCount: randomBetween(200, 1500),
        forkCount: 0,
        downloadCount: randomBetween(5, 40),
        createdAt: randomDate(60),
      }
    })
    const forkVersion = await prisma.promptVersion.create({
      data: {
        promptId: fork.id,
        version: 1,
        content: origPrompt.versions[0].content + '\n\n// Forked and customized',
        changelog: 'Forked from original',
        variables: origPrompt.versions[0].variables as object[],
        authorId: forker.id,
        createdAt: randomDate(60),
      }
    })
    await prisma.prompt.update({ where: { id: fork.id }, data: { currentVersionId: forkVersion.id } })
    await prisma.prompt.update({ where: { id: original.id }, data: { forkCount: { increment: 1 } } })
    createdPrompts.push({ id: fork.id, authorId: forker.id, upvoteCount: randomBetween(10, 80) })
  }

  // ── Battle Sessions ────────────────────────────────────────────────────────
  console.log('⚔️  Creating battle sessions...')
  const battlePromptPairs = [
    [createdPrompts[0], createdPrompts[1]],   // Code Reviewer vs SQL Optimizer
    [createdPrompts[8], createdPrompts[9]],   // Blog Post Writer vs Cold Email Writer
    [createdPrompts[2], createdPrompts[3]],   // Test Suite Generator vs Debug Assistant
    [createdPrompts[14], createdPrompts[13]], // Story Generator vs Brand Voice
    [createdPrompts[20], createdPrompts[21]], // Dungeon Master vs Historical Character
  ]
  const battleVoters = users.filter(u => u.role !== UserRole.ADMIN)
  const battleSessions = []

  for (let i = 0; i < battlePromptPairs.length; i++) {
    const pair = battlePromptPairs[i]
    if (!pair || !pair[0] || !pair[1]) continue
    const isActive = i < 3
    const expiresAt = isActive
      ? new Date(Date.now() + (24 + i * 12) * 60 * 60 * 1000)
      : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    const themes = ['Best for Developer Productivity', 'Most Versatile Prompt', 'Best Structured Output', 'Top Creative Prompt', 'Ultimate Roleplay Experience']
    const votesA = isActive ? randomBetween(12, 45) : randomBetween(40, 120)
    const votesB = isActive ? randomBetween(8, 50) : randomBetween(30, 100)
    const winnerId = isActive ? null : (votesA >= votesB ? pair[0].id : pair[1].id)

    const session = await prisma.battleSession.create({
      data: {
        promptAId: pair[0].id,
        promptBId: pair[1].id,
        theme: themes[i] ?? 'Community Vote',
        status: isActive ? 'active' : 'completed',
        votesA,
        votesB,
        winnerId,
        expiresAt,
        createdAt: randomDate(7),
      }
    })
    battleSessions.push(session)

    // Seed some votes for each session
    const voters = [...battleVoters].sort(() => Math.random() - 0.5).slice(0, 5)
    for (const voter of voters) {
      const voteForA = Math.random() > 0.5
      try {
        await prisma.battleVote.create({
          data: {
            sessionId: session.id,
            voterId: voter.id,
            winnerId: voteForA ? pair[0].id : pair[1].id,
            loserId: voteForA ? pair[1].id : pair[0].id,
            createdAt: randomDate(7),
          }
        })
      } catch { /* skip duplicates */ }
    }

    // Update ELO for completed sessions
    if (!isActive && winnerId) {
      const winnerPrompt = createdPrompts.find(p => p.id === winnerId)
      const loserPrompt = createdPrompts.find(p => p.id !== winnerId && (p.id === pair[0].id || p.id === pair[1].id))
      if (winnerPrompt && loserPrompt) {
        await prisma.user.update({ where: { id: winnerPrompt.authorId }, data: { eloRating: { increment: 16 } } }).catch(() => {})
        await prisma.user.update({ where: { id: loserPrompt.authorId }, data: { eloRating: { decrement: 16 } } }).catch(() => {})
      }
    }
  }
  console.log(`   Created ${battleSessions.length} battle sessions`)

  // ── Notifications ──────────────────────────────────────────────────────────
  console.log('🔔 Creating notifications...')
  const notifData = [
    { userId: userMap['alex_chen'].id, type: 'UPVOTE' as const, title: 'New upvote', message: 'priya_nair upvoted your prompt "Code Reviewer Pro"', read: false },
    { userId: userMap['alex_chen'].id, type: 'COMMENT' as const, title: 'New comment', message: 'sarah_kim commented: "This saved me 2 hours on my sprint!"', read: false },
    { userId: userMap['alex_chen'].id, type: 'FORK' as const, title: 'Prompt forked', message: 'nina_web forked your prompt "Code Reviewer Pro"', read: true },
    { userId: userMap['alex_chen'].id, type: 'FOLLOW' as const, title: 'New follower', message: 'dev_marcus is now following you', read: true },
    { userId: userMap['priya_nair'].id, type: 'UPVOTE' as const, title: 'New upvote', message: 'tom_analyst upvoted "AI Consulting Essentials"', read: false },
    { userId: userMap['priya_nair'].id, type: 'FOLLOW' as const, title: 'New follower', message: 'raj_patel is now following you', read: false },
    { userId: userMap['jake_morrison'].id, type: 'UPVOTE' as const, title: 'New upvote', message: 'elena_v upvoted your prompt "Blog Post Writer"', read: false },
    { userId: userMap['jake_morrison'].id, type: 'COMMENT' as const, title: 'New comment', message: 'raj_patel commented: "This LinkedIn template is 🔥"', read: true },
    { userId: userMap['raj_patel'].id, type: 'FORK' as const, title: 'Prompt forked', message: 'sarah_kim forked "Pitch Deck Script"', read: false },
    { userId: userMap['sarah_kim'].id, type: 'ACHIEVEMENT' as const, title: 'Achievement unlocked!', message: 'Your prompt reached 500 upvotes!', read: false },
  ]
  for (const n of notifData) {
    await prisma.notification.create({
      data: {
        ...n,
        data: {},
        createdAt: randomDate(14),
      }
    })
  }

  console.log('\n✅ Seed complete!')
  console.log(`   👤 ${users.length} users`)
  console.log(`   🏷️  ${tagRecords.length} tags`)
  console.log(`   📝 ${createdPrompts.length} prompts`)
  console.log(`   ⚡ ${execCount} executions`)
  console.log(`   ⚔️  ${battleSessions.length} battle sessions`)
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
