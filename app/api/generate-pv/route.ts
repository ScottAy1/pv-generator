import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  WidthType,
  BorderStyle,
  PageBreak,
  AlignmentType,
  Header,
  Footer,
  VerticalAlign,
  LevelFormat,
} from 'docx';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      reportNumber,
      importer,
      transitaire,
      interventionDate,
      factureNumber,
      blNumber,
      location,
      containersAndSeals,
      images = [],
      numberOfPackages,
      packagingType,
      goodsNature,
      shipName,
      arrivalDate,
      loadingPort,
      dischargePort,
      grossOrArticle,
      constatations,
    } = data;

    // --- 1. GRAMMAR & LOGIC ---
    const containerItems = String(containersAndSeals ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const isPlural = containerItems.length > 1;
    const safeReportNumber = reportNumber ?? '';
    const safeImporter = importer ?? '';
    const safeTransitaire = transitaire ?? '';
    const safeInterventionDate = interventionDate ?? '';
    const safeFactureNumber = factureNumber ?? '';
    const safeBlNumber = blNumber ?? '';
    const safeLocation = location ?? '';
    const safePackages = numberOfPackages ?? '';
    const safePackagingType = packagingType ?? '';
    const safeGoodsNature = goodsNature ?? '';
    const safeGoodsState = 'Neuve et sous emballage';
    const safeShipName = shipName ?? '';
    const safeArrivalDate = arrivalDate ?? '';
    const safeLoadingPort = loadingPort ?? '';
    const safeDischargePort = dischargePort ?? 'Alger';
    const safeGrossOrArticle = grossOrArticle ?? '';
    const safeConstatations = constatations ?? '';
    const safeContainersText = containerItems.length ? containerItems.join(', ') : '';
    const todayFr = new Date().toLocaleDateString('fr-FR');
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const logoBuffer = await readFile(logoPath).catch(() => null);

    const constatationLines = String(safeConstatations)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^➢\s*/, ''));
    const grammar = {
      title: isPlural ? "Identification des conteneurs inspectés" : `Identification du conteneur inspecté (1 x 40' GP)`,
      intro: isPlural 
        ? "A notre arrivée sur site en présence du déclarant et l'agent de douane chargé du dossier et après pointage et ouverture des conteneurs nous avons constaté que la marchandise est en bon état et sous emballage ;" 
        : "A notre arrivée sur site en présence du déclarant et l'agent de douane chargé du dossier et après pointage et ouverture du conteneur nous avons constaté que la marchandise est en bon état et sous emballage ;",
    };

    // --- 2. IMAGE GRID FORMATTING ---
    const imageElements: Array<Table | Paragraph> = [];
    for (let i = 0; i < images.length; i += 4) {
      const chunk = images.slice(i, i + 4);
      
      const createCell = (imgBase64: string) => {
        const mimeMatch = imgBase64.match(/^data:image\/(png|jpe?g|gif|bmp);base64,/i);
        const imageType = (() => {
          const ext = mimeMatch?.[1]?.toLowerCase();
          if (ext === 'png') return 'png';
          if (ext === 'jpeg' || ext === 'jpg') return 'jpg';
          if (ext === 'gif') return 'gif';
          if (ext === 'bmp') return 'bmp';
          return 'jpg';
        })();

        return new TableCell({
          margins: { top: 200, bottom: 200, left: 200, right: 200 },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: Buffer.from((imgBase64.split('base64,')[1] ?? imgBase64), 'base64'),
                  type: imageType,
                  transformation: { width: 300, height: 350 }, // Adjusted to better match your vertical photos
                }),
              ],
            }),
          ],
        });
      };

      const row1Cells = [
        chunk[0] ? createCell(chunk[0]) : new TableCell({ children: [] }),
        chunk[1] ? createCell(chunk[1]) : new TableCell({ children: [] }),
      ];
      const row2Cells = [
        chunk[2] ? createCell(chunk[2]) : new TableCell({ children: [] }),
        chunk[3] ? createCell(chunk[3]) : new TableCell({ children: [] }),
      ];

      imageElements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
          },
          rows: [new TableRow({ children: row1Cells }), new TableRow({ children: row2Cells })],
        }),
        new Paragraph({ children: [new PageBreak()] }) 
      );
    }

    // --- 3. DOCUMENT ASSEMBLY ---
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: 'Times New Roman',
              size: 24,
            },
            paragraph: {
              spacing: {
                after: 200,
                line: 276,
              },
            },
          },
        },
      },
      numbering: {
        config: [
          {
            reference: 'identification-bullet',
            levels: [
              {
                level: 0,
                format: LevelFormat.BULLET,
                text: '●',
                alignment: AlignmentType.LEFT,
                style: {
                  run: {
                    font: 'Times New Roman',
                    size: 24,
                  },
                },
              },
            ],
          },
          {
            reference: 'general-info-dash',
            levels: [
              {
                level: 0,
                format: LevelFormat.BULLET,
                text: '—',
                alignment: AlignmentType.LEFT,
                style: {
                  run: {
                    font: 'Times New Roman',
                    size: 24,
                  },
                },
              },
            ],
          },
          {
            reference: 'constatations-arrow',
            levels: [
              {
                level: 0,
                format: LevelFormat.BULLET,
                text: '➢',
                alignment: AlignmentType.LEFT,
                style: {
                  run: {
                    font: 'Times New Roman',
                    size: 24,
                  },
                },
              },
            ],
          },
        ],
      },
      sections: [{
        // Define the BECTIM Header
        headers: {
          default: new Header({
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE } },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 30, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: logoBuffer
                              ? [
                                  new ImageRun({
                                    data: logoBuffer,
                                    type: 'png',
                                    transformation: { width: 170, height: 80 },
                                  }),
                                ]
                              : [new TextRun({ text: 'BECTIM', bold: true, color: '000080', font: 'Times New Roman' })],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 70, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({ children: [new TextRun({ text: "Société d'Expertise et de contrôle Technique Industriel & Maritime", bold: true, color: "4F81BD", size: 18, font: 'Times New Roman' })] }),
                          new Paragraph({ children: [new TextRun({ text: "Villa 05, Rue Ahmed Assas El Harrach - Alger", color: "4F81BD", size: 16, font: 'Times New Roman' })] }),
                          new Paragraph({ children: [new TextRun({ text: "Email : bectim_expertise@yahoo.fr", color: "4F81BD", size: 16, font: 'Times New Roman' })] }),
                          new Paragraph({ children: [new TextRun({ text: "Tel / Mobile : 021.83.24.85 / 0555.01.26.73", color: "4F81BD", size: 16, font: 'Times New Roman' })] }),
                        ]
                      })
                    ]
                  })
                ]
              }),
              new Paragraph({ text: "" }) // Spacer
            ]
          })
        },
        // Define the Blue Footer
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({ text: `${safeReportNumber}/BCTIM/2026`, color: "4F81BD" })
                ]
              })
            ]
          })
        },
        children: [
          // TITLE
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'PV DE SURVEILLANCE', bold: true, size: 28, color: '000080', underline: {}, font: 'Times New Roman' }),
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `N° : ${safeReportNumber}/BCTIM/ 2026`, bold: true, size: 24, color: '000080', underline: {}, font: 'Times New Roman' }),
            ]
          }),
          new Paragraph({ text: "" }),
          
          // 2-COLUMN INFO TABLE
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6 },
              bottom: { style: BorderStyle.SINGLE, size: 6 },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.SINGLE, size: 6 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 6 },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ margins: { top: 100, bottom: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Importateur", bold: true, underline: {} }), new TextRun({ text: ` : ${safeImporter}` })] })] }),
                  new TableCell({ margins: { top: 100, bottom: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Transitaire", bold: true, underline: {} }), new TextRun({ text: ` : ${safeTransitaire}` })] })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ margins: { top: 100, bottom: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Intervention du", bold: true, underline: {} }), new TextRun({ text: ` : ${safeInterventionDate}` })] })] }),
                  new TableCell({ margins: { top: 100, bottom: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Facture N°", bold: true, underline: {} }), new TextRun({ text: ` : ${safeFactureNumber}` })] })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ margins: { top: 100, bottom: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Lieu d'intervention", bold: true, underline: {} }), new TextRun({ text: ` : ${safeLocation}` })] })] }),
                  new TableCell({ margins: { top: 100, bottom: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "BL N°", bold: true, underline: {} }), new TextRun({ text: ` : ${safeBlNumber}` })] })] })
                ]
              })
            ]
          }),
          
          new Paragraph({ text: "" }),
          
          // IDENTIFICATION SECTION
          new Paragraph({ children: [new TextRun({ text: grammar.title, bold: true, underline: {} })] }),
          new Paragraph({ text: `TC N° : ${safeContainersText}`, numbering: { reference: 'identification-bullet', level: 0 } }),
          new Paragraph({ text: `Nombre de colis : ${safePackages}`, numbering: { reference: 'identification-bullet', level: 0 } }),
          new Paragraph({ text: `Conditionnement : ${safePackagingType}`, numbering: { reference: 'identification-bullet', level: 0 } }),
          
          new Paragraph({ text: "" }),

          // RENSEIGNEMENTS GÉNÉRAUX
          new Paragraph({ children: [new TextRun({ text: "Renseignements généraux:", bold: true, underline: {} })] }),
          new Paragraph({ text: `Nature de la marchandise : ${safeGoodsNature}`, numbering: { reference: 'general-info-dash', level: 0 } }),
          new Paragraph({ text: `État de la marchandise : ${safeGoodsState}`, numbering: { reference: 'general-info-dash', level: 0 } }),
          new Paragraph({ text: `Navire : ${safeShipName}`, numbering: { reference: 'general-info-dash', level: 0 } }),
          new Paragraph({ text: `Date d'arrivée : ${safeArrivalDate}`, numbering: { reference: 'general-info-dash', level: 0 } }),
          new Paragraph({ text: `Port de chargement : ${safeLoadingPort}`, numbering: { reference: 'general-info-dash', level: 0 } }),
          new Paragraph({ text: `Port de déchargement : ${safeDischargePort}`, numbering: { reference: 'general-info-dash', level: 0 } }),
          new Paragraph({ text: `Gros / Article : ${safeGrossOrArticle}`, numbering: { reference: 'general-info-dash', level: 0 } }),
          
          new Paragraph({ text: "" }),

          // CONSTATATIONS
          new Paragraph({ children: [new TextRun({ text: "Constatations", bold: true, underline: {} })] }),
          ...(constatationLines.length
            ? constatationLines.map(
                (line) => new Paragraph({ text: line, numbering: { reference: 'constatations-arrow', level: 0 } }),
              )
            : [new Paragraph({ text: grammar.intro, numbering: { reference: 'constatations-arrow', level: 0 } })]),

          new Paragraph({ text: '' }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `Alger le ${todayFr}`,
                bold: true,
                font: 'Times New Roman',
              }),
            ],
          }),
          
          // DEDICATED PHOTO TITLE PAGE
          new Paragraph({ children: [new PageBreak()] }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "REPORTAGE", size: 72, font: "Times New Roman" })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "PHOTOGRAPHIQUE", size: 72, font: "Times New Roman" })]
          }),
          new Paragraph({ children: [new PageBreak()] }),

          // THE 4-UP IMAGE GRID
          ...imageElements,
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const body = new Uint8Array(buffer);
    
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="PV_${reportNumber}_${importer}_2026.docx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 });
  }
}