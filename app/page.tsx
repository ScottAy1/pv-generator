'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { type ContainerSealData, type OpenedParcelData, type PVFormData, type SamplingItemData } from '../components/PdfDocument';

const DynamicDownloadButton = dynamic(() => import('@/components/DownloadButton'), { ssr: false });

const SCHNEIDER_CLIENT = 'SCHENEIDER ELECTRIC ALGERIE';
const BASE_CONSTATATION_SENTENCES = [
  'Après pointage, vérification et ouverture des {containerNoun} nous avons constaté ce qui suit :',
  '{containerSentence}',
  'Les colis ont été ouverts sur demande de l’inspecteur de douane chargé du dossier ;',
  'À l’ouverture des colis nous avons constaté que la marchandise à l’intérieur est à l’état neuf ;',
  'L’emballage a été déchiré pour inspection et vérification du matériel électrique par les services de douane ;',
  'Aucune anomalie apparente n’a été constatée durant notre intervention',
] as const;

type ConstatationItem = {
  id: string;
  text: string;
  isChecked: boolean;
  isCustom: boolean;
};

type AutoFillRule = {
  transitaire: string;
  goodsNature: string;
};

const AUTO_FILL_BY_CLIENT: Record<string, AutoFillRule> = {
  'DECATHLON EL DJAZAIR': {
    transitaire: 'MOUGAS',
    goodsNature: 'Articles de sport',
  },
  'SCHENEIDER ELECTRIC ALGERIE': {
    transitaire: 'Transit Kherrat',
    goodsNature: 'Matériel électrique',
  },
  STELLANTIS: {
    transitaire: 'TRANS VN',
    goodsNature: 'Pièces de rechange automobile',
  },
};

const REQUIRED_TEXT_FIELDS: Array<
  keyof Omit<PVFormData, 'images' | 'containerData' | 'openedParcels' | 'hasCustomsSampling' | 'samplingItems'>
> = ['reportNumber', 'client'];

function withTextFallback(value: string | undefined | null): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'N/A';
}

function buildPredefinedConstatations(hasMultipleContainers: boolean): string[] {
  const containerNoun = hasMultipleContainers ? 'conteneurs' : 'conteneur';
  
  const containerSentence = hasMultipleContainers
    ? 'Les conteneurs ont subi une visite intégrale sur demande de l\'inspecteur de douane chargé du dossier, lors de la visite plusieurs cartons ont été ouverts pour inspection par les services douane/fraude .'
    : 'Le conteneur a subi une visite intégrale sur demande de l\'inspecteur de douane chargé du dossier, lors de la visite plusieurs cartons ont été ouverts pour inspection par les services douane/fraude .';

  return BASE_CONSTATATION_SENTENCES.map((sentence) =>
    sentence
      .replace(/\{containerNoun\}/g, containerNoun)
      .replace(/\{containerSentence\}/g, containerSentence),
  );
}

function createInitialConstatations(hasMultipleContainers = false): ConstatationItem[] {
  return buildPredefinedConstatations(hasMultipleContainers).map((text, index) => ({
    id: `default-${index}`,
    text,
    isChecked: true,
    isCustom: false,
  }));
}

function sanitizeFilenameSegment(input: string): string {
  const cleaned = input.trim().replace(/[^a-zA-Z0-9_-]+/g, '_');
  return cleaned || 'SANS_NUMERO';
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Erreur lecture du fichier: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;

  // Some browsers return an empty MIME type for files selected via folder upload.
  return /\.(avif|bmp|gif|heic|heif|jpe?g|png|tiff?|webp)$/i.test(file.name);
}

export default function HomePage() {
  const [containerData, setContainerData] = useState<ContainerSealData[]>([{ container: '', seal: '' }]);
  const [openedParcels, setOpenedParcels] = useState<OpenedParcelData[]>([{ parcelId: '', status: 'RAS' }]);
  const [hasCustomsSampling, setHasCustomsSampling] = useState(false);
  const [samplingItems, setSamplingItems] = useState<SamplingItemData[]>([{ item: '', identifier: '', quantity: '' }]);
  const [constatationItems, setConstatationItems] = useState<ConstatationItem[]>(() => createInitialConstatations(false));
  const [customConstatation, setCustomConstatation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);

  const [form, setForm] = useState<PVFormData>({
    reportNumber: '',
    client: '',
    transitaire: '',
    interventionDate: '',
    location: '',
    factureNumber: '',
    blNumber: '',
    containerData: [{ container: '', seal: '' }],
    openedParcels: [{ parcelId: '', status: 'RAS' }],
    hasCustomsSampling: false,
    samplingItems: [{ item: '', identifier: '', quantity: '' }],
    numberOfPackages: '',
    packagingType: 'Cartons - Palettisés',
    goodsNature: '',
    shipName: '',
    arrivalDate: '',
    loadingPort: '',
    dischargePort: "Port d'Alger",
    grossOrArticle: '',
    constatations: 'N/A',
    images,
  });

  const [isReadingImages, setIsReadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  const hasMultipleContainers = containerData.length > 1;

  useEffect(() => {
    const dynamicDefaults = buildPredefinedConstatations(hasMultipleContainers);

    setConstatationItems((previous) => {
      const next = [...previous];

      for (let index = 0; index < dynamicDefaults.length; index += 1) {
        const defaultId = `default-${index}`;
        const existingIndex = next.findIndex((item) => item.id === defaultId);

        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            text: dynamicDefaults[index],
          };
        }
      }

      return next;
    });
  }, [hasMultipleContainers]);

  const pdfFormData = useMemo<PVFormData>(
    () => {
      const selectedConstatations = constatationItems
        .filter((item) => item.isChecked)
        .map((item) => `• ${item.text.trim()}`);

      return {
        ...form,
        reportNumber: withTextFallback(form.reportNumber),
        client: withTextFallback(form.client),
        transitaire: withTextFallback(form.transitaire),
        interventionDate: withTextFallback(form.interventionDate),
        location: withTextFallback(form.location),
        factureNumber: withTextFallback(form.factureNumber),
        blNumber: withTextFallback(form.blNumber),
        numberOfPackages: withTextFallback(form.numberOfPackages),
        packagingType: withTextFallback(form.packagingType),
        goodsNature: withTextFallback(form.goodsNature),
        shipName: withTextFallback(form.shipName),
        arrivalDate: withTextFallback(form.arrivalDate),
        loadingPort: withTextFallback(form.loadingPort),
        dischargePort: withTextFallback(form.dischargePort),
        grossOrArticle: withTextFallback(form.grossOrArticle),
        constatations: selectedConstatations.length > 0 ? selectedConstatations.join('\n') : 'N/A',
        containerData: containerData.map((item) => ({
          container: withTextFallback(item.container),
          seal: withTextFallback(item.seal),
        })),
        openedParcels: openedParcels.map((item) => ({
          parcelId: withTextFallback(item.parcelId),
          status: withTextFallback(item.status),
        })),
        hasCustomsSampling,
        samplingItems: samplingItems.map((item) => ({
          item: withTextFallback(item.item),
          identifier: withTextFallback(item.identifier),
          quantity: withTextFallback(item.quantity),
        })),
        images,
      };
    },
    [form, containerData, openedParcels, hasCustomsSampling, samplingItems, images, constatationItems],
  );

  const clientOptions = useMemo(() => Object.keys(AUTO_FILL_BY_CLIENT), []);

  const isFormComplete = useMemo(() => {
    return REQUIRED_TEXT_FIELDS.every((fieldName) => {
      const value = form[fieldName];
      return typeof value === 'string' && value.trim().length > 0;
    });
  }, [form]);

  const areContainersComplete = useMemo(() => {
    return (
      containerData.length > 0 &&
      containerData.every((item) => item.container.trim().length > 0 && item.seal.trim().length > 0)
    );
  }, [containerData]);

  const isDownloadDisabled = !isFormComplete || !areContainersComplete || images.length === 0 || isReadingImages;

  const dynamicFilename = useMemo(() => {
    return `PV_${sanitizeFilenameSegment(form.reportNumber)}_${sanitizeFilenameSegment(form.client)}_2026.pdf`;
  }, [form.reportNumber, form.client]);

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleClientChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedClient = event.target.value;
    const autoFill = AUTO_FILL_BY_CLIENT[selectedClient];

    setForm((previous) => ({
      ...previous,
      client: selectedClient,
      transitaire: autoFill?.transitaire ?? previous.transitaire,
      goodsNature: autoFill?.goodsNature ?? previous.goodsNature,
    }));
  };

  const handleContainerChange = (index: number, field: keyof ContainerSealData, value: string) => {
    setContainerData((previous) =>
      previous.map((item, rowIndex) => (rowIndex === index ? { ...item, [field]: value.toUpperCase() } : item)),
    );
  };

  const addContainerRow = () => {
    setContainerData((previous) => [...previous, { container: '', seal: '' }]);
  };

  const removeContainerRow = (index: number) => {
    setContainerData((previous) => previous.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleOpenedParcelChange = (index: number, field: keyof OpenedParcelData, value: string) => {
    setOpenedParcels((previous) =>
      previous.map((item, rowIndex) => (rowIndex === index ? { ...item, [field]: value } : item)),
    );
  };

  const addOpenedParcelRow = () => {
    setOpenedParcels((previous) => [...previous, { parcelId: '', status: 'RAS' }]);
  };

  const removeOpenedParcelRow = (index: number) => {
    setOpenedParcels((previous) => previous.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleSamplingItemChange = (index: number, field: keyof SamplingItemData, value: string) => {
    setSamplingItems((previous) =>
      previous.map((item, rowIndex) => (rowIndex === index ? { ...item, [field]: value } : item)),
    );
  };

  const handleConstatationToggle = (id: string) => {
    setConstatationItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, isChecked: !item.isChecked } : item)),
    );
  };

  const addCustomConstatation = () => {
    const trimmed = customConstatation.trim();
    if (!trimmed) return;

    setConstatationItems((previous) => [
      ...previous,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: trimmed,
        isChecked: true,
        isCustom: true,
      },
    ]);
    setCustomConstatation('');
  };

  const removeCustomConstatation = (id: string) => {
    setConstatationItems((previous) => previous.filter((item) => item.id !== id || !item.isCustom));
  };

  const addSamplingItemRow = () => {
    setSamplingItems((previous) => [...previous, { item: '', identifier: '', quantity: '' }]);
  };

  const removeSamplingItemRow = (index: number) => {
    setSamplingItems((previous) => previous.filter((_, rowIndex) => rowIndex !== index));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setImages((previous) => {
      if (fromIndex < 0 || fromIndex >= previous.length) return previous;
      if (toIndex < 0 || toIndex >= previous.length) return previous;

      const next = [...previous];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedImageIndex(index);
    setDragOverImageIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedImageIndex === null) return;
    setDragOverImageIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  };

  const handleDropOnImage = (index: number) => {
    if (draggedImageIndex === null) {
      handleDragEnd();
      return;
    }

    moveImage(draggedImageIndex, index);
    handleDragEnd();
  };

  const removeImage = (index: number) => {
    setImages((previous) => previous.filter((_, imageIndex) => imageIndex !== index));
    if (draggedImageIndex === index) {
      setDraggedImageIndex(null);
      setDragOverImageIndex(null);
    }
  };

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = event.target.files;
    if (!inputFiles || inputFiles.length === 0) {
      setImages([]);
      return;
    }

    setUploadError('');
    setIsReadingImages(true);

    try {
      const files = Array.from(inputFiles)
        .filter((file) => isImageFile(file))
        .sort((a, b) => {
          const aPath = a.webkitRelativePath || a.name;
          const bPath = b.webkitRelativePath || b.name;
          return aPath.localeCompare(bPath, 'fr');
        });

      const base64Images = await Promise.all(files.map((file) => fileToBase64(file)));
      setImages(base64Images);

      if (base64Images.length === 0) {
        setUploadError('Aucune image valide trouvée dans ce dossier (formats supportés: JPG, PNG, WEBP, etc.).');
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Erreur pendant le chargement des images.');
      setImages([]);
    } finally {
      setIsReadingImages(false);
      event.target.value = '';
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-100 via-white to-slate-100 px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-slate-200 sm:p-8 lg:p-10">
        <div className="mb-8 border-b border-slate-200 pb-5">
          <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">PV de Surveillance - Génération PDF</h1>
          <p className="mt-3 text-center text-sm text-slate-600 sm:text-base">
            Complétez le formulaire puis téléchargez un rapport PDF professionnel prêt à partager.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="N° de PV" required>
            <input
              type="text"
              name="reportNumber"
              value={form.reportNumber}
              onChange={handleTextChange}
              placeholder="044"
              className={inputClassName}
            />
          </Field>

          <Field label="Client" required>
            <select name="client" value={form.client} onChange={handleClientChange} className={inputClassName}>
              <option value="">Sélectionnez un client</option>
              {clientOptions.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Transitaire" required>
            <input type="text" name="transitaire" value={form.transitaire} onChange={handleTextChange} className={inputClassName} />
          </Field>

          <Field label="Intervention du" required>
            <input type="text" name="interventionDate" value={form.interventionDate} onChange={handleTextChange} placeholder="jj/mm/aaaa ou Laisser vide" className={inputClassName} />
          </Field>

          <Field label="Lieu d'intervention" required>
            <>
              <input type="text" name="location" list="locations" value={form.location} onChange={handleTextChange} className={inputClassName} />
              <datalist id="locations">
                <option value="PORT D'ALGER D.P.W" />
                <option value="PORT D'ALGER E.P.A. L" />
              </datalist>
            </>
          </Field>

          <Field label="Facture N°" required>
            <input type="text" name="factureNumber" value={form.factureNumber} onChange={handleTextChange} className={inputClassName} />
          </Field>

          <Field label="BL N°" required>
            <input type="text" name="blNumber" value={form.blNumber} onChange={handleTextChange} className={inputClassName} />
          </Field>

          <Field label="Nombre de colis" required>
            <input
              type="text"
              name="numberOfPackages"
              value={form.numberOfPackages}
              onChange={handleTextChange}
              className={inputClassName}
            />
          </Field>

          <Field label="Conditionnement" required>
            <select name="packagingType" value={form.packagingType} onChange={handleTextChange} className={inputClassName}>
              <option value="Cartons - Palettisés">Cartons - Palettisés</option>
              <option value="Cartons">Cartons</option>
              <option value="Palettes">Palettes</option>
              <option value="Vrac">Vrac</option>
            </select>
          </Field>

          <Field label="Nature de la marchandise" required>
            <input type="text" name="goodsNature" value={form.goodsNature} onChange={handleTextChange} className={inputClassName} />
          </Field>

          <Field label="Navire" required>
            <input type="text" name="shipName" value={form.shipName} onChange={handleTextChange} className={inputClassName} />
          </Field>

          <Field label="Date d'arrivée" required>
            <input type="text" name="arrivalDate" value={form.arrivalDate} onChange={handleTextChange} placeholder="jj/mm/aaaa ou Laisser vide" className={inputClassName} />
          </Field>

          <Field label="Port de chargement" required>
            <input type="text" name="loadingPort" value={form.loadingPort} onChange={handleTextChange} className={inputClassName} />
          </Field>

          <Field label="Port de déchargement" required>
            <input type="text" name="dischargePort" value={form.dischargePort} onChange={handleTextChange} className={inputClassName} />
          </Field>

          <Field label="Gros/Article" required>
            <input type="text" name="grossOrArticle" value={form.grossOrArticle} onChange={handleTextChange} className={inputClassName} />
          </Field>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-base font-semibold text-slate-900">Identification des conteneurs</h2>
          <p className="mt-1 text-sm text-slate-600">Renseignez le TC N° et le N° de scellé pour chaque conteneur inspecté.</p>

          <div className="mt-4 space-y-3">
            {containerData.map((item, index) => (
              <div key={`container-row-${index}`} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <Field label={`TC N° ${index + 1}`} required>
                  <input
                    type="text"
                    value={item.container}
                    onChange={(event) => handleContainerChange(index, 'container', event.target.value)}
                    className={inputClassName}
                    placeholder="MSCU1234567"
                  />
                </Field>

                <Field label="N° de scellé" required>
                  <input
                    type="text"
                    value={item.seal}
                    onChange={(event) => handleContainerChange(index, 'seal', event.target.value)}
                    className={inputClassName}
                    placeholder="SEAL12345"
                  />
                </Field>

                {index > 0 ? (
                  <button
                    type="button"
                    onClick={() => removeContainerRow(index)}
                    className="h-11 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                ) : (
                  <div className="hidden sm:block" />
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addContainerRow}
            className="mt-4 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Ajouter un conteneur
          </button>
        </div>

        {form.client === SCHNEIDER_CLIENT && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-base font-semibold text-slate-900">Colis ouverts (Schneider)</h2>
            <p className="mt-1 text-sm text-slate-600">
              Renseignez les colis ouverts pendant le contrôle douanier et l&apos;observation correspondante.
            </p>

            <div className="mt-4 space-y-3">
              {openedParcels.map((item, index) => (
                <div
                  key={`opened-parcel-row-${index}`}
                  className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                >
                  <Field label={`ID colis ${index + 1}`}>
                    <input
                      type="text"
                      value={item.parcelId}
                      onChange={(event) => handleOpenedParcelChange(index, 'parcelId', event.target.value)}
                      className={inputClassName}
                      placeholder="COLIS-001"
                    />
                  </Field>

                  <Field label="Statut / observation">
                    <input
                      type="text"
                      value={item.status}
                      onChange={(event) => handleOpenedParcelChange(index, 'status', event.target.value)}
                      className={inputClassName}
                      placeholder="RAS"
                    />
                  </Field>

                  {index > 0 ? (
                    <button
                      type="button"
                      onClick={() => removeOpenedParcelRow(index)}
                      className="h-11 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  ) : (
                    <div className="hidden sm:block" />
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addOpenedParcelRow}
              className="mt-4 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Ajouter un colis ouvert
            </button>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-base font-semibold text-slate-900">Prélèvements douaniers</h2>
          <p className="mt-1 text-sm text-slate-600">
            Activez cette section uniquement si des prélèvements ont été effectués, puis indiquez ce qui a été prélevé.
          </p>

          <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={hasCustomsSampling}
              onChange={(event) => setHasCustomsSampling(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-300"
            />
              Des prélèvements ont été effectués par la douane
          </label>

            {hasCustomsSampling && (
              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                Dites-moi ce qui a été prélevé, puis complétez les lignes ci-dessous.
              </div>
            )}

          {hasCustomsSampling && (
            <div className="mt-4 space-y-3">
              {samplingItems.map((item, index) => (
                <div
                  key={`sampling-item-row-${index}`}
                  className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[1.2fr_1fr_0.8fr_auto] sm:items-end"
                >
                    <Field label="Article prélevé">
                    <input
                      type="text"
                      value={item.item}
                      onChange={(event) => handleSamplingItemChange(index, 'item', event.target.value)}
                      className={inputClassName}
                        placeholder="Ballons"
                    />
                  </Field>

                  <Field label="ID / Référence">
                    <input
                      type="text"
                      value={item.identifier}
                      onChange={(event) => handleSamplingItemChange(index, 'identifier', event.target.value)}
                      className={inputClassName}
                      placeholder="REF-001"
                    />
                  </Field>

                  <Field label="Nbre prélevé">
                    <input
                      type="text"
                      value={item.quantity}
                      onChange={(event) => handleSamplingItemChange(index, 'quantity', event.target.value)}
                      className={inputClassName}
                      placeholder="02"
                    />
                  </Field>

                  {index > 0 ? (
                    <button
                      type="button"
                      onClick={() => removeSamplingItemRow(index)}
                      className="h-11 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  ) : (
                    <div className="hidden sm:block" />
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addSamplingItemRow}
                className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Ajouter un élément prélevé
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-base font-semibold text-slate-900">Constatations</h2>
          <p className="mt-1 text-sm text-slate-600">Cochez les constatations à inclure dans le PDF, puis ajoutez vos phrases personnalisées si besoin.</p>

          <div className="mt-4 space-y-3">
            {constatationItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={item.isChecked}
                  onChange={() => handleConstatationToggle(item.id)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-300"
                />

                <p className="flex-1 text-sm text-slate-700">{item.text}</p>

                {item.isCustom ? (
                  <button
                    type="button"
                    onClick={() => removeCustomConstatation(item.id)}
                    className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={customConstatation}
              onChange={(event) => setCustomConstatation(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addCustomConstatation();
                }
              }}
              placeholder="Ajouter une constatation personnalisée"
              className={inputClassName}
            />

            <button
              type="button"
              onClick={addCustomConstatation}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 sm:min-w-24"
            >
              Ajouter
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
          <label className="flex cursor-pointer flex-col items-center gap-2 text-slate-700">
            <span className="text-sm font-semibold text-slate-900">Dossier photos</span>
            <span className="text-sm text-slate-600">Sélectionnez un dossier contenant vos images d&apos;inspection.</span>
            <input
              type="file"
              multiple
              onChange={handleFolderUpload}
              {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
              className="mt-2 block w-full max-w-sm cursor-pointer text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-blue-800"
            />
          </label>

          <p className="mt-3 text-sm text-slate-600">
            {isReadingImages
              ? 'Chargement des images en cours...'
              : images.length > 0
                ? `${images.length} image(s) prête(s) pour le rapport.`
                : 'Aucune image chargée.'}
          </p>

          {uploadError && <p className="mt-2 text-sm font-medium text-red-600">{uploadError}</p>}
        </div>

        {images.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Aperçu et tri des images</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {images.map((image, index) => {
                const isDragging = draggedImageIndex === index;
                const isDragOver = dragOverImageIndex === index && draggedImageIndex !== null && draggedImageIndex !== index;

                return (
                  <div
                    key={`preview-image-${index}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDropOnImage(index)}
                    onDragEnd={handleDragEnd}
                    className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition duration-200 ${
                      isDragging
                        ? 'scale-[0.98] cursor-grabbing opacity-60 shadow-xl'
                        : 'cursor-grab hover:-translate-y-0.5 hover:shadow-md'
                    } ${isDragOver ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`}
                  >
                    <img src={image} alt={`Aperçu ${index + 1}`} className="h-32 w-full object-cover sm:h-36" />

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-900/60 to-transparent px-2 py-1 text-xs font-medium text-white">
                      Photo {index + 1}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-1.5 top-1.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white shadow transition hover:bg-red-700"
                      aria-label={`Supprimer la photo ${index + 1}`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8">
          <DynamicDownloadButton
            form={pdfFormData}
            fileName={dynamicFilename}
            isDownloadDisabled={isDownloadDisabled}
            isReadingImages={isReadingImages}
            isFormComplete={isFormComplete}
          />
        </div>
      </section>
    </main>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

function Field({ label, required = false, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>
      {children}
    </label>
  );
}

const inputClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';