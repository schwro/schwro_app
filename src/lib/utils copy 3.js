import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import jsPDF from 'jspdf';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const formatDateFull = (dateString) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  const formatted = date.toLocaleDateString('pl-PL', options);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const getPDFHtmlContent = (program, songsMap) => {
  let songCounter = 0;
  const songNumberMap = {};

  program.schedule?.forEach(row => {
    if ((row.element || '').toLowerCase().includes('uwielbienie') && row.selectedSongs?.length > 0) {
      row.selectedSongs.forEach(s => {
        songCounter++;
        songNumberMap[s.songId] = songCounter;
      });
    }
  });

  // --- STYLES & COMPONENTS ---
  
  const colors = {
    // Główny motyw (Plan, Pieśni) - PINK
    primary: '#db2777',      // Pink 600
    primaryLight: '#fdf2f8', // Pink 50
    primaryBorder: '#fbcfe8',// Pink 200
    
    // Motyw Sekcji (Zespoły) - ORANGE
    sectionAccent: '#ea580c', // Orange 600

    // Ogólne teksty - SLATE
    textMain: '#1e293b',     // Slate 800
    textMuted: '#64748b',    // Slate 500
    border: '#e2e8f0',       // Slate 200
    bgGray: '#f8fafc'        // Slate 50
  };

  // Funkcja do kolorowania słów kluczowych w akordach
  const formatChordsText = (text) => {
    if (!text) return '<span style="color:#9ca3af; font-style:italic;">Brak akordów</span>';
    
    // Lista słów do pokolorowania (regex case-insensitive)
    const pattern = /(intro|ref\.|zwr\.|bridge|tag|outro|pre-chorus|instrumentalne)/gi;
    
    // Podmiana na wersję z kolorem Orange
    return text.replace(pattern, (match) => 
      `<span style="color: ${colors.sectionAccent}; font-weight: 700;">${match}</span>`
    );
  };

  const renderScheduleTable = () => {
    return `
      <div style="margin-bottom: 40px;">
        <div style="display: flex; align-items: center; margin-bottom: 16px; border-bottom: 2px solid ${colors.primary}; padding-bottom: 8px;">
            <h2 style="font-family: 'Roboto', sans-serif; font-size: 18px; font-weight: 700; color: ${colors.textMain}; margin: 0;">
                PLAN SZCZEGÓŁOWY
            </h2>
        </div>
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed;">
          <thead>
            <tr style="background-color: ${colors.bgGray};">
              <th style="width: 20%; padding: 8px 12px; text-align: left; font-weight: 700; font-size: 10px; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.8px; border-top: 1px solid ${colors.border}; border-bottom: 1px solid ${colors.border}; font-family: 'Roboto', sans-serif;">Element</th>
              <th style="width: 35%; padding: 8px 12px; text-align: left; font-weight: 700; font-size: 10px; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.8px; border-top: 1px solid ${colors.border}; border-bottom: 1px solid ${colors.border}; font-family: 'Roboto', sans-serif;">Osoba Odpowiedzialna</th>
              <th style="width: 45%; padding: 8px 12px; text-align: left; font-weight: 700; font-size: 10px; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.8px; border-top: 1px solid ${colors.border}; border-bottom: 1px solid ${colors.border}; font-family: 'Roboto', sans-serif;">Szczegóły / Pieśni</th>
            </tr>
          </thead>
          <tbody>
            ${program.schedule?.map((row, idx) => `
              <tr style="border-bottom: 1px solid ${colors.border};">
                <td style="padding: 8px 12px; border-bottom: 1px solid ${colors.border}; color: ${colors.textMain}; font-weight: 600; font-size: 12px; font-family: 'Roboto', sans-serif; vertical-align: top; word-wrap: break-word;">
                  ${row.element || '-'}
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid ${colors.border}; vertical-align: top; word-wrap: break-word;">
                   ${row.person ? `
                    <span style="display: inline-block; background-color: #f1f5f9; color: #334155; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; font-family: 'Roboto', sans-serif; border: 1px solid #e2e8f0;">
                        ${row.person}
                    </span>
                   ` : '<span style="color: #cbd5e1; font-size: 11px;">-</span>'}
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid ${colors.border}; vertical-align: top;">
                  ${(row.element || '').toLowerCase().includes('uwielbienie') && row.selectedSongs?.length > 0 ? 
                    `<div style="display: flex; flex-direction: column; gap: 3px;">
                      ${row.selectedSongs.map((s) => {
                        const song = songsMap[s.songId];
                        const songNum = songNumberMap[s.songId];
                        return song ? `
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="display: flex; align-items: center; justify-content: center; width: 16px; height: 16px; background-color: ${colors.primary}; color: white; border-radius: 50%; font-size: 9px; font-weight: 700;">${songNum}</span>
                            <span style="font-size: 12px; font-weight: 500; color: ${colors.textMain}; font-family: 'Roboto', sans-serif;">
                              ${song.title} 
                            </span>
                            <span style="background-color: ${colors.primaryLight}; color: ${colors.primary}; padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: 700; border: 1px solid ${colors.primaryBorder};">${s.key}</span>
                          </div>
                        ` : '';
                      }).join('')}
                    </div>` 
                    : `<span style="color: ${colors.textMuted}; font-size: 12px; font-family: 'Roboto', sans-serif;">${row.details || '-'}</span>`}
                </td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
      </div>
    `;
  };

  const renderSectionCard = (title, fields) => {
    const filledFields = fields.filter(f => f.value?.trim());
    if (filledFields.length === 0) return '';

    return `
      <div style="page-break-inside: avoid; margin-bottom: 24px; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid ${colors.border}; border-top: 4px solid ${colors.sectionAccent};">
        <h3 style="font-family: 'Roboto', sans-serif; font-size: 13px; font-weight: 700; color: ${colors.textMuted}; margin-top: 0; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
          ${title}
        </h3>
        <div style="display: grid; grid-template-columns: ${filledFields.length === 1 ? '1fr' : 'repeat(2, 1fr)'}; gap: 20px;">
          ${filledFields.map(field => `
            <div>
              <div style="font-family: 'Roboto', sans-serif; font-size: 11px; font-weight: 600; color: ${colors.sectionAccent}; margin-bottom: 4px;">
                ${field.label}
              </div>
              <div style="font-family: 'Roboto', sans-serif; font-size: 13px; color: ${colors.textMain}; line-height: 1.4; font-weight: 500;">
                ${field.value}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const renderSections = () => {
    const sectionConfigs = [
      { title: 'Atmosfera Team', data: program.atmosfera_team, fields: [{ key: 'przygotowanie', label: 'Przygotowanie' }, { key: 'witanie', label: 'Witanie' }] },
      { title: 'Produkcja', data: program.produkcja, fields: [{ key: 'naglosnienie', label: 'Nagłośnienie' }, { key: 'propresenter', label: 'ProPresenter' }, { key: 'social', label: 'Social Media' }, { key: 'host', label: 'Host' }] },
      { title: 'Scena', data: program.scena, fields: [{ key: 'prowadzenie', label: 'Prowadzenie' }, { key: 'modlitwa', label: 'Modlitwa' }, { key: 'kazanie', label: 'Kazanie' }, { key: 'wieczerza', label: 'Wieczerza' }, { key: 'ogloszenia', label: 'Ogłoszenia' }] },
      { title: 'Szkółka Niedzielna', data: program.szkolka, fields: [{ key: 'mlodsza', label: 'Grupa Młodsza' }, { key: 'srednia', label: 'Grupa Średnia' }, { key: 'starsza', label: 'Grupa Starsza' }] },
      { title: 'Zespół Uwielbienia', data: program.zespol, fields: [{ key: 'lider', label: 'Lider Uwielbienia' }, { key: 'piano', label: 'Piano' }, { key: 'gitara_akustyczna', label: 'Gitara Akustyczna' }, { key: 'gitara_elektryczna', label: 'Gitara Elektryczna' }, { key: 'bas', label: 'Gitara Basowa' }, { key: 'wokale', label: 'Wokale' }, { key: 'cajon', label: 'Cajon / Perkusja' }] }
    ];

    return sectionConfigs.map(section => {
      const filledFields = section.fields.filter(f => section.data?.[f.key]?.trim()).map(f => ({ label: f.label, value: section.data?.[f.key] }));
      return renderSectionCard(section.title, filledFields);
    }).filter(s => s).join('');
  };

  const renderSongsPages = () => {
    const allSongs = [];
    program.schedule?.forEach(row => {
      if (row.selectedSongs?.length > 0) {
        row.selectedSongs.forEach(s => {
          const song = songsMap[s.songId];
          if (song) {
            const chordsContent = song.chords_bars || song.chords || '';
            allSongs.push({ ...song, selectedKey: s.key, finalChords: chordsContent, songNumber: songNumberMap[s.songId] });
          }
        });
      }
    });

    if (allSongs.length === 0) return '';

    return allSongs.map((song) => `
      <div style="page-break-before: always; page-break-inside: avoid; padding: 20px 0 40px 0;">
        <!-- Song Header -->
        <div style="border-bottom: 1px solid ${colors.border}; padding-bottom: 20px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div style="font-family: 'Roboto', sans-serif; font-size: 12px; font-weight: 700; color: ${colors.primary}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                        Pieśń #${song.songNumber}
                    </div>
                    <h2 style="font-family: 'Roboto', sans-serif; font-size: 32px; font-weight: 800; color: ${colors.textMain}; margin: 0; line-height: 1.2; letter-spacing: -0.5px;">${song.title}</h2>
                </div>
                <div style="display: flex; gap: 12px;">
                     <div style="background: ${colors.bgGray}; border: 1px solid ${colors.border}; padding: 8px 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 10px; text-transform: uppercase; color: ${colors.textMuted}; font-weight: 600; letter-spacing: 0.5px;">Tonacja</div>
                        <div style="font-size: 18px; font-weight: 700; color: ${colors.primary};">${song.selectedKey || '-'}</div>
                     </div>
                     ${song.tempo ? `
                     <div style="background: ${colors.bgGray}; border: 1px solid ${colors.border}; padding: 8px 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 10px; text-transform: uppercase; color: ${colors.textMuted}; font-weight: 600; letter-spacing: 0.5px;">Tempo</div>
                        <div style="font-size: 18px; font-weight: 700; color: ${colors.textMain};">${song.tempo}</div>
                     </div>` : ''}
                     ${song.meter ? `
                     <div style="background: ${colors.bgGray}; border: 1px solid ${colors.border}; padding: 8px 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 10px; text-transform: uppercase; color: ${colors.textMuted}; font-weight: 600; letter-spacing: 0.5px;">Metrum</div>
                        <div style="font-size: 18px; font-weight: 700; color: ${colors.textMain};">${song.meter}</div>
                     </div>` : ''}
                </div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
          <!-- Lyrics Card -->
          <div>
            <div style="background: white; border: 1px solid ${colors.border}; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden;">
                <div style="background: ${colors.bgGray}; padding: 12px 16px; border-bottom: 1px solid ${colors.border};">
                    <h3 style="font-family: 'Roboto', sans-serif; font-size: 12px; font-weight: 700; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Tekst</h3>
                </div>
                <div style="font-family: 'Roboto', sans-serif; font-size: 12px; line-height: 1.5; color: ${colors.textMain}; white-space: pre-wrap; padding: 20px; min-height: 300px;">${(song.lyrics || '').trim() || '<span style="color:#9ca3af; font-style:italic;">Brak tekstu</span>'}</div>
            </div>
          </div>

          <!-- Chords Card -->
          <div>
            <div style="background: white; border: 1px solid ${colors.border}; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden;">
                <div style="background: ${colors.primaryLight}; padding: 12px 16px; border-bottom: 1px solid ${colors.primaryBorder};">
                    <h3 style="font-family: 'Roboto', sans-serif; font-size: 12px; font-weight: 700; color: ${colors.primary}; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Akordy</h3>
                </div>
                <div style="padding: 20px; font-size: 12px; line-height: 1.5; color: ${colors.textMain}; white-space: pre-wrap; font-family: 'Roboto', sans-serif; font-weight: 600; min-height: 300px;">${formatChordsText((song.finalChords || '').trim())}</div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  };

  return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Program nabożeństwa</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
        
        /* Marginesy A4 i szerokości */
        @page { size: A4; margin: 15mm; margin-bottom: 20mm; }
        
        @media print { 
           body { margin: 0; padding: 0; background: white; font-family: 'Roboto', sans-serif !important; -webkit-print-color-adjust: exact; } 
           /* FIX STOPKI: Fixed w media print działa poprawnie tylko jako bezpośrednie dziecko body */
           .footer-print { position: fixed; bottom: 0; left: 0; right: 0; display: block !important; }
           .container { margin-bottom: 40px; }
           .page-1 { page-break-after: always; }
           .sections-wrapper { page-break-before: always; }
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif; background: white; }
        body { color: ${colors.textMain}; line-height: 1.5; }
        
        .container { max-width: 180mm; margin: 0 auto; padding: 0; background: white; padding-bottom: 50px; }
        
        /* Header */
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end; 
            margin-bottom: 40px; 
            padding-bottom: 24px; 
            border-bottom: 2px solid ${colors.border}; 
        }
        .header-content h1 { 
            font-family: 'Roboto', sans-serif; 
            font-size: 36px; 
            font-weight: 800; 
            color: ${colors.textMain}; 
            margin-bottom: 4px; 
            letter-spacing: -1px; 
            line-height: 1;
        }
        .header-content .subtitle {
            font-size: 14px;
            color: ${colors.textMuted};
            font-weight: 500;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .date-badge { 
            background-color: ${colors.primaryLight}; 
            color: ${colors.primary}; 
            font-family: 'Roboto', sans-serif; 
            font-size: 14px; 
            font-weight: 700; 
            padding: 8px 16px;
            border-radius: 8px;
            border: 1px solid ${colors.primaryBorder};
        }

        /* CSS STOPKA (dla window.print) */
        .footer-print {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            text-align: center;
            font-size: 10px;
            color: ${colors.textMuted};
            padding: 10px;
            background-color: white;
            border-top: 1px solid ${colors.border};
            font-family: 'Roboto', sans-serif;
            z-index: 1000;
        }

        .page-1 { page-break-after: always; }
        .sections-wrapper { page-break-before: always; margin-bottom: 48px; }
      </style>
    </head>
    <body>
      <!-- STOPKA POZA KONTENEREM -->
      <div class="footer-print">
          Wygenerowano w App SchWro Południe
      </div>

      <div class="container">
        <!-- STRONA 1 -->
        <div class="page-1">
          <div class="header">
            <div class="header-content">
                <div class="subtitle">IT Excellence • Church Manager</div>
                <h1>Program nabożeństwa</h1>
            </div>
            <div class="date-badge">${formatDateFull(program.date)}</div>
          </div>
          ${renderScheduleTable()}
        </div>

        <!-- STRONA 2 -->
        <div class="sections-wrapper">
           <div style="margin-bottom: 32px;">
                <h2 style="font-family: 'Roboto', sans-serif; font-size: 24px; font-weight: 800; color: ${colors.textMain}; margin-bottom: 8px;">Służby i Zespoły</h2>
                <p style="color: ${colors.textMuted}; font-size: 14px;">Szczegółowy podział obowiązków na dzisiejsze nabożeństwo.</p>
           </div>
          ${renderSections()}
        </div>

        <!-- STRONY 3+ -->
        ${renderSongsPages()}
      </div>
    </body>
    </html>
  `;
};

export const generatePDF = (program, songsMap) => {
  const htmlContent = getPDFHtmlContent(program, songsMap);
  const script = `
    <script>
      window.onload = function() {
        setTimeout(() => { window.print(); }, 100);
      };
    </script>
  `;
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(htmlContent + script);
    newWindow.document.close();
  } else {
    alert('Proszę wyłączyć blokadę wyskakujących okien');
  }
};

export const generatePDFBase64 = async (program, songsMap) => {
  // Modyfikujemy HTML dla jsPDF - ukrywamy HTML-ową stopkę, bo dodamy ją ręcznie
  let htmlContent = getPDFHtmlContent(program, songsMap);
  
  // Injectujemy styl ukrywający stopkę HTML w trybie jsPDF, żeby nie było duplikatów
  htmlContent = htmlContent.replace('</head>', '<style>.footer-print { display: none !important; }</style></head>');

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
  
  try {
    const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
    const binary = new Uint8Array(fontBytes);
    let binaryString = '';
    for (let i = 0; i < binary.length; i++) {
      binaryString += String.fromCharCode(binary[i]);
    }
    const base64Font = btoa(binaryString);
    
    doc.addFileToVFS("Roboto-Regular.ttf", base64Font);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto");
  } catch (error) {
    console.warn('Nie udało się załadować czcionki, używam domyślnej', error);
  }

  return new Promise((resolve, reject) => {
    try {
      doc.html(htmlContent, {
        callback: function (doc) {
          // RĘCZNE DODANIE STOPKI DLA JAZDEJ STRONY W JSPDF
          const totalPages = doc.internal.getNumberOfPages();
          doc.setFont("Roboto", "normal");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139); // Slate 500
          
          for (let i = 1; i <= totalPages; i++) {
             doc.setPage(i);
             // Pozycja: środek strony (105mm), dół strony (290mm)
             doc.text("Wygenerowano w App SchWro Południe", 105, 290, { align: "center" });
          }

          const dataUri = doc.output('datauristring');
          const base64 = dataUri.split(',')[1];
          resolve(base64);
        },
        x: 0,
        y: 0,
        width: 210,
        windowWidth: 800
      });
    } catch (error) {
      reject(error);
    }
  });
};
