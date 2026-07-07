import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterForm from "./components/RegisterForm";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Layout do Header Decorativo e Efeitos de Brilho no Background */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "linear-gradient(90deg, var(--primary) 0%, var(--secondary) 50%, var(--accent) 100%)", zIndex: 100 }} />
        
        <main style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 10 }}>
          <Routes>
            <Route path="/" element={<RegisterForm />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
