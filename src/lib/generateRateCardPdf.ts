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
    // 2. Wait for the iframe to load AND for the print pages to appear in its DOM
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Iframe load timeout")), 30000);
      iframe.onload = async () => {
        try {
          const doc = iframe.contentDocument;
          if (!doc) throw new Error("No iframe document");

          // Poll for print pages to appear (the print page mounts client-side)
          const start = Date.now();
          while (Date.now() - start < 15000) {
            const pages = doc.querySelectorAll('[data-print-page="true"]');
            if (pages.length > 0) {
              // Also wait for images inside to load
              const images = Array.from(doc.querySelectorAll("img"));
              await Promise.all(
                images.map(img =>
                  img.complete
                    ? Promise.resolve()
                    : new Promise<void>(res => {
                        img.onload = () => res();
                        img.onerror = () => res();
                        // Safety timeout
                        setTimeout(() => res(), 5000);
                      })
                )
              );
              // Small buffer for fonts
              await new Promise(r => setTimeout(r, 800));
              clearTimeout(timeout);
              resolve();
              return;
            }
            await new Promise(r => setTimeout(r, 200));
          }
          clearTimeout(timeout);
          reject(new Error("Print pages did not render"));
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
    for (let i = 0; i < pages.length; i++) {
      opts.onProgress?.(i + 1, pages.length, `Rendering page ${i + 1} of ${pages.length}…`);

      const pageEl = pages[i];
      const canvas = await html2canvas(pageEl, {
        scale: 2, // 2x for sharp text/images
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        windowWidth: 1400,
        windowHeight: 900,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      if (i > 0) pdf.addPage("a4", "landscape");
      pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMm, pageHeightMm, undefined, "FAST");
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
