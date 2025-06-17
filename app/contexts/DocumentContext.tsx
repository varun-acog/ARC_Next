'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface EvaluationQuestion {
  id: string;
  question: string;
  answer: string;
  status: 'good' | 'warning' | 'critical';
}

interface Metadata {
  template_type: string;
  enterprise_name: string;
  client_name: string;
  effective_date: string;
  valid_duration: string;
  notice_period: string;
  generatedAt: string;
  analyzedAt?: string;
  session_id?: string;
  uploadedAt?: string;
  [key: string]: any;
}

interface Document {
  id: string;
  name: string;
  type: string;
  content: string | null;
  metadata: Metadata;
  file: File;
  evaluation?: EvaluationQuestion[];
}

interface DocumentContextType {
  generateDocument: Document | null;
  setGenerateDocument: (doc: Document | null) => void;
  reviewDocument: Document | null;
  setReviewDocument: (doc: Document | null) => void;
  compareDocument: Document | null;
  setCompareDocument: (doc: Document | null) => void;
  documents: Document[];
  addDocument: (doc: Document) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [generateDocument, setGenerateDocument] = useState<Document | null>(null);
  const [reviewDocument, setReviewDocument] = useState<Document | null>(null);
  const [compareDocument, setCompareDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);

  const addDocument = (doc: Document) => {
    setDocuments((prev) => [...prev.filter((d) => d.id !== doc.id), doc]);
  };

  return (
    <DocumentContext.Provider
      value={{
        generateDocument,
        setGenerateDocument,
        reviewDocument,
        setReviewDocument,
        compareDocument,
        setCompareDocument,
        documents,
        addDocument,
      }}
    >
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