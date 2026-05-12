import { createClient } from '@supabase/supabase-js';

// Usando o URL extraído da sua string de conexão Postgres
const supabaseUrl = 'https://ftxexhdigckykgwcurzx.supabase.co';
// Usando a chave pública (anon) correta
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eGV4aGRpZ2NreWtnd2N1cnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDUzNjEsImV4cCI6MjA5NDEyMTM2MX0.P5H3-1FvAeXJFeFOrfHIXxQGHt29raiYoe1tj82YIvA';

export const supabase = createClient(supabaseUrl, supabaseKey);
