<!-- PDFViewer.svelte -->
<script>
  import { onMount } from 'svelte';
  import { PDFDocument, rgb } from 'pdf-lib';
  import PocketBase from 'pocketbase';

  export let pdfUrl = '';
  export let pdfId = '';
  
  const pb = new PocketBase('http://127.0.0.1:8090'); // Adjust to your PocketBase URL
  
  let pdfViewer;
  let canvas;
  let ctx;
  let pdfDoc;
  let currentPage = 1;
  let totalPages = 0;
  let scale = 1.5;
  let isSignMode = false;
  let isDrawing = false;
  let signatures = [];
  let currentSignature = [];
  
  // Load PDF
  onMount(async () => {
    if (pdfUrl) {
      await loadPDF(pdfUrl);
    }
  });
  
  async function loadPDF(url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      
      // Load with pdf-lib for editing
      pdfDoc = await PDFDocument.load(arrayBuffer);
      totalPages = pdfDoc.getPageCount();
      
      // Also load with PDF.js for viewing (you'll need to include PDF.js)
      const pdfjsLib = window.pdfjsLib;
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      
      renderPage(currentPage, pdf);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }
  
  async function renderPage(pageNum, pdf) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // Redraw signatures on this page
    redrawSignatures();
  }
  
  function toggleSignMode() {
    isSignMode = !isSignMode;
    canvas.style.cursor = isSignMode ? 'crosshair' : 'default';
  }
  
  // Drawing functions
  function startDrawing(event) {
    if (!isSignMode) return;
    
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    currentSignature = [{ x, y, page: currentPage }];
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }
  
  function draw(event) {
    if (!isDrawing || !isSignMode) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    currentSignature.push({ x, y, page: currentPage });
    
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  
  function stopDrawing() {
    if (!isDrawing) return;
    
    isDrawing = false;
    if (currentSignature.length > 0) {
      signatures.push([...currentSignature]);
      currentSignature = [];
    }
  }
  
  function redrawSignatures() {
    signatures.forEach(signature => {
      if (signature.length > 0 && signature[0].page === currentPage) {
        ctx.beginPath();
        ctx.moveTo(signature[0].x, signature[0].y);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        signature.forEach((point, index) => {
          if (index > 0) {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      }
    });
  }
  
  function clearSignatures() {
    signatures = signatures.filter(sig => sig[0]?.page !== currentPage);
    const pdf = window.pdfjsLib.getDocument(pdfUrl);
    pdf.promise.then(pdfDoc => renderPage(currentPage, pdfDoc));
  }
  
  async function savePDF() {
    try {
      // Add signatures to PDF using pdf-lib
      signatures.forEach(signature => {
        if (signature.length > 0) {
          const page = pdfDoc.getPage(signature[0].page - 1);
          const { height } = page.getSize();
          
          // Convert canvas coordinates to PDF coordinates
          signature.forEach((point, index) => {
            if (index > 0) {
              const prevPoint = signature[index - 1];
              // Convert coordinates (canvas uses top-left origin, PDF uses bottom-left)
              const x1 = prevPoint.x / scale;
              const y1 = height - (prevPoint.y / scale);
              const x2 = point.x / scale;
              const y2 = height - (point.y / scale);
              
              page.drawLine({
                start: { x: x1, y: y1 },
                end: { x: x2, y: y2 },
                thickness: 1,
                color: rgb(0, 0, 0),
              });
            }
          });
        }
      });
      
      const pdfBytes = await pdfDoc.save();
      
      // Save to PocketBase
      if (pdfId) {
        const formData = new FormData();
        formData.append('pdf', new Blob([pdfBytes], { type: 'application/pdf' }), 'signed.pdf');
        
        await pb.collection('documents').update(pdfId, formData);
        alert('PDF saved successfully!');
      } else {
        // Download the PDF
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'signed-document.pdf';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      alert('Error saving PDF');
    }
  }
  
  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
      const pdf = window.pdfjsLib.getDocument(pdfUrl);
      pdf.promise.then(pdfDoc => renderPage(currentPage, pdfDoc));
    }
  }
  
  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      const pdf = window.pdfjsLib.getDocument(pdfUrl);
      pdf.promise.then(pdfDoc => renderPage(currentPage, pdfDoc));
    }
  }
  
  function zoomIn() {
    scale += 0.2;
    const pdf = window.pdfjsLib.getDocument(pdfUrl);
    pdf.promise.then(pdfDoc => renderPage(currentPage, pdfDoc));
  }
  
  function zoomOut() {
    if (scale > 0.4) {
      scale -= 0.2;
      const pdf = window.pdfjsLib.getDocument(pdfUrl);
      pdf.promise.then(pdfDoc => renderPage(currentPage, pdfDoc));
    }
  }
</script>

<svelte:head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  </script>
</svelte:head>

<div class="pdf-viewer-container">
  <!-- Toolbar -->
  <div class="toolbar">
    <div class="nav-controls">
      <button on:click={prevPage} disabled={currentPage <= 1}>Previous</button>
      <span>Page {currentPage} of {totalPages}</span>
      <button on:click={nextPage} disabled={currentPage >= totalPages}>Next</button>
    </div>
    
    <div class="zoom-controls">
      <button on:click={zoomOut}>Zoom Out</button>
      <span>{Math.round(scale * 100)}%</span>
      <button on:click={zoomIn}>Zoom In</button>
    </div>
    
    <div class="sign-controls">
      <button 
        class="pencil-btn {isSignMode ? 'active' : ''}" 
        on:click={toggleSignMode}
        title="Toggle Sign Mode"
      >
        ✏️ Sign
      </button>
      <button on:click={clearSignatures}>Clear Page</button>
      <button on:click={savePDF} class="save-btn">Save PDF</button>
    </div>
  </div>

  <!-- PDF Canvas -->
  <div class="canvas-container">
    <canvas 
      bind:this={canvas}
      on:mousedown={startDrawing}
      on:mousemove={draw}
      on:mouseup={stopDrawing}
      on:mouseleave={stopDrawing}
    ></canvas>
  </div>
</div>

<style>
  .pdf-viewer-container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f5f5f5;
  }
  
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: white;
    border-bottom: 1px solid #ddd;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .nav-controls, .zoom-controls, .sign-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  button {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    background: white;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  button:hover:not(:disabled) {
    background: #f0f0f0;
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .pencil-btn {
    font-size: 1rem;
  }
  
  .pencil-btn.active {
    background: #007bff;
    color: white;
  }
  
  .save-btn {
    background: #28a745;
    color: white;
  }
  
  .save-btn:hover {
    background: #218838;
  }
  
  .canvas-container {
    flex: 1;
    overflow: auto;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 2rem;
  }
  
  canvas {
    border: 1px solid #ddd;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    background: white;
    max-width: 100%;
    height: auto;
  }
  
  @media (max-width: 768px) {
    .toolbar {
      flex-direction: column;
      align-items: stretch;
    }
    
    .nav-controls, .zoom-controls, .sign-controls {
      justify-content: center;
    }
    
    .canvas-container {
      padding: 1rem;
    }
  }
</style>