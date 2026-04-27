'use client';

import { pdf } from '@react-pdf/renderer';
import { useState } from 'react';
import PdfDocument, { type PVFormData } from './PdfDocument';

type DownloadButtonProps = {
  form: PVFormData;
  fileName: string;
  isDownloadDisabled: boolean;
  isReadingImages: boolean;
  isFormComplete: boolean;
};

export default function DownloadButton({
  form,
  fileName,
  isDownloadDisabled,
  isReadingImages,
  isFormComplete,
}: DownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const isDisabled = isDownloadDisabled || isGenerating;

  const handleDownload = async () => {
    if (isDisabled) return;

    setIsGenerating(true);

    try {
      const blob = await pdf(<PdfDocument data={form} />).toBlob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-center text-lg font-bold transition ${
        isDisabled
          ? 'pointer-events-none cursor-not-allowed bg-slate-300 text-slate-500'
          : 'bg-blue-700 text-white shadow-lg shadow-blue-200 hover:bg-blue-800'
      }`}
      disabled={isDisabled}
    >
      {isReadingImages
        ? 'Traitement des images...'
        : isGenerating
          ? 'Génération du PV...'
          : !isFormComplete
            ? 'Complétez tous les champs requis'
            : form.images.length === 0
              ? 'Ajoutez des images pour activer le téléchargement'
              : 'Générer le PV'}
    </button>
  );
}
