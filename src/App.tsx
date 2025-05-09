import { StatusProvider } from "./context/StatusContext";
import Home from "./pages/home/home";

function App() {
  return (
    <StatusProvider>
      <Home />
    </StatusProvider>
  );
}

export default App;
