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
            html, body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            /* Hide root layout's background image + dark overlay */
            body > div:nth-child(1),
            body > div:nth-child(2) {
              display: none !important;
            }
            /* Reset the content wrapper */
            body > div:nth-child(3) {
              position: static !important;
              z-index: auto !important;
              background: white !important;
            }
            @media print {
              @page { size: A4 landscape; margin: 0; }
              html, body { margin: 0 !important; background: white !important; }
              .page-break { page-break-after: always; break-after: page; }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print { display: none !important; }
            }
          `,
        }}
      />
      {children}
    </>
  );
}
