export const generatePPT = (program, songsMap) => {
    const printWindow = window.open('', '', 'width=1000,height=700');
    
    // Pobierz unikalne pieśni
    const uniqueSongIds = new Set();
    program.schedule.forEach(item => item.songIds?.forEach(id => uniqueSongIds.add(id)));
  
    let slidesHtml = '';
    
    // SLAJD TYTUŁOWY
    slidesHtml += `
      <div class="slide title-slide">
        <h1>NABOŻEŃSTWO</h1>
        <h2>${program.date}</h2>
      </div>
    `;
  
    uniqueSongIds.forEach(id => {
      const song = songsMap[id];
      if(!song) return;
  
      // SLAJD TYTUŁOWY PIEŚNI
      slidesHtml += `
        <div class="slide song-title">
          <h1>${song.title}</h1>
          <div class="meta">${song.key} | ${song.tempo} BPM</div>
        </div>
      `;
  
      // PARSOWANIE ZWROTEK (proste dzielenie po pustych liniach)
      const sections = song.lyrics.split(/\n\s*\n/);
      sections.forEach(section => {
        if(section.trim()) {
          slidesHtml += `
            <div class="slide content">
              <div class="text">${section.replace(/\n/g, '<br/>')}</div>
            </div>
          `;
        }
      });
    });
  
    const html = `
      <html>
        <head>
          <title>Prezentacja - ${program.date}</title>
          <style>
            body { margin: 0; background: #000; color: white; font-family: Arial, sans-serif; }
            .slide { 
              height: 100vh; width: 100vw; 
              display: flex; flex-direction: column; justify-content: center; align-items: center; 
              text-align: center; page-break-after: always; border-bottom: 1px solid #333;
            }
            .title-slide h1 { font-size: 80px; margin: 0; }
            .title-slide h2 { font-size: 40px; color: #aaa; }
            .song-title h1 { font-size: 60px; color: #4da6ff; }
            .meta { font-size: 30px; color: #666; margin-top: 20px; }
            .content .text { font-size: 50px; line-height: 1.4; font-weight: bold; }
            @media print { 
              .slide { border: none; } 
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${slidesHtml}
          <div class="no-print" style="position:fixed; top:20px; right:20px; background:white; color:black; padding:20px;">
            <p>1. Naciśnij <strong>Ctrl+P</strong> (Drukuj)</p>
            <p>2. Wybierz "Zapisz jako PDF"</p>
            <p>3. Zaimportuj PDF do PowerPointa</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };
  