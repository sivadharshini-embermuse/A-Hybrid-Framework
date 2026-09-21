import { useState } from "react";
import "./Home.css"
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { supabase } from "../supabaseClient";

function UploadStudents() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setLoading(true);

    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(new Uint8Array(event.target.result));
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
      });

      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const json = XLSX.utils.sheet_to_json(worksheet);

      const students = json.map(row => {
        let rNo = row.reg_no || row.RegisterNumber || row['Reg No'] || Object.values(row)[0];
        let sName = row.student_name || row.StudentName || row['Name'] || Object.values(row)[1];
        
        return {
          reg_no: String(rNo).trim(),
          student_name: String(sName).trim()
        };
      });

      const { error } = await supabase
        .from('student')
        .upsert(students, { onConflict: 'reg_no' });

      if (error) {
        console.error("Supabase Error:", error);
        throw new Error(error.message);
      }

      alert(`Successfully uploaded ${students.length} students!`);
      setFile(null);
    } catch (error) {
      console.error("Error uploading students:", error);
      alert("Failed to upload students: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="uploading">
      <h2 className="deptname">Upload Student Excel</h2>

      <form onSubmit={handleUpload} className="ooo">
        <input 
          className="inputseting" 
          type="file" 
          accept=".xlsx,.csv" 
          onChange={(e) => setFile(e.target.files[0])}
          required 
        />
        <br /><br />
        <div className="buttonkacenter">
          <button className="buttonuu" type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </form>
      
      <hr style={{ margin: "30px 0" }} />
      <button 
        onClick={() => navigate("/admin")}
        className="dashboard-btn"
      >
        View Admin Dashboard
      </button>
    </div>
  );
}

export default UploadStudents;
