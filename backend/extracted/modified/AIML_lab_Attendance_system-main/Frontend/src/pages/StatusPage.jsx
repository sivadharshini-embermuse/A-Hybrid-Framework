import { useEffect } from "react";
import profile from "../assets/greentik.png";
import { useLocation, useNavigate } from "react-router-dom";
import "./Home.css"
function StatusPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, status, number, ttime } = location.state || {};

  const time = new Date().toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="status-bg">
        <figure className="lll">
          <img src={profile} className="avatar" alt="avatar" />
        </figure>
        <div className="StatusBox">
          <h1 className="entrytime">Entry time: {time}</h1>
          <h1 className="status">
            Name: <span className="student">{name}-{number}</span><br />
            <span id="status">{status}</span>
          </h1>
          <h1>{ttime}</h1>
        </div>
    </div>
  );
}

export default StatusPage;
