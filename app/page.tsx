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
  const ACCESS_PASSCODE = '121012';

  const [containerData, setContainerData] = useState<ContainerSealData[]>([{ container: '', seal: '' }]);
  const [openedParcels, setOpenedParcels] = useState<OpenedParcelData[]>([{ parcelId: '', status: 'RAS' }]);
  const [interventionDateIsNA, setInterventionDateIsNA] = useState(false);
  const [arrivalDateIsNA, setArrivalDateIsNA] = useState(false);
  const [hasCustomsSampling, setHasCustomsSampling] = useState(false);
  const [samplingItems, setSamplingItems] = useState<SamplingItemData[]>([{ item: '', identifier: '', quantity: '' }]);
  const [constatationItems, setConstatationItems] = useState<ConstatationItem[]>(() => createInitialConstatations(false));
  const [customConstatation, setCustomConstatation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);
  const [draggedConstatationId, setDraggedConstatationId] = useState<string | null>(null);
  const [dragOverConstatationId, setDragOverConstatationId] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

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
    document.body.style.overflow = isUnlocked ? '' : 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isUnlocked]);

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
        interventionDate: interventionDateIsNA ? 'N/A' : withTextFallback(form.interventionDate),
        location: withTextFallback(form.location),
        factureNumber: withTextFallback(form.factureNumber),
        blNumber: withTextFallback(form.blNumber),
        numberOfPackages: withTextFallback(form.numberOfPackages),
        packagingType: withTextFallback(form.packagingType),
        goodsNature: withTextFallback(form.goodsNature),
        shipName: withTextFallback(form.shipName),
        arrivalDate: arrivalDateIsNA ? 'N/A' : withTextFallback(form.arrivalDate),
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
    [
      form,
      containerData,
      openedParcels,
      hasCustomsSampling,
      samplingItems,
      images,
      constatationItems,
      interventionDateIsNA,
      arrivalDateIsNA,
    ],
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

  const handleDateChange = (field: 'interventionDate' | 'arrivalDate', value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleDateToggle = (field: 'interventionDate' | 'arrivalDate', checked: boolean) => {
    if (field === 'interventionDate') {
      setInterventionDateIsNA(checked);
    } else {
      setArrivalDateIsNA(checked);
    }

    if (checked) {
      setForm((previous) => ({
        ...previous,
        [field]: '',
      }));
    }
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

  const moveConstatation = (fromId: string, toId: string) => {
    if (fromId === toId) return;

    setConstatationItems((previous) => {
      const fromIndex = previous.findIndex((item) => item.id === fromId);
      const toIndex = previous.findIndex((item) => item.id === toId);

      if (fromIndex < 0 || toIndex < 0) return previous;

      const next = [...previous];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleConstatationDragStart = (id: string) => {
    setDraggedConstatationId(id);
    setDragOverConstatationId(id);
  };

  const handleConstatationDragEnter = (id: string) => {
    if (draggedConstatationId === null) return;
    setDragOverConstatationId(id);
  };

  const handleConstatationDragEnd = () => {
    setDraggedConstatationId(null);
    setDragOverConstatationId(null);
  };

  const handleConstatationDrop = (toId: string) => {
    if (draggedConstatationId === null) {
      handleConstatationDragEnd();
      return;
    }

    moveConstatation(draggedConstatationId, toId);
    handleConstatationDragEnd();
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

  const handleUnlockSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passcodeInput.trim() === ACCESS_PASSCODE) {
      setIsUnlocked(true);
      setPasscodeError('');
      return;
    }

    setPasscodeError('Code invalide. Veuillez réessayer.');
  };

  return (
    <>
      <div
        className={isUnlocked ? '' : 'pointer-events-none select-none blur-sm'}
        aria-hidden={!isUnlocked}
      >
        <main className="min-h-screen px-3 py-8 sm:px-6 lg:px-8">
          <section className="animate-slide-up mx-auto max-w-6xl rounded-3xl border border-white/60 bg-white/95 p-8 shadow-2xl backdrop-blur-md sm:p-10 lg:p-12">
        <div className="mb-10 border-b border-gradient-to-r from-transparent via-slate-200 to-transparent pb-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="shrink-0">
              <img src="/assets/logo.png" alt="Logo" className="h-24 w-24 rounded-2xl shadow-lg ring-2 ring-white sm:h-28 sm:w-28" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl lg:text-5xl">PV de Surveillance</h1>
              <p className="mt-2 text-lg font-semibold text-slate-600">Génération PDF</p>
              <p className="mt-4 text-sm leading-relaxed text-slate-500 sm:text-base">
                Complétez le formulaire et générez un rapport PDF professionnel prêt à partager.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

          <Field label="Date d'intervention" required>
            <div className="space-y-2">
              <input
                type="date"
                name="interventionDate"
                value={form.interventionDate}
                onChange={(event) => handleDateChange('interventionDate', event.target.value)}
                disabled={interventionDateIsNA}
                className={`${inputClassName} ${interventionDateIsNA ? 'cursor-not-allowed bg-slate-50 text-slate-400' : ''}`}
              />
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={interventionDateIsNA}
                  onChange={(event) => handleDateToggle('interventionDate', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600 focus:ring-blue-500"
                />
                N/A
              </label>
            </div>
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
            <div className="space-y-2">
              <input
                type="date"
                name="arrivalDate"
                value={form.arrivalDate}
                onChange={(event) => handleDateChange('arrivalDate', event.target.value)}
                disabled={arrivalDateIsNA}
                className={`${inputClassName} ${arrivalDateIsNA ? 'cursor-not-allowed bg-slate-50 text-slate-400' : ''}`}
              />
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={arrivalDateIsNA}
                  onChange={(event) => handleDateToggle('arrivalDate', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600 focus:ring-blue-500"
                />
                N/A
              </label>
            </div>
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

        <div className="mt-8 rounded-2xl border border-blue-100/50 bg-linear-to-br from-blue-50/50 to-indigo-50/50 p-6 backdrop-blur-sm sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m0 0l8 4m-8-4v10l8 4m0-10l8 4m-8-4v10l8-4" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900">Identification des conteneurs</h2>
              <p className="mt-1 text-sm text-slate-600">Renseignez le TC N° et le N° de scellé pour chaque conteneur inspecté.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {containerData.map((item, index) => (
              <div key={`container-row-${index}`} className="group grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:grid-cols-[1fr_1fr_auto] sm:items-end">
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
                    className="h-11 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 active:scale-95"
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
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un conteneur
          </button>
        </div>

        {form.client === SCHNEIDER_CLIENT && (
          <div className="mt-8 rounded-2xl border border-purple-100/50 bg-linear-to-br from-purple-50/50 to-pink-50/50 p-6 backdrop-blur-sm sm:p-8">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900">Colis ouverts (Schneider)</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Renseignez les colis ouverts pendant le contrôle douanier et l&apos;observation correspondante.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {openedParcels.map((item, index) => (
                <div
                  key={`opened-parcel-row-${index}`}
                  className="group grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:grid-cols-[1fr_1fr_auto] sm:items-end"
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
                      className="h-11 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 active:scale-95"
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
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:from-purple-700 hover:to-pink-700 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un colis ouvert
            </button>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-green-100/50 bg-linear-to-br from-green-50/50 to-emerald-50/50 p-6 backdrop-blur-sm sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900">Prélèvements douaniers</h2>
              <p className="mt-1 text-sm text-slate-600">
                Activez cette section uniquement si des prélèvements ont été effectués, puis indiquez ce qui a été prélevé.
              </p>
            </div>
          </div>

          <label className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={hasCustomsSampling}
              onChange={(event) => setHasCustomsSampling(event.target.checked)}
              className="h-5 w-5 rounded border-slate-300 accent-green-600 focus:ring-green-500"
            />
              Des prélèvements ont été effectués par la douane
          </label>

            {hasCustomsSampling && (
              <div className="mt-4 rounded-lg border border-green-300 bg-green-100 px-4 py-3 text-sm font-medium text-green-900">
                ✓ Dites-moi ce qui a été prélevé, puis complétez les lignes ci-dessous.
              </div>
            )}

          {hasCustomsSampling && (
            <div className="mt-6 space-y-3">
              {samplingItems.map((item, index) => (
                <div
                  key={`sampling-item-row-${index}`}
                  className="group grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:grid-cols-[1.2fr_1fr_0.8fr_auto] sm:items-end"
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
                      className="h-11 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 active:scale-95"
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
                className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-green-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:from-green-700 hover:to-emerald-700 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un élément prélevé
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-orange-100/50 bg-linear-to-br from-orange-50/50 to-amber-50/50 p-6 backdrop-blur-sm sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
              <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900">Constatations</h2>
              <p className="mt-1 text-sm text-slate-600">Cochez les constatations à inclure dans le PDF, puis ajoutez vos phrases personnalisées si besoin.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {constatationItems.map((item) => {
              const isDragging = draggedConstatationId === item.id;
              const isDragOver = dragOverConstatationId === item.id && draggedConstatationId !== null && draggedConstatationId !== item.id;

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleConstatationDragStart(item.id)}
                  onDragEnter={() => handleConstatationDragEnter(item.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleConstatationDrop(item.id)}
                  onDragEnd={handleConstatationDragEnd}
                  className={`group flex items-start gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm transition duration-200 ${
                    isDragging
                      ? 'scale-[0.98] cursor-grabbing opacity-60 shadow-lg'
                      : 'cursor-grab hover:shadow-md'
                  } ${isDragOver ? 'border-orange-500 ring-2 ring-orange-200' : 'border-slate-200'}`}
                >
                  <div className="flex shrink-0 items-center gap-2">
                    <svg className="h-5 w-5 text-slate-400 opacity-0 transition group-hover:opacity-100" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm4-8h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2z" />
                    </svg>
                    <input
                      type="checkbox"
                      checked={item.isChecked}
                      onChange={() => handleConstatationToggle(item.id)}
                      className="h-5 w-5 rounded border-slate-300 accent-orange-600 focus:ring-orange-500"
                    />
                  </div>

                  <p className="flex-1 text-sm leading-relaxed text-slate-700">{item.text}</p>

                  {item.isCustom ? (
                    <button
                      type="button"
                      onClick={() => removeCustomConstatation(item.id)}
                      className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 active:scale-95"
                    >
                      Supprimer
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-orange-600 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:from-orange-700 hover:to-amber-700 active:scale-95 sm:min-w-36"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border-2 border-dashed border-slate-300 bg-linear-to-br from-slate-50 to-slate-100 px-6 py-8 text-center shadow-sm transition hover:border-blue-400 hover:shadow-md sm:px-8">
          <label className="flex cursor-pointer flex-col items-center gap-4 text-slate-700">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-100 to-indigo-100">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-base font-semibold text-slate-900">Dossier photos</span>
            <span className="text-sm text-slate-600">Sélectionnez un dossier contenant vos images d&apos;inspection.</span>
            <input
              type="file"
              multiple
              onChange={handleFolderUpload}
              {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
              className="mt-2 block w-full max-w-sm cursor-pointer text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-linear-to-r file:from-blue-600 file:to-indigo-600 file:px-5 file:py-2.5 file:font-semibold file:text-white hover:file:from-blue-700 hover:file:to-indigo-700 active:file:scale-95"
            />
          </label>

          <p className="mt-5 text-sm text-slate-600">
            {isReadingImages
              ? '⏳ Chargement des images en cours...'
              : images.length > 0
                ? `✓ ${images.length} image(s) prête(s) pour le rapport.`
                : '📷 Aucune image chargée.'}
          </p>

          {uploadError && <p className="mt-3 text-sm font-medium text-red-600">❌ {uploadError}</p>}
        </div>

        {images.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-slate-700">
              <svg className="h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
              </svg>
              Aperçu et tri des images
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
                    className={`group relative overflow-hidden rounded-2xl border bg-white shadow-md transition duration-200 ${
                      isDragging
                        ? 'scale-[0.98] cursor-grabbing opacity-60 shadow-2xl'
                        : 'cursor-grab hover:-translate-y-1 hover:shadow-lg'
                    } ${isDragOver ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-slate-200'}`}
                  >
                    <img src={image} alt={`Aperçu ${index + 1}`} className="h-32 w-full object-cover sm:h-40" />

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-900/70 via-slate-900/30 to-transparent px-2 py-2 text-xs font-semibold text-white">
                      Photo {index + 1}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-95"
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

        <div className="mt-10 border-t border-slate-200 pt-10">
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
      </div>

      {!isUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-lg">
          <form
            onSubmit={handleUnlockSubmit}
            className="w-full max-w-sm animate-fade-in rounded-3xl border border-white/40 bg-white/95 p-8 shadow-2xl backdrop-blur-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-indigo-100 self-center mb-6">
              <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-center text-2xl font-bold text-slate-900">Accès protégé</h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              Entrez le code d&apos;accès pour ouvrir l&apos;application.
            </p>

            <label className="mt-6 block text-sm font-semibold text-slate-700" htmlFor="passcode-input">
              Code d&apos;accès
            </label>
            <input
              id="passcode-input"
              type="password"
              inputMode="numeric"
              value={passcodeInput}
              onChange={(event) => {
                setPasscodeInput(event.target.value);
                if (passcodeError) setPasscodeError('');
              }}
              autoFocus
              className={`${inputClassName} mt-3`}
              placeholder="••••••"
            />

            {passcodeError ? <p className="mt-3 text-sm font-medium text-red-600">❌ {passcodeError}</p> : null}

            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Déverrouiller
            </button>
          </form>
        </div>
      )}
    </>
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
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>
      {children}
    </label>
  );
}

const inputClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400';