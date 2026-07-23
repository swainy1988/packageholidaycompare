// ======================================================
// PackageHolidayCompare
// Supabase Connection
// ======================================================

const SUPABASE_URL =
"https://lezietramgfhjhgkyeyf.supabase.co";

const SUPABASE_ANON_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlemlldHJhbWdmaGpoZ2t5ZXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTE4NzAsImV4cCI6MjA5OTYyNzg3MH0.OqCNR82awUNVndL_xy3tXvO67xwMXTEc2JBNW-0Ve6U";

window.db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log("✅ PackageHolidayCompare connected to Supabase");