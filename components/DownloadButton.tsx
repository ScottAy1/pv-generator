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
      className={`inline-flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-center font-semibold transition duration-200 shadow-lg ${
        isDisabled
          ? 'pointer-events-none cursor-not-allowed bg-slate-300 text-slate-500 shadow-slate-300'
          : 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-blue-300 hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 active:scale-95'
      }`}
      disabled={isDisabled}
    >
      {isReadingImages ? (
        <>
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Traitement des images...</span>
        </>
      ) : isGenerating ? (
        <>
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Génération du PV...</span>
        </>
      ) : !isFormComplete ? (
        <>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Complétez tous les champs requis</span>
        </>
      ) : form.images.length === 0 ? (
        <>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Ajoutez des images pour activer</span>
        </>
      ) : (
        <>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
          </svg>
          <span className="text-lg">Générer le PV</span>
        </>
      )}
    </button>
  );
}
