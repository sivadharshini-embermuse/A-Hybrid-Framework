import { useState, useEffect } from "react";
import "./Home.css" 
import { useNavigate } from "react-router-dom";
import ifet_logo from "../assets/IFET Logo.png";
import AICC_logo from "../assets/AICC-logos_transparent-removebg-preview.png";
import { supabase } from "../supabaseClient";


const Home = () => {
  const navigate =useNavigate();

  const [labname, setLabname] = useState("");

  useEffect(() => {
    // Replaced backend /home fetch with static state
    setLabname("Machine Learning");
  }, []);


    const [regNumber, setRegNumber] = useState(""); 
    const [regHistory, setRegHistory] = useState([]);
    const [systemNo, setSystemNo] = useState("");
    const systems = ["PC-01", "PC-02", "PC-03", "PC-04", "PC-05", "PC-06", "PC-07", "PC-08", "PC-09", "PC-10", "PC-11", "PC-12", "PC-13", "PC-14", "PC-15", "PC-16", "PC-17", "PC-18", "PC-19", "PC-20", "PC-21", "PC-22", "PC-23", "PC-24", "PC-25", "PC-26", "PC-27", "PC-28", "PC-29", "PC-30", "PC-31", "PC-32", "PC-33", "PC-34", "PC-35", "PC-36", "PC-37", "PC-38", "PC-39", "PC-40", "PC-41", "PC-42", "PC-43", "PC-44", "PC-45", "PC-46", "PC-47", "PC-48", "PC-49", "PC-50", "PC-51", "PC-52", "PC-53", "PC-54", "PC-55", "PC-56", "PC-57", "PC-58", "PC-59", "PC-60", "PC-61", "PC-62", "PC-63", "PC-64", "PC-65", "PC-66", "PC-67", "PC-68", "PC-69", "PC-70", "PC-71", "PC-72", "PC-73", "PC-74", "PC-75", "PC-76", "PC-77", "PC-78", "PC-79", "PC-80", "PC-81", "PC-82", "PC-83", "PC-84", "PC-85", "PC-86", "PC-87", "PC-88", "PC-89", "PC-90", "PC-91", "PC-92", "PC-93", "PC-94", "PC-95", "PC-96", "PC-97", "PC-98", "PC-99", "PC-100"];
    
    const handleSubmit = async (e) => {
      e.preventDefault();

      try {
        const trimmedRegNumber = String(regNumber).trim();
        const { data: student, error: studentError } = await supabase
          .from('student')
          .select('student_name')
          .eq('reg_no', trimmedRegNumber)
          .maybeSingle();

        if (studentError) throw studentError;
        
        if (!student) {
          alert("Student not found!");
          return;
        }

        const { data: openEntry } = await supabase
          .from('entry')
          .select('*')
          .eq('reg_no', trimmedRegNumber)
          .eq('system_no', systemNo)
          .is('out_time', null)
          .limit(1)
          .maybeSingle();

        const nowIST = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const currentDate = new Date(nowIST);

        if (!openEntry) {
          // CHECK-IN
          const { error: insertError } = await supabase
            .from('entry')
            .insert({
              reg_no: trimmedRegNumber,
              name: student.student_name,
              system_no: systemNo,
              in_time: currentDate.toISOString(),
              date_: currentDate.toISOString().split("T")[0]
            });
            
          if(insertError) throw insertError;

          navigate("/status", { state: { name: student.student_name, status: "Check-in", number: trimmedRegNumber, ttime: null } });
        } else {
          // CHECK-OUT
          const inTime = new Date(openEntry.in_time);
          const diffMs = currentDate - inTime;
          // Format ms to HH:mm:ss
          const totalTime = new Date(diffMs).toISOString().substring(11, 19);

          const { error: updateError } = await supabase
            .from('entry')
            .update({
              out_time: currentDate.toISOString(),
              total_time: totalTime
            })
            .eq('id', openEntry.id);
            
          if(updateError) throw updateError;

          navigate("/status", { state: { name: student.student_name, status: "Check-out", number: trimmedRegNumber, ttime: totalTime } });
        }

        setRegHistory(prev => prev.includes(trimmedRegNumber) ? prev : [...prev, trimmedRegNumber]);

      } catch (error) {
        console.error("Error:", error);
        alert("Error during check-in/out: " + error.message);
      }
    };
    return (
      <div className="background-papre">
        <main className="background-blue"> 
          <section>
            <div className="section1">
              <h1 className="deptname">Department of Artificial intelligence and Machine learning</h1>
              <h2 className="deptname">Attendance Register</h2>
              <figure className="three-clm">
                <img src={ifet_logo} alt="IFET logo" height="200px" />
                <section className="reg">
                  <form onSubmit={handleSubmit} className="form-bg">
                    <h1 className="head">Enter your Register number</h1>
                    <input
                      type="text"
                      value={regNumber}
                      minLength={12}
                      onChange={(e) => setRegNumber(e.target.value)}
                      list="reg-history"
                      placeholder="Register Number: (e.g.,421123107047)"
                      className="input-box"
                      required
                    />
                    <datalist id="reg-history">
                      {regHistory.map((reg, index) => (
                        <option key={index} value={reg} />
                      ))}
                    </datalist>

                    <select
                      value={systemNo}
                      onChange={(e) => setSystemNo(e.target.value)}
                      className="selection-box"
                      required
                    >
                      <option value="">Select System Number</option>

                      {systems.map(sys => (
                        <option
                          key={sys}
                          value={sys}
                        >
                          {sys}
                        </option>
                      ))}
                    </select>
                    <br />
                    <button className="subit" type="submit">Submit</button>
                  </form>
                </section>
                <img src={AICC_logo} alt="AICC logo" height="200px" />
              </figure>
            </div>
          </section>

          <div className="butoon">
          <button 
            className="Documents-btn"
            onClick={() => navigate("/upload")}>
            <span className="folderContainer">
              <svg
                className="fileBack"
                width="146"
                height="113"
                viewBox="0 0 146 113"

                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 4C0 1.79086 1.79086 0 4 0H50.3802C51.8285 0 53.2056 0.627965 54.1553 1.72142L64.3303 13.4371C65.2799 14.5306 66.657 15.1585 68.1053 15.1585H141.509C143.718 15.1585 145.509 16.9494 145.509 19.1585V109C145.509 111.209 143.718 113 141.509 113H3.99999C1.79085 113 0 111.209 0 109V4Z"
                  fill="url(#paint0_linear_117_4)"
                ></path>
                <defs>
                  <linearGradient
                    id="paint0_linear_117_4"
                    x1="0"
                    y1="0"
                    x2="72.93"
                    y2="95.4804"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#4abaf1"></stop>
                    <stop offset="1" stop-color="#7ecaf6"></stop>
                  </linearGradient>
                </defs>
              </svg>
              <svg
                class="filePage"
                width="88"
                height="99"
                viewBox="0 0 88 99"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="88" height="99" fill="url(#paint0_linear_117_6)"></rect>
                <defs>
                  <linearGradient
                    id="paint0_linear_117_6"
                    x1="0"
                    y1="0"
                    x2="81"
                    y2="160.5"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="white"></stop>
                    <stop offset="1" stop-color="#686868"></stop>
                  </linearGradient>
                </defs>
              </svg>

              <svg
                class="fileFront"
                width="160"
                height="79"
                viewBox="0 0 160 79"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0.29306 12.2478C0.133905 9.38186 2.41499 6.97059 5.28537 6.97059H30.419H58.1902C59.5751 6.97059 60.9288 6.55982 62.0802 5.79025L68.977 1.18034C70.1283 0.410771 71.482 0 72.8669 0H77H155.462C157.87 0 159.733 2.1129 159.43 4.50232L150.443 75.5023C150.19 77.5013 148.489 79 146.474 79H7.78403C5.66106 79 3.9079 77.3415 3.79019 75.2218L0.29306 12.2478Z"
                  fill="url(#paint0_linear_117_5)"
                ></path>
                <defs>
                  <linearGradient
                    id="paint0_linear_117_5"
                    x1="38.7619"
                    y1="8.71323"
                    x2="66.9106"
                    y2="82.8317"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#40b3e9"></stop>
                    <stop offset="1" stop-color="#47d8f1"></stop>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <p class="text">upload Files</p>
          </button>

          </div>
        </main>
      </div>
    );
  };

export default Home;
