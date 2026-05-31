import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ftxexhdigckykgwcurzx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eGV4aGRpZ2NreWtnd2N1cnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDUzNjEsImV4cCI6MjA5NDEyMTM2MX0.P5H3-1FvAeXJFeFOrfHIXxQGHt29raiYoe1tj82YIvA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('historico').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  const dups = data.filter(d => 
    d.posicao === 1 && 
    d.turno === 'TN' && 
    d.data_troca.includes('2026-05-30')
  );
  
  console.log("Found matching records:");
  console.log(dups);

  const toDelete = dups.find(d => d.obs_motivo === 'Desgaste');
  
  if (toDelete) {
    console.log("Deleting record with ID:", toDelete.id);
    const { error: delErr } = await supabase.from('historico').delete().eq('id', toDelete.id);
    if (delErr) console.error("Error deleting:", delErr);
    else console.log("Deleted successfully.");
  } else {
    console.log("No record found with obs_motivo === 'Desgaste'");
  }
}

run();
