'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Document {
  id: string;
  name: string;
  type: string;
  content: string | null;
  metadata: {
    template_type: string;
    enterprise_name: string;
    client_name: string;
    effective_date: string;
    valid_duration: string;
    notice_period: string;
    generatedAt: string;
  };
  file: File;
}

interface DocumentContextType {
  documents: Document[];
  currentDocument: Document | null;
  addDocument: (document: Document) => void;
  setCurrentDocument: (document: Document | null) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider = ({ children }: { children: ReactNode }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);

  const addDocument = (document: Document) => {
    setDocuments((prev) => [...prev, document]);
  };

  return (
    <DocumentContext.Provider value={{ documents, currentDocument, addDocument, setCurrentDocument }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};