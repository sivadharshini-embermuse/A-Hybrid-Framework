import { useEffect } from "react";
import batman from "../assets/batman.png"
import { useLocation, useNavigate } from "react-router-dom";
function formatTime(number) {
    return number < 10 ? '0' + number : number;
}
var now = new Date();
var hours = formatTime(now.getHours());
var minutes = formatTime(now.getMinutes());
var seconds = formatTime(now.getSeconds());
var time=`${hours}:${minutes}:${seconds}`
function StatusPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, status,number,ttime } = location.state || {};
  console.log({'name':name,"status":status,"ttime":ttime
    
  });

    useEffect(() => {
      const timer = setTimeout(() => {
        navigate("/");
      }, 3000);

      return () => clearTimeout(timer);
    }, [navigate]);

  return (
    <div>
      <main>
        <figure>
            <img src={batman} className="avatar" alt="avatar"/>
        </figure>
      <div className="StatusBox">
      <h1 className="entrytime">Entry time: {time}</h1>
      <h1 className="status">Person: <span className="student">{name }-{number}</span><br /> <span id="status">{status}</span></h1>
      <h1>{
        ttime
        }</h1>
      </div>
      </main>
    </div>
  );
}

export default StatusPage;
