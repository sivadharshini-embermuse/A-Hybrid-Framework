import "./App.css";
import Home from "./pages/Home";
import StatusPage from "./pages/StatusPage";
import UploadStudents from "./pages/UploadStudents";
import AdminDashboard from "./pages/AdminDashboard";

import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className="app-bg">
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/upload" element={<UploadStudents />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}

export default App;
