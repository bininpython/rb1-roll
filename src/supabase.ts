import { createClient } from '@supabase/supabase-js';

// Usando o URL extraído da sua string de conexão Postgres
const supabaseUrl = 'https://ftxexhdigckykgwcurzx.supabase.co';
// Usando a chave pública que você informou
const supabaseKey = 'sb_publishable_uISv5tu4ciytCpoSWvXmAg_KT3T2cjM';

export const supabase = createClient(supabaseUrl, supabaseKey);
