# Claude Project Instructions - Vilo

## CRITICAL: Terminal & Server Protection (DO NOT VIOLATE)

**THIS RULE OVERRIDES ALL OTHER INSTRUCTIONS**

Claude MUST NEVER execute any of the following actions:

### Forbidden Actions
1. **NEVER kill dev servers** - Do not terminate running `npm run dev` or similar processes
2. **NEVER use process-killing commands** on dev-related processes:
   - `taskkill` (Windows)
   - `kill` / `pkill` / `killall` (Unix)
   - Ctrl+C signals to running servers
3. **NEVER restart the dev server** - This includes stopping and starting
4. **NEVER close or terminate terminal sessions** that are running dev processes

### Why This Matters
Killing terminals or dev servers causes Claude Code to disconnect from the AI model, resulting in:
- Lost session context
- Interrupted work
- Need to restart and re-explain everything

### What To Do Instead
- If a server needs restarting, **ASK the user**: "The dev server may need to be restarted. Please restart it manually when ready."
- If a port is in use, **ASK the user** to manually kill the process
- If you need to run a build or other command, use a **separate terminal** or run it alongside the dev server
- For any process management needs, **always defer to the user**

---

## Plan Tracking System (MANDATORY)

Claude MUST follow these rules for every session:

### 1. Check for Active Plan on Session Start
Before starting any work, ALWAYS check if `CURRENT_PLAN.md` exists:
- If it exists, read it and resume from the last recorded step
- Announce: "Resuming plan: [PLAN TITLE] - Currently on step [X] of [Y]"

### 2. Create a Plan for Any Multi-Step Task
When the user requests work that involves 3+ steps:
1. Create/update `CURRENT_PLAN.md` with the plan details
2. Include ALL context needed to resume if disconnected
3. Update progress after EACH step completion

### 3. CURRENT_PLAN.md Format (Required)
```markdown
# Current Plan: [TITLE]

## Status: [IN_PROGRESS | PAUSED | BLOCKED | COMPLETED]
## Started: [DATE]
## Last Updated: [DATE TIME]
## Current Step: [NUMBER]

## Goal
[Clear description of what we're trying to achieve]

## Context
[Any important context, decisions made, or information needed to resume]

## Steps
- [ ] Step 1: Description
- [ ] Step 2: Description
- [x] Step 3: Description (COMPLETED)
- [>] Step 4: Description (IN PROGRESS)
- [ ] Step 5: Description

## Progress Log
### [DATE TIME] - Step X
- What was done
- Any issues encountered
- Decisions made

### [DATE TIME] - Step Y
- What was done
- Any issues encountered
- Decisions made

## Files Modified
- `path/to/file1.ts` - Brief description of changes
- `path/to/file2.tsx` - Brief description of changes

## Notes for Resume
[Anything the next session needs to know to continue seamlessly]
```

### 4. Update Rules
- Mark step as `[>]` when starting it
- Mark step as `[x]` when completed
- Update `Last Updated` timestamp on every change
- Update `Current Step` number
- Add entry to Progress Log after each step
- Update `Files Modified` when changing files
- Update `Notes for Resume` with any pending context

### 5. On Plan Completion
1. Change Status to `COMPLETED`
2. Move file to `.claude/plans/archive/[DATE]_[TITLE].md`
3. Clear `CURRENT_PLAN.md` or delete it

### 6. On Session End/Disconnect Recovery
The plan file serves as the recovery document. When resuming:
1. Read `CURRENT_PLAN.md`
2. Check the `Current Step` and `[>]` marker
3. Read the most recent `Progress Log` entry
4. Continue from exactly where work stopped

---

## Debugging & Logging Best Practices (MANDATORY)

**CRITICAL RULE: Always add comprehensive logging when writing or modifying code**

### When to Add Logs

Claude MUST add detailed logging in these scenarios:

1. **At the start of every new feature or bug fix**
   - Add logs BEFORE writing the main logic
   - Log helps identify issues during development and testing

2. **For all backend services and controllers**
   - Log function entry with parameters
   - Log key decision points and branches
   - Log before and after database operations
   - Log errors with full context (stack trace, input data, etc.)

3. **For all frontend API calls and state changes**
   - Log API request parameters
   - Log API response data or errors
   - Log state changes in complex components
   - Log user interactions that trigger important actions

4. **During debugging sessions**
   - Add temporary verbose logs to trace execution flow
   - Log variable values at key points
   - Can be removed after issue is resolved

### Logging Pattern

**Backend Pattern (Node.js/Express)**:
```typescript
export const someFunction = async (userId: string, data: SomeData) => {
  console.log('=== [SERVICE_NAME] functionName called ===');
  console.log('[SERVICE_NAME] User ID:', userId);
  console.log('[SERVICE_NAME] Input data:', JSON.stringify(data, null, 2));

  try {
    console.log('[SERVICE_NAME] Step 1: Doing something...');
    const result = await doSomething();
    console.log('[SERVICE_NAME] Step 1 result:', result);

    console.log('[SERVICE_NAME] Step 2: Doing another thing...');
    const finalResult = await doAnotherThing(result);
    console.log('[SERVICE_NAME] Success:', finalResult.id);

    return finalResult;
  } catch (error) {
    console.error('[SERVICE_NAME] Error in functionName:', error);
    console.error('[SERVICE_NAME] Error stack:', error instanceof Error ? error.stack : 'N/A');
    throw error;
  }
};
```

**Frontend Pattern (React/TypeScript)**:
```typescript
const handleSubmit = async () => {
  console.log('=== [ComponentName] Submit started ===');
  console.log('[ComponentName] Form data:', formData);

  try {
    console.log('[ComponentName] Calling API...');
    const response = await api.create(formData);
    console.log('[ComponentName] API success:', response);

    setData(response);
    console.log('[ComponentName] State updated');
  } catch (error) {
    console.error('[ComponentName] Submit failed:', error);
    console.error('[ComponentName] Error details:', error.response?.data);
    setError(error.message);
  }
};
```

### Log Naming Convention

Use clear prefixes to identify the source:
- `[CONTROLLER]` - For controllers
- `[SERVICE_NAME]` - For services (e.g., `[COMPANY_SERVICE]`, `[BILLING_SERVICE]`)
- `[ComponentName]` - For React components
- `[HOOK_NAME]` - For React hooks

### What to Log

**DO LOG**:
- ✅ Function entry with parameters
- ✅ Key decisions and branches ("User has subscription", "Limit check passed")
- ✅ Before/after database operations
- ✅ API request/response data
- ✅ Error messages with full context
- ✅ Success confirmations with IDs/keys

**DON'T LOG**:
- ❌ Sensitive data (passwords, tokens, credit card numbers)
- ❌ Large binary data
- ❌ Every single line of code execution (keep it meaningful)

### Testing with Logs

After adding code with logs:

1. **Test the happy path** - Verify logs show correct flow
2. **Test error cases** - Verify errors are logged with context
3. **Check log output** - Ensure logs are helpful for debugging
4. **Remove or reduce** verbose logs after feature is stable (optional)

### Example: Complete Logging for a Feature

```typescript
// Controller
export const createCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== [COMPANY_CONTROLLER] Create company request ===');
    console.log('[COMPANY_CONTROLLER] User:', req.user!.id);
    console.log('[COMPANY_CONTROLLER] Body:', JSON.stringify(req.body, null, 2));

    const validated = companySchema.parse(req.body);
    console.log('[COMPANY_CONTROLLER] Validation passed');

    const result = await companyService.create(req.user!.id, validated);
    console.log('[COMPANY_CONTROLLER] Success:', result.id);

    sendSuccess(res, result);
  } catch (error) {
    console.error('[COMPANY_CONTROLLER] Failed:', error);
    next(error);
  }
};

// Service
export const create = async (userId: string, input: CreateInput) => {
  console.log('=== [COMPANY_SERVICE] create called ===');
  console.log('[COMPANY_SERVICE] User ID:', userId);
  console.log('[COMPANY_SERVICE] Input:', JSON.stringify(input, null, 2));

  try {
    console.log('[COMPANY_SERVICE] Checking limits...');
    const limitInfo = await checkLimits(userId);
    console.log('[COMPANY_SERVICE] Limits:', limitInfo);

    if (!limitInfo.can_create) {
      console.error('[COMPANY_SERVICE] Limit exceeded');
      throw new Error('Limit exceeded');
    }

    console.log('[COMPANY_SERVICE] Inserting to database...');
    const result = await db.insert(input);
    console.log('[COMPANY_SERVICE] Insert successful:', result.id);

    return result;
  } catch (error) {
    console.error('[COMPANY_SERVICE] Create failed:', error);
    throw error;
  }
};
```

### Benefits of This Approach

1. **Faster debugging** - See exactly where code fails
2. **Better testing** - Verify flow without debugger
3. **Production debugging** - Logs help diagnose user-reported issues
4. **Team collaboration** - Other developers understand code flow
5. **Documentation** - Logs serve as execution documentation

**Remember**: Logs are your first line of defense when code doesn't work as expected. Add them proactively, not reactively!

---

## Continuous Change Log (MANDATORY - AUTO SAVE POINTS)

**THIS SYSTEM PREVENTS CONTEXT LOSS FROM CRASHES/DISCONNECTS**

Claude MUST maintain a detailed change log that records EVERY action in real-time, creating automatic "save points" for seamless recovery.

### Location
`.claude/SESSION_LOG.md` - Active session log (current work)
`.claude/logs/[DATE]_session_log.md` - Archived completed sessions

### When to Log
**Log IMMEDIATELY after every action:**
1. Before AND after modifying any file
2. After running any command
3. After making any decision
4. After discovering any information
5. Before asking the user a question
6. After completing any sub-task

### Log Entry Format (REQUIRED)

```markdown
## [TIMESTAMP] - [ACTION TYPE]

### What I Did
[1-2 sentence description of the action]

### File(s) Changed
- `path/to/file.ts` - [Brief change description]

### Code Changed
**Before:**
```language
[relevant code snippet if modified]
```

**After:**
```language
[new code snippet]
```

### Why This Change
[Reasoning/context for the decision]

### Current Status
- [x] What's completed
- [>] What I'm currently doing
- [ ] What's next

### Context for Resume
[Any info needed to continue from this exact point]

### Blockers/Issues
[Any problems encountered or decisions pending]

---
```

### Action Types
Use these standardized tags:
- `[FILE_CREATE]` - Created new file
- `[FILE_MODIFY]` - Modified existing file
- `[FILE_DELETE]` - Deleted file
- `[COMMAND_RUN]` - Executed command
- `[DECISION_MADE]` - Made architectural/implementation decision
- `[RESEARCH]` - Searched/explored codebase
- `[USER_QUESTION]` - Asked user for input
- `[ERROR_ENCOUNTERED]` - Hit a problem/blocker
- `[TASK_COMPLETE]` - Finished a task/step
- `[SESSION_START]` - Beginning of session
- `[SESSION_PAUSE]` - Pausing work

### Mandatory Update Frequency
**Claude MUST update SESSION_LOG.md:**
- After EVERY file modification
- After EVERY 2-3 actions minimum
- Before presenting work to user
- When switching between tasks
- When asking user a question

### Example Log (Required Format)

```markdown
# Session Log - Vilo Project

## Session Started: 2026-01-09 14:30:22

---

## 14:30:25 - [SESSION_START]

### What I Did
Beginning work on add-ons management feature

### Current Status
- [>] Reading existing add-on service implementation
- [ ] Update add-on types to include new fields
- [ ] Create add-on form component
- [ ] Add validation logic

### Context for Resume
User requested full CRUD for add-ons with pricing and availability options

---

## 14:32:18 - [RESEARCH]

### What I Did
Analyzed existing addon.service.ts to understand current implementation

### Key Findings
- Service uses Supabase directly
- No validation on max_quantity
- Missing type definitions for addon_type field

### Current Status
- [x] Read addon.service.ts
- [>] About to update addon.types.ts
- [ ] Create form component

### Context for Resume
Need to add AddonType enum ('per_booking' | 'per_person' | 'per_night') to types

---

## 14:35:42 - [FILE_MODIFY]

### What I Did
Updated addon.types.ts to include missing type definitions

### File(s) Changed
- `backend/src/types/addon.types.ts`

### Code Changed
**Before:**
```typescript
export interface AddOn {
  id: string;
  name: string;
  price: number;
}
```

**After:**
```typescript
export type AddonType = 'per_booking' | 'per_person' | 'per_night';

export interface AddOn {
  id: string;
  name: string;
  price: number;
  addon_type: AddonType;
  max_quantity?: number;
}
```

### Why This Change
Database schema has these fields but types were incomplete, causing TypeScript errors

### Current Status
- [x] Updated addon types
- [>] Now updating addon service to use new types
- [ ] Create form component

### Context for Resume
Types are now aligned with database schema. Next: update service methods to handle new fields

---

## 14:38:55 - [DECISION_MADE]

### What I Did
Decided to use dedicated page instead of modal for add-on creation

### Why This Change
Following CLAUDE.md rule #10: "No Modal Pop-ups for Forms"
- Better UX with full screen space
- Consistent with existing patterns (rooms, properties)
- Mobile-friendly

### Current Status
- [x] Updated types
- [x] Updated service
- [>] Creating AddOnFormPage component
- [ ] Add routes and navigation

### Context for Resume
Will create:
- /addons/new → CreateAddOnPage
- /addons/:id/edit → EditAddOnPage
- AddOnForm component (reused for both)

---

## 14:45:12 - [ERROR_ENCOUNTERED]

### What I Did
Attempted to import Button component, got TypeScript error

### Error Details
```
Module '"@/components/ui"' has no exported member 'Button'
```

### Why This Happened
Button export missing from ui/index.ts barrel file

### Current Status
- [x] Created AddOnForm component structure
- [>] Fixing Button export issue
- [ ] Complete form implementation

### Context for Resume
Need to check ui/index.ts and add Button export

### Blockers/Issues
Form is 80% done but blocked on missing Button export

---

## 14:47:30 - [FILE_MODIFY]

### What I Did
Fixed Button export in ui barrel file

### File(s) Changed
- `frontend/src/components/ui/index.ts`

### Code Changed
**After:**
```typescript
export { Button } from './Button';
export type { ButtonProps } from './Button/Button.types';
```

### Current Status
- [x] Fixed Button export
- [>] Completing AddOnForm component
- [ ] Test form functionality

### Context for Resume
Button import now works. Continuing with form implementation using Button and Input components

---

## 15:02:45 - [TASK_COMPLETE]

### What I Did
Completed add-on management feature implementation

### Files Modified
1. `backend/src/types/addon.types.ts` - Added AddonType and updated interface
2. `backend/src/services/addon.service.ts` - Updated CRUD methods
3. `frontend/src/components/features/AddOnForm/AddOnForm.tsx` - Created form component
4. `frontend/src/pages/addons/CreateAddOnPage.tsx` - Created create page
5. `frontend/src/pages/addons/EditAddOnPage.tsx` - Created edit page
6. `frontend/src/App.tsx` - Added routes

### Current Status
- [x] All add-on CRUD operations complete
- [x] Form validation working
- [x] Routes configured
- [ ] User testing needed

### Context for Resume
Feature is complete and ready for testing. No blockers.

### Next Steps
Ready to move on to next task or wait for user feedback

---

## 15:05:00 - [SESSION_PAUSE]

### What I Did
Pausing work to present completed feature to user

### Summary of Session
- Added add-on management with full CRUD
- Fixed Button component export issue
- Followed all CLAUDE.md conventions (no modals, explicit save buttons, theme colors)

### Context for Resume
If session disconnects, all work is complete. Just need user approval/testing.

---
```

### Recovery Protocol

When Claude resumes after crash/disconnect:

1. **Read SESSION_LOG.md FIRST** (before responding to user)
2. Find the most recent entry
3. Check the "Current Status" and "Context for Resume"
4. Announce to user:
   ```
   📋 Resuming from last save point:
   - Last action: [ACTION TYPE] at [TIME]
   - Status: [Current status from log]
   - Next: [What was about to be done]
   ```
5. Continue from exact point without asking user to re-explain

### Session Archiving

At end of session or when task completes:
1. Move `SESSION_LOG.md` to `.claude/logs/[DATE]_[TASK_NAME].md`
2. Create fresh `SESSION_LOG.md` for next session
3. Update `CURRENT_PLAN.md` to reference archived log if needed

### Log Maintenance Rules

- **NEVER delete** SESSION_LOG.md during active work
- Update log **before** presenting work to user (so if crash happens during user response, context is saved)
- If log exceeds 500 lines, split into SESSION_LOG_PART2.md but keep latest 50 entries in main log
- Archive completed sessions weekly to `.claude/logs/archive/[YEAR]/[MONTH]/`

---

## Project Overview
Vilo is a vacation rental booking management platform with:
- **Backend**: Express.js + TypeScript + Supabase
- **Frontend**: React + TypeScript + TailwindCSS
- **Features**: Property management, bookings, customer portal, analytics

## Key Directories
- `/backend` - Express API server
- `/frontend` - React SPA
- `/backend/migrations` - Database migrations
- `/.claude` - Claude configuration and plan archives

## Development Commands
```bash
# Start development
npm run dev

# Build
npm run build

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev
```

## Important Conventions
- Use TypeScript strict mode
- Follow existing code patterns
- Run build before committing to check for errors
- Keep migrations sequential (###_description.sql)

---

## Frontend Page Layout Standards (MANDATORY)

**CRITICAL RULE: All authenticated pages MUST use AuthenticatedLayout**

### Rule: Authenticated Page Layout
When creating ANY page for authenticated users (protected routes), you MUST wrap the page content with `AuthenticatedLayout`:

```tsx
import { AuthenticatedLayout } from '@/components/layout';

export const YourPage: React.FC = () => {
  return (
    <AuthenticatedLayout
      title="Page Title"
      subtitle="Optional subtitle"
    >
      {/* Your page content here */}
    </AuthenticatedLayout>
  );
};
```

### What This Provides:
- ✅ Dashboard sidebar (left nav) automatically visible
- ✅ Header with user profile/logout
- ✅ Consistent page title and breadcrumbs
- ✅ Proper padding and layout constraints
- ✅ Dark mode support
- ✅ Mobile responsive sidebar

### When to Use AuthenticatedLayout:
- **ALL protected routes** (requires login)
- Dashboard pages
- Settings pages
- Management pages (Users, Properties, Bookings, Reviews, etc.)
- Profile pages
- Admin pages

### When NOT to Use AuthenticatedLayout:
- Public routes (Login, Signup, Landing pages)
- Guest checkout flows
- Confirmation pages (may have custom layout)
- Embedded widgets

### Common Mistake to Avoid:
❌ **WRONG** - Creating full page layout from scratch:
```tsx
export const ReviewListPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Review Manager</h1>
      {/* content */}
    </div>
  );
};
```

✅ **CORRECT** - Using AuthenticatedLayout:
```tsx
export const ReviewListPage: React.FC = () => {
  return (
    <AuthenticatedLayout title="Review Manager">
      {/* content */}
    </AuthenticatedLayout>
  );
};
```

### Optional Props:
- `title`: Page title (shown in header)
- `subtitle`: Optional subtitle below title
- `noPadding`: Remove default content padding (for full-width layouts)

### Example Usage:
```tsx
// Simple page
<AuthenticatedLayout title="Dashboard">
  <div>Your content</div>
</AuthenticatedLayout>

// Page with subtitle
<AuthenticatedLayout
  title="User Management"
  subtitle="Manage users and permissions"
>
  <UserList />
</AuthenticatedLayout>

// Full-width page (no padding)
<AuthenticatedLayout title="Calendar" noPadding>
  <FullWidthCalendar />
</AuthenticatedLayout>
```

### Loading States:
Wrap loading states inside AuthenticatedLayout:
```tsx
if (isLoading) {
  return (
    <AuthenticatedLayout title="Page Title">
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    </AuthenticatedLayout>
  );
}
```

### Multiple Return Statements:
Each return must have AuthenticatedLayout:
```tsx
export const MyPage: React.FC = () => {
  // Loading
  if (isLoading) {
    return (
      <AuthenticatedLayout title="Loading...">
        <Spinner />
      </AuthenticatedLayout>
    );
  }

  // Error
  if (error) {
    return (
      <AuthenticatedLayout title="Error">
        <ErrorMessage error={error} />
      </AuthenticatedLayout>
    );
  }

  // Main content
  return (
    <AuthenticatedLayout title="Main Content">
      <Content />
    </AuthenticatedLayout>
  );
};
```

**Remember:** Every authenticated page MUST have the sidebar visible. Never create standalone pages for authenticated users.

---

## Database Migrations (CRITICAL - MANDATORY)

**ALWAYS verify database schema before writing migrations to ensure correctness and prevent errors.**

### Pre-Migration Checklist (REQUIRED)

Before writing ANY migration file, Claude MUST:

1. **Check Existing Schema** - Read relevant existing migration files to understand current state:
   ```bash
   # Check what tables/columns already exist
   - Read latest migrations in /backend/migrations/
   - Check for existing table definitions
   - Verify column names, types, and constraints
   ```

2. **Verify Dependencies** - Ensure referenced tables/columns exist:
   - Foreign key references must point to existing tables
   - Enum types must be created before use
   - Extension dependencies (uuid-ossp, etc.) must be enabled first

3. **Check for Conflicts** - Avoid duplicate definitions:
   - Don't create tables that already exist
   - Don't add columns that are already present
   - Don't recreate indexes or constraints

### Migration Writing Rules

**Structure Requirements:**
```sql
-- Migration: ###_descriptive_name.sql
-- Description: Clear description of what this migration does
-- Date: YYYY-MM-DD

-- ============================================================================
-- [SECTION NAME - e.g., CREATE TABLE, ADD COLUMNS, CREATE INDEXES]
-- ============================================================================

-- Clear comments explaining each major change

[SQL statements here]
```

**SQL Best Practices:**
1. **Use IF NOT EXISTS** where supported to make migrations idempotent:
   ```sql
   CREATE TABLE IF NOT EXISTS table_name (...);
   CREATE INDEX IF NOT EXISTS idx_name ON table (...);
   ```

2. **Check for existence** before altering:
   ```sql
   -- Add column only if it doesn't exist
   DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'users' AND column_name = 'new_field'
     ) THEN
       ALTER TABLE users ADD COLUMN new_field VARCHAR(255);
     END IF;
   END $$;
   ```

3. **Use transactions** for complex migrations:
   ```sql
   BEGIN;
     -- Multiple related changes
     [statements]
   COMMIT;
   ```

4. **Add proper constraints and indexes**:
   - NOT NULL where appropriate
   - Foreign key constraints with ON DELETE actions
   - Unique constraints for unique data
   - Indexes for frequently queried columns

5. **Use correct data types**:
   - UUID for IDs (with uuid_generate_v4())
   - TIMESTAMP WITH TIME ZONE for dates
   - DECIMAL for money/precision numbers
   - JSONB (not JSON) for JSON data
   - TEXT for unlimited strings
   - VARCHAR(n) only when length limit is needed

### Verification Steps (MANDATORY)

After writing a migration, Claude MUST:

1. **Review the SQL syntax** - Check for:
   - Typos in table/column names
   - Missing commas or parentheses
   - Correct PostgreSQL syntax
   - Proper constraint definitions

2. **Verify relationships** - Ensure:
   - Foreign keys reference existing columns
   - Referenced tables exist or are created earlier in migration
   - ON DELETE/ON UPDATE actions are appropriate

3. **Check RLS policies** - If table needs Row Level Security:
   - Enable RLS on the table
   - Create appropriate policies for different user roles
   - Test policies don't block legitimate access

4. **Consider rollback** - Can this migration be reversed?
   - Document how to rollback if needed
   - Create a rollback migration file if necessary

### Common Pitfalls to Avoid

❌ **DON'T:**
- Write migrations without checking existing schema
- Assume a table/column doesn't exist without verifying
- Use `ALTER TABLE` without checking if column exists
- Forget foreign key constraints
- Skip indexes on frequently queried columns
- Use `SERIAL` (use `UUID` with `uuid_generate_v4()` instead)

✅ **DO:**
- Read existing migrations first
- Use conditional creation (`IF NOT EXISTS`)
- Add comments explaining complex logic
- Keep migrations focused and atomic
- Test migrations can be applied cleanly
- Follow sequential numbering (###_description.sql)

### Migration Workflow

**Correct Process:**
```
1. User requests feature requiring DB changes
2. Claude reads relevant existing migration files
3. Claude identifies what needs to be added/changed
4. Claude writes migration with proper checks
5. Claude reviews SQL for correctness
6. Claude presents migration to user
7. User applies migration to database
```

**Example - Before Writing a Migration:**
```typescript
// User asks: "Add a reviews table"

// Claude MUST first:
// 1. Check if reviews table already exists
Read: backend/migrations/049_create_reviews_schema.sql (if exists)
Read: backend/migrations/ALL_MIGRATIONS.sql

// 2. Check what tables it needs to reference
Read: backend/migrations/033_create_bookings_schema.sql
Read: backend/migrations/032_create_rooms_schema.sql

// 3. Then write the migration with confidence that:
//    - The table doesn't already exist
//    - Foreign key references are valid
//    - The approach matches existing patterns
```

### When in Doubt

If unsure about database schema:
- **ASK the user** to verify table/column existence
- **Read multiple migration files** to understand patterns
- **Use information_schema queries** in migration to check state
- **Err on the side of conditional logic** (IF NOT EXISTS)

---

## Modern Coding Best Practices (MANDATORY)

### 1. Theming System (CRITICAL)
All UI code MUST use the centralized theming system. **Never hardcode colors.**

**Theme File Location**: `frontend/src/theme/`
```
frontend/src/theme/
  index.ts          # Main export
  colors.ts         # Color palette & utilities
  spacing.ts        # Spacing scale
  typography.ts     # Font sizes, weights
  shadows.ts        # Shadow definitions
  variants.ts       # Component variant configs
```

**Brand Colors (Locked)**:
- Primary: `#047857` (Brand Green)
- Neutral: Black (`#000000`) and White (`#FFFFFF`)
- Grays: Use Tailwind gray scale

**Usage Rules**:
```tsx
// CORRECT - Import from theme
import { colors, getStatusColor } from '@/theme/colors';

// WRONG - Never hardcode
className="bg-[#047857]"  // ❌ NO
className="bg-primary"     // ✅ YES (via Tailwind config)
```

### 2. Reusable Components (MANDATORY)
**Always check for existing components before creating new ones.**

**Component Location**: `frontend/src/components/`
```
frontend/src/components/
  ui/                    # Base UI primitives
    Button/
    Input/
    Card/
    Modal/
  forms/                 # Form-specific components
    FormField/
    Select/
    DatePicker/
  layout/                # Layout components
    Sidebar/
    Header/
    Container/
  features/              # Feature-specific components
    BookingCard/
    PropertyList/
```

**Component Structure (Required)**:
```
ComponentName/
  index.ts              # Barrel export
  ComponentName.tsx     # Main component
  ComponentName.types.ts # TypeScript interfaces
  ComponentName.test.tsx # Tests (optional)
```

### 3. Component Guidelines

**Props Interface Pattern**:
```tsx
// ComponentName.types.ts
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// ComponentName.tsx
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  children,
  onClick,
}) => { ... }
```

**Required Practices**:
1. **TypeScript interfaces** for all props (export them)
2. **Default values** for optional props
3. **Controlled pattern** for form components (`value` + `onChange`)
4. **Semantic HTML** with proper ARIA attributes
5. **Mobile-first** responsive design
6. **Theme-compliant** colors only

### 4. Code Reuse Checklist
Before writing ANY UI code, ask:

- [ ] Does a similar component already exist?
- [ ] Can an existing component be extended with a variant?
- [ ] Will this be used in more than one place? → Make it reusable
- [ ] Am I duplicating styling logic? → Extract to theme/utils

### 5. Tailwind CSS Standards

**Use Tailwind Config for Theming**:
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#047857',
        // All brand colors defined here
      },
    },
  },
}
```

**Utility Class Order** (for consistency):
1. Layout (flex, grid, position)
2. Sizing (w-, h-, p-, m-)
3. Typography (text-, font-)
4. Colors (bg-, text-, border-)
5. Effects (shadow-, opacity-)
6. States (hover:, focus:, active:)

### 6. No Inline Styles
```tsx
// WRONG
<div style={{ backgroundColor: '#047857' }}>  // ❌

// CORRECT
<div className="bg-primary">  // ✅
```

### 7. Extract Repeated Patterns
If you write the same Tailwind classes 3+ times, extract:

```tsx
// WRONG - Repeated everywhere
<button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
<button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">

// CORRECT - Use a component
<Button variant="primary">Click me</Button>
```

### 8. TypeScript Best Practices
- Use `interface` for props, `type` for unions/intersections
- Avoid `any` - use `unknown` or proper typing
- Use discriminated unions for complex state
- Export types alongside components

### 9. Form Submission Pattern (MANDATORY)

**Rule**: All forms with text inputs MUST have an explicit Save button. Only toggle/switch controls should save immediately upon change.

**Pattern to follow:**
```tsx
// 1. Collect form data in local state
const [formData, setFormData] = useState({...});
const [isSaving, setIsSaving] = useState(false);
const [hasChanges, setHasChanges] = useState(false);

// 2. Handle field changes - just update state, NO API call
const handleFieldChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  setHasChanges(true);
};

// 3. Submit ONLY on button click
const handleSubmit = async () => {
  setIsSaving(true);
  try {
    await service.update(id, formData);
    setHasChanges(false);
  } finally {
    setIsSaving(false);
  }
};

// 4. Each form section MUST have Cancel/Save buttons
<div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
  <Button variant="outline" onClick={handleCancel} disabled={!hasChanges}>
    Cancel
  </Button>
  <Button variant="primary" onClick={handleSubmit} disabled={!hasChanges} isLoading={isSaving}>
    Save Changes
  </Button>
</div>
```

**Exception - Instant save allowed for:**
- Toggle switches / Checkboxes (e.g., permission toggles, is_active switches)
- These use `useImmediateSave` hook and can show `SaveStatus` indicator

**DO NOT use auto-save patterns** (`useAutoSave`) for text input fields. Users expect to explicitly save their changes.

### 10. No Modal Pop-ups for Forms (MANDATORY)

**Rule**: NEVER use modal pop-ups for create or edit forms. Always use dedicated full pages.

**Why this matters:**
- Better user experience with more screen space
- Consistent navigation patterns
- Browser back button works as expected
- URL can be bookmarked/shared
- Mobile-friendly

**Pattern to follow:**
```
/entities           → List page (EntityListPage)
/entities/new       → Create page (CreateEntityPage)
/entities/:id       → Detail page (EntityDetailPage)
/entities/:id/edit  → Edit page (EditEntityPage)
```

**Implementation:**
1. Create separate page components for create and edit
2. Use the same form component for both (with `mode` prop: 'create' | 'edit')
3. Navigate to the page instead of opening a modal
4. Form component should follow AdminDetailLayout pattern like RoomWizard

**Example:**
```tsx
// List page - navigate instead of opening modal
const handleCreate = () => navigate('/addons/new');
const handleEdit = (addon: AddOn) => navigate(`/addons/${addon.id}/edit`);

// CreatePage and EditPage use the same form component
<AddonForm mode="create" ... />
<AddonForm mode="edit" addon={addon} ... />
```

**Exception - Modals are allowed ONLY for:**
- Confirmation dialogs (delete, cancel, discard changes)
- Quick actions that require no text input
- Preview/view-only content
- When explicitly requested by the user

---

## Quick Reference: Component Creation Checklist

When creating a new component:
1. [ ] Check if similar component exists
2. [ ] Create in correct directory (`ui/`, `forms/`, `layout/`, `features/`)
3. [ ] Create folder structure (index.ts, Component.tsx, Component.types.ts)
4. [ ] Define and export TypeScript interface
5. [ ] Use theme colors only (no hardcoded values)
6. [ ] Add proper default props
7. [ ] Include ARIA attributes for accessibility
8. [ ] Make responsive (mobile-first)
9. [ ] Export from barrel file
