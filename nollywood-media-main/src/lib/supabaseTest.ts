/**
 * SUPABASE CONNECTION TEST
 * Run this in browser console to diagnose auth issues
 */

import { supabase } from '@/lib/supabase';

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...');
  
  try {
    // Test 1: Check if we can reach Supabase
    console.log('📡 Test 1: Checking Supabase URL...');
    const response = await fetch('https://uwoubrqimjhfdoobpozncr.supabase.co/rest/v1/', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3b3VicWltamhmZG9icG96bmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyOTIyNzYsImV4cCI6MjA4Mzg2ODI3Nn0.KwKYEJ6EPpw5WSFjGevF1SWZx_XQ0wLHmhrwT18yFXg',
      }
    });
    console.log('✅ Supabase URL reachable:', response.status);
    
    // Test 2: Try health check
    console.log('📡 Test 2: Health check...');
    const health = await supabase.from('user_profiles').select('count()', { count: 'exact', head: true });
    console.log('✅ Health check result:', health);
    
    // Test 3: Check auth state
    console.log('📡 Test 3: Checking auth state...');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('✅ Current session:', session);
    
  } catch (err: any) {
    console.error('❌ Connection Error:', err);
    console.error('Error details:', {
      message: err.message,
      status: err.status,
      code: err.code,
    });
  }
}

// Run in console: testSupabaseConnection()
