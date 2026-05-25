// This layout has NO <html> or <body> — it inherits from root layout.
// We inject print-specific styles and ensure clean white background.
import "../globals.css";

export default function RateCardPrintLayout({
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

            /* PRINT: force A4 landscape, kill all inherited print styles */
            @media print {
              @page {
                size: A4 landscape;
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
              /* Reset the rate card root container in print */
              #rate-card-root {
                padding: 0 !important;
                margin: 0 !important;
              }
              /* Hide the print toolbar + spacer */
              .no-print { display: none !important; }
              /* Every printable page = exactly one A4 landscape canvas (1100x780 with safety margin),
                 fits within 1123x794 (96dpi A4 landscape) leaving room for browser rounding. */
              [data-print-page="true"] {
                width: 1100px !important;
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
              }
              [data-print-page="true"]:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }
              /* Force all immediate children of a print page to not stretch past */
              [data-print-page="true"] > * {
                max-height: 780px !important;
                overflow: hidden !important;
              }

              /* Kill the globals.css print rule forcing dark body */
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
