// react router za navigaciju i importujemo stranice make i show materials
import { Routes, Route } from "react-router-dom";
import MakeMaterial from "./MakeMaterial";
import ShowMaterials from "./ShowMaterials";

//povezujemo url adrese sa odgovarajucim komponentama koje se prikazuju korisniku
export default function App() {
  
  
  return (
    <div>
      <Routes>
        <Route path="/" element={<MakeMaterial />} />
        <Route path="/show" element={<ShowMaterials/>} />
      </Routes>
    </div>
  );
}