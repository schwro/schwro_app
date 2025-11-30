import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Trash2, X, FileText, Music, Calendar } from 'lucide-react';
import SongForm from './SongForm';

const TAGS = [
  "intymna", "modlitewna", "niedzielna", "popularna", "szybko", "uwielbienie", "wolna"
];
const CHORDS = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];

function transposeChord(chord, steps) {
  const idx = CHORDS.findIndex(c => chord.startsWith(c));
  if (idx === -1) return chord;
  const mod = (idx + steps + 12) % 12;
  return chord.replace(CHORDS[idx], CHORDS[mod]);
}

function transposeLine(line, steps) {
  return line.replace(/\b([A-G][b#]?)(m7|m|7|sus4|add2|dim|aug|maj7)?(\/[A-G][b#]?)?\b/g,
    (all, root, qual, bass) => transposeChord(root, steps) + (qual || "") + (bass || ""));
}

function SongDetailsModal({ song, onClose, onEdit }) {
  const [transpose, setTranspose] = useState(0);
  const originalKey = song.key || "C";
  const actualKeyIdx = CHORDS.indexOf(originalKey);
  const displayKey = CHORDS[(actualKeyIdx + transpose + 12) % 12];

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

  // FUNKCJA GENEROWANIA PDF Z POLSKIMI ZNAKAMI I NOWOCZESNYM DESIGNEM
  const generatePDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      doc.setFont('helvetica');

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const colWidth = (pageWidth - margin * 3) / 2;
      let yPos = margin;

      // HEADER Z GRADIENTEM
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setFillColor(147, 51, 234);
      doc.circle(pageWidth, 10, 20, 'F');

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(song.title || 'Bez tytułu', margin, 18);

      doc.setTextColor(0, 0, 0);
      yPos = 30;

      // META: Tonacja, Tempo, Metrum
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      doc.setFillColor(229, 231, 235);
      doc.rect(margin, yPos - 4, pageWidth - margin * 2, 12, 'F');
      
      doc.setFont('helvetica', 'bold');
      const metaText = `Tonacja: ${displayKey} (oryginalna: ${originalKey}) | Tempo: ${song.tempo ? song.tempo + ' BPM' : '–'} | Metrum: ${song.meter || '–'}`;
      doc.text(metaText, margin + 3, yPos + 2);
      yPos += 18;

      // SEPARACJA
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += 4;

      // DWIE KOLUMNY Z NAGŁÓWKAMI
      const leftColX = margin;
      const rightColX = margin + colWidth + margin;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(219, 234, 254);
      doc.rect(leftColX, yPos - 3, colWidth - 1, 7, 'F');
      doc.rect(rightColX, yPos - 3, colWidth - 1, 7, 'F');
      
      doc.setTextColor(30, 58, 138);
      doc.text('TREŚĆ', leftColX + 2, yPos + 1);
      doc.text('AKORDY W TAKTACH', rightColX + 2, yPos + 1);
      
      doc.setTextColor(0, 0, 0);
      yPos += 8;

      // ZAWARTOŚĆ KOLUMN
      const lyricsLines = (song.lyrics || '(brak tekstu)').split('\n');
      const chordLines = (transposedChordsBars || '(brak akordów)').split('\n');
      const maxLines = Math.max(lyricsLines.length, chordLines.length);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      for (let i = 0; i < maxLines; i++) {
        if (yPos > pageHeight - margin - 5) {
          doc.addPage();
          yPos = margin;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setFillColor(219, 234, 254);
          doc.rect(leftColX, yPos - 3, colWidth - 1, 7, 'F');
          doc.rect(rightColX, yPos - 3, colWidth - 1, 7, 'F');
          
          doc.setTextColor(30, 58, 138);
          doc.text('TREŚĆ', leftColX + 2, yPos + 1);
          doc.text('AKORDY W TAKTACH', rightColX + 2, yPos + 1);
          
          doc.setTextColor(0, 0, 0);
          yPos += 8;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
        }

        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(leftColX, yPos - 2, colWidth - 1, 4.5, 'F');
          doc.rect(rightColX, yPos - 2, colWidth - 1, 4.5, 'F');
        }

        const lyricLine = lyricsLines[i] || '';
        const chordLine = chordLines[i] || '';

        doc.setTextColor(60, 60, 60);
        doc.text(lyricLine, leftColX + 1, yPos, { maxWidth: colWidth - 3 });
        
        doc.setTextColor(37, 99, 235);
        doc.setFont('helvetica', 'bold');
        doc.text(chordLine, rightColX + 1, yPos, { maxWidth: colWidth - 3 });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        yPos += 4.5;
      }

      // FOOTER
      yPos = pageHeight - 12;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.text(`${song.title || 'Piesń'} | Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`, margin, yPos);
      
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Strona ${i}/${pageCount}`, pageWidth - margin - 15, yPos);
      }

      doc.save(`${song.title || 'piesn'}.pdf`);
    }).catch(err => {
      console.error('Błąd ładowania jsPDF:', err);
      alert('Nie udało się wygenerować PDF');
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl max-w-5xl w-full rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-white/20 max-h-[90vh]">
        
        <div className="flex justify-between items-center py-6 px-10 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/80 to-purple-50/80">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                    <span key={i} className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200/50">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">brak tagów</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-200/30 rounded-2xl p-5">
            <div className="text-xs font-semibold text-gray-500 mb-2">Tonacja</div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {displayKey}
              </span>
              <button
                onClick={() => setTranspose(transpose - 1)}
                className="px-4 py-2 rounded-xl border border-gray-300/50 bg-white/70 text-blue-700 font-bold hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white transition"
              >
                ▼ Niżej
              </button>
              <button
                onClick={() => setTranspose(transpose + 1)}
                className="px-4 py-2 rounded-xl border border-gray-300/50 bg-white/70 text-blue-700 font-bold hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white transition"
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
              <div className="font-bold text-blue-700 mb-2 flex items-center gap-2">
                <FileText size={18} />
                Tekst pieśni
              </div>
              <pre className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 text-sm font-mono text-gray-900 max-h-64 overflow-y-auto">
                {song.lyrics || "(brak tekstu)"}
              </pre>
            </div>
            <div>
              <div className="font-bold text-purple-700 mb-2 flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <Music size={18} />
                  Akordy w taktach
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(transposedChordsBars)}
                  className="text-xs text-gray-500 hover:text-blue-600 underline"
                >
                  Kopiuj
                </button>
              </div>
              <pre className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 text-sm font-mono text-gray-900 max-h-64 overflow-y-auto">
                {transposedChordsBars || "(brak akordów)"}
              </pre>
            </div>
          </div>

          <div>
            <div className="font-bold text-blue-700 mb-2 flex items-center gap-2">
              <Music size={18} />
              Tekst z akordami (pełna wersja)
            </div>
            <pre className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 backdrop-blur-sm border border-blue-200/30 rounded-xl p-5 text-sm font-mono text-gray-900 max-h-80 overflow-y-auto">
              {lyricsWithChords || "(brak)"}
            </pre>
          </div>

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
                  {file.name?.endsWith(".mp3") ? (
                    <Music size={20} className="text-blue-600" />
                  ) : (
                    <FileText size={20} className="text-purple-600" />
                  )}
                  <span className="font-semibold flex-1">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {file.size
                      ? file.size > 1024 * 1024
                        ? (file.size / 1024 / 1024).toFixed(1) + " MB"
                        : (file.size / 1024).toFixed(0) + " KB"
                      : ""}
                  </span>
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-xl border border-blue-200/50 hover:from-blue-200 hover:to-purple-200 transition font-semibold"
              >
                Zobacz nuty / nagranie ↗
              </a>
            ) : (
              <div className="text-gray-500 text-sm">Brak linku</div>
            )}
          </div>

          <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm border border-blue-200/30 rounded-2xl p-6">
            <div className="font-bold text-blue-700 mb-3 flex items-center gap-2">
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

        <div className="flex justify-end gap-4 p-6 border-t border-gray-200/50 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 font-medium rounded-xl hover:bg-white transition"
          >
            Zamknij
          </button>
          <button 
            onClick={generatePDF}
            className="px-7 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition"
          >
            Generuj PDF
          </button>
          <button
            onClick={onEdit}
            className="px-7 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition"
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
    try {
      const { data: t, error: teamError } = await supabase.from('worship_team').select('*').order('full_name');
      const { data: s, error: songsError } = await supabase.from('songs').select('*').order('title');
      
      if (teamError) console.error('Błąd pobierania zespołu:', teamError);
      if (songsError) console.error('Błąd pobierania pieśni:', songsError);
      
      setTeam(t || []);
      setSongs(s || []);
    } catch (err) {
      console.error('Błąd pobierania danych:', err);
    }
    setLoading(false);
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
      fetchData();
    } catch (err) {
      console.error('Błąd zapisywania członka:', err);
      alert('Błąd: ' + err.message);
    }
  };

  const deleteMember = async (id) => {
    if(confirm('Usunąć?')) {
      try {
        const { error } = await supabase.from('worship_team').delete().eq('id', id);
        if (error) throw error;
        fetchData();
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
        fetchData();
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

  if (loading) return <div className="p-10 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Grupa Uwielbienia</h1>
      </div>

      <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Członkowie Zespołu</h2>
          <button onClick={() => { setMemberForm({ id: null, full_name: '', role: '', status: 'Aktywny', phone: '', email: '' }); setShowMemberModal(true); }} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/50 transition flex items-center gap-2"><Plus size={18}/> Dodaj członka</button>
        </div>
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 text-gray-700 font-bold border-b border-gray-200/50">
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
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Brak danych</td></tr>
              ) : team.map(m => (
                <tr key={m.id} className="hover:bg-blue-50/30 transition">
                  <td className="p-4 font-medium">{m.full_name}</td>
                  <td className="p-4">{m.role}</td>
                  <td className="p-4"><span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200/50">{m.status}</span></td>
                  <td className="p-4">{m.phone}</td>
                  <td className="p-4">{m.email}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => { setMemberForm(m); setShowMemberModal(true); }} className="text-blue-600 hover:text-purple-600 font-medium transition">Edytuj</button>
                    <button onClick={() => deleteMember(m.id)} className="text-red-500 hover:text-red-700 font-medium transition">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Baza Pieśni</h2>
          <button onClick={() => { setSongForm({}); setShowSongModal(true); }} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition flex items-center gap-2"><Plus size={18}/> Dodaj pieśń</button>
        </div>
        <div className="bg-white/50 backdrop-blur-sm p-4 mb-4 rounded-2xl border border-gray-200/50 flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2">
            <Search className="text-gray-400" size={20} />
            <input className="w-full outline-none text-sm bg-transparent" placeholder="Szukaj pieśni..." value={songFilter} onChange={e => setSongFilter(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <input className="px-4 py-2 border border-gray-200/50 rounded-xl text-sm bg-white/50 backdrop-blur-sm" placeholder="Szukaj po tagach..." value={tagFilter} onChange={e => setTagFilter(e.target.value)} />
            {TAGS.map(tag => tagFilter !== tag && (
              <button key={tag} onClick={() => setTagFilter(tag)} className="bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-1.5 rounded-xl text-xs text-blue-800 border border-blue-200/50 hover:from-blue-100 hover:to-purple-100 transition font-medium">{tag}</button>
            ))}
            {tagFilter && <button onClick={() => setTagFilter('')} className="ml-2 text-sm text-gray-500 hover:text-gray-700 transition">Wyczyść</button>}
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-x-auto">
          <table className="w-full text-left text-sm align-middle">
            <thead className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 text-gray-700 font-bold border-b border-gray-200/50">
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
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Brak danych - Dodaj pierwszą pieśń!</td></tr>
              ) : filteredSongs.map(s => (
                <tr key={s.id} className="hover:bg-blue-50/30 transition">
                  <td className="p-4 font-bold">{s.title}</td>
                  <td className="p-4">{s.category}</td>
                  <td className="p-4 font-mono font-bold text-blue-600">{s.key}</td>
                  <td className="p-4">{s.tempo || "-"}</td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {Array.isArray(s.tags) && s.tags.length > 0 ? s.tags.map((t, i) => (
                        <span key={i} className="bg-gradient-to-r from-blue-100 to-purple-100 px-2 py-1 text-xs rounded-full text-blue-800 border border-blue-200/50 font-medium">{t}</span>
                      )) : <span className="text-gray-400 text-xs">-</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => setShowSongDetails(s)} className="text-gray-800 font-semibold px-3 py-1.5 rounded-xl hover:bg-white/50 transition">Szczegóły</button>
                    <button onClick={() => { setSongForm(s); setShowSongModal(true); }} className="text-blue-600 hover:text-purple-600 font-medium transition">Edytuj</button>
                    <button onClick={() => deleteSong(s.id)} className="text-red-500 hover:text-red-700 font-medium transition">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showMemberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-6 border border-white/20">
            <div className="flex justify-between mb-6"><h3 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Członek Zespołu</h3><button onClick={() => setShowMemberModal(false)} className="p-2 hover:bg-gray-100/50 rounded-xl transition"><X size={20}/></button></div>
            <div className="space-y-4">
              <input className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" placeholder="Imię i nazwisko" value={memberForm.full_name} onChange={e => setMemberForm({...memberForm, full_name: e.target.value})} />
              <input className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" placeholder="Rola (np. Wokal)" value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})} />
              <input className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" placeholder="Telefon" value={memberForm.phone} onChange={e => setMemberForm({...memberForm, phone: e.target.value})} />
              <input className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" placeholder="Email" value={memberForm.email} onChange={e => setMemberForm({...memberForm, email: e.target.value})} />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowMemberModal(false)} className="px-5 py-2.5 border border-gray-200/50 rounded-xl bg-white/50 hover:bg-white transition">Anuluj</button>
                <button onClick={saveMember} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition font-medium">Zapisz</button>
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
              // Walidacja i czyszczenie danych
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
              fetchData();
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
