import { useState, useEffect } from "react";
import "./styles/medication-list.css";
import "./styles/letter-list.css";

//pravimo DTO pojedinacnog fajla
interface FileDTO {
  id: number;
  fileName: string;
  fileType: string;
}
// DTO edukativnog materijala
interface MaterialDTO {
  id: number;
  title: string;
  description: string;
  date: string;
  adminName: string;
  adminId: number;
  files: FileDTO[];
  medicationNames: string[];
  medicationIds: string[];
}
// Asinhrona funkcija za fetchovanje svih edukativnih materijala sa API-ja
const getMaterialsList = async (): Promise<MaterialDTO[]> => {
  try {
    const response = await fetch('http://localhost:8080/api/v1/materials');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MaterialDTO[] = await response.json();
    console.log('Fetched materials:', data);
    return data;
  } catch (error) {
    console.error('Error fetching materials:', error);
    throw error;
  }
};
// asinhrona unkcija a download pojedinacnog fajla iz edukativnog materijala
const downloadMaterialFile = async (materialId: number, fileId: number, fileName: string): Promise<void> => {
  try {
    // saljemo GET zahtev sa id-evima materijala i fajla
    const response = await fetch(`http://localhost:8080/api/v1/materials/${materialId}/download/${fileId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // kreiranje blob-a i simulacija klika na link za download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a'); // kreira se nevidljivi link
    link.href = url;
    link.download = fileName; // postavlja ime fajla za download
    document.body.appendChild(link);
    link.click(); // pokrece download
    document.body.removeChild(link); // ciscenje urla
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
    alert('Failed to download file.');
  }
};
// komponenta materials list 
const MaterialsList: React.FC = () => {
  const [materials, setMaterials] = useState<MaterialDTO[]>([]); // lista svih materijala preuzeta sa servera
  const [displayedMaterials, setDisplayedMaterials] = useState<MaterialDTO[]>([]); // lista trenutno prikazanih
  const [currentPage, setCurrentPage] = useState<number>(1); // trenutna stranica
  const [totalPages, setTotalPages] = useState<number>(0); // ukupan broj stranica
  // fiksni broj stavki po stranici
  const pageSize: number = 8;
  // efekat koji loaduje pisma kad se upali stranica
  useEffect(() => {
    getMaterials();
  }, []);
  // efekat koji se pokrece kad se promeni lista pisama
  useEffect(() => {
    updateDisplayedMaterials();
  }, [materials, currentPage]);
  // asinhrona funkcija a dobijanje, sortiranje  postavljanje dukativnih materijala
  const getMaterials = async (): Promise<void> => {
    try {
      const data = await getMaterialsList();
      // sortirano po atumu opadajuce
      const sorted = data.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setMaterials(sorted);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };
  // funkcija za prikaz materijala po tranici
  const updateDisplayedMaterials = (): void => {
    // racunamo ukupan broj stranica kao ukupan br pisama / br pisama po stranici
    const total = Math.ceil(materials.length / pageSize);
    setTotalPages(total);
    //pocetni indeks
    const start = (currentPage - 1) * pageSize;
    //krajnji indeks
    const end = start + pageSize;
    setDisplayedMaterials(materials.slice(start, end));
  };

  const goToPage = (page: number): void => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextPage = (): void => {
    goToPage(currentPage + 1);
  };

  const prevPage = (): void => {
    goToPage(currentPage - 1);
  };
  // formatiranje datuma u citljiv format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  // funkcija koja se zove kad korisnik klikne fajl ( zove f-ju downloadmaterialfile)
  const handleViewFile = (material: MaterialDTO, file: FileDTO): void => {
    downloadMaterialFile(material.id, file.id, file.fileName);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="page-header">
        <img src="/alims.jpeg" alt="Alims logo" className="header-logo" />
        <h2>ALIMS - Materials for Healthcare Workers</h2>
        <button
          className="btn-show-letters"
          onClick={() => (window.location.href = "http://localhost:4200/letters")}
        >
          Show Letters
        </button>
      </div>

      {displayedMaterials.length === 0 && materials.length === 0 && (
        <em style={{ display: 'block', textAlign: 'center', color: '#888', fontSize: '1.1em', marginTop: '20px' }}>
          No materials available.
        </em>
      )}

      <div className="letters-container">
        {displayedMaterials.map((material) => (
          <div key={material.id} className="letter-card">
            <h3>{material.title}</h3>
            <p className="letter-date">{formatDate(material.date)}</p>
            <p className="letter-description">{material.description}</p>
            <p>
              <strong>Medications:</strong> {material.medicationNames.join(', ')}
            </p>
            <p>
              <strong>Admin:</strong> {material.adminName}
            </p>

            {material.files.length > 0 ? (
              <div style={{ marginTop: '15px' }}>
                <p style={{ fontSize: '0.95em', color: '#333', fontWeight: '600', marginBottom: '8px' }}>
                  Attached Files ({material.files.length}):
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {material.files.map((file) => (
                    <button
                      key={file.id}
                      className="btn-read"
                      onClick={() => handleViewFile(material, file)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9em'
                      }}
                    >
                      <span style={{ fontSize: '1.1em' }}>📥</span>
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.fileName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.9em', color: '#999', fontStyle: 'italic', marginTop: '10px' }}>
                No files attached
              </p>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button onClick={prevPage} disabled={currentPage === 1}>
            Previous
          </button>
          <span>
            Page {currentPage} / {totalPages}
          </span>
          <button onClick={nextPage} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}

      <footer>
        <p>&copy; 2025 Matija Veljković-Šupić & David Bošković</p>
      </footer>
    </div>
  );
};

export default MaterialsList;