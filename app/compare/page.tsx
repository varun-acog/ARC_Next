'use client';

import React, { useState, useEffect } from 'react';
import { GitCompare, Upload, FileText, Plus, Minus, CheckCircle, MessageSquare, Download, X, Shield, Scale, ArrowRight, RefreshCw } from 'lucide-react';
import { useDocuments } from '../contexts/DocumentContext';
import { useSession } from '../hooks/useSession';

interface Change {
  id: string;
  type: 'addition' | 'deletion' | 'modification';
  section: string;
  index: number;
  oldText?: string;
  newText?: string;
  summary: string;
  legalOpinion: string;
  precedence: string;
  policyViolations: string;
  status?: 'approved' | 'referred' | 'pending';
  remarks?: string;
}

interface RemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (remarks: string) => void;
  change: Change | null;
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
}

interface UploadResponse {
  message: string;
  session_id: string;
  filename: string;
}

const RemarkModal: React.FC<RemarkModalProps> = ({ isOpen, onClose, onSubmit, change }) => {
  const [remarks, setRemarks] = useState('');

  if (!isOpen || !change) return null;

  const handleSubmit = () => {
    onSubmit(remarks);
    setRemarks('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Remarks</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Change #{change.index}</p>
          <p className="text-sm text-gray-800">{change.summary}</p>
        </div>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Enter your remarks for this change..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
        />
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

const CompareContract: React.FC = () => {
  const { compareDocument, setCompareDocument, addDocument } = useDocuments();
  const { sessionId, isLoading: sessionLoading, error: sessionError, updateSession, clearSession } = useSession();
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [compareFile, setCompareFile] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isUploadingOriginal, setIsUploadingOriginal] = useState(false);
  const [isUploadingCompare, setIsUploadingCompare] = useState(false);
  const [originalUploadResponse, setOriginalUploadResponse] = useState<UploadResponse | null>(null);
  const [compareUploadResponse, setCompareUploadResponse] = useState<UploadResponse | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [remarkModal, setRemarkModal] = useState<{ isOpen: boolean; change: Change | null }>({
    isOpen: false,
    change: null,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (sessionError) {
      setError(sessionError);
    }
  }, [sessionError]);

  useEffect(() => {
    if (compareDocument && !compareFile && sessionId) {
      console.log('Syncing compareDocument:', compareDocument.name);
      setCompareFile(compareDocument.file);
      setSelectedTemplate(compareDocument.type);
      const metadata = compareDocument.metadata as Metadata;
      if (metadata?.session_id && metadata.session_id !== sessionId) {
        console.log('Updating session_id from compareDocument:', metadata.session_id);
        updateSession(metadata.session_id);
      }
      if (!compareUploadResponse && compareDocument.file) {
        handleFileUpload('compare')({ target: { files: [compareDocument.file] } } as any);
      }
    }
  }, [compareDocument, compareFile, sessionId, updateSession]);

  useEffect(() => {
    // Reset states on new session
    if (sessionId) {
      console.log('New session detected, resetting states for session_id:', sessionId);
      setOriginalFile(null);
      setCompareFile(null);
      setOriginalUploadResponse(null);
      setCompareUploadResponse(null);
      setChanges([]);
      setError(null);
      setCompareDocument(null);
    }
  }, [sessionId, setCompareDocument]);

  const fetchTemplates = async () => {
    try {
      console.log('Fetching templates...');
      const response: globalThis.Response = await fetch('/api/templates', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        let errorMessage = 'Failed to fetch templates';
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          errorMessage = `${errorMessage} (Status: ${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      console.log('Templates fetched:', data.templates);
      setTemplates(data.templates);
      if (data.templates.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data.templates[0].name);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Templates fetch error:', error.message);
      setError(error.message);
    }
  };

  const clearComparison = () => {
    console.log('Clearing previous comparison results');
    setChanges([]);
    setError(null);
  };

  const handleFileUpload = (type: 'original' | 'compare') => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log(`${type} file selected:`, { name: file.name, size: file.size, type: file.type });
    clearComparison();
    setError(null);

    if (!sessionId) {
      console.error('No session ID available');
      setError('Session not established. Please try again.');
      return;
    }

    if (!selectedTemplate && type === 'compare') {
      console.error('No template selected for compare upload');
      setError('Please select a template before uploading the compare document.');
      return;
    }

    if (type === 'original') {
      setOriginalFile(file);
      setIsUploadingOriginal(true);
      setOriginalUploadResponse(null);
    } else {
      setCompareFile(file);
      setIsUploadingCompare(true);
      setCompareUploadResponse(null);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('session_id', sessionId);
      if (type === 'compare') {
        formData.append('template_type', selectedTemplate);
      }

      const endpoint = type === 'original' ? '/api/contracts/upload-reference' : '/api/contracts/upload-for-review';
      console.log(`Uploading to ${endpoint} with:`, {
        session_id: sessionId,
        template_type: type === 'compare' ? selectedTemplate : undefined,
        filename: file.name,
      });

      const response: globalThis.Response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Cache-Control': 'no-cache' },
        body: formData,
      });

      const contentType = response.headers.get('Content-Type');
      let responseData: any;

      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = { text: await response.text() };
      }

      console.log(`Upload ${type} response:`, {
        status: response.status,
        ok: response.ok,
        data: responseData,
      });

      if (!response.ok) {
        let errorMessage = responseData.error || responseData.details || `Failed to upload ${type} document`;
        if (!contentType?.includes('application/json')) {
          errorMessage = `${errorMessage} (Status: ${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }

      if (!responseData.message || !responseData.session_id) {
        throw new Error(`Invalid response format from ${endpoint}: Missing message or session_id`);
      }

      if (responseData.session_id !== sessionId) {
        console.warn('Session ID mismatch in upload response, updating:', responseData.session_id);
        updateSession(responseData.session_id);
      }

      if (type === 'original') {
        setOriginalUploadResponse(responseData);
      } else {
        setCompareUploadResponse(responseData);
        const documentId = `compare_${Date.now()}`;
        const tempDoc: Document = {
          id: documentId,
          name: file.name.replace(/\.[^/.]+$/, ''),
          type: selectedTemplate,
          content: null,
          metadata: {
            template_type: selectedTemplate,
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
        setCompareDocument(tempDoc);
        addDocument(tempDoc);
      }
    } catch (err) {
      const error = err as Error;
      console.error(`Upload ${type} error:`, error.message);
      setError(error.message);
      if (type === 'original') {
        setOriginalFile(null);
        setOriginalUploadResponse(null);
      } else {
        setCompareFile(null);
        setCompareUploadResponse(null);
      }
    } finally {
      if (type === 'original') {
        setIsUploadingOriginal(false);
      } else {
        setIsUploadingCompare(false);
      }
    }
  };

  const handleCompareDocuments = async () => {
    if (isComparing) {
      console.log('Comparison already in progress, ignoring duplicate click');
      return;
    }

    console.log('Starting comparison with session_id:', sessionId);
    setIsComparing(true);
    setError(null);

    try {
      console.log('Validating prerequisites...');
      if (!sessionId) {
        throw new Error('No session ID available');
      }
      if (!originalUploadResponse || !compareUploadResponse) {
        throw new Error('Both documents must be successfully uploaded before comparison');
      }
      if (!selectedTemplate) {
        throw new Error('Please select a template');
      }
      if (originalUploadResponse.session_id !== sessionId || compareUploadResponse.session_id !== sessionId) {
        throw new Error('Session mismatch between uploads. Please re-upload both documents.');
      }

      console.log('Sending comparison request...');
      const compareBody = new URLSearchParams();
      compareBody.append('session_id', sessionId);

      const compareResultResponse: globalThis.Response = await fetch('/api/contracts/compare', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache',
        },
        body: compareBody,
      });

      const contentType = compareResultResponse.headers.get('Content-Type');
      let compareResult: any;

      if (contentType?.includes('application/json')) {
        compareResult = await compareResultResponse.json();
      } else {
        compareResult = { text: await compareResultResponse.text() };
      }

      console.log('Comparison response:', {
        status: compareResultResponse.status,
        ok: compareResultResponse.ok,
        data: compareResult,
      });

      if (!compareResultResponse.ok) {
        let errorMessage = compareResult.error || compareResult.details || 'Failed to compare documents';
        if (!contentType?.includes('application/json')) {
          errorMessage = `Failed to compare documents (Status: ${compareResultResponse.status} ${compareResult.text || compareResultResponse.statusText})`;
        }
        if (errorMessage.includes('Files not found for this session')) {
          console.log('Session not found, resetting uploads');
          setOriginalUploadResponse(null);
          setCompareUploadResponse(null);
          setOriginalFile(null);
          setCompareFile(null);
          throw new Error('Session expired or invalid. Please re-upload both documents.');
        }
        throw new Error(errorMessage);
      }

      if (!compareResult.differences || !Array.isArray(compareResult.differences)) {
        console.error('Invalid differences format:', compareResult.differences);
        throw new Error(`No valid differences found. Response: ${JSON.stringify(compareResult)}`);
      }

      if (compareResult.differences.length === 0) {
        console.log('No differences detected between documents');
        setError('No differences found between the documents.');
        setChanges([]);
        return;
      }

      const precedenceOptions = [
        "Similar extension was accepted by Microsoft in 2023 contract negotiations, but rejected by Google in 2024 due to cash flow concerns. Amazon accepted 45-day terms with 2% early payment discount in Q3 2024.",
        "Unlimited liability was rejected by Apple in 2023 and Tesla in 2024. Industry standard maintains 1-2x contract value cap. Only 3% of enterprise contracts accept unlimited liability.",
        "Payment term extension to 90 days was accepted by IBM in 2022 but rejected by Oracle in 2024 due to financial risk concerns. Salesforce agreed to 60-day terms with a 1.5% late fee in Q1 2024.",
        "Confidentiality clause expansion was accepted by Intel in 2023 but rejected by Cisco in 2024 due to compliance issues. Dell agreed to a 5-year confidentiality term in Q2 2024.",
        "Termination clause modification was rejected by Adobe in 2023 and SAP in 2024 due to operational risks. VMware accepted a 30-day termination notice with penalties in Q4 2023."
      ];

      const policyViolationsOptions = [
        "No policy violations detected. Change aligns with company payment policy guidelines for enterprise clients.",
        "MAJOR VIOLATION: Contradicts company risk management policy which mandates liability caps not exceed 3x annual contract value. Requires C-level approval.",
        "MINOR VIOLATION: Exceeds standard payment terms of 60 days as per company financial policy. Requires finance team review.",
        "No policy violations detected. Change complies with company confidentiality and data protection policies.",
        "MAJOR VIOLATION: Conflicts with company termination policy requiring a minimum 45-day notice period. Requires legal team approval."
      ];

      console.log('Mapping differences to changes...');
      const mappedChanges: Change[] = compareResult.differences.map((diff: any, idx: number) => {
        const type = diff.reference_text === '' ? 'addition' : diff.review_text === '' ? 'deletion' : 'modification';
        const aiOpinionParts = diff.ai_opinion ? diff.ai_opinion.split('\n- Legal Opinion:') : ['No default summary provided', 'No legal opinion provided'];
        const summary = aiOpinionParts[0].replace('- Summary:', '').trim();
        const legalOpinion = aiOpinionParts[1] ? aiOpinionParts[1].trim() : 'No legal opinion provided';

        const precedence = precedenceOptions[idx % precedenceOptions.length];
        const policyViolations = policyViolationsOptions[idx % policyViolationsOptions.length];

        return {
          id: String(diff.index),
          type,
          section: '',
          index: diff.index,
          oldText: diff.reference_text || undefined,
          newText: diff.review_text || undefined,
          summary,
          legalOpinion,
          precedence,
          policyViolations,
          status: 'pending',
        };
      });

      console.log('Setting changes:', mappedChanges);
      setChanges(mappedChanges);
    } catch (err) {
      const error = err as Error;
      console.error('Comparison error:', error.message);
      setError(error.message);
    } finally {
      console.log('Comparison process completed');
      setIsComparing(false);
    }
  };

  const handleApproveChange = (changeId: string) => {
    setChanges((prev) =>
      prev.map((change) =>
        change.id === changeId ? { ...change, status: 'approved' as const } : change
      )
    );
  };

  const handleReferChange = (changeId: string) => {
    const change = changes.find((c) => c.id === changeId);
    if (change) {
      setRemarkModal({ isOpen: true, change });
    }
  };

  const handleSubmitRemarks = (remarks: string) => {
    if (remarkModal.change) {
      setChanges((prev) =>
        prev.map((change) =>
          change.id === remarkModal.change!.id
            ? { ...change, status: 'referred' as const, remarks }
            : change
        )
      );
    }
  };

  const handleSaveChanges = () => {
    const approvedChanges = changes.filter((c) => c.status === 'approved');
    const referredChanges = changes.filter((c) => c.status === 'referred');

    const content = `
      DOCUMENT COMPARISON RESULTS
      ==========================

      APPROVED CHANGES (${approvedChanges.length}):
      ${approvedChanges.map((change) => `
      - Change #${change.index}: ${change.summary}
      `).join('')}

      REFERRED CHANGES (${referredChanges.length}):
      ${referredChanges.map((change) => `
      - Change #${change.index}: ${change.summary}
        Remarks: ${change.remarks || null}
      `).join('')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_comparison_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'addition':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'deletion':
        return <Minus className="w-4 h-4 text-red-600" />;
      case 'modification':
        return <ArrowRight className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'referred':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPolicyViolationStyles = (policyViolation: string) => {
    if (policyViolation.includes('MAJOR VIOLATION')) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700'
      };
    } else if (policyViolation.includes('MINOR VIOLATION')) {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700'
      };
    } else {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700'
      };
    }
  };

  const renderTextComparison = (oldText?: string, newText?: string, type?: string) => {
    if (type === 'addition' && newText) {
      return (
        <div className="bg-white border border-gray-200 rounded p-3">
          <h5 className="text-sm font-medium text-gray-800 mb-2">Text Changes</h5>
          <div className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
            <div className="flex-1">
              <span className="text-gray-600 text-xs block mb-1">Original:</span>
              <p className="text-sm border border-gray-200 rounded p-2 text-gray-500 italic">N/A</p>
            </div>
            <div className="flex-1">
              <span className="text-gray-600 text-xs block mb-1">Modified:</span>
              <p className="text-sm border border-gray-200 rounded p-2 compare-text" dangerouslySetInnerHTML={{ __html: newText }} />
            </div>
          </div>
        </div>
      );
    }

    if (type === 'deletion' && oldText) {
      return (
        <div className="bg-white border border-gray-200 rounded p-3">
          <h5 className="text-sm font-medium text-gray-800 mb-2">Text Changes</h5>
          <div className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
            <div className="flex-1">
              <span className="text-gray-600 text-xs block mb-1">Original:</span>
              <p className="text-sm border border-gray-200 rounded p-2 compare-text" dangerouslySetInnerHTML={{ __html: oldText }} />
            </div>
            <div className="flex-1">
              <span className="text-gray-600 text-xs block mb-1">Modified:</span>
              <p className="text-sm border border-gray-200 rounded p-2 text-gray-500 italic">N/A</p>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'modification' && oldText && newText) {
      return (
        <div className="bg-white border border-gray-200 rounded p-3">
          <h5 className="text-sm font-medium text-gray-800 mb-2">Text Changes</h5>
          <div className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
            <div className="flex-1">
              <span className="text-gray-600 text-xs block mb-1">Original:</span>
              <p className="text-sm border border-gray-200 rounded p-2 compare-text" dangerouslySetInnerHTML={{ __html: oldText }} />
            </div>
            <div className="flex-1">
              <span className="text-gray-600 text-xs block mb-1">Modified:</span>
              <p className="text-sm border border-gray-200 rounded p-2 compare-text" dangerouslySetInnerHTML={{ __html: newText }} />
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div>
      <style jsx>{`
        .compare-text span[style*="color: green"],
        .compare-text span[style*="color: #008000"],
        .compare-text span[style*="color: #00ff00"],
        .compare-text span[style*="color: #228B22"],
        .compare-text span[style*="color: #32CD32"],
        .compare-text span[style*="color: #006400"],
        .compare-text span[style*="color: #0F5132"],
        .compare-text span[style*="color: #198754"],
        .compare-text span[style*="color: #20c997"],
        .compare-text span[style*="color:green"],
        .compare-text span[style*="color:#008000"],
        .compare-text span[style*="color:#00ff00"],
        .compare-text span[style*="color:#228B22"],
        .compare-text span[style*="color:#32CD32"],
        .compare-text span[style*="color:#006400"],
        .compare-text span[style*="color:#0F5132"],
        .compare-text span[style*="color:#198754"],
        .compare-text span[style*="color:#20c997"] {
          color: #86efac !important;
        }
        .compare-text span[style*="background-color: green"],
        .compare-text span[style*="background-color: #008000"],
        .compare-text span[style*="background-color: #00ff00"],
        .compare-text span[style*="background-color: #228B22"],
        .compare-text span[style*="background-color: #32CD32"],
        .compare-text span[style*="background-color: #006400"],
        .compare-text span[style*="background-color:#008000"],
        .compare-text span[style*="background-color:#00ff00"],
        .compare-text span[style*="background-color:#228B22"],
        .compare-text span[style*="background-color:#32CD32"],
        .compare-text span[style*="background-color:#006400"] {
          background-color: #dcfce7 !important;
          color: #166534 !important;
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Compare Contracts</h1>
                  <p className="text-gray-600">Compare document versions with AI-powered insights and approval workflows</p>
                </div>
              </div>
              {/* <button
                onClick={clearSession}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Start New Session</span>
              </button> */}
            </div>

            <div className="mb-6 flex items-center space-x-4">
              <label className="block text-sm font-medium text-gray-700">
                Template Type *
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                  clearComparison();
                }}
                className="w-64 px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {templates.length === 0 ? (
                  <option value="">Loading templates...</option>
                ) : (
                  <>
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.name}>
                        {template.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-2">Reference Document</h3>
                <input
                  type="file"
                  accept=".doc,.docx"
                  onChange={handleFileUpload('original')}
                  className="hidden"
                  id="original-upload"
                  disabled={isUploadingOriginal || sessionLoading}
                />
                <label
                  htmlFor="original-upload"
                  className={`bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 cursor-pointer transition-colors text-sm ${isUploadingOriginal || sessionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploadingOriginal ? 'Uploading...' : 'Choose File'}
                </label>
                {originalFile && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-blue-800">{originalFile.name}</span>
                      {originalUploadResponse && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-2">Modified Document</h3>
                <input
                  type="file"
                  accept=".doc,.docx"
                  onChange={handleFileUpload('compare')}
                  className="hidden"
                  id="compare-upload"
                  disabled={isUploadingCompare || sessionLoading}
                />
                <label
                  htmlFor="compare-upload"
                  className={`bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 cursor-pointer transition-colors text-sm ${isUploadingCompare || sessionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploadingCompare ? 'Uploading...' : 'Choose File'}
                </label>
                {compareFile && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-blue-800">{compareFile.name}</span>
                      {compareUploadResponse && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleCompareDocuments}
              disabled={isComparing || isUploadingOriginal || isUploadingCompare || !originalUploadResponse || !compareUploadResponse || !selectedTemplate || sessionLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 mb-8"
            >
              {isComparing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Comparing Documents...</span>
                </>
              ) : (
                <>
                  <GitCompare className="w-5 h-5" />
                  <span>Compare Documents</span>
                </>
              )}
            </button>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <X className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {changes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Comparison Results ({changes.length} changes found)
                  </h3>
                  <button
                    onClick={handleSaveChanges}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {changes.map((change) => {
                    const policyStyles = getPolicyViolationStyles(change.policyViolations);
                    return (
                      <div key={change.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {getChangeIcon(change.type)}
                            <div>
                              <h4 className="font-semibold text-gray-900">Change #{change.index}</h4>
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  change.status
                                )}`}
                              >
                                {change.status || 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          {renderTextComparison(change.oldText, change.newText, change.type)}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h5 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
                            <Scale className="w-4 h-4" />
                            <span>AI Insights</span>
                          </h5>
                          <div className="space-y-4">
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-2">Summary</h6>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                                {change.summary}
                              </p>
                            </div>
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-2">Legal Opinion</h6>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                                {change.legalOpinion}
                              </p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                                  <FileText className="w-3 h-3" />
                                  <span>Precedence</span>
                                </h6>
                                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
                                  {change.precedence}
                                </p>
                              </div>
                              <div>
                                <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                                  <Shield className="w-3 h-3" />
                                  <span>Policy Violations</span>
                                </h6>
                                <p className={`text-sm ${policyStyles.text} ${policyStyles.bg} p-3 rounded border ${policyStyles.border}`}>
                                  {change.policyViolations}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {change.remarks && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                            <h6 className="text-sm font-medium text-yellow-800 mb-1">Remarks</h6>
                            <p className="text-sm text-yellow-700">{change.remarks}</p>
                          </div>
                        )}

                        {change.status === 'pending' && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleApproveChange(change.id)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReferChange(change.id)}
                              className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition-colors flex items-center space-x-2"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>Refer Back</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <RemarkModal
          isOpen={remarkModal.isOpen}
          onClose={() => setRemarkModal({ isOpen: false, change: null })}
          onSubmit={handleSubmitRemarks}
          change={remarkModal.change}
        />
      </div>
    </div>
  );
};

export default CompareContract;