'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Upload, FileText, ArrowRight, X } from 'lucide-react';
import { useDocuments } from '../contexts/DocumentContext';

interface EvaluationQuestion {
  id: string;
  question: string;
  answer: string;
}

const ReviewContract: React.FC = () => {
  const router = useRouter();
  const { currentDocument, addDocument, setCurrentDocument } = useDocuments();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contractType, setContractType] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationQuestion[]>([]);
  const [analyzedDocument, setAnalyzedDocument] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadResponse, setUploadResponse] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contractTypes = [
    { value: 'msa', label: 'Master Service Agreement (MSA)' },
    { value: 'nda', label: 'Non-Disclosure Agreement (NDA)' },
    { value: 'sla', label: 'Service Level Agreement (SLA)' },
    { value: 'employment', label: 'Employment Contract' },
    { value: 'vendor', label: 'Vendor Agreement' }
  ];

  // Create session on component mount
  useEffect(() => {
    createSession();
  }, []);

  // Check if there's a current document from generation
  useEffect(() => {
    if (currentDocument && !selectedFile) {
      setContractType(currentDocument.type);
      setSelectedFile(currentDocument.file || null);
    }
  }, [currentDocument, selectedFile]);

  const createSession = async () => {
    try {
      console.log('Creating new session...');
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        let errorMessage = 'Failed to create session';
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          errorMessage = `${errorMessage} (Status: ${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      console.log('Created session:', data.session_id);
      setSessionId(data.session_id);
      return data.session_id;
    } catch (err) {
      console.error('Session creation error:', err.message);
      setError(err.message);
      throw err;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input change event triggered');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    setSelectedFile(file);
    setUploadResponse(null); // Reset previous upload response
    setError(null);
    if (currentDocument) {
      setCurrentDocument(null);
    }

    if (!sessionId) {
      console.log('No session ID, creating a new one...');
      await createSession();
    }

    if (!contractType) {
      setError('Please select a contract type before uploading the document.');
      return;
    }

    try {
      console.log('Uploading document for review with sessionId:', sessionId);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('template_type', contractType);
      formData.append('session_id', sessionId!);

      const response = await fetch('/api/contracts/upload-for-review', {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', response.status);
      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        let errorMessage = 'Failed to upload document';
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          errorMessage = `${errorMessage} (Status: ${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Document uploaded successfully:', data);
      setUploadResponse(data); // Store the upload response
    } catch (err) {
      console.error('Upload error:', err.message);
      setError(err.message);
      setSelectedFile(null);
      setUploadResponse(null);
    }
  };

  const handleAnalyzeContract = async () => {
    if (!selectedFile || !contractType || !sessionId) {
      setError('Please upload a document, select a contract type, and ensure a session is active.');
      return;
    }

    if (!uploadResponse || uploadResponse.message !== 'File uploaded successfully') {
      setError('Document upload failed or was not completed. Please upload the document again.');
      return;
    }

    console.log('Proceeding to evaluate with sessionId:', sessionId, 'and file:', selectedFile.name);

    setIsAnalyzing(true);
    setError(null);

    const maxRetries = 3;
    let attempt = 0;
    let evaluationData = null;

    while (attempt < maxRetries) {
      try {
        console.log(`Analyze attempt ${attempt + 1} of ${maxRetries}...`);
        const evaluateBody = new URLSearchParams();
        evaluateBody.append('session_id', sessionId);

        const evaluateResponse = await fetch('/api/contracts/evaluate', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: evaluateBody,
        });

        console.log('Evaluate response status:', evaluateResponse.status);
        if (!evaluateResponse.ok) {
          const contentType = evaluateResponse.headers.get('Content-Type');
          let errorMessage = 'Failed to evaluate contract';
          let errorData = {};
          if (contentType && contentType.includes('application/json')) {
            errorData = await evaluateResponse.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
          } else {
            errorMessage = `${errorMessage} (Status: ${evaluateResponse.status} ${evaluateResponse.statusText})`;
          }
          throw new Error(errorMessage);
        }

        evaluationData = await evaluateResponse.json();
        console.log('Evaluation response:', evaluationData);
        break; // Success, exit the retry loop
      } catch (err) {
        attempt++;
        if (attempt === maxRetries) {
          console.error('Max retries reached. Evaluation failed:', err.message);
          setError('Failed to evaluate the contract after multiple attempts. Please try again or contact support.');
          setIsAnalyzing(false);
          return;
        }
        console.log(`Retrying... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff: 1s, 2s, 3s
      }
    }

    try {
      if (evaluationData) {
        // Pair questions and answers from the API response
        const mappedEvaluation: EvaluationQuestion[] = evaluationData.questions.map((question: string, index: number) => ({
          id: String(index),
          question: question,
          answer: evaluationData.answers[index] || 'No answer provided.',
        }));

        setEvaluation(mappedEvaluation);

        // Create analyzed document
        const documentId = currentDocument?.id || `analyzed_${Date.now()}`;
        const analyzedDoc = {
          id: documentId,
          name: selectedFile.name.replace(/\.[^/.]+$/, ""),
          type: contractType,
          content: currentDocument?.content || 'Document content...',
          metadata: {
            ...currentDocument?.metadata,
            analyzedAt: new Date().toISOString(),
          },
          file: selectedFile,
          evaluation: mappedEvaluation,
        };

        addDocument(analyzedDoc);
        setCurrentDocument(analyzedDoc);
        setAnalyzedDocument(analyzedDoc);
      }
    } catch (err) {
      console.error('Evaluation processing error:', err.message);
      setError('Failed to process the evaluation results. Please try again or contact support.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCompareDocument = () => {
    router.push('/compare');
  };

  const handleChooseFileClick = () => {
    console.log('Choose File button clicked');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('File input ref is not assigned');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-teal-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Evaluate Contract</h1>
              <p className="text-gray-600">Analyze contracts with AI-powered evaluation</p>
            </div>
          </div>

          {/* Show current document info if coming from generation */}
          {currentDocument && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Document from Generation</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Ready to analyze: {currentDocument.name} ({contractTypes.find(t => t.value === currentDocument.type)?.label})
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <X className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Contract Document</h3>
                <p className="text-gray-600 mb-4">Support for Word documents, PDFs, and text files</p>
                <input
                  type="file"
                  accept=".doc,.docx,.pdf,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  ref={fileInputRef}
                />
                <label
                  htmlFor="file-upload"
                  onClick={handleChooseFileClick}
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 cursor-pointer transition-colors"
                >
                  Choose File
                </label>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span className="text-sm text-teal-800">{selectedFile.name}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract Type *
                </label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Select contract type</option>
                  {contractTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAnalyzeContract}
                disabled={isAnalyzing || !selectedFile || !contractType || !sessionId}
                className="w-full mt-6 bg-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing Contract...</span>
                  </>
                ) : (
                  <>
                    <Scale className="w-5 h-5" />
                    <span>Analyze Contract</span>
                  </>
                )}
              </button>
            </div>

            {/* Results Section */}
            <div>
              {evaluation.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Evaluation Results</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {evaluation.map((item) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4 bg-white"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">{item.question}</h4>
                          <p className="text-sm text-gray-700">{item.answer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <ArrowRight className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Next Step</span>
                    </div>
                    <p className="text-sm text-purple-700 mb-4">
                      Ready to compare this contract with another version? Use our Contract Comparison tool 
                      to identify changes and get detailed AI insights.
                    </p>
                    <button
                      onClick={handleCompareDocument}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Compare Document</span>
                    </button>
                  </div>
                </div>
              )}
              
              {evaluation.length === 0 && !isAnalyzing && (
                <div className="text-center py-12">
                  <Scale className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Analyze</h3>
                  <p className="text-gray-600">Upload a contract document and select its type to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewContract;