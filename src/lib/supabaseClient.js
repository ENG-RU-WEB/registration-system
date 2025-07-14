import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hzsxahbtufjidtwpfvrd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6c3hhaGJ0dWZqaWR0d3BmdnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDQzNjMsImV4cCI6MjA2NzIyMDM2M30.dr7VfbSek7uj5brp8iMPIAOqmQkTCDDBEW9FMBKxBxQ'
export const supabase = createClient(supabaseUrl, supabaseKey)
