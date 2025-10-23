import { Routes, Route } from "react-router-dom";
import MakeMaterial from "./MakeMaterial";
import ShowMaterials from "./ShowMaterials";


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




