import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./routes/AppRouter";
import { AppProvider } from "./providers/AppProvider";

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRouter></AppRouter>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
