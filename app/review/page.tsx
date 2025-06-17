'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Scale, Upload, FileText, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { useDocuments } from '../contexts/DocumentContext';

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

interface UploadResponse {
  message: string;
  session_id: string;
  filename: string;
  [key: string]: any;
}

interface Template {
  value: string;
  label: string;
}

const ReviewContract: React.FC = () => {
  const { reviewDocument, setReviewDocument, addDocument } = useDocuments();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contractType, setContractType] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationQuestion[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [contractTypes, setContractTypes] = useState<Template[]>([
    { value: 'msa', label: 'Master Service Agreement (MSA)' },
    { value: 'nda', label: 'Non-Disclosure Agreement (NDA)' },
    { value: 'sla', label: 'Service Level Agreement (SLA)' },
    { value: 'employment', label: 'Employment Contract' },
    { value: 'vendor', label: 'Vendor Agreement' },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTemplates();
    createSession();
  }, []);

  useEffect(() => {
    if (reviewDocument && !selectedFile) {
      console.log('Setting contract type from reviewDocument:', reviewDocument.type);
      setContractType(reviewDocument.type);
      setSelectedFile(reviewDocument.file || null);
      const metadata = reviewDocument.metadata as Metadata;
      if (metadata?.session_id) {
        setSessionId(metadata.session_id);
        setUploadResponse({
          message: 'File uploaded successfully',
          session_id: metadata.session_id,
          filename: reviewDocument.name,
        });
      }
    }
  }, [reviewDocument, selectedFile]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch templates');
      }
      const data = await response.json();
      console.log('Templates response:', data);

      let templatesArray: any[] = [];
      if (Array.isArray(data)) {
        templatesArray = data;
      } else if (data.templates && Array.isArray(data.templates)) {
        templatesArray = data.templates;
      } else if (data.data && Array.isArray(data.data)) {
        templatesArray = data.data;
      } else {
        console.warn('Unexpected templates response structure, using fallback contract types');
        return;
      }

      const templates: Template[] = templatesArray.map((item: any) => ({
        value: (item.name || item.id || item.type || '').toLowerCase(),
        label: item.description || item.name || item.type || 'Unknown Template',
      }));

      console.log('Mapped templates:', templates);
      setContractTypes(templates.length > 0 ? templates : contractTypes);
    } catch (err) {
      const error = err as Error;
      console.error('Template fetch error:', error);
      setError(error.message || 'Failed to load contract types, using fallback options');
    }
  };

  const createSession = async () => {
    try {
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        let errorMessage = 'Failed to create session';
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          errorMessage = `${errorMessage} (Status: ${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (!data.session_id) {
        throw new Error('Session ID not returned');
      }
      console.log('Session created:', data.session_id);
      setSessionId(data.session_id);
    } catch (err) {
      const error = err as Error;
      console.error('Session creation error:', error);
      setError(error.message || 'An unexpected error occurred during session creation');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    console.log('File uploaded:', { name: file.name, type: file.type, size: file.size });
    setSelectedFile(file);
    setUploadResponse(null);
    setError(null);
    setIsUploading(true);

    if (reviewDocument && reviewDocument.type !== contractType) {
      console.log('Clearing reviewDocument, preserving contractType:', contractType);
      setReviewDocument(null);
    }

    if (!sessionId) {
      console.log('No session ID, creating new session');
      await createSession();
    }

    if (!contractType) {
      setError('Please select a contract type before uploading the document.');
      setIsUploading(false);
      return;
    }

    if (!sessionId) {
      setError('Session could not be created. Please try again.');
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('template_type', contractType);
      formData.append('session_id', sessionId);

      console.log('Sending upload request with:', {
        template_type: contractType,
        session_id: sessionId,
        file_name: file.name,
      });

      const response = await fetch('/api/contracts/upload-for-review', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('Content-Type');
      let responseData: any;

      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = { text: await response.text() };
      }

      console.log('Upload response:', {
        status: response.status,
        ok: response.ok,
        data: responseData,
      });

      if (!response.ok) {
        let errorMessage = responseData.error || responseData.details || 'Failed to upload document';
        if (!contentType?.includes('application/json')) {
          errorMessage = `Failed to upload document (Status: ${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }

      if (!responseData.message) {
        throw new Error('Unexpected response format: No message field');
      }

      setUploadResponse(responseData);
      console.log('Upload successful, response set:', responseData);

      const documentId = `upload_${Date.now()}`;
      const tempDoc: Document = {
        id: documentId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: contractType,
        content: null,
        metadata: {
          template_type: contractType,
          enterprise_name: '',
          client_name: '',
          effective_date: '',
          valid_duration: '',
          notice_period: '',
          generatedAt: new Date().toISOString(),
          session_id: sessionId,
          uploadedAt: new Date().toISOString(),
        },
        file,
      };
      setReviewDocument(tempDoc);
      addDocument(tempDoc);
    } catch (err) {
      const error = err as Error;
      console.error('Upload error:', error.message);
      setError(error.message || 'Failed to upload document. Please try again.');
      setSelectedFile(null);
      setUploadResponse(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyzeContract = async () => {
    if (!selectedFile || !contractType || !sessionId) {
      setError('Please upload a document, select a contract type, and ensure a session is active.');
      return;
    }

    console.log('Analyzing contract, uploadResponse:', uploadResponse);
    if (!uploadResponse) {
      setError('Document upload not completed. Please upload the document again.');
      return;
    }

    const validMessages = ['File uploaded successfully', 'Upload successful', 'Document uploaded'];
    if (!validMessages.includes(uploadResponse.message)) {
      setError(`Upload issue: ${uploadResponse.message || 'Unknown error'}. Please upload the document again.`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const maxRetries = 3;
    let attempt = 0;
    let evaluationData = null;

    while (attempt < maxRetries) {
      try {
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

        if (!evaluateResponse.ok) {
          const contentType = evaluateResponse.headers.get('Content-Type');
          let errorMessage = 'Failed to evaluate contract';
          if (contentType?.includes('application/json')) {
            const errorData = await evaluateResponse.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
          } else {
            errorMessage = `${errorMessage} (Status: ${evaluateResponse.status} ${evaluateResponse.statusText})`;
          }
          throw new Error(errorMessage);
        }

        evaluationData = await evaluateResponse.json();
        console.log('Evaluation response:', evaluationData);
        break;
      } catch (err) {
        attempt++;
        if (attempt === maxRetries) {
          const error = err as Error;
          console.error('Max retries reached. Evaluation failed:', error);
          setError('Failed to evaluate the contract after multiple attempts. Please try again or contact support.');
          setIsAnalyzing(false);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    try {
      if (evaluationData) {
        const { questions, answers } = evaluationData;
        const mappedEvaluation: EvaluationQuestion[] = questions.map((question: string, index: number) => {
          const answer = answers[index] || 'No answer provided.';
          let status: 'good' | 'warning' | 'critical' = 'good';
          if (answer.includes('NA - Not Applicable') || answer.startsWith('No')) {
            status = 'good';
          } else if (answer.includes('partially') || answer.includes('could be')) {
            status = 'warning';
          } else if (answer.includes('issue') || answer.includes('excessive')) {
            status = 'critical';
          }
          return {
            id: String(index),
            question,
            answer,
            status,
          };
        });

        setEvaluation(mappedEvaluation);

        const documentId = reviewDocument?.id || `analyzed_${Date.now()}`;
        const analyzedDoc: Document = {
          id: documentId,
          name: selectedFile.name.replace(/\.[^/.]+$/, ''),
          type: contractType,
          content: reviewDocument?.content || null,
          metadata: {
            template_type: contractType,
            enterprise_name: reviewDocument?.metadata.enterprise_name || '',
            client_name: reviewDocument?.metadata.client_name || '',
            effective_date: reviewDocument?.metadata.effective_date || '',
            valid_duration: reviewDocument?.metadata.valid_duration || '',
            notice_period: reviewDocument?.metadata.notice_period || '',
            generatedAt: reviewDocument?.metadata.generatedAt || new Date().toISOString(),
            session_id: sessionId,
            analyzedAt: new Date().toISOString(),
          },
          file: selectedFile,
          evaluation: mappedEvaluation,
        };

        addDocument(analyzedDoc);
        setReviewDocument(analyzedDoc);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Evaluation processing error:', error);
      setError(error.message || 'Failed to process the evaluation results. Please try again or contact support.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChooseFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return null;
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

          {reviewDocument && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Document from Generation</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Ready to analyze: {reviewDocument.name} ({contractTypes.find(t => t.value === reviewDocument.type)?.label || reviewDocument.type})
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
            <div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={contractType}
                  onChange={(e) => {
                    console.log('Contract type selected:', e.target.value);
                    setContractType(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-emphasis"
                  required
                >
                  <option value="">Select contract type</option>
                  {contractTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Contract Document</h3>
                <p className="text-gray-600 mb-3">Support for Word (.doc, .docx), PDF, and text (.txt) files</p>
                <input
                  type="file"
                  accept=".doc,.docx,.pdf,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  ref={fileInputRef}
                />
                <button
                  type="button"
                  onClick={handleChooseFileClick}
                  disabled={isUploading}
                  className="px-6 py-2 text-white bg-teal-600 rounded-lg font-semibold hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploading ? 'Uploading...' : 'Choose File'}
                </button>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-teal-50 border border-gray-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span className="text-sm text-teal-800 truncate">{selectedFile.name}</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleAnalyzeContract}
                disabled={isAnalyzing || isUploading || !selectedFile || !contractType || !sessionId || !uploadResponse?.message}
                className="w-full mt-4 py-3 px-6 text-white bg-teal-700 rounded-lg font-semibold hover:bg-teal-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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

            <div>
              {evaluation.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Evaluation Results</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {evaluation.map((item) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          {getStatusIcon(item.status)}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{item.question}</h4>
                            <p className="text-sm text-gray-600">{item.answer}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {evaluation.length === 0 && !isAnalyzing && (
                <div className="text-center py-12">
                  <Scale className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Analyze</h3>
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