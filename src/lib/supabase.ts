import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hsnknwvcjpglsypwpngb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzbmtud3ZjanBnbHN5cHdwbmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NTI4NzUsImV4cCI6MjEwMTUyODg3NX0.6wGFJ2p5o08fx6G6CpsHTSIHgcMYj03SgL8kphaFZCM'; // Apni key yahan rakhein

export const supabase = createClient(supabaseUrl, supabaseAnonKey);