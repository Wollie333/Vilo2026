# Backend Signup Logging - Summary

## What Was Added

Added detailed console logging to the signup flow in `backend/src/services/auth.service.ts` to track every step of the user registration process.

## Log Output Format

When a user signs up, you'll now see this in your backend console:

### Successful Signup Flow

```
=== SIGNUP STARTED ===
Email: user@example.com
Full Name: John Doe
Phone: +27 21 123 4567

Step 1: Checking if email already exists in public.users...
✓ Email not found in public.users

Step 2: Creating auth user in auth.users...
✓ Auth user created successfully: 1c1bfb58-08a2-4b0d-832b-dca3a15748e4

Step 3: Creating user profile in public.users...
✓ User profile created successfully

Step 4: Assigning user type...
Querying user_types table for category="customer"...
User type query result: {
  customerType: { id: '2dc47fa2-441d-4898-bec5-48920b4968ed', name: 'guest', category: 'customer' },
  typeError: null
}
Found customer user type: guest (2dc47fa2-441d-4898-bec5-48920b4968ed)
Updating user record with user_type_id...
✓ Auto-assigned customer user type to user 1c1bfb58-08a2-4b0d-832b-dca3a15748e4

Step 5: Signing in user to create session...
✓ User signed in successfully
=== SIGNUP COMPLETED SUCCESSFULLY ===
User ID: 1c1bfb58-08a2-4b0d-832b-dca3a15748e4
Email: user@example.com
Session created: true
```

### Failed Signup - Email Exists in public.users

```
=== SIGNUP STARTED ===
Email: admin@vilo.com
Full Name: Test User
Phone: not provided

Step 1: Checking if email already exists in public.users...
❌ Email already exists in public.users: 5e7f9a1b-2c3d-4e5f-6a7b-8c9d0e1f2a3b
```

### Failed Signup - No Customer User Type

```
=== SIGNUP STARTED ===
Email: newuser@example.com
Full Name: New User
Phone: not provided

Step 1: Checking if email already exists in public.users...
✓ Email not found in public.users

Step 2: Creating auth user in auth.users...
✓ Auth user created successfully: abc123...

Step 3: Creating user profile in public.users...
✓ User profile created successfully

Step 4: Assigning user type...
Querying user_types table for category="customer"...
User type query result: { customerType: null, typeError: { code: 'PGRST116', message: '...' } }
❌ No customer user type found - user created without user_type_id
❌ Failed to auto-assign user type: Error: User type configuration error...
Rolling back: Deleting auth user and profile...
```

### Failed Signup - Profile Creation Error

```
=== SIGNUP STARTED ===
Email: test@example.com
Full Name: Test
Phone: not provided

Step 1: Checking if email already exists in public.users...
✓ Email not found in public.users

Step 2: Creating auth user in auth.users...
✓ Auth user created successfully: xyz789...

Step 3: Creating user profile in public.users...
❌ Profile creation error: { code: '23502', message: 'null value in column "user_type_id"...' }
Rolling back: Deleting auth user...
```

## What Each Step Does

### Step 1: Email Check
- **Purpose**: Prevent duplicate emails in public.users
- **Success**: Email not found, proceed
- **Failure**: Email exists, throw error immediately

### Step 2: Auth User Creation
- **Purpose**: Create Supabase auth record in auth.users
- **Success**: Returns user ID
- **Failure**: Usually means email exists in auth.users or password too weak

### Step 3: Profile Creation
- **Purpose**: Create user record in public.users table
- **Success**: Profile created
- **Failure**: Usually constraint violations (missing required fields)
- **Rollback**: Deletes auth user if this fails

### Step 4: User Type Assignment
- **Purpose**: Assign default 'guest' user type (required by database)
- **Query**: Looks for user_type with category='customer'
- **Success**: Updates user_type_id column
- **Failure**: No customer type found or update failed
- **Rollback**: Deletes auth user and profile if this fails

### Step 5: Auto-Login
- **Purpose**: Sign in the newly created user
- **Success**: Returns session for immediate authentication
- **Failure**: User created but can't auto-login (rare)

## How to Use This

### 1. View Logs
Watch your backend terminal where `npm run dev` is running. All signup attempts will show detailed logs.

### 2. Debug Issues
If signup fails, check the logs to see exactly which step failed and why.

### 3. Common Issues

**"Email already exists"**
- Look for: `❌ Email already exists in public.users:`
- Solution: User already signed up, use different email or login

**"Failed to create user profile"**
- Look for: `❌ Profile creation error:`
- Check: What constraint is violated
- Common: `user_type_id` cannot be null

**"No customer user type found"**
- Look for: `❌ No customer user type found`
- Look for: `User type query result: { customerType: null, ... }`
- Solution: Run `FIX_GUEST_USER_TYPE_CORRECT.sql`

## Files Modified

- `backend/src/services/auth.service.ts` - Added console.log statements at every step

## Testing

1. **Restart backend server** (changes won't apply until restart)
   ```bash
   # In backend terminal, press Ctrl+C
   npm run dev
   ```

2. **Try signing up** - Watch the terminal for detailed logs

3. **Check each step** - Verify all steps complete with ✓ marks

## Next Steps

After restarting the backend:
1. Go to `/pricing`
2. Click "Subscribe Now"
3. Fill out signup form
4. Watch your backend terminal for detailed logs
5. Report any step that shows ❌ instead of ✓

---

**Status**: Logging complete ✓
**Action Required**: Restart backend server to apply changes
