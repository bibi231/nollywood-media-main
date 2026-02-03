/*
  # Fix Infinite Recursion in user_roles RLS Policies

  1. Problem
    - Current policies query user_roles table to check admin status
    - This creates infinite recursion when checking permissions
    
  2. Solution
    - Create a security definer function that bypasses RLS
    - Use this function in policies to safely check admin status
    
  3. Changes
    - Drop existing problematic policies
    - Create helper function to check if user is admin
    - Recreate policies using the helper function
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;

-- Create a security definer function to check admin status
-- This function runs with the privileges of the function owner, bypassing RLS
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles
    WHERE user_id = user_uuid
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- Recreate policies using the helper function
CREATE POLICY "Admins can read all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));
