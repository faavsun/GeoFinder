// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Tu URL y clave pública
const supabaseUrl = 'https://krltlhmaimttyxpbvexn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybHRsaG1haW10dHl4cGJ2ZXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MTg2NzUsImV4cCI6MjA2NDI5NDY3NX0.nnOIU57EWpMqyaGVNtnWnCsJC0xM-QO4Ie77_AbBw2E'; 

export const supabase = createClient(supabaseUrl, supabaseKey);
