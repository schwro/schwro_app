import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { jsPDF } from "jspdf";

// --- Łączenie klas CSS (Tailwind) ---
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Helper formatujący datę ---
const formatDateFull = (dateString) => {
  if (!dateString) return '';
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  const formatted = date.toLocaleDateString('pl-PL', options);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

// --- Helper do usuwania polskich znaków (dla standardowych fontów PDF) ---
const safeText = (text) => {
  if (!text) return "";
  const map = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
  };
  return String(text).split('').map(c => map[c] || c).join('');
};

// --- GŁÓWNA LOGIKA TWORZENIA PDF ---
// ... (importy i helpery bez zmian)

// --- GŁÓWNA LOGIKA TWORZENIA PDF ---
const createPDFDoc = (program, songsMap) => {
  const doc = new jsPDF();
  let y = 20;
  const pageHeight = doc.internal.pageSize.height;

  const checkPageBreak = (spaceNeeded = 10) => {
    if (y + spaceNeeded > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // TYTUŁ
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(safeText(`Program Nabozenstwa: ${program.date}`), 105, y, { align: "center" });
  y += 15;

  // 1. TABELA HARMONOGRAMU (Bez zmian, kod działa dobrze)
  doc.setFontSize(12);
  doc.text("HARMONOGRAM", 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Czas", 14, y); doc.text("Element", 35, y); doc.text("Szczegoly", 80, y); doc.text("Piosenki", 140, y);
  doc.line(14, y+2, 196, y+2);
  y += 8;
  doc.setFont("helvetica", "normal");

  if (program.schedule && program.schedule.length > 0) {
    program.schedule.forEach(row => {
      checkPageBreak(20);
      if (row.duration) doc.text(safeText(`${row.duration} min`), 14, y);
      doc.text(safeText(row.element || ""), 35, y);
      
      const desc = safeText(row.description || "");
      const splitDesc = doc.splitTextToSize(desc, 50); 
      doc.text(splitDesc, 80, y);

      if (row.selectedSongs && row.selectedSongs.length > 0) {
        let songY = y;
        row.selectedSongs.forEach(s => {
          const song = songsMap[s.songId];
          const title = song ? song.title : "Nieznana";
          const key = s.key ? `(${s.key})` : "";
          doc.text(safeText(`- ${title} ${key}`), 140, songY);
          songY += 5;
        });
        const heightNeeded = Math.max(splitDesc.length * 5, row.selectedSongs.length * 5);
        y += heightNeeded > 7 ? heightNeeded : 7;
      } else {
        y += splitDesc.length * 5 > 7 ? splitDesc.length * 5 : 7;
      }
      
      doc.setDrawColor(240);
      doc.line(14, y - 2, 196, y - 2);
      doc.setDrawColor(0);
      y += 2;
    });
  }
  y += 10;

  // 2. SEKCJE ZESPOŁÓW (Tutaj dodajemy wszystkie brakujące)
  checkPageBreak(40);
  
  const drawSection = (title, dataObj) => {
    if (!dataObj) return;
    
    // Filtrujemy puste pola
    const entries = Object.entries(dataObj).filter(([_, v]) => v && v.trim() !== '');
    if (entries.length === 0) return;

    checkPageBreak(entries.length * 6 + 20);
    
    // Nagłówek sekcji
    doc.setFillColor(245, 245, 245);
    doc.rect(14, y - 4, 182, 8, 'F'); // Szare tło nagłówka
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(safeText(title.toUpperCase()), 16, y + 1);
    y += 10;
    
    // Tabela sekcji
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    entries.forEach(([role, person]) => {
      doc.setFont("helvetica", "bold");
      doc.text(safeText(role + ":"), 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(safeText(person), 60, y);
      y += 6;
    });
    y += 5;
  };

  // Rysujemy wszystkie sekcje po kolei
  drawSection("Zespol Uwielbienia", program.zespol);
  drawSection("Produkcja / Media", program.produkcja);
  drawSection("Scena / Technika", program.scena);
  drawSection("Atmosfera / Obsluga", program.atmosfera);
  drawSection("Male SchWro (Szkolka)", program.szkolka);

  return doc;
};

// ... (Reszta pliku utils.js bez zmian)


// --- GENEROWANIE PLIKU DO POBRANIA ---
export const generatePDF = (program, songsMap) => {
  try {
    const doc = createPDFDoc(program, songsMap);
    doc.save(`Program_${program.date || 'bez_daty'}.pdf`);
  } catch (e) {
    console.error("Błąd generowania PDF:", e);
    alert("Wystąpił błąd podczas generowania PDF.");
  }
};

// --- GENEROWANIE BASE64 DLA E-MAILA ---
export const generatePDFBase64 = async (program, songsMap) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = createPDFDoc(program, songsMap);
      // output('datauristring') zwraca "data:application/pdf;base64,JVBERi0..."
      const dataUri = doc.output('datauristring');
      // Musimy usunąć prefix, aby wysłać czysty base64 do API
      const base64 = dataUri.split(',')[1];
      resolve(base64);
    } catch (e) {
      reject(e);
    }
  });
};
