# Project Context for LLM Handoff

## Project Summary

This repository is a frontend-only demo for a Hyundai Futurenet-style messaging operation system. It is intended for project planning and UI review before backend implementation.

The planned backend stack is:

- Spring Boot
- Thymeleaf
- Bootstrap
- Oracle
- Spring Security

The current repository does not implement that backend stack. It is a React/Vite visual prototype with mock data.

## User Goal

The user needs a complete web page demo of a messaging system, not a meeting slide or static mockup. The UI should show the actual operating flows for:

- Login
- Dashboard
- Message sending
- Template management
- Send history
- Member management
- Detailed marketing statistics

The user repeatedly emphasized:

- Remove unrelated decorative UI.
- Keep only system operation flows.
- Assume thousands to hundreds of thousands of members.
- Assume hundreds or tens of thousands of tags/templates.
- Make the UI safe for real operators.
- Message sending should be step-based.
- AI recommendation and individual member selection must remain.
- Table rows should show hover feedback and pointer cursor.

## Current App

Main file:

- `src/app/App.tsx`

Entry:

- `src/main.tsx`

Current routed pages in `MainLayout`:

- `dashboard` -> `DashboardPage`
- `send` -> `SendMessagePageWizard`
- `templates` -> `TemplatesPage`
- `history` -> `HistoryPage`
- `members` -> `MembersPage`
- `stats-overview` -> `StatsOverview`
- `stats-channel` -> `StatsChannel`
- `stats-member` -> `StatsMember`
- `stats-performance` -> `StatsPerformance`

Important note:

- Older message send components still exist in the file (`SendMessagePage`, `SendMessagePageV2`) but the active route uses `SendMessagePageWizard`.

## Design Direction

The visual direction was based on a user-provided design archive and later adjusted by request.

Current expectation:

- Clean, modern, bright
- Pretendard-like Korean UI typography
- No unnecessary gradients
- Avoid excessive decorative copy
- Use the original early color feeling rather than strict Hyundai CI colors
- Use color only where it supports operation, status, or hierarchy
- Keep UI density appropriate for enterprise tools

The user disliked earlier decorative or overly heavy designs. Be conservative and operational.

## Implemented Feature Details

### Login

- Demo login page
- User can enter any ID/password
- Login routes to dashboard
- Intended backend mapping: Spring Security, encryption, masking

### Dashboard

Shows operational KPIs:

- Today send count
- Success rate
- Active members
- Monthly send total
- Daily send trend
- Channel distribution
- Recent send history
- Quick actions
- AI marketing insight

### Message Send Flow

Active component: `SendMessagePageWizard`

Step flow:

1. Recipient selection
2. Message writing
3. Channel selection
4. Review and send

Recipient selection:

- Tag search
- Similar tag suggestions
- Selected tags
- Member search
- Individual member checkbox selection
- Add checked members to include list
- Add checked members to exclude list
- Manual recipient add
- Include/exclude recipient boxes
- Members can have multiple tags

Template/message step:

- Searchable template list
- Designed for large template count
- Select template from list
- Immediate preview
- Variable substitution preview
- Manual message editing

Channel step:

- Channel cards
- SMS
- LMS
- RCS
- Kakao Alimtalk
- Kakao Friendtalk

Review/send step:

- Async AI inspection jobs
- Jobs:
  - Typo/proofreading
  - Ad label/policy
  - Sensitive expression
  - Privacy/masking
  - Channel length fit
  - Send fatigue
- AI report detail
- Immediate send / scheduled send
- Send request button

AI recommendation:

- Toggle exists in the send page top control
- AI recommendation fills recipients, template, channel, and message
- Must remain if editing this area

### Template Management

- Template table/list
- Search
- Filter
- Add/edit/delete UI
- Row click opens detail modal
- Pagination
- Template tags
- Usage count and update date

### Send History

- Send record table
- Row hover/click interactions
- Detail modal
- Campaign, channel, target, counts, success/fail, status

### Member Management

- Member table/list
- Search/filter
- Consent status for SMS/Kakao/RCS
- Multiple tags per member
- Detail modal
- Bulk/partial update intent
- File upload UI for Excel, CSV, JSON
- Pagination

### Statistics

Statistics are split into at least 4 pages:

- Overview
- Channel
- Member
- Performance

The goal is not only charts but decision support for marketers and executives:

- Campaign performance
- Channel performance
- Segment response
- Member/tag behavior
- Marketing strategy insights

## Commands

Install:

```bash
pnpm install
```

Run:

```bash
pnpm dev
```

Build:

```bash
pnpm build
```

The `dev` script is configured as:

```bash
vite --host 0.0.0.0
```

This allows LAN access such as:

```text
http://192.168.2.247:5174/
```

## GitHub

Remote:

```text
https://github.com/kosa-second-project/message-demo.git
```

Current branch:

```text
main
```

## Files Ignored

The following are intentionally ignored:

- `node_modules/`
- `.pnpm-store/`
- `dist/`
- `.vite/`
- `modern-design-source/`

`modern-design-source/` was a local extracted copy of the user-provided design reference. It is not required for running the current app.

## Suggested Next Work

High-priority improvements:

- Split `src/app/App.tsx` into page/components files.
- Remove unused older send page components after confirming no rollback is needed.
- Add actual route state or React Router.
- Add API boundary types for future Spring Boot integration.
- Add mock service layer so UI is not tightly coupled to local arrays.
- Add real pagination behavior for large member/template datasets.
- Add upload validation UI for member file import.
- Add confirmation dialogs for destructive actions and final send.
- Add accessible labels and keyboard navigation pass.

Potential backend mapping:

- `Template`
- `Member`
- `MemberTag`
- `Consent`
- `SendCampaign`
- `SendRecord`
- `AiInspectionJob`
- `AiRecommendation`
- `StatsSnapshot`

## Cautions for Future Agents

- Do not reintroduce decorative landing-page style UI.
- Do not remove AI recommendation from message send.
- Do not remove individual include/exclude member selection.
- Do not use a simple dropdown for large template selection.
- Do not list hundreds of tags as a flat uncontrolled chip wall.
- Preserve table row hover and pointer interactions.
- Keep the active send page route pointing to `SendMessagePageWizard`.
- If changing colors, follow the current app tone unless the user gives a new explicit direction.
