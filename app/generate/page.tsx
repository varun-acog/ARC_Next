'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Calendar, Building, User, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { useDocuments } from '../contexts/DocumentContext';

interface FormData {
  enterprise_name: string;
  client_name: string;
  effective_date: string;
  valid_duration: string;
  notice_period: string;
  template_type: string;
}

const GenerateContract = () => {
  const router = useRouter();
  const { addDocument, setCurrentDocument } = useDocuments();
  const [formData, setFormData] = useState<FormData>({
    enterprise_name: '',
    client_name: '',
    effective_date: '',
    valid_duration: '',
    notice_period: '',
    template_type: '',
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);

  useEffect(() => {
    createSession();
    fetchTemplates();
  }, []);

  const createSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }
      const data = await response.json();
      setSessionId(data.session_id);
    } catch (err) {
      setError(err.message);
      console.error('Session creation error:', err);
    } finally {
      setLoading(false);
    }
  };

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
      setTemplates(data.templates);
      if (data.templates.length > 0) {
        setFormData((prev) => ({ ...prev, template_type: data.templates[0].name }));
      }
    } catch (err) {
      setError(err.message);
      console.error('Templates fetch error:', err);
    }
  };

  const checkSessionStatus = async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(`/api/session/${sessionId}/status`);
      const data = await response.json();
      console.log('Session Status:', data);
      alert(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Session status error:', err);
      setError('Failed to check session status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) {
      setError('No session ID available');
      return;
    }

    if (isNaN(Number(formData.valid_duration)) || Number(formData.valid_duration) <= 0) {
      setError('Valid Duration must be a positive number (in years)');
      return;
    }
    if (isNaN(Number(formData.notice_period)) || Number(formData.notice_period) <= 0) {
      setError('Notice Period must be a positive number (in months)');
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
        const errorData = await response.json();
        console.error('Contract generation response:', errorData);
        throw new Error(errorData.error || 'Failed to generate contract');
      }

      // Get the response as a Blob
      const blob = await response.blob();
      const documentId = `doc_${Date.now()}`;
      const documentName = `${formData.template_type}_${formData.client_name}_${new Date().toISOString().split('T')[0]}`;
      const file = new File([blob], `${documentName}.docx`, { type: blob.type });

      const docObject = {
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
        },
        file: file,
      };

      // Add to context
      addDocument(docObject);
      setCurrentDocument(docObject);
      setGeneratedDocument(docObject);

      // Trigger automatic download
      console.log('Document object before download:', typeof document); // Debug log
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); // Ensure 'document' is used correctly
      a.href = url;
      a.download = `${documentName}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
      console.error('Contract generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedDocument?.file) {
      console.log('Document object in handleDownload:', typeof document); // Debug log
      const url = window.URL.createObjectURL(generatedDocument.file);
      const a = document.createElement('a'); // Ensure 'document' is used correctly
      a.href = url;
      a.download = generatedDocument.file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const handleReviewDocument = () => {
    router.push('/review');
  };

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

          {/* {sessionId && (
            <div className="mb-6 flex items-center justify-center space-x-4">
              <p className="text-sm text-green-600">Session ID: {sessionId}</p>
              <button
                onClick={checkSessionStatus}
                disabled={!sessionId}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Check Session Status
              </button>
            </div>
          )} */}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Template *
              </label>
              <select
                name="template_type"
                value={formData.template_type}
                onChange={(e) =>
                  setFormData({ ...formData, template_type: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Enterprise Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="w-4 h-4 inline mr-1" />
                Enterprise Name *
              </label>
              <input
                type="text"
                name="enterprise_name"
                value={formData.enterprise_name}
                onChange={(e) =>
                  setFormData({ ...formData, enterprise_name: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter enterprise name"
              />
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Client Name *
              </label>
              <input
                type="text"
                name="client_name"
                value={formData.client_name}
                onChange={(e) =>
                  setFormData({ ...formData, client_name: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter client name"
              />
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Effective Date *
              </label>
              <input
                type="date"
                name="effective_date"
                value={formData.effective_date}
                onChange={(e) =>
                  setFormData({ ...formData, effective_date: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Valid Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Duration (Years) *
              </label>
              <input
                type="number"
                name="valid_duration"
                value={formData.valid_duration}
                onChange={(e) =>
                  setFormData({ ...formData, valid_duration: e.target.value })
                }
                min="1"
                max="10"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter duration in years"
              />
            </div>

            {/* Notice Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Notice Period (Months) *
              </label>
              <input
                type="number"
                name="notice_period"
                value={formData.notice_period}
                onChange={(e) =>
                  setFormData({ ...formData, notice_period: e.target.value })
                }
                min="1"
                max="12"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter notice period in months"
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
              onClick={handleSubmit}
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

            {/* Success Actions */}
            {generatedDocument && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Document Generated Successfully!</span>
                </div>
                <p className="text-sm text-green-700 mb-4">
                  Your {formData.template_type} has been generated and is ready for download or review.
                </p>
                <div className="flex space-x-3">
                  <button
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
                  </button>
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
        </div>
      </div>
    </div>
  );
};

export default GenerateContract;