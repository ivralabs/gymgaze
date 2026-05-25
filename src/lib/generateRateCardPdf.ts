/**
 * Client-side PDF generation for the rate card.
 *
 * Approach: open the /rate-card-print URL in a hidden iframe, wait for
 * the [data-print-page="true"] divs to render, capture each one with
 * html2canvas at 2x resolution, and stitch them into a landscape A4 PDF.
 *
 * No server, no Chromium, no print dialog. Just works.
 */

export type GenerateOptions = {
  venues: string[];
  cpm: number;
  weeks: number;
  clientName: string;
  flightStart: string;
  flightEnd: string;
  groupByCity: boolean;
  filename?: string;
  onProgress?: (current: number, total: number, label: string) => void;
};

export async function generateRateCardPdf(opts: GenerateOptions): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");
  const { default: jsPDF } = await import("jspdf");

  const params = new URLSearchParams({
    venues: opts.venues.join(","),
    cpm: opts.cpm.toString(),
    weeks: opts.weeks.toString(),
    client: opts.clientName,
    start: opts.flightStart,
    end: opts.flightEnd,
    groupByCity: opts.groupByCity.toString(),
    noAutoPrint: "1",
  });
  const printUrl = `/rate-card-print?${params.toString()}`;

  opts.onProgress?.(0, 1, "Loading rate card…");

  // 1. Mount an offscreen iframe
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-99999px";
  iframe.style.top = "0";
  iframe.style.width = "1400px";
  iframe.style.height = "900px";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  iframe.src = printUrl;
  document.body.appendChild(iframe);

  try {
    // 2. Wait for iframe load + print pages + images + fonts
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Iframe load timeout")), 45000);
      iframe.onload = async () => {
        try {
          const doc = iframe.contentDocument;
          const win = iframe.contentWindow;
          if (!doc || !win) throw new Error("No iframe document");

          // Poll for print pages to appear (the print page mounts client-side)
          const start = Date.now();
          while (Date.now() - start < 20000) {
            const pages = doc.querySelectorAll('[data-print-page="true"]');
            if (pages.length > 0) {
              // Wait for all images inside the iframe to fully load
              const images = Array.from(doc.querySelectorAll("img"));
              await Promise.all(
                images.map(img =>
                  img.complete && img.naturalWidth > 0
                    ? Promise.resolve()
                    : new Promise<void>(res => {
                        img.onload = () => res();
                        img.onerror = () => res();
                        setTimeout(() => res(), 8000);
                      })
                )
              );
              // Wait for fonts to load in the iframe (CRITICAL for typography)
              try {
                const fontFaceSet = (doc as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
                if (fontFaceSet?.ready) {
                  await fontFaceSet.ready;
                }
              } catch {}
              // Final settle buffer
              await new Promise(r => setTimeout(r, 1500));
              clearTimeout(timeout);
              resolve();
              return;
            }
            await new Promise(r => setTimeout(r, 200));
          }
          clearTimeout(timeout);
          reject(new Error("Print pages did not render in iframe"));
        } catch (e) {
          clearTimeout(timeout);
          reject(e);
        }
      };
      iframe.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Iframe failed to load"));
      };
    });

    const doc = iframe.contentDocument!;
    const pages = Array.from(doc.querySelectorAll<HTMLElement>('[data-print-page="true"]'));
    if (pages.length === 0) throw new Error("No print pages found");

    // 3. Create the landscape A4 PDF (297mm × 210mm)
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
    });
    const pageWidthMm = 297;
    const pageHeightMm = 210;

    // 4. Capture each page as canvas and add to PDF
    // Scroll each page into view inside the iframe before capture so html2canvas
    // captures the full element (Safari/html2canvas otherwise clip off-screen content).
    const iframeWin = iframe.contentWindow!;

    for (let i = 0; i < pages.length; i++) {
      opts.onProgress?.(i + 1, pages.length, `Rendering page ${i + 1} of ${pages.length}…`);

      const pageEl = pages[i];

      // Scroll the iframe so this page is at the top of the viewport
      pageEl.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
      iframeWin.scrollTo(0, pageEl.offsetTop);
      // Tiny wait for layout to settle
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(pageEl, {
        scale: 2.5, // higher scale = sharper output
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        // Tell html2canvas the exact dimensions of the element (no inference)
        width: pageEl.offsetWidth,
        height: pageEl.offsetHeight,
        windowWidth: iframeWin.innerWidth,
        windowHeight: iframeWin.innerHeight,
        // Don't try to capture from outside the element
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

      // PNG for sharp text + crisp lines. Larger files but the quality is worth it.
      const imgData = canvas.toDataURL("image/png");
      if (i > 0) pdf.addPage("a4", "landscape");
      pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, pageHeightMm, undefined, "FAST");
    }

    opts.onProgress?.(pages.length, pages.length, "Saving…");

    // 5. Save with proper filename
    const filename =
      opts.filename ||
      `GymGaze-Rate-Card-${opts.clientName ? opts.clientName.replace(/[^a-zA-Z0-9-]/g, "_") + "-" : ""}${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(iframe);
  }
}
