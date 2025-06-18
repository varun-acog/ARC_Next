'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Calendar, Building, User, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { useDocuments } from '../contexts/DocumentContext';
import { useSession } from '../hooks/useSession';

interface FormData {
  enterprise_name: string;
  client_name: string;
  effective_date: string;
  valid_duration: string;
  notice_period: string;
  template_type: string;
}

interface Template {
  id: string;
  name: string;
}

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
    analyzedAt?: string;
    session_id?: string;
    uploadedAt?: string;
    [key: string]: any;
  };
  file: File;
}

const GenerateContract = () => {
  const router = useRouter();
  const { addDocument, setGenerateDocument } = useDocuments();
  const { sessionId, isLoading: sessionLoading, error: sessionError } = useSession();
  const [formData, setFormData] = useState<FormData>({
    enterprise_name: '',
    client_name: '',
    effective_date: '',
    valid_duration: '',
    notice_period: '',
    template_type: '',
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<Document | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (sessionError) {
      setError(sessionError);
    }
  }, [sessionError]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        let errorMessage = 'Failed to fetch templates';
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          errorMessage = `${errorMessage} (Status: ${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (!Array.isArray(data.templates)) {
        throw new Error('Invalid templates data');
      }
      setTemplates(data.templates);
      if (data.templates.length > 0) {
        setFormData((prev) => ({ ...prev, template_type: data.templates[0].name }));
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'An unexpected error occurred while fetching templates');
      console.error('Templates fetch error:', error);
    }
  };

  const validateForm = (): string | null => {
    if (!formData.template_type) return 'Please select a document template';
    if (!formData.enterprise_name.trim()) return 'Please enter the enterprise name';
    if (!formData.client_name.trim()) return 'Please enter the client name';
    if (!formData.effective_date) return 'Please select an effective date';
    if (!formData.valid_duration || isNaN(Number(formData.valid_duration)) || Number(formData.valid_duration) <= 0) {
      return 'Valid Duration must be a positive number (in years)';
    }
    if (!formData.notice_period || isNaN(Number(formData.notice_period)) || Number(formData.notice_period) <= 0) {
      return 'Notice Period must be a positive number (in months)';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) {
      setError('No session ID available. Please try again.');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const formBody = new URLSearchParams({
      enterprise_name: formData.enterprise_name,
      client_name: formData.client_name,
      effective_date: formData.effective_date,
      valid_duration: formData.valid_duration.toString(),
      notice_period: formData.notice_period.toString(),
      template_type: formData.template_type,
      session_id: sessionId,
    });

    try {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
        body: formBody,
      });

      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        let errorMessage = 'Failed to generate contract';
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          errorMessage = `${errorMessage} (Status: ${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const documentId = `doc_${Date.now()}`;
      const documentName = `${formData.template_type}_${formData.client_name}_${new Date().toISOString().split('T')[0]}`;
      const file = new File([blob], `${documentName}.docx`, { type: blob.type });

      const docObject: Document = {
        id: documentId,
        name: documentName,
        type: formData.template_type,
        content: null,
        metadata: {
          template_type: formData.template_type,
          enterprise_name: formData.enterprise_name,
          client_name: formData.client_name,
          effective_date: formData.effective_date,
          valid_duration: formData.valid_duration,
          notice_period: formData.notice_period,
          generatedAt: new Date().toISOString(),
          session_id: sessionId,
        },
        file,
      };

      addDocument(docObject);
      setGenerateDocument(docObject);
      setGeneratedDocument(docObject);

      if (typeof window !== 'undefined') {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentName}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'An unexpected error occurred during contract generation');
      console.error('Contract generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedDocument?.file && typeof window !== 'undefined') {
      const url = window.URL.createObjectURL(generatedDocument.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = generatedDocument.file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const handleReviewDocument = () => {
    if (generatedDocument) {
      router.push('/review');
    }
  };

  if (sessionLoading) {
    return <div className="text-center py-8">Loading session...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Generate Contract</h1>
              <p className="text-gray-600">Create contracts from pre-built templates</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Template *
                </label>
                <select
                  name="template_type"
                  value={formData.template_type}
                  onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-1" />
                  Enterprise Name *
                </label>
                <input
                  type="text"
                  name="enterprise_name"
                  value={formData.enterprise_name}
                  onChange={(e) => setFormData({ ...formData, enterprise_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter enterprise name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Client Name *
                </label>
                <input
                  type="text"
                  name="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter client name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Effective Date *
                </label>
                <input
                  type="date"
                  name="effective_date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract Duration (Years) *
                </label>
                <input
                  type="number"
                  name="valid_duration"
                  value={formData.valid_duration}
                  onChange={(e) => setFormData({ ...formData, valid_duration: e.target.value })}
                  min="1"
                  max="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter duration in years"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Notice Period (Months) *
                </label>
                <input
                  type="number"
                  name="notice_period"
                  value={formData.notice_period}
                  onChange={(e) => setFormData({ ...formData, notice_period: e.target.value })}
                  min="1"
                  max="12"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter notice period in months"
                  required
                />
              </div>
            </div>

            <div className="mt-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Document Generation</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Your document will be generated based on the selected template and details provided. 
                      The contract will be automatically downloaded as a Word document.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !sessionId || templates.length === 0}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating Document...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Generate Contract</span>
                  </>
                )}
              </button>

              {generatedDocument && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Document Generated Successfully!</span>
                  </div>
                  <p className="text-sm text-green-700 mb-4">
                    Your {formData.template_type} has been downloaded.
                  </p>
                  <div className="flex space-x-3">
                    {/* <button
                      onClick={handleDownload}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={handleReviewDocument}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center space-x-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Review Document</span>
                    </button> */}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default GenerateContract;
