'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Calendar, Building, User, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { useDocuments } from '../contexts/DocumentContext';

interface FormData {
  templateType: string;
  enterpriseName: string;
  clientName: string;
  effectiveDate: string;
  contractValidation: string;
  noticePeriod: string;
}

const GenerateDocument: React.FC = () => {
  const router = useRouter();
  const { addDocument, setCurrentDocument } = useDocuments();
  const [formData, setFormData] = useState<FormData>({
    templateType: '',
    enterpriseName: '',
    clientName: '',
    effectiveDate: '',
    contractValidation: '',
    noticePeriod: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);

  const templates = [
    { value: 'msa', label: 'Master Service Agreement (MSA)' },
    { value: 'nda', label: 'Non-Disclosure Agreement (NDA)' },
    { value: 'sla', label: 'Service Level Agreement (SLA)' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateContract = async () => {
    if (!formData.templateType || !formData.enterpriseName || !formData.clientName || 
        !formData.effectiveDate || !formData.contractValidation || !formData.noticePeriod) {
      alert('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    
    // Simulate document generation
    setTimeout(() => {
      const templateLabel = templates.find(t => t.value === formData.templateType)?.label || '';
      const content = `
        ${templateLabel}
        
        Enterprise: ${formData.enterpriseName}
        Client: ${formData.clientName}
        Effective Date: ${formData.effectiveDate}
        Contract Duration: ${formData.contractValidation} years
        Notice Period: ${formData.noticePeriod} months
        
        [Document content would be generated here based on the template...]
      `;

      const documentId = `doc_${Date.now()}`;
      const documentName = `${formData.templateType}_${formData.clientName}_${new Date().toISOString().split('T')[0]}`;
      
      // Create document blob for download
      const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const file = new File([blob], `${documentName}.docx`, { type: blob.type });

      const document = {
        id: documentId,
        name: documentName,
        type: formData.templateType,
        content: content,
        metadata: {
          templateType: formData.templateType,
          enterpriseName: formData.enterpriseName,
          clientName: formData.clientName,
          effectiveDate: formData.effectiveDate,
          contractValidation: formData.contractValidation,
          noticePeriod: formData.noticePeriod,
          generatedAt: new Date().toISOString()
        },
        file: file
      };

      // Add to context
      addDocument(document);
      setCurrentDocument(document);
      setGeneratedDocument(document);
      setIsGenerating(false);
    }, 2000);
  };

  const handleDownload = () => {
    if (generatedDocument?.file) {
      const url = URL.createObjectURL(generatedDocument.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = generatedDocument.file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
              <h1 className="text-2xl font-bold text-gray-900">Generate Legal Document</h1>
              <p className="text-gray-600">Create professional contracts from pre-built templates</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Template *
              </label>
              <select
                name="templateType"
                value={formData.templateType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a template</option>
                {templates.map(template => (
                  <option key={template.value} value={template.value}>
                    {template.label}
                  </option>
                ))}
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
                name="enterpriseName"
                value={formData.enterpriseName}
                onChange={handleInputChange}
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
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
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
                name="effectiveDate"
                value={formData.effectiveDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Contract Validation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Duration (Years) *
              </label>
              <input
                type="number"
                name="contractValidation"
                value={formData.contractValidation}
                onChange={handleInputChange}
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
                name="noticePeriod"
                value={formData.noticePeriod}
                onChange={handleInputChange}
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
              onClick={handleGenerateContract}
              disabled={isGenerating}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating Document...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Generate & Download Contract</span>
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
                  Your {templates.find(t => t.value === generatedDocument.type)?.label} has been generated and is ready for download or review.
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
        </div>
      </div>
    </div>
  );
};

export default GenerateDocument;