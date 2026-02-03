-- Add Admin Role for User
-- Run this in your Supabase SQL Editor

-- First, get your user ID from the auth.users table by email
-- Then insert/update your admin role

-- Option 1: If you know your user_id (UUID), use this:
-- Replace 'YOUR_USER_ID_HERE' with your actual UUID from auth.users table
INSERT INTO user_roles (user_id, role, created_at)
VALUES ('peterjohn2343@gmail.com', 'admin', NOW())
ON CONFLICT (user_id) DO UPDATE 
SET role = 'admin';

-- Option 2: Query to verify the role was set
SELECT * FROM user_roles 
WHERE user_id = 'peterjohn2343@gmail.com' 
AND role = 'admin';

-- Option 3: If the above doesn't work because user_id is not email,
-- first find your actual user_id:
-- SELECT id, email FROM auth.users WHERE email = 'peterjohn2343@gmail.com';
-- Then use that UUID in Option 1 instead

-- Option 4: Add admin role for multiple users (if needed)
-- INSERT INTO user_roles (user_id, role, created_at)
-- VALUES 
--   ('user-uuid-1', 'admin', NOW()),
--   ('user-uuid-2', 'moderator', NOW())
-- ON CONFLICT (user_id) DO UPDATE 
-- SET role = EXCLUDED.role;
