import "../../globals.css";

export default function ProposalScenariosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html, body {
              background: white !important;
              background-image: none !important;
              margin: 0 !important;
              padding: 0 !important;
              min-height: 0 !important;
              color: #111 !important;
            }
            body > div:nth-child(1),
            body > div:nth-child(2) {
              display: none !important;
            }
            body > div:nth-child(3) {
              position: static !important;
              z-index: auto !important;
              background: white !important;
              min-height: 0 !important;
            }
            @media screen {
              [data-print-page="true"] {
                margin-bottom: 16px;
                box-shadow: 0 4px 24px rgba(0,0,0,0.08);
              }
            }
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
                min-height: 0 !important;
                width: 1123px !important;
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
