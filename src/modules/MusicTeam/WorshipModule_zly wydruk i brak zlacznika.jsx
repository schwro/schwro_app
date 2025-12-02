import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, X, FileText, Music, Calendar, Download, AlertCircle } from 'lucide-react';
import SongForm from './SongForm';
import { jsPDF } from 'jspdf';

const TAGS = [
  "intymna", "modlitewna", "niedzielna", "popularna", "szybko", "uwielbienie", "wolna"
];

const CHORDS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];

// Inicjalizacja czcionki – musi być JEDNORAZOWO
let isFontRegistered = false;

async function initializePDFFont() {
  if (isFontRegistered) return;
  
  try {
    // Pobierz czcionkę Roboto (najlepsza dostępność)
    const response = await fetch('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf');
    if (!response.ok) throw new Error('Nie można pobrać czcionki');
    
    const arrayBuffer = await response.arrayBuffer();
    const fontBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Rejestracja czcionki w jsPDF
    const callAddFont = function() {
      this.addFileToVFS('Roboto-Regular.ttf', fontBase64);
      this.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    };
    
    jsPDF.API.events.push(['addFonts', callAddFont]);
    isFontRegistered = true;
    console.log('✅ Czcionka Roboto załadowana');
  } catch (err) {
    console.warn('⚠️ Błąd ładowania czcionki, używam domyślnej:', err);
  }
}

function transposeChord(chord, steps) {
  let foundRoot = null;
  for (const root of CHORDS) {
    if (chord.startsWith(root)) {
      if (!foundRoot || root.length > foundRoot.length) {
        foundRoot = root;
      }
    }
  }
  
  if (!foundRoot) return chord;
  
  const idx = CHORDS.indexOf(foundRoot);
  const mod = (idx + steps + CHORDS.length) % CHORDS.length;
  return chord.replace(foundRoot, CHORDS[mod]);
}

function transposeLine(line, steps) {
  return line.replace(/\b([A-G][b#]?)(sus2|sus4|maj7|m7|m9|add2|add9|dim|aug|m|7|9|11|13)?(\/[A-G][b#]?)?\b/g,
    (all) => transposeChord(all, steps));
}

function SongDetailsModal({ song, onClose, onEdit }) {
  const [transpose, setTranspose] = useState(0);
  const [downloadError, setDownloadError] = useState(null);
  
  const originalKey = song.key || "C";
  const actualKeyIdx = CHORDS.indexOf(originalKey);
  const displayKey = actualKeyIdx !== -1 ? CHORDS[(actualKeyIdx + transpose + CHORDS.length) % CHORDS.length] : originalKey;

  const transposedChordsBars = song.chords_bars
    ? song.chords_bars.split("\n").map(line => transposeLine(line, transpose)).join("\n")
    : "";

  const lyricsWithChords = song.lyrics_chords 
    ? song.lyrics_chords.split("\n").map(line => transposeLine(line, transpose)).join("\n")
    : transposedChordsBars;

  const usageHistory = [
    { date: "2025-10-20", desc: "Nabożeństwo 20 października 2025" },
    { date: "2025-10-13", desc: "Nabożeństwo 13 października 2025" },
  ];

  useEffect(() => {
    initializePDFFont();
  }, []);

  const generatePDF = async () => {
    try {
      await initializePDFFont();
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Ustaw czcionkę z polskimi znakami
      doc.setFont(isFontRegistered ? 'Roboto' : 'helvetica', 'normal');

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 16;
      const lineSpacing = 4.5;

      let yPos = margin;

      // ========== NAGŁÓWEK ==========
      doc.setFontSize(24);
      doc.setFont(isFontRegistered ? 'Roboto' : 'helvetica', 'bold');
      doc.setTextColor(40, 80, 120); // Niebieski
      
      const title = song.title || 'Bez tytułu';
      doc.text(title, margin, yPos);
      yPos += 10;

      // META (tonacja, tempo, metrum)
      doc.setFontSize(10);
      doc.setFont(isFontRegistered ? 'Roboto' : 'helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      
      const metaText = `Tonacja: ${displayKey} (oryg: ${originalKey}) | Tempo: ${song.tempo ? song.tempo + ' BPM' : '-'} | Metrum: ${song.meter || '-'}`;
      doc.text(metaText, margin, yPos);
      yPos += 7;

      // Dekoracyjna linia
      doc.setDrawColor(180, 200, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // ========== ZAWARTOŚĆ ==========
      const lyricsLines = (song.lyrics || '').split('\n');
      const chordLines = (transposedChordsBars || '').split('\n');
      const maxLines = Math.max(lyricsLines.length, chordLines.length);

      doc.setFontSize(9);
      doc.setFont(isFontRegistered ? 'Roboto' : 'helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      let currentPage = 1;

      for (let i = 0; i < maxLines; i++) {
        // Stronicowanie
        if (yPos > pageHeight - margin - 15) {
          // Stopka poprzedniej strony
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Wygenerowano w SchWro App | ${new Date().toLocaleDateString('pl-PL')} | Str. ${currentPage}`,
            margin,
            pageHeight - 8
          );

          doc.addPage();
          yPos = margin;
          currentPage++;
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          doc.setFont(isFontRegistered ? 'Roboto' : 'helvetica', 'normal');
        }

        const lyricLine = (lyricsLines[i] || '').trim();
        const chordLine = (chordLines[i] || '').trim();

        // Akordy (małym, szarym tekstem na górze)
        if (chordLine) {
          doc.setTextColor(100, 130, 160);
          doc.setFontSize(7.5);
          doc.setFont(isFontRegistered ? 'Roboto' : 'helvetica', 'bold');
          doc.text(chordLine, margin, yPos);
          yPos += 2.5;
        }

        // Tekst
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont(isFontRegistered ? 'Roboto' : 'helvetica', 'normal');
        
        if (lyricLine) {
          const splitText = doc.splitTextToSize(lyricLine, pageWidth - margin * 2);
          doc.text(splitText, margin, yPos);
          yPos += splitText.length * lineSpacing;
        } else {
          yPos += lineSpacing / 2;
        }

        yPos += 1;
      }

      // Ostatnia stopka
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Wygenerowano w SchWro App | ${new Date().toLocaleDateString('pl-PL')} | Str. ${currentPage}`,
        margin,
        pageHeight - 8
      );

      doc.save(`${title}.pdf`);
      console.log('✅ PDF wygenerowany pomyślnie');
    } catch (err) {
      console.error('❌ Błąd generowania PDF:', err);
      alert('❌ Błąd generowania PDF: ' + err.message);
    }
  };

  const downloadAttachment = async (file) => {
    setDownloadError(null);
    try {
      if (!file || !file.name) {
        throw new Error('Brak informacji o pliku');
      }

      console.log('📥 Pobieranie pliku:', file);
      
      let blob;

      if (file.path) {
        const { data, error } = await supabase.storage
          .from('song-attachments')
          .download(file.path);
        
        if (error) throw error;
        blob = data;
      }
      else if (file.url && file.url.startsWith('http')) {
        const response = await fetch(file.url, {
          mode: 'cors',
          credentials: 'omit'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        blob = await response.blob();
      }
      else if (file.data) {
        const byteCharacters = atob(file.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: file.type || 'application/octet-stream' });
      }
      else {
        throw new Error('Brak prawidłowych danych do pobrania');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name || 'plik';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Plik pobrany pomyślnie:', file.name);
    } catch (err) {
      console.error('❌ Błąd pobierania pliku:', err);
      setDownloadError(err.message);
      alert('❌ Nie udało się pobrać pliku:\n\n' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl max-w-5xl w-full rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-white/20 max-h-[90vh]">
        
        <div className="flex justify-between items-center py-6 px-10 border-b border-gray-200/50 bg-gradient-to-r from-pink-50/80 to-orange-50/80">
          <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
            {song.title}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-xl transition">
            <X size={28} className="text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">Kategoria</div>
              <div className="text-lg font-bold text-gray-800">{song.category || "–"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">Tagi</div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(song.tags) && song.tags.length > 0 ? (
                  song.tags.map((t, i) => (
                    <span key={i} className="bg-gradient-to-r from-pink-100 to-orange-100 text-pink-700 px-3 py-1 rounded-full text-xs font-medium border border-pink-200/50">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">brak tagów</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-pink-50/50 to-orange-50/50 border border-pink-200/30 rounded-2xl p-5">
            <div className="text-xs font-semibold text-gray-500 mb-2">Tonacja</div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                {displayKey}
              </span>
              <button
                onClick={() => setTranspose(transpose - 1)}
                className="px-4 py-2 rounded-xl border border-gray-300/50 bg-white/70 text-pink-700 font-bold hover:bg-gradient-to-r hover:from-pink-500 hover:to-orange-500 hover:text-white transition"
              >
                ▼ Niżej
              </button>
              <button
                onClick={() => setTranspose(transpose + 1)}
                className="px-4 py-2 rounded-xl border border-gray-300/50 bg-white/70 text-pink-700 font-bold hover:bg-gradient-to-r hover:from-pink-500 hover:to-orange-500 hover:text-white transition"
              >
                ▲ Wyżej
              </button>
              <button
                onClick={() => setTranspose(0)}
                className="px-4 py-2 rounded-xl border border-gray-300/50 bg-white/50 text-gray-600 hover:bg-gray-100/80 transition text-sm"
              >
                Reset
              </button>
              <span className="ml-2 text-xs text-gray-500">
                (Oryginalna: <b>{originalKey}</b>)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">Tempo</div>
              <div className="text-lg font-bold text-gray-800">
                {song.tempo ? `${song.tempo} BPM` : "–"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">Metrum</div>
              <div className="text-lg font-bold text-gray-800">{song.meter || "–"}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="font-bold text-pink-700 mb-2 flex items-center gap-2">
                <FileText size={18} />
                Tekst pieśni
              </div>
              <pre className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 text-sm font-mono text-gray-900 max-h-64 overflow-y-auto whitespace-pre-wrap break-words text-left">
                {song.lyrics || "(brak tekstu)"}
              </pre>
            </div>
            <div>
              <div className="font-bold text-orange-700 mb-2 flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <Music size={18} />
                  Akordy w taktach
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(transposedChordsBars)}
                  className="text-xs text-gray-500 hover:text-pink-600 underline"
                >
                  Kopiuj
                </button>
              </div>
              <pre className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 text-sm font-mono text-gray-900 max-h-64 overflow-y-auto whitespace-pre-wrap break-words text-left">
                {transposedChordsBars || "(brak akordów)"}
              </pre>
            </div>
          </div>

          <div>
            <div className="font-bold text-pink-700 mb-2 flex items-center gap-2">
              <Music size={18} />
              Tekst z akordami (pełna wersja)
            </div>
            <pre className="bg-gradient-to-br from-pink-50/50 to-orange-50/50 backdrop-blur-sm border border-pink-200/30 rounded-xl p-5 text-sm font-mono text-gray-900 max-h-80 overflow-y-auto whitespace-pre-wrap break-words text-left">
              {lyricsWithChords || "(brak)"}
            </pre>
          </div>

          {downloadError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-700">Błąd pobierania</div>
                <div className="text-red-600 text-sm">{downloadError}</div>
              </div>
            </div>
          )}

          <div>
            <div className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <FileText size={20} />
              Załączniki
            </div>
            {Array.isArray(song.attachments) && song.attachments.length > 0 ? (
              song.attachments.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 mb-2 hover:bg-white/90 transition"
                >
                  {file.name?.endsWith(".mp3") || file.name?.endsWith(".wav") ? (
                    <Music size={20} className="text-pink-600" />
                  ) : (
                    <FileText size={20} className="text-orange-600" />
                  )}
                  <span className="font-semibold flex-1">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {file.size
                      ? file.size > 1024 * 1024
                        ? (file.size / 1024 / 1024).toFixed(1) + " MB"
                        : (file.size / 1024).toFixed(0) + " KB"
                      : ""}
                  </span>
                  <button
                    onClick={() => downloadAttachment(file)}
                    className="text-pink-600 hover:text-pink-800 transition p-2 hover:bg-pink-50 rounded-lg"
                    title="Pobierz plik"
                  >
                    <Download size={18} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">Brak załączników</div>
            )}
          </div>

          <div>
            <div className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Music size={20} />
              Nuty / Nagrania
            </div>
            {song.sheet_music_url ? (
              <a
                href={song.sheet_music_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-100 to-orange-100 text-pink-700 rounded-xl border border-pink-200/50 hover:from-pink-200 hover:to-orange-200 transition font-semibold"
              >
                Zobacz nuty / nagranie ↗
              </a>
            ) : (
              <div className="text-gray-500 text-sm">Brak linku</div>
            )}
          </div>

          <div className="bg-gradient-to-r from-pink-50/80 to-orange-50/80 backdrop-blur-sm border border-pink-200/30 rounded-2xl p-6">
            <div className="font-bold text-pink-700 mb-3 flex items-center gap-2">
              <Calendar size={20} />
              Historia wykorzystania ({usageHistory.length}x)
            </div>
            <div className="text-gray-600 text-sm mb-3">
              Ostatnio użyto: poniedziałek, 20 października 2025
            </div>
            {usageHistory.map((row, idx) => (
              <div
                key={idx}
                className="bg-white/70 backdrop-blur-sm border border-gray-200/30 py-3 px-4 rounded-xl mb-2"
              >
                <b>
                  {new Date(row.date).toLocaleDateString("pl-PL", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </b>
                {" – "}
                {row.desc}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 p-6 border-t border-gray-200/50 bg-gradient-to-r from-pink-50/30 to-orange-50/30">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 font-medium rounded-xl hover:bg-white transition"
          >
            Zamknij
          </button>
          <button 
            onClick={generatePDF}
            className="px-7 py-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/50 transition"
          >
            Generuj PDF
          </button>
          <button
            onClick={onEdit}
            className="px-7 py-3 bg-gradient-to-r from-orange-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/50 transition"
          >
            Edytuj pieśń
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorshipModule() {
  const [team, setTeam] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showSongModal, setShowSongModal] = useState(false);
  const [showSongDetails, setShowSongDetails] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const [songForm, setSongForm] = useState({});
  const [memberForm, setMemberForm] = useState({ id: null, full_name: '', role: '', status: 'Aktywny', phone: '', email: '' });

  const [songFilter, setSongFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Pobieranie danych z Supabase...');
      
      // Pobierz zespół
      const { data: teamData, error: teamError } = await supabase
        .from('worship_team')
        .select('*')
        .order('full_name');
      
      if (teamError) {
        console.error('❌ Błąd pobierania zespołu:', teamError);
        throw new Error(`Błąd zespołu: ${teamError.message}`);
      }
      
      console.log('✅ Pobrano członków zespołu:', teamData?.length || 0);
      
      // Pobierz pieśni
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select('*')
        .order('title');
      
      if (songsError) {
        console.error('❌ Błąd pobierania pieśni:', songsError);
        throw new Error(`Błąd pieśni: ${songsError.message}`);
      }
      
      console.log('✅ Pobrano pieśni:', songsData?.length || 0);
      
      setTeam(teamData || []);
      setSongs(songsData || []);
    } catch (err) {
      console.error('❌ Błąd pobierania danych:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const saveMember = async () => {
    try {
      if (memberForm.id) {
        const { error } = await supabase.from('worship_team').update(memberForm).eq('id', memberForm.id);
        if (error) throw error;
      } else {
        const { id, ...rest } = memberForm;
        const { error } = await supabase.from('worship_team').insert([rest]);
        if (error) throw error;
      }
      setShowMemberModal(false);
      await fetchData();
    } catch (err) {
      console.error('Błąd zapisywania członka:', err);
      alert('Błąd: ' + err.message);
    }
  };

  const deleteMember = async (id) => {
    if(confirm('Usunąć członka zespołu?')) {
      try {
        const { error } = await supabase.from('worship_team').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
      } catch (err) {
        console.error('Błąd usuwania członka:', err);
        alert('Błąd: ' + err.message);
      }
    }
  };

  const deleteSong = async (id) => {
    if(confirm('Usunąć pieśń?')) {
      try {
        const { error } = await supabase.from('songs').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
      } catch (err) {
        console.error('Błąd usuwania pieśni:', err);
        alert('Błąd: ' + err.message);
      }
    }
  };

  const filteredSongs = songs.filter(s =>
    (s.title || '').toLowerCase().includes(songFilter.toLowerCase()) &&
    (tagFilter ? (Array.isArray(s.tags) ? s.tags.map(String).map(t => t.toLowerCase()).includes(tagFilter.toLowerCase()) : false) : true)
  );

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
        <div className="mt-4 text-gray-600">Ładowanie danych...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex gap-4">
          <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-red-700 mb-2">Błąd ładowania danych</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">Grupa Uwielbienia</h1>
      </div>

      {/* SEKCJA ZESPOŁU */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
            Członkowie Zespołu ({team.length})
          </h2>
          <button 
            onClick={() => { 
              setMemberForm({ id: null, full_name: '', role: '', status: 'Aktywny', phone: '', email: '' }); 
              setShowMemberModal(true); 
            }} 
            className="bg-gradient-to-r from-pink-600 to-orange-600 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/50 transition flex items-center gap-2"
          >
            <Plus size={18}/> Dodaj członka
          </button>
        </div>
        
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-pink-50/80 to-orange-50/80 text-gray-700 font-bold border-b border-gray-200/50">
              <tr>
                <th className="p-4">Imię i nazwisko</th>
                <th className="p-4">Instrument/Rola</th>
                <th className="p-4">Status</th>
                <th className="p-4">Telefon</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {team.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Brak członków zespołu</td></tr>
              ) : team.map(m => (
                <tr key={m.id} className="hover:bg-pink-50/30 transition">
                  <td className="p-4 font-medium">{m.full_name}</td>
                  <td className="p-4">{m.role}</td>
                  <td className="p-4">
                    <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200/50">
                      {m.status}
                    </span>
                  </td>
                  <td className="p-4">{m.phone}</td>
                  <td className="p-4">{m.email}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setMemberForm(m); setShowMemberModal(true); }} 
                        className="text-pink-600 hover:text-orange-600 font-medium transition"
                      >
                        Edytuj
                      </button>
                      <button 
                        onClick={() => deleteMember(m.id)} 
                        className="text-red-500 hover:text-red-700 font-medium transition"
                      >
                        Usuń
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SEKCJA PIEŚNI */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
            Baza Pieśni ({songs.length})
          </h2>
          <button 
            onClick={() => { setSongForm({}); setShowSongModal(true); }} 
            className="bg-gradient-to-r from-orange-600 to-pink-600 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-orange-500/50 transition flex items-center gap-2"
          >
            <Plus size={18}/> Dodaj pieśń
          </button>
        </div>
        
        <div className="bg-white/50 backdrop-blur-sm p-4 mb-4 rounded-2xl border border-gray-200/50 flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2">
            <Search className="text-gray-400" size={20} />
            <input 
              className="w-full outline-none text-sm bg-transparent" 
              placeholder="Szukaj pieśni..." 
              value={songFilter} 
              onChange={e => setSongFilter(e.target.value)} 
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <input 
              className="px-4 py-2 border border-gray-200/50 rounded-xl text-sm bg-white/50 backdrop-blur-sm" 
              placeholder="Szukaj po tagach..." 
              value={tagFilter} 
              onChange={e => setTagFilter(e.target.value)} 
            />
            {TAGS.map(tag => tagFilter !== tag && (
              <button 
                key={tag} 
                onClick={() => setTagFilter(tag)} 
                className="bg-gradient-to-r from-pink-50 to-orange-50 px-3 py-1.5 rounded-xl text-xs text-pink-800 border border-pink-200/50 hover:from-pink-100 hover:to-orange-100 transition font-medium"
              >
                {tag}
              </button>
            ))}
            {tagFilter && (
              <button 
                onClick={() => setTagFilter('')} 
                className="ml-2 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Wyczyść
              </button>
            )}
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-x-auto">
          <table className="w-full text-left text-sm align-middle">
            <thead className="bg-gradient-to-r from-pink-50/80 to-orange-50/80 text-gray-700 font-bold border-b border-gray-200/50">
              <tr>
                <th className="p-4">Tytuł</th>
                <th className="p-4">Kategoria</th>
                <th className="p-4">Tonacja</th>
                <th className="p-4">Tempo</th>
                <th className="p-4">Tagi</th>
                <th className="p-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {filteredSongs.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">
                  {songFilter || tagFilter ? 'Brak wyników wyszukiwania' : 'Brak pieśni - Dodaj pierwszą pieśń!'}
                </td></tr>
              ) : filteredSongs.map(s => (
                <tr key={s.id} className="hover:bg-pink-50/30 transition">
                  <td className="p-4 font-bold">{s.title}</td>
                  <td className="p-4">{s.category}</td>
                  <td className="p-4 font-mono font-bold text-pink-600">{s.key}</td>
                  <td className="p-4">{s.tempo || "-"}</td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {Array.isArray(s.tags) && s.tags.length > 0 ? s.tags.map((t, i) => (
                        <span 
                          key={i} 
                          className="bg-gradient-to-r from-pink-100 to-orange-100 px-2 py-1 text-xs rounded-full text-pink-800 border border-pink-200/50 font-medium"
                        >
                          {t}
                        </span>
                      )) : <span className="text-gray-400 text-xs">-</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setShowSongDetails(s)} 
                        className="text-gray-800 font-semibold px-3 py-1.5 rounded-xl hover:bg-white/50 transition"
                      >
                        Szczegóły
                      </button>
                      <button 
                        onClick={() => { setSongForm(s); setShowSongModal(true); }} 
                        className="text-pink-600 hover:text-orange-600 font-medium transition"
                      >
                        Edytuj
                      </button>
                      <button 
                        onClick={() => deleteSong(s.id)} 
                        className="text-red-500 hover:text-red-700 font-medium transition"
                      >
                        Usuń
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODALS */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-6 border border-white/20">
            <div className="flex justify-between mb-6">
              <h3 className="font-bold text-xl bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                {memberForm.id ? 'Edytuj członka' : 'Nowy członek'}
              </h3>
              <button 
                onClick={() => setShowMemberModal(false)} 
                className="p-2 hover:bg-gray-100/50 rounded-xl transition"
              >
                <X size={20}/>
              </button>
            </div>
            <div className="space-y-4">
              <input 
                className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" 
                placeholder="Imię i nazwisko" 
                value={memberForm.full_name} 
                onChange={e => setMemberForm({...memberForm, full_name: e.target.value})} 
              />
              <input 
                className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" 
                placeholder="Rola (np. Wokal)" 
                value={memberForm.role} 
                onChange={e => setMemberForm({...memberForm, role: e.target.value})} 
              />
              <input 
                className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" 
                placeholder="Telefon" 
                value={memberForm.phone} 
                onChange={e => setMemberForm({...memberForm, phone: e.target.value})} 
              />
              <input 
                className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" 
                placeholder="Email" 
                value={memberForm.email} 
                onChange={e => setMemberForm({...memberForm, email: e.target.value})} 
              />
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowMemberModal(false)} 
                  className="px-5 py-2.5 border border-gray-200/50 rounded-xl bg-white/50 hover:bg-white transition"
                >
                  Anuluj
                </button>
                <button 
                  onClick={saveMember} 
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-pink-500/50 transition font-medium"
                >
                  Zapisz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSongModal && (
        <SongForm 
          initialData={songForm} 
          onSave={async (data) => {
            try {
              const cleanData = {
                title: (data.title || '').trim(),
                category: (data.category || '').trim(),
                key: (data.key || 'C').trim(),
                tempo: data.tempo ? parseInt(data.tempo) : null,
                meter: (data.meter || '').trim(),
                tags: Array.isArray(data.tags) ? data.tags : [],
                chords_bars: (data.chords_bars || '').trim(),
                lyrics: (data.lyrics || '').trim(),
                lyrics_chords: (data.lyrics_chords || '').trim(),
                sheet_music_url: (data.sheet_music_url || '').trim(),
                attachments: Array.isArray(data.attachments) ? data.attachments : []
              };

              console.log('Wysyłam do Supabase:', cleanData);

              if (data.id) {
                const { error } = await supabase.from('songs').update(cleanData).eq('id', data.id);
                if (error) throw error;
              } else {
                const { error } = await supabase.from('songs').insert([cleanData]);
                if (error) throw error;
              }
              
              setShowSongModal(false);
              await fetchData();
            } catch (err) {
              console.error('Błąd zapisywania pieśni:', err);
              alert('Błąd: ' + (err.message || 'Nie udało się zapisać pieśni'));
            }
          }}
          onCancel={() => setShowSongModal(false)}
        />
      )}

      {showSongDetails && (
        <SongDetailsModal
          song={showSongDetails}
          onClose={() => setShowSongDetails(null)}
          onEdit={() => {
            setSongForm(showSongDetails);
            setShowSongModal(true);
            setShowSongDetails(null);
          }}
        />
      )}
    </div>
  );
}
