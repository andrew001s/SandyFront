import { StatusProvider } from "./context/StatusContext";
import Home from "./pages/home/home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TwitchCallback } from "./pages/auth/callback";

function App() {
  return (
    <StatusProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/callback" element={<TwitchCallback />} />
        </Routes>
      </Router>
    </StatusProvider>
  );
}

export default App;
