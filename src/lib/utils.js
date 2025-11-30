import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


// src/lib/utils.js

export const generatePDF = (program, songsMap) => {
  const formatDateFull = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('pl-PL', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Liczy wszystkie pieśni w całym planie - numeracja ciągła
  let songCounter = 0;
  const songNumberMap = {};

  const renderScheduleTable = () => {
    // Najpierw zlicz wszystkie pieśni z "Uwielbienia" aby mieć ciągłą numerację
    program.schedule?.forEach(row => {
      if ((row.element || '').toLowerCase().includes('uwielbienie') && row.selectedSongs?.length > 0) {
        row.selectedSongs.forEach(s => {
          songCounter++;
          songNumberMap[s.songId] = songCounter;
        });
      }
    });

    return `
      <div style="margin-bottom: 48px; page-break-inside: avoid;">
        <h2 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Plan szczegółowy</h2>
        <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Element</th>
              <th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Osoba</th>
              <th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Szczegóły</th>
            </tr>
          </thead>
          <tbody>
            ${program.schedule?.map((row, idx) => `
              <tr style="border-bottom: 1px solid #e5e7eb; ${idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f9fafb;'}">
                <td style="padding: 12px 16px; color: #1f2937; font-weight: 600; font-size: 13px;">
                  ${row.element || '-'}
                </td>
                <td style="padding: 12px 16px; color: #4b5563; font-size: 13px; font-weight: 500;">${row.person || '-'}</td>
                <td style="padding: 12px 16px; color: #4b5563; font-size: 13px;">
                  ${(row.element || '').toLowerCase().includes('uwielbienie') && row.selectedSongs?.length > 0 ? 
                    `<div style="display: flex; flex-direction: column; gap: 4px;">
                      ${row.selectedSongs.map((s) => {
                        const song = songsMap[s.songId];
                        const songNum = songNumberMap[s.songId];
                        return song ? `
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-weight: 600; color: #3b82f6;">${songNum}.</span>
                            <span style="background-color: #eef2ff; color: #3b82f6; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                              ${song.title} <span style="font-weight: 700;">[${s.key}]</span>
                            </span>
                          </div>
                        ` : '';
                      }).join('')}
                    </div>` 
                    : (row.details || '-')}
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
      <div style="page-break-inside: avoid; margin-bottom: 24px; background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
        <h3 style="font-size: 14px; font-weight: 700; color: #1f2937; margin-top: 0; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.3px;">
          ${title}
        </h3>
        <div style="display: grid; grid-template-columns: ${filledFields.length === 1 ? '1fr' : 'repeat(2, 1fr)'}; gap: 20px;">
          ${filledFields.map(field => `
            <div>
              <div style="font-size: 11px; font-weight: 600; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px;">
                ${field.label}
              </div>
              <div style="font-size: 13px; color: #1f2937; line-height: 1.5; font-weight: 500;">
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
      { 
        title: 'Atmosfera Team', 
        data: program.atmosfera_team, 
        fields: [
          { key: 'przygotowanie', label: 'Przygotowanie' },
          { key: 'witanie', label: 'Witanie' }
        ] 
      },
      { 
        title: 'Produkcja', 
        data: program.produkcja, 
        fields: [
          { key: 'naglosnienie', label: 'Nagłośnienie' },
          { key: 'propresenter', label: 'ProPresenter' },
          { key: 'social', label: 'Social Media' },
          { key: 'host', label: 'Host' }
        ] 
      },
      { 
        title: 'Scena', 
        data: program.scena, 
        fields: [
          { key: 'prowadzenie', label: 'Prowadzenie' },
          { key: 'modlitwa', label: 'Modlitwa' },
          { key: 'kazanie', label: 'Kazanie' },
          { key: 'wieczerza', label: 'Wieczerza' },
          { key: 'ogloszenia', label: 'Ogłoszenia' }
        ] 
      },
      { 
        title: 'Szkółka Niedzielna', 
        data: program.szkolka, 
        fields: [
          { key: 'mlodsza', label: 'Grupa Młodsza' },
          { key: 'srednia', label: 'Grupa Średnia' },
          { key: 'starsza', label: 'Grupa Starsza' }
        ] 
      },
      { 
        title: 'Zespół Uwielbienia', 
        data: program.zespol, 
        fields: [
          { key: 'lider', label: 'Lider Uwielbienia' },
          { key: 'piano', label: 'Piano' },
          { key: 'gitara_akustyczna', label: 'Gitara Akustyczna' },
          { key: 'gitara_elektryczna', label: 'Gitara Elektryczna' },
          { key: 'bas', label: 'Gitara Basowa' },
          { key: 'wokale', label: 'Wokale' },
          { key: 'cajon', label: 'Cajon / Perkusja' }
        ] 
      }
    ];

    return sectionConfigs.map(section => {
      const filledFields = section.fields
        .filter(f => section.data?.[f.key]?.trim())
        .map(f => ({ label: f.label, value: section.data?.[f.key] }));
      
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
            
            allSongs.push({ 
              ...song, 
              selectedKey: s.key,
              finalChords: chordsContent,
              songNumber: songNumberMap[s.songId]
            });
          }
        });
      }
    });

    if (allSongs.length === 0) return '';

    return allSongs.map((song, idx) => `
      <div style="page-break-before: always; page-break-inside: avoid; padding: 5px 0 40px 0;">
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 600; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
            Pieśń ${song.songNumber}
          </div>
          <h2 style="font-size: 28px; font-weight: 700; color: #1f2937; margin: 0; line-height: 1.3;">
            ${song.title}
          </h2>
        </div>
        
        <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; padding: 12px 0;">
          <div style="text-align: center;">
            <div style="font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 3px;">
              Tonacja
            </div>
            <div style="font-size: 16px; font-weight: 700; color: #3b82f6;">
              [${song.selectedKey || '-'}]
            </div>
          </div>
          ${song.meter ? `
            <div style="text-align: center;">
              <div style="font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 3px;">
                Metrum
              </div>
              <div style="font-size: 14px; font-weight: 600; color: #1f2937;">
                ${song.meter}
              </div>
            </div>
          ` : ''}
          ${song.tempo ? `
            <div style="text-align: center;">
              <div style="font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 3px;">
                Tempo
              </div>
              <div style="font-size: 14px; font-weight: 600; color: #1f2937;">
                ${song.tempo} BPM
              </div>
            </div>
          ` : ''}
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 24px;">
          <div>
            <h3 style="font-size: 12px; font-weight: 600; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 12px;">Tekst</h3>
            <div style="font-size: 13px; line-height: 1.5; color: #1f2937; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; padding: 16px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); min-height: 400px;">
              ${song.lyrics || '<span style="color:#9ca3af; font-style:italic;">Brak tekstu</span>'}
            </div>
          </div>
          <div>
            <h3 style="font-size: 12px; font-weight: 600; color: #8b5cf6; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 12px;">Akordy w taktach</h3>
            <div style="padding: 16px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; font-size: 13px; line-height: 1.5; color: #1f2937; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; font-weight: 600; min-height: 400px;">
              ${song.finalChords || '<span style="color:#9ca3af; font-style:italic;">Brak akordów</span>'}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Program nabożeństwa</title>
      <style>
        @page { 
          size: A4; 
          margin: 20mm; 
        }
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .container { padding: 0; margin: 0; }
        }
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        html, body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
          background: white;
        }
        body { 
          color: #1f2937; 
          line-height: 1.6; 
        }
        .container { 
          max-width: 210mm;
          margin: 0 auto;
          padding: 0;
          background: white;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          padding-bottom: 24px; 
          border-bottom: 2px solid #e5e7eb;
          page-break-after: avoid;
        }
        .header h1 { 
          font-size: 40px; 
          font-weight: 700; 
          color: #1f2937;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .header .date { 
          font-size: 14px; 
          color: #6b7280; 
          font-weight: 500;
          text-transform: capitalize;
        }
        .sections-wrapper {
          margin-bottom: 48px;
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Program nabożeństwa</h1>
          <div class="date">${formatDateFull(program.date)}</div>
        </div>

        ${renderScheduleTable()}

        <div class="sections-wrapper">
          ${renderSections()}
        </div>

        ${renderSongsPages()}
      </div>

      <script>
        window.onload = function() {
          setTimeout(() => {
            window.print();
          }, 100);
        };
      </script>
    </body>
    </html>
  `;

  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  } else {
    alert('Proszę wyłączyć blokadę wyskakujących okien');
  }
};
