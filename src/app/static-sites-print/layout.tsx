// This layout has NO <html> or <body> — it inherits from root layout.
// Near-identical to /rate-card-print/layout.tsx — same A4 landscape CSS.
import "../globals.css";

export default function StaticSitesPrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* SCREEN: reset everything to a clean white canvas */
            html, body {
              background: white !important;
              background-image: none !important;
              margin: 0 !important;
              padding: 0 !important;
              min-height: 0 !important;
              color: #0a0a0a !important;
            }
            /* Hide root layout's background image + dark overlay divs */
            body > div:nth-child(1),
            body > div:nth-child(2) {
              display: none !important;
            }
            /* Neutralise the content wrapper from root layout */
            body > div:nth-child(3) {
              position: static !important;
              z-index: auto !important;
              background: white !important;
              min-height: 0 !important;
            }
            /* SCREEN ONLY: add visual gap between pages so they look like a deck. */
            @media screen {
              [data-print-page="true"] {
                margin-bottom: 16px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.08);
              }
            }

            /* PRINT: force A4 landscape using explicit dimensions */
            @media print {
              @page {
                size: 297mm 210mm;
                margin: 0;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                background-image: none !important;
                color: #0a0a0a !important;
                min-height: 0 !important;
                width: 1100px !important;
                height: auto !important;
              }
              body > div:nth-child(1),
              body > div:nth-child(2) {
                display: none !important;
              }
              body > div:nth-child(3) {
                position: static !important;
                z-index: auto !important;
                background: white !important;
              }
              #rate-card-root {
                padding: 0 !important;
                margin: 0 !important;
              }
              .no-print { display: none !important; }
              [data-print-page="true"] {
                width: 1123px !important;
                height: 780px !important;
                max-height: 780px !important;
                min-height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                position: relative !important;
                box-shadow: none !important;
              }
              [data-print-page="true"]:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }
              [data-print-page="true"] > * {
                max-height: 780px !important;
                overflow: hidden !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
          `,
        }}
      />
      {children}
    </>
  );
}
