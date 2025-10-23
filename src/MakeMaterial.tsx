import { useState, useEffect } from "react";
import "./styles/medication-list.css";

// TypeScript interface matching Java DTO
interface MedicationDTO {
  id: string;
  name: string;
  manufacturer: string;
  inn: string;
  dosage_form: string;
}

// Fetch medications from backend API
const getMedicationList = async (): Promise<MedicationDTO[]> => {
  try {
    const response = await fetch('http://localhost:8080/api/v1/medications');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: MedicationDTO[] = await response.json();
    console.log('Fetched medications:', data); // Debug: Check the structure
    console.log('First medication:', data[0]); // Debug: Check first item
    return data;
  } catch (error) {
    console.error('Error fetching medications:', error);
    throw error;
  }
};

const MakeMaterial: React.FC = () => {
  // Get admin info from URL parameters (must be used in a Router context)
  const urlParams = new URLSearchParams(window.location.search);
  const adminName = urlParams.get("name") || "vesa";
  const adminId = urlParams.get("id") || "1";

  // State management - Using array for selected IDs
  const [medications, setMedications] = useState<MedicationDTO[]>([]);
  const [displayedMedications, setDisplayedMedications] = useState<MedicationDTO[]>([]);
  const [currentLetter, setCurrentLetter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [letterTitle, setLetterTitle] = useState<string>("");
  const [letterDescription, setLetterDescription] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const pageSize: number = 100;
  const alphabet: string[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Set URL params if missing
  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    if (!currentParams.get("name") || !currentParams.get("id")) {
      currentParams.set("name", adminName);
      currentParams.set("id", adminId);
      window.history.replaceState({}, '', `${window.location.pathname}?${currentParams}`);
    }
  }, [adminName, adminId]);

  // Fetch medications on component mount
  useEffect(() => {
    getMedications();
  }, []);

  // Update displayed medications when filters change
  useEffect(() => {
    updateDisplayedMedications();
  }, [medications, currentLetter, currentPage]);

  const getMedications = async (): Promise<void> => {
    try {
      const data = await getMedicationList();
      setMedications(data);
    } catch (error) {
      console.error("Error fetching medications:", error);
    }
  };

  const filterByLetter = (letter: string): void => {
    setCurrentLetter(letter);
    setCurrentPage(1);
  };

  const updateDisplayedMedications = (): void => {
    let filtered = medications;
    
    if (currentLetter) {
      filtered = medications.filter((med) =>
        med.name.toUpperCase().startsWith(currentLetter)
      );
    }
    
    const total = Math.ceil(filtered.length / pageSize);
    setTotalPages(total);
    
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    setDisplayedMedications(filtered.slice(start, end));
  };

  const goToPage = (page: number): void => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const nextPage = (): void => {
    goToPage(currentPage + 1);
  };

  const prevPage = (): void => {
    goToPage(currentPage - 1);
  };

  const scrollToTop = (): void => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get unique ID from medication - try multiple possible field names
  const getMedicationId = (medication: MedicationDTO): string => {
    // The API returns 'id' field
    const id = medication.id;
    
    if (!id) {
      console.error('Medication has no valid ID:', medication);
    }
    
    return String(id);
  };

  const onRowClick = (medication: MedicationDTO): void => {
    const medicationId = getMedicationId(medication);
    
    if (!medicationId || medicationId === 'undefined') {
      console.error('Cannot select medication without valid ID:', medication);
      alert('Error: This medication has no valid ID');
      return;
    }

    setSelectedIds(prevIds => {
      const isCurrentlySelected = prevIds.includes(medicationId);
      
      if (isCurrentlySelected) {
        // Remove if already selected
        const newIds = prevIds.filter(id => id !== medicationId);
        console.log(`Removed: ${medication.name} (${medicationId}). Total selected: ${newIds.length}`);
        console.log('Currently selected IDs:', newIds);
        return newIds;
      } else {
        // Add if not selected
        const newIds = [...prevIds, medicationId];
        console.log(`Added: ${medication.name} (${medicationId}). Total selected: ${newIds.length}`);
        console.log('Currently selected IDs:', newIds);
        return newIds;
      }
    });
  };

  const isLekSelected = (medication: MedicationDTO): boolean => {
    const medicationId = getMedicationId(medication);
    return selectedIds.includes(medicationId);
  };

  const getSelectedMedications = (): MedicationDTO[] => {
    return medications.filter(med => {
      const medicationId = getMedicationId(med);
      return selectedIds.includes(medicationId);
    });
  };

  const openModal = (): void => {
    if (selectedIds.length === 0) {
      alert("You have to select at least one medication");
      return;
    }
    console.log('Opening modal with selected medications:', getSelectedMedications());
    setIsModalOpen(true);
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    setLetterTitle("");
    setLetterDescription("");
    setSelectedFiles([]);
  };

  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

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
      const formData = new FormData();

      const materialDTO = {
        title: letterTitle,
        description: letterDescription,
        adminId: adminId,
        medicationIds: selectedIds
      };

      formData.append('material', new Blob([JSON.stringify(materialDTO)], {
        type: 'application/json'
      }));

      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('http://localhost:8080/api/v1/materials', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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

  const emptySelectedMedications = (): void => {
    console.log('Clearing all selections. Previously had:', selectedIds.length);
    setSelectedIds([]);
  };

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
            <h3>Letter</h3>
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
                accept="application/pdf,image/*"
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