import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://swcomyfybmycgyklzdcp.supabase.co";
const supabaseAnonKey = "sb_publishable_f2XouLnrpbTRmZOR1T2iFg_cUK1hYQa";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const regNumber = "421123107047";
  console.log("Checking for regNumber:", regNumber);
  
  const { data: student, error: studentError } = await supabase
    .from('student')
    .select('student_name')
    .eq('reg_no', regNumber)
    .maybeSingle();

  console.log("Student Data:", student);
  console.log("Student Error:", studentError);
}

test();
