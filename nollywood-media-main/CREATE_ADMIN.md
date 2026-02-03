# Creating Your First Admin Account

To access the admin dashboard at `/admin`, you need to create an admin user. Follow these steps:

## Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Create a new user via authentication and assign admin role:

```sql
-- First, sign up a user through the app UI at http://localhost:5173
-- Then find their user_id and run this:

-- Replace 'USER_ID_HERE' with the actual user ID from auth.users table
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

## Option 2: Quick Admin Setup

1. Sign up for an account through the website (http://localhost:5173)
2. Go to Supabase Dashboard → **Authentication** → **Users**
3. Copy your User ID
4. Go to **SQL Editor** and run:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('PASTE_YOUR_USER_ID_HERE', 'admin');
```

5. Refresh the website and you should see the "Admin Dashboard" option in your user menu

## Verify Admin Access

Once you've created an admin user:

1. Sign out and sign in again with your admin account
2. Click your profile icon in the top right
3. You should see "Admin Dashboard" option
4. Click it to access `/admin`

## Default User Roles

- **user**: Regular user with access to browse and watch content
- **admin**: Can manage films, users, and view analytics
- **super_admin**: Full access to all admin features

## Troubleshooting

If you don't see the Admin Dashboard option:

1. Make sure you're signed in
2. Check that the user_roles table has your user_id with role='admin'
3. Try signing out and signing in again
4. Check the browser console for any errors

## Next Steps

Once you have admin access:

1. Go to `/admin/films` to start adding content to your catalog
2. Go to `/admin/users` to manage user roles
3. The films you add will immediately appear on the frontend
