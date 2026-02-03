/*
  # Fix Films Table RLS Policies

  1. Changes
    - Drop existing incomplete INSERT policy for films
    - Create new INSERT policy with proper WITH CHECK clause for admins
    - Ensure only authenticated admins can insert films
    
  2. Security
    - Restricts film insertion to admin and super_admin roles only
    - Checks user_roles table for proper authorization
*/

-- Drop the incomplete policy
DROP POLICY IF EXISTS "Admins can insert films" ON films;

-- Create proper INSERT policy with WITH CHECK
CREATE POLICY "Admins can insert films"
  ON films
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );
