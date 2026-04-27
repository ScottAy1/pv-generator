import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

export type ContainerSealData = {
  container: string;
  seal: string;
};

export type OpenedParcelData = {
  parcelId: string;
  status: string;
};

export type SamplingItemData = {
  item: string;
  identifier: string;
  quantity: string;
};

export type PVFormData = {
  reportNumber: string;
  client: string;
  transitaire: string;
  interventionDate: string;
  location: string;
  factureNumber: string;
  blNumber: string;
  containerData: ContainerSealData[];
  openedParcels: OpenedParcelData[];
  hasCustomsSampling: boolean;
  samplingItems: SamplingItemData[];
  numberOfPackages: string;
  packagingType: string;
  goodsNature: string;
  shipName: string;
  arrivalDate: string;
  loadingPort: string;
  dischargePort: string;
  grossOrArticle: string;
  constatations: string;
  images: string[];
};

type PdfDocumentProps = {
  data: PVFormData;
};

const PRIMARY = '#000080';
const SECONDARY = '#4F81BD';
const LOGO_SRC = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 10,
    color: '#1f2937',
    paddingTop: 28,
    paddingBottom: 44,
    paddingHorizontal: 34,
    lineHeight: 1.45,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 16,
  },
  logoBlock: {
    width: 180,
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    color: '#64748b',
    fontSize: 9,
  },
  logoImage: {
    width: 160,
    height: 78,
    objectFit: 'contain',
  },
  companyCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fbff',
  },
  companyName: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 2,
  },
  companyDetails: {
    fontSize: 8.9,
    color: '#334155',
    marginBottom: 1,
  },
  title: {
    marginTop: 2,
    textAlign: 'center',
    fontSize: 18,
    color: PRIMARY,
    fontWeight: 700,
    marginBottom: 14,
    letterSpacing: 0.4,
  },
  sectionTitle: {
    color: SECONDARY,
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 7,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoTable: {
    borderWidth: 1,
    borderColor: '#d6deea',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e6ebf3',
    minHeight: 30,
  },
  infoRowNoBorder: {
    borderBottomWidth: 0,
  },
  infoCol: {
    width: '50%',
    borderRightWidth: 1,
    borderRightColor: '#e6ebf3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 1,
  },
  infoColNoBorder: {
    borderRightWidth: 0,
  },
  infoLabel: {
    color: '#1e3a8a',
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  infoValue: {
    color: '#0f172a',
    fontSize: 10,
    fontWeight: 400,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
    gap: 7,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SECONDARY,
    marginTop: 5,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#1f2937',
  },
  containerTable: {
    borderWidth: 1,
    borderColor: '#d6deea',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  containerHeaderRow: {
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#d6deea',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  containerHeaderText: {
    color: '#1e3a8a',
    fontSize: 8.5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: 700,
  },
  containerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e6ebf3',
    minHeight: 34,
  },
  containerRowNoBorder: {
    borderBottomWidth: 0,
  },
  containerCell: {
    width: '50%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRightWidth: 1,
    borderRightColor: '#e6ebf3',
  },
  containerCellNoBorder: {
    borderRightWidth: 0,
  },
  containerCellLabel: {
    color: '#1e3a8a',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  containerCellValue: {
    color: '#0f172a',
    fontSize: 9.5,
    fontWeight: 600,
    marginTop: 1,
  },
  noteTable: {
    borderWidth: 1,
    borderColor: '#d6deea',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
    marginTop: 2,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#d6deea',
    minHeight: 24,
    alignItems: 'center',
  },
  noteHeaderCell: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: '#d6deea',
  },
  noteHeaderCellNoBorder: {
    borderRightWidth: 0,
  },
  noteHeaderText: {
    color: '#1e3a8a',
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  noteRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e6ebf3',
    minHeight: 26,
  },
  noteRowNoBorder: {
    borderBottomWidth: 0,
  },
  noteCell: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRightWidth: 1,
    borderRightColor: '#e6ebf3',
    fontSize: 9,
    color: '#0f172a',
  },
  noteCellNoBorder: {
    borderRightWidth: 0,
  },
  samplingLead: {
    fontSize: 10,
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 1.4,
  },
  constatBox: {
    borderWidth: 1,
    borderColor: '#d6deea',
    borderLeftWidth: 2,
    borderLeftColor: '#4F81BD',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    paddingLeft: 8,
    backgroundColor: '#fcfdff',
    marginTop: 2,
  },
  constatLine: {
    marginBottom: 4,
    fontSize: 10,
    color: '#1f2937',
  },
  constatRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  constatBullet: {
    width: 15,
    fontSize: 10,
    lineHeight: 1.4,
    color: '#1f2937',
  },
  constatContent: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.45,
    textAlign: 'justify',
    color: '#1f2937',
  },
  reportDateText: {
    marginTop: 8,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: 600,
    color: '#1f2937',
  },
  photoTitlePage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f9ff',
    borderWidth: 1,
    borderColor: '#d7e3f6',
    borderRadius: 10,
  },
  photoTitleText: {
    fontSize: 34,
    textAlign: 'center',
    color: PRIMARY,
    fontWeight: 700,
    letterSpacing: 2,
    lineHeight: 1.3,
  },
  photosPageTitle: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
    marginTop: 6,
  },
  photoCard: {
    width: '49%',
    borderWidth: 1,
    borderColor: '#d6deea',
    borderRadius: 8,
    padding: 6,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  photoImage: {
    width: '100%',
    height: 210,
    objectFit: 'contain',
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  photoCaption: {
    marginTop: 4,
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
  },
  footerLeft: {
    position: 'absolute',
    bottom: 16,
    left: 34,
    fontSize: 9,
    color: '#334155',
  },
  footerRight: {
    position: 'absolute',
    bottom: 16,
    right: 34,
    fontSize: 9,
    color: '#334155',
  },
});

function formatDate(dateValue: string): string {
  if (!dateValue) return 'N/A';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function valueOrFallback(value: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'N/A';
}

function chunkImages(images: string[], size = 4): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < images.length; i += size) {
    chunks.push(images.slice(i, i + size));
  }
  return chunks;
}

function PdfFooter({ reportNumber }: { reportNumber: string }) {
  return (
    <>
      <Text style={styles.footerLeft} fixed>
        PV N° {valueOrFallback(reportNumber)}
      </Text>
      <Text
        style={styles.footerRight}
        fixed
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
      />
    </>
  );
}

function FirstPageHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.logoBlock}>
        <PdfImage src={LOGO_SRC} style={styles.logoImage} />
      </View>
      <View style={styles.companyCard}>
        <Text style={styles.companyName}>BECTIM</Text>
        <Text style={styles.companyDetails}>Société d&apos;Expertise et de Contrôle Technique Industriel et Maritime</Text>
        <Text style={styles.companyDetails}>Inspection • Contrôle • Expertise</Text>
        <Text style={styles.companyDetails}>Alger, Algérie</Text>
      </View>
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item) => (
        <View style={styles.bulletRow} key={item} wrap={false}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PdfDocument({ data }: PdfDocumentProps) {
  const IMAGES_PER_PAGE = 4;
  const photoGroups = chunkImages(data.images, IMAGES_PER_PAGE);
  const safeContainerData = data.containerData.length > 0 ? data.containerData : [{ container: '', seal: '' }];
  const identificationTitle =
    data.containerData.length > 1 ? 'Identification des conteneurs inspectés' : 'Identification du conteneur inspecté';
  const reportDate = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  const identificationItems = [
    `Nombre de colis: ${valueOrFallback(data.numberOfPackages)}`,
    `Conditionnement: ${valueOrFallback(data.packagingType)}`,
  ];

  const openedParcelsRows = (data.openedParcels || []).filter((item) => item.parcelId.trim() || item.status.trim());
  const showOpenedParcels = valueOrFallback(data.client).toUpperCase() === 'SCHENEIDER ELECTRIC ALGERIE' && openedParcelsRows.length > 0;

  const samplingRows = (data.samplingItems || []).filter(
    (item) => item.item.trim() || item.identifier.trim() || item.quantity.trim(),
  );

  const generalInfoItems = [
    `Nature de la marchandise: ${valueOrFallback(data.goodsNature)}`,
    `Navire: ${valueOrFallback(data.shipName)}`,
    `Date d'arrivée: ${formatDate(data.arrivalDate)}`,
    `Port de chargement: ${valueOrFallback(data.loadingPort)}`,
    `Port de déchargement: ${valueOrFallback(data.dischargePort)}`,
    `Gros/Article: ${valueOrFallback(data.grossOrArticle)}`,
  ];

  const constatLines = (data.constatations || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsedConstatLines = constatLines.map((line) => {
    if (line.startsWith('- ')) {
      return { bullet: '-', text: line.slice(2).trim() };
    }
    if (line.startsWith('• ')) {
      return { bullet: '•', text: line.slice(2).trim() };
    }
    return { bullet: '-', text: line };
  });

  return (
    <Document title={`PV_${valueOrFallback(data.reportNumber)}`}>
      <Page size="A4" style={styles.page}>
        <FirstPageHeader />

        <Text style={styles.title}>PROCÈS-VERBAL DE SURVEILLANCE</Text>

        <View style={styles.infoTable}>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Importateur</Text>
              <Text style={styles.infoValue}>{valueOrFallback(data.client)}</Text>
            </View>
            <View style={[styles.infoCol, styles.infoColNoBorder]}>
              <Text style={styles.infoLabel}>Transitaire</Text>
              <Text style={styles.infoValue}>{valueOrFallback(data.transitaire)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Date d&apos;intervention</Text>
              <Text style={styles.infoValue}>{formatDate(data.interventionDate)}</Text>
            </View>
            <View style={[styles.infoCol, styles.infoColNoBorder]}>
              <Text style={styles.infoLabel}>Lieu d&apos;intervention</Text>
              <Text style={styles.infoValue}>{valueOrFallback(data.location)}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, styles.infoRowNoBorder]}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Facture N°</Text>
              <Text style={styles.infoValue}>{valueOrFallback(data.factureNumber)}</Text>
            </View>
            <View style={[styles.infoCol, styles.infoColNoBorder]}>
              <Text style={styles.infoLabel}>BL N°</Text>
              <Text style={styles.infoValue}>{valueOrFallback(data.blNumber)}</Text>
            </View>
          </View>
        </View>

        <View wrap={false}>
          <Text style={styles.sectionTitle}>{identificationTitle}</Text>
          <View style={styles.containerTable}>
          <View style={styles.containerHeaderRow}>
            <Text style={styles.containerHeaderText}>Conteneurs et scellés</Text>
          </View>
          {safeContainerData.map((item, index) => {
            const isLast = index === safeContainerData.length - 1;
            return (
              <View
                key={`${item.container}-${item.seal}-${index}`}
                style={[styles.containerRow, isLast && styles.containerRowNoBorder]}
                wrap={false}
              >
                <View style={styles.containerCell}>
                  <Text style={styles.containerCellLabel}>TC N°</Text>
                  <Text style={styles.containerCellValue}>{valueOrFallback(item.container)}</Text>
                </View>
                <View style={[styles.containerCell, styles.containerCellNoBorder]}>
                  <Text style={styles.containerCellLabel}>Numero de scelle</Text>
                  <Text style={styles.containerCellValue}>{valueOrFallback(item.seal)}</Text>
                </View>
              </View>
            );
          })}
          </View>
        </View>

        <View wrap={false}>
          <Text style={styles.sectionTitle}>Identification complémentaire</Text>
          <BulletList items={identificationItems} />
        </View>

        <View wrap={false}>
          <Text style={styles.sectionTitle}>Renseignements généraux</Text>
          <BulletList items={generalInfoItems} />
        </View>

        {showOpenedParcels && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Colis ouverts lors du contrôle douanier</Text>
            <View style={styles.noteTable}>
              <View style={styles.noteHeaderRow}>
                <View style={styles.noteHeaderCell}>
                  <Text style={styles.noteHeaderText}>ID colis</Text>
                </View>
                <View style={[styles.noteHeaderCell, styles.noteHeaderCellNoBorder]}>
                  <Text style={styles.noteHeaderText}>Statut</Text>
                </View>
              </View>

              {openedParcelsRows.map((row, index) => {
                const isLast = index === openedParcelsRows.length - 1;

                return (
                  <View
                    key={`${row.parcelId}-${row.status}-${index}`}
                    style={[styles.noteRow, isLast && styles.noteRowNoBorder]}
                    wrap={false}
                  >
                    <Text style={styles.noteCell}>{valueOrFallback(row.parcelId)}</Text>
                    <Text style={[styles.noteCell, styles.noteCellNoBorder]}>{valueOrFallback(row.status)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {data.hasCustomsSampling && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Prélèvements douaniers</Text>
            <Text style={styles.samplingLead}>
              Des prélèvements ont été effectués par les services de douane pour contrôle. Détail ci-dessous.
            </Text>

            {samplingRows.length > 0 ? (
              <View style={styles.noteTable}>
                <View style={styles.noteHeaderRow}>
                  <View style={styles.noteHeaderCell}>
                    <Text style={styles.noteHeaderText}>Article</Text>
                  </View>
                  <View style={styles.noteHeaderCell}>
                    <Text style={styles.noteHeaderText}>ID / Référence</Text>
                  </View>
                  <View style={[styles.noteHeaderCell, styles.noteHeaderCellNoBorder]}>
                    <Text style={styles.noteHeaderText}>Nbre prélevé</Text>
                  </View>
                </View>

                {samplingRows.map((row, index) => {
                  const isLast = index === samplingRows.length - 1;

                  return (
                    <View
                      key={`${row.item}-${row.identifier}-${index}`}
                      style={[styles.noteRow, isLast && styles.noteRowNoBorder]}
                      wrap={false}
                    >
                      <Text style={styles.noteCell}>{valueOrFallback(row.item)}</Text>
                      <Text style={styles.noteCell}>{valueOrFallback(row.identifier)}</Text>
                      <Text style={[styles.noteCell, styles.noteCellNoBorder]}>{valueOrFallback(row.quantity)}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.constatLine}>Détails des éléments prélevés non renseignés.</Text>
            )}
          </View>
        )}

        <View wrap={false}>
          <Text style={styles.sectionTitle}>Constatations</Text>
          <View style={styles.constatBox}>
            {parsedConstatLines.length > 0 ? (
              parsedConstatLines.map((line, index) => (
                <View key={`${line.text}-${index}`} style={styles.constatRow} wrap={false}>
                  <Text style={styles.constatBullet}>{line.bullet}</Text>
                  <Text style={styles.constatContent}>{line.text}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.constatLine}>Aucune constatation renseignée.</Text>
            )}
          </View>
        </View>

        <Text style={styles.reportDateText}>Alger le {reportDate}</Text>

        <PdfFooter reportNumber={data.reportNumber} />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.photoTitlePage}>
          <Text style={styles.photoTitleText}>REPORTAGE{`\n`}PHOTOGRAPHIQUE</Text>
        </View>
        <PdfFooter reportNumber={data.reportNumber} />
      </Page>

      {photoGroups.map((group, pageIndex) => (
        <Page key={`photos-${pageIndex}`} size="A4" style={styles.page}>
          <Text style={styles.photosPageTitle}>Photographies - Planche {pageIndex + 1}</Text>
          <View style={styles.photoGrid}>
            {group.map((image, imageIndex) => {
              const label = `Photo ${pageIndex * IMAGES_PER_PAGE + imageIndex + 1}`;
              return (
                <View style={styles.photoCard} key={label}>
                  <PdfImage src={image} style={styles.photoImage} />
                  <Text style={styles.photoCaption}>{label}</Text>
                </View>
              );
            })}
          </View>
          <PdfFooter reportNumber={data.reportNumber} />
        </Page>
      ))}
    </Document>
  );
}
