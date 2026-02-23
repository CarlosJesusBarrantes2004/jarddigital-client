import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import { AppProvider } from "./providers/AppProvider";
import { AppRouter } from "./routes/AppRouter";

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRouter />
        <Toaster richColors position="top-right" closeButton />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
