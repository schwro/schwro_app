import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const generatePDF = (program, songsMap) => {
  const printWindow = window.open('', '', 'width=800,height=600');
  
  let songsHtml = '';
  const uniqueSongIds = new Set();
  
  program.schedule?.forEach(item => {
    if(item.songIds) {
      item.songIds.forEach(id => uniqueSongIds.add(id));
    }
  });

  uniqueSongIds.forEach(id => {
    const song = songsMap[id];
    if(song) {
      songsHtml += `
        <div class="page-break" style="margin-top: 2rem; border: 1px solid #ccc; padding: 2rem;">
          <h2 style="text-align: center;">${song.title}</h2>
          <div style="text-align: center; color: gray; margin-bottom: 1rem;">
            Tonacja: ${song.key} | Tempo: ${song.tempo} BPM
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <pre style="font-family: monospace; white-space: pre-wrap;">${song.lyrics}</pre>
            <pre style="font-family: monospace; white-space: pre-wrap;">${song.chords || ''}</pre>
          </div>
        </div>
      `;
    }
  });

  const html = `
    <html>
      <head><title>Program ${program.date}</title>
      <style>
        body { font-family: sans-serif; padding: 2rem; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
        th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
        .page-break { page-break-before: always; }
        @media print { .no-print { display: none; } }
      </style></head>
      <body>
        <h1 style="text-align: center;">Nabożeństwo: ${program.date}</h1>
        <table>
          <thead><tr><th>Element</th><th>Osoba</th><th>Szczegóły</th></tr></thead>
          <tbody>
            ${program.schedule?.map(row => `
              <tr>
                <td><strong>${row.title}</strong></td>
                <td>${row.person || ''}</td>
                <td>${row.details || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${songsHtml}
        <div class="no-print" style="position: fixed; bottom: 20px; right: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: blue; color: white; border: none; cursor: pointer;">DRUKUJ</button>
        </div>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};
