const db= require("../config/db")
exports.enrtry=async (req,res)=>{
    const regNumber = req.body.regNumber;
    console.log(`reg: ${regNumber}`)
    // 1. Find student
  const [student] = await db.query(
    'SELECT student_name FROM student WHERE reg_no = ?',
    [regNumber]
  );
  if (student.length!==0) {
    console.log("name: ",student[0].student_name)
}
else return res.status(500).send("student not found");

  // 2. Check today's attendance
  const [attendance] = await db.query(
    'SELECT * FROM entry where Date_=curdate() and in_time=(select max(in_time) from entry where reg_no=? and Date_=curdate())',
    [regNumber]
  );
//   console.log("attendance:",attendance[0].in_time!==null)
  if (attendance.length===0 ||  attendance[0].out_time!==null) {
    // 3. Check-in
    await db.query(
      'INSERT INTO entry (reg_no, in_time, Date_) VALUES (?, NOW(), CURDATE())',
      [regNumber]
    );
    console.log("checkin")
    return res.json({"name":student[0].student_name,"status":"checkin","regNumber":regNumber});
  }
  if (!attendance[0].out_time) {
    // 4. Check-out
    const outTime = new Date();

// Extract today's date in YYYY-MM-DD format
const todayDateStr = outTime.toISOString().split('T')[0]; 

// Combine with in_time from DB
const inTimeStr = `${todayDateStr}T${attendance[0].in_time}`; 

// Create valid Date object
const inTime = new Date(inTimeStr);

// Validate inTime
if (isNaN(inTime.getTime())) {
  console.error("Invalid in_time:", attendance[0].in_time);
  return res.status(400).json({ error: "Invalid in_time format from DB" });
}

// Calculate total time
    const totalTimeMs = outTime - inTime;
    const totalTime = new Date(totalTimeMs).toISOString().substr(11, 8);
    console.log("checkout")
    console.log(`current date:${outTime}, in-time=${inTime},diff=${totalTimeMs}`)
    await db.query(
      'UPDATE entry SET out_time = ?,total_time=? where Date_=curdate() and out_time is null and reg_no=?',
      [outTime,totalTime, regNumber]
    );
    return res.json({"name":student[0].student_name,"status":"check-out","regNumber":regNumber,"totaltime":totalTime});
  }
}