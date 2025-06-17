'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DocumentData {
  id: string;
  name: string;
  type: string;
  content: string;
  metadata: {
    templateType?: string;
    enterpriseName?: string;
    clientName?: string;
    effectiveDate?: string;
    contractValidation?: string;
    noticePeriod?: string;
    generatedAt?: string;
    analyzedAt?: string;
  };
  file?: File;
}

interface DocumentContextType {
  documents: DocumentData[];
  currentDocument: DocumentData | null;
  addDocument: (document: DocumentData) => void;
  setCurrentDocument: (document: DocumentData | null) => void;
  getDocumentById: (id: string) => DocumentData | undefined;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

interface DocumentProviderProps {
  children: ReactNode;
}

export const DocumentProvider: React.FC<DocumentProviderProps> = ({ children }) => {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [currentDocument, setCurrentDocument] = useState<DocumentData | null>(null);

  const addDocument = (document: DocumentData) => {
    setDocuments(prev => {
      const existingIndex = prev.findIndex(doc => doc.id === document.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = document;
        return updated;
      }
      return [...prev, document];
    });
  };

  const getDocumentById = (id: string) => {
    return documents.find(doc => doc.id === id);
  };

  return (
    <DocumentContext.Provider value={{
      documents,
      currentDocument,
      addDocument,
      setCurrentDocument,
      getDocumentById
    }}>
      {children}
    </DocumentContext.Provider>
  );
};