import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./routes/AppRouter";
import { AppProvider } from "./providers/AppProvider";
import { Toaster } from "sonner";

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRouter></AppRouter>
        <Toaster richColors position="top-right"></Toaster>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
