import React from "react";
import "./App.css";
import Home from "./pages/Home";
import StatusPage from "./pages/StatusPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <Router>
      <Routes>
        <Route path="/" element={<Home />} />
         <Route path="/status" element={<StatusPage />} />
        {/* Add more routes here */}
      </Routes>
    </Router>
    </>
  );
}

export default App;
