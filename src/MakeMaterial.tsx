import { useState, useEffect } from "react";
import "./styles/medication-list.css";

// pravimo interface koji kao onaj koji dobijamo iz beka
interface MedicationDTO {
  id: string;
  name: string;
  manufacturer: string;
  inn: string;
  dosage_form: string;
}

// funkcija za fetchovanje lekova iz api-ja
// asinhrona funkcija ne koci izvrsenje programa i daje obecanje da ce vratiti niz objekata MedicationDTO
const getMedicationList = async (): Promise<MedicationDTO[]> => {
  try {
    const response = await fetch('http://localhost:8080/api/v1/medications'); //fetch salje GET zahtev na endpoint
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: MedicationDTO[] = await response.json();
    console.log('Fetched medications:', data); // debug
    console.log('First medication:', data[0]); // debug
    return data;
  } catch (error) {
    console.error('Error fetching medications:', error);
    throw error;
  }
};

const MakeMaterial: React.FC = () => {
  // ucitavanje admin parametara iz urla
  const urlParams = new URLSearchParams(window.location.search);
  const adminName = urlParams.get("name") || "vesa";
  const adminId = urlParams.get("id") || "1";

  // deklarisanje svih varijabli
  const [medications, setMedications] = useState<MedicationDTO[]>([]); // cela lista lekova
  const [displayedMedications, setDisplayedMedications] = useState<MedicationDTO[]>([]); // trenutno prikazani
  const [currentLetter, setCurrentLetter] = useState<string>(""); // odabrano slovo za filtriranje
  const [currentPage, setCurrentPage] = useState<number>(1); // trenutna stranica default:1
  const [totalPages, setTotalPages] = useState<number>(0); // ukupan broj stranica 
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // id selektovanih lekova
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // da li je otvoren popup - default:false
  const [letterTitle, setLetterTitle] = useState<string>(""); // naslov em
  const [letterDescription, setLetterDescription] = useState<string>(""); // description 
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // selectovani fajlovi
  
  const pageSize: number = 100;
  const alphabet: string[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // proverava da li name i id postoje u urlu, ako ne stavlja default vrednosti vesa, 1.
  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    if (!currentParams.get("name") || !currentParams.get("id")) {
      currentParams.set("name", adminName);
      currentParams.set("id", adminId);
      window.history.replaceState({}, '', `${window.location.pathname}?${currentParams}`);
    }
  }, [adminName, adminId]);

  // cim se komponenta mountuje zovemo funkciju getMedications
  useEffect(() => {
    getMedications();
  }, []);

  // Updateuje prikazane lekove kad se promeni filter
  useEffect(() => {
    updateDisplayedMedications();
  }, [medications, currentLetter, currentPage]);
  // get medications zove getMedicationList koji iz beka puni listu lekova
  const getMedications = async (): Promise<void> => {
    try {
      const data = await getMedicationList();
      setMedications(data);
    } catch (error) {
      console.error("Error fetching medications:", error);
    }
  };
  // inicira filtraciju po slovu, stavlja stranicu na prvu za ta slova
  const filterByLetter = (letter: string): void => {
    setCurrentLetter(letter);
    setCurrentPage(1);
  };
  // ovde se vrsi filtracija po slovu
  const updateDisplayedMedications = (): void => {
    let filtered = medications;
    
    if (currentLetter) {
      filtered = medications.filter((med) =>
        med.name.toUpperCase().startsWith(currentLetter)
      );
    }
    // racunamo broj ukupnih stranica
    const total = Math.ceil(filtered.length / pageSize);
    setTotalPages(total);
    // indeks pocetnog leka
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    // Izdvaja jednu stranicu iz filtriranog niza i rezultat postavlja u stanje displayedMedications
    setDisplayedMedications(filtered.slice(start, end));
  };
  // prima page kao parameter i ide na tu stranicu
  const goToPage = (page: number): void => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  // sledeca stranica
  const nextPage = (): void => {
    goToPage(currentPage + 1);
  };
  // prethodna stranica
  const prevPage = (): void => {
    goToPage(currentPage - 1);
  };
  // scroll to top
  const scrollToTop = (): void => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // dobijanje id-a iz leka i pretvaranje ga u string
  const getMedicationId = (medication: MedicationDTO): string => {

    const id = medication.id;
    
    if (!id) {
      console.error('Medication has no valid ID:', medication);
    }
    
    return String(id);
  };
  // funcija za selektovanje lekova iz tabele
  const onRowClick = (medication: MedicationDTO): void => {
    const medicationId = getMedicationId(medication);
    
    if (!medicationId || medicationId === 'undefined') {
      console.error('Cannot select medication without valid ID:', medication);
      alert('Error: This medication has no valid ID');
      return;
    }
    // azuriraj stanje selektovanih lekova
    setSelectedIds(prevIds => {
      const isCurrentlySelected = prevIds.includes(medicationId);
      
      if (isCurrentlySelected) {
        // ako kliknes na selektovan -> odselektuj
        const newIds = prevIds.filter(id => id !== medicationId);
        console.log(`Removed: ${medication.name} (${medicationId}). Total selected: ${newIds.length}`);
        console.log('Currently selected IDs:', newIds);
        return newIds;
      } else {
        // selektuj ako vec nije
        const newIds = [...prevIds, medicationId];
        console.log(`Added: ${medication.name} (${medicationId}). Total selected: ${newIds.length}`);
        console.log('Currently selected IDs:', newIds);
        return newIds;
      }
    });
  };
  // provera da li je lek selektovan
  const isLekSelected = (medication: MedicationDTO): boolean => {
    const medicationId = getMedicationId(medication);
    return selectedIds.includes(medicationId);
  };
  // vraca pune objekte (ne samo ideve)
  const getSelectedMedications = (): MedicationDTO[] => {
    return medications.filter(med => {
      const medicationId = getMedicationId(med);
      return selectedIds.includes(medicationId);
    });
  };
  // otvara formu za dodavanje em
  const openModal = (): void => {
    if (selectedIds.length === 0) {
      alert("You have to select at least one medication");
      return;
    }
    console.log('Opening modal with selected medications:', getSelectedMedications());
    setIsModalOpen(true);
  };
  // zatvara formu za dodavanje em
  const closeModal = (): void => {
    setIsModalOpen(false);
    setLetterTitle("");
    setLetterDescription("");
    setSelectedFiles([]);
  };
  // obrada fajlova odabranih preko input polja
  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };
  // validacija
  const sendMaterial = async (): Promise<void> => {
    if (!letterTitle.trim()) {
      alert("Please enter a title!");
      return;
    }

    if (selectedFiles.length === 0) {
      alert("Please attach at least one file!");
      return;
    }
    
    try {
      // kreiraj FormData objekat za slanje podataka koji ukljucuje fajlove 
      const formData = new FormData();
      // definisemo strukturu datatransferobjecta
      const materialDTO = {
        title: letterTitle,
        description: letterDescription,
        adminId: adminId,
        medicationIds: selectedIds
      };
      // dodaj JSON podatke
      formData.append('material', new Blob([JSON.stringify(materialDTO)], {
        type: 'application/json'
      }));
      // prolazimo kroz selektovane fajlove i dodajemo ih u objekat
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      // saljemo ih na server
      const response = await fetch('http://localhost:8080/api/v1/materials', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // ispis o uspehu
      alert('Material successfully uploaded!');
      setLetterTitle("");
      setLetterDescription("");
      setSelectedIds([]);
      setSelectedFiles([]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error uploading material:', error);
      alert('Error uploading material!');
    }
  };
  // delete selection
  const emptySelectedMedications = (): void => {
    console.log('Clearing all selections. Previously had:', selectedIds.length);
    setSelectedIds([]);
  };
  // kreiranje varijable koja sadrži pune objekte (DTO) svih selektovanih lekova
  const selectedMedications = getSelectedMedications();

  return (
    <div style={{ padding: '10px 30px 30px 30px' }}>
      <h2>Medications list</h2>
      
      {/* Selection counter badge */}
      {selectedIds.length > 0 && (
        <div style={{ 
          background: '#4CAF50', 
          color: 'white', 
          padding: '8px 15px', 
          borderRadius: '20px', 
          display: 'inline-block',
          marginBottom: '15px',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          ✓ {selectedIds.length} medication{selectedIds.length !== 1 ? 's' : ''} selected
        </div>
      )}
      
      <div className="alphabet-buttons">
        {alphabet.map((letter) => (
          <button key={letter} onClick={() => filterByLetter(letter)}>
            {letter}
          </button>
        ))}
        <button onClick={() => filterByLetter("")} className="all-btn">
          All
        </button>
      </div>

      <div className="pagination-controls">
        <button onClick={prevPage} disabled={currentPage === 1}>
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={nextPage} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>

      {displayedMedications.length > 0 && (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Manufacturer</th>
              <th>INN</th>
              <th>Dosage form</th>
            </tr>
          </thead>
          <tbody>
            {displayedMedications.map((medication) => {
              const medicationId = getMedicationId(medication);
              const isSelected = isLekSelected(medication);
              
              return (
                <tr
                  key={medicationId}
                  onClick={() => onRowClick(medication)}
                  className={isSelected ? "selected" : ""}
                >
                  <td>{medication.id}</td>
                  <td>{medication.name}</td>
                  <td>{medication.manufacturer}</td>
                  <td>{medication.inn}</td>
                  <td>{medication.dosage_form}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <button className="back-to-top" onClick={scrollToTop}>
        Back to Top
      </button>

      {selectedIds.length > 0 && (
        <div className="fixed-letter-actions">
          <button onClick={emptySelectedMedications} className="empty-list-btn">
            Delete selection ({selectedIds.length})
          </button>
          <button onClick={openModal} className="create-letter-btn">
            Make an Educational material ({selectedIds.length})
          </button>
        </div>
      )}

      <div className="pagination-controls">
        <button onClick={prevPage} disabled={currentPage === 1}>
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={nextPage} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Educational material</h3>
            <h4>Selected medication:</h4>
            <table className="table table-modal">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Manufacturer</th>
                  <th>INN</th>
                  <th>Dosage form</th>
                </tr>
              </thead>
              <tbody>
                {selectedMedications.map((medication) => (
                  <tr key={getMedicationId(medication)}>
                    <td>{medication.id}</td>
                    <td>{medication.name}</td>
                    <td>{medication.manufacturer}</td>
                    <td>{medication.inn}</td>
                    <td>{medication.dosage_form}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>Material Title:</h4>
            <input
              type="text"
              value={letterTitle}
              onChange={(e) => setLetterTitle(e.target.value)}
              placeholder="Enter the title of the material"
              className="letter-input-title"
            />

            <h4>Material Description:</h4>
            <textarea
              value={letterDescription}
              onChange={(e) => setLetterDescription(e.target.value)}
              rows={4}
              placeholder="Brief description of the material (e.g., purpose, educational content)"
            />

            <h4>Attach Files (PDF, images, etc.):</h4>
            <div className="file-input-wrapper">
              <input
                type="file"
                onChange={onFileSelected}
                multiple
                accept="application/pdf,image/*,video/*"
              />
              {selectedFiles.length > 0 && (
                <p style={{ marginTop: '5px', color: '#666', fontSize: '14px' }}>
                  {selectedFiles.length} file(s) selected
                </p>
              )}
            </div>
            
            <div className="modal-actions">
              <button onClick={closeModal} className="btn-cancel">
                Close
              </button>
              <button
                onClick={sendMaterial}
                className="btn-send"
                disabled={!letterTitle.trim() || selectedFiles.length === 0}
              >
                Upload Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MakeMaterial;