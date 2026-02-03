# Admin Account Setup

## Current Admin Accounts

### 1. bitrus@gadzama.com
- **Status**: ✅ Active Admin
- **Password**: admin00 (update via Supabase Authentication dashboard)
- **Role**: Admin
- **Setup**: Completed via database

### 2. admin@admin.com
- **Status**: ⏳ Needs to be created
- **Password**: admin00
- **Role**: Admin

## To Create admin@admin.com Account

1. Go to the website homepage
2. Click "Sign Up" in the header
3. Enter:
   - Email: `admin@admin.com`
   - Password: `admin00`
4. Click "Create Account"
5. The account will be created (email verification may be required depending on Supabase settings)
6. Once created, run this SQL in Supabase to make it an admin:

```sql
-- Find the user ID first
SELECT id, email FROM auth.users WHERE email = 'admin@admin.com';

-- Then add admin role (replace USER_ID with the actual ID from above)
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

Or if you have access to Supabase Auth Admin API, you can create the user directly:

```sql
-- This requires admin privileges in Supabase dashboard
-- Go to Authentication > Users > Invite User
-- Email: admin@admin.com
-- Then set password and add admin role as shown above
```

## Quick Admin Role Assignment

To make any existing user an admin, use this query:

```sql
-- Replace with actual user email
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'user@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

## Verifying Admin Access

After setting up admin accounts:
1. Sign in with the admin credentials
2. You should be automatically redirected to `/admin`
3. Check that "Admin Dashboard" appears in the user menu
4. Verify access to all admin pages (Films, Users, Analytics, Settings)
