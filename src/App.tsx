import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { AppProvider } from "./providers/AppProvider";
import { AppRouter } from "./routes/AppRouter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster richColors position="top-right" closeButton />
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
