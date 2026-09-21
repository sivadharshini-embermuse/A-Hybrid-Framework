import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../supabaseClient";
import "./Home.css"

function AdminDashboard() {

  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const nowIST = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const todayStr = new Date(nowIST).toISOString().split("T")[0];

        // Fetch today's entries
        const { data: entries, error } = await supabase
          .from('entry')
          .select('*')
          .eq('date_', todayStr);

        if (error) throw error;

        const uniqueStudents = new Set(entries.map(e => e.reg_no)).size;
        const activeStudents = entries.filter(e => !e.out_time).length;
        const totalCheckouts = entries.filter(e => e.out_time).length;

        // Calculate Average Usage Time
        let totalMs = 0;
        let checkoutCount = 0;
        entries.forEach(e => {
          if (e.total_time) {
            const parts = e.total_time.split(':');
            totalMs += (parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])) * 1000;
            checkoutCount++;
          }
        });
        
        let avgStr = "00:00:00";
        if (checkoutCount > 0) {
          const avgMs = totalMs / checkoutCount;
          avgStr = new Date(avgMs).toISOString().substring(11, 19);
        }

        // Most Used Systems
        const systemCount = {};
        entries.forEach(e => {
          systemCount[e.system_no] = (systemCount[e.system_no] || 0) + 1;
        });

        const sortedSystems = Object.entries(systemCount)
          .map(([sys, count]) => ({ system_no: sys, system_usage: count }))
          .sort((a, b) => b.system_usage - a.system_usage)
          .slice(0, 5); // top 5

        setData({
          studentsToday: uniqueStudents,
          activeStudents,
          totalCheckouts,
          averageUsage: avgStr,
          systems: sortedSystems
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
  }, []);

  const downloadExcel = async () => {
    try {
      const { data: allEntries, error } = await supabase
        .from('entry')
        .select('id, date_, name, reg_no, system_no, in_time, out_time, total_time')
        .order('id', { ascending: true });

      if (error) throw error;

      // Format dates for better readability
      const formattedData = allEntries.map(e => ({
        ...e,
        in_time: new Date(e.in_time).toLocaleString(),
        out_time: e.out_time ? new Date(e.out_time).toLocaleString() : 'Active'
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Entries");
      XLSX.writeFile(workbook, "Attendance_Report.xlsx");

    } catch (err) {
      console.error("Error downloading excel:", err);
      alert("Failed to download excel.");
    }
  };

  if (!data) return <h2>Loading...</h2>;

  return (
    <div className="admin-dsb">
      <h1 className="deptname">Lab Analytics Dashboard</h1>
      <p>Students Today: {data.studentsToday}</p>
      <p>Currently in Lab: {data.activeStudents}</p>
      <p>Total Checkouts: {data.totalCheckouts}</p>
      <p>Average Usage Time: {data.averageUsage}</p>
      
      <h2>Most Used Systems</h2>
      {data.systems.length > 0 ? (
        data.systems.map(sys => (
          <p key={sys.system_no}>
            {sys.system_no} : {sys.system_usage}
          </p>
        ))
      ) : (
        <p>No usage data for today.</p>
      )}

      <button onClick={downloadExcel} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
        Download All Entries (Excel)
      </button>

    </div>
  );
}

export default AdminDashboard;