// importujemo strictmode(provera zastarelih delova koda u aplikaciji),createroot(pokretanje),index(stil),
// app i browser router.
import { StrictMode } from "react"; 
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";

// pokrecemo aplikaciju
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);