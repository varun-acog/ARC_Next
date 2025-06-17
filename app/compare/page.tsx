'use client';

import React, { useState, useEffect } from 'react';
import { GitCompare, Upload, FileText, Plus, Minus, CheckCircle, MessageSquare, ArrowRight, Download, X, Shield, Scale } from 'lucide-react';
import { useDocuments } from '../contexts/DocumentContext';

interface Change {
  id: string;
  type: 'addition' | 'deletion' | 'modification';
  section: string;
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
          <p className="text-sm text-gray-600 mb-2">Change: {change.section}</p>
          <p className="text-sm text-gray-800">{change.summary}</p>
        </div>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Enter your remarks for this change..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

const CompareContract: React.FC = () => {
  const { currentDocument } = useDocuments();
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [compareFile, setCompareFile] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [changes, setChanges] = useState<Change[]>([]);
  const [remarkModal, setRemarkModal] = useState<{ isOpen: boolean; change: Change | null }>({
    isOpen: false,
    change: null
  });

  const mockChanges: Change[] = [
    {
      id: '1',
      type: 'modification',
      section: 'Section 3.2 - Payment Terms',
      oldText: 'Payment due within 30 days of invoice date',
      newText: 'Payment due within 45 days of invoice date',
      summary: 'Payment terms extended from 30 to 45 days',
      legalOpinion: 'This change increases cash flow risk but may improve client relationships. Consider adding early payment discounts to mitigate extended terms.',
      precedence: 'Similar extension was accepted by Microsoft in 2023 contract negotiations, but rejected by Google in 2024 due to cash flow concerns. Amazon accepted 45-day terms with 2% early payment discount in Q3 2024.',
      policyViolations: 'No policy violations detected. Change aligns with company payment policy guidelines for enterprise clients.',
      status: 'pending'
    },
    {
      id: '2',
      type: 'addition',
      section: 'Section 7.4 - Force Majeure',
      newText: 'Including pandemics and cyber security incidents as force majeure events',
      summary: 'Added pandemic and cyber incidents to force majeure clause',
      legalOpinion: 'Highly recommended addition given recent global events. Provides essential protection against unforeseeable circumstances that could impact service delivery.',
      precedence: 'This clause has been standard practice since 2020. Accepted by 95% of Fortune 500 companies in recent contracts including Apple, Tesla, and Meta.',
      policyViolations: 'No violations. Addition strongly recommended by legal department policy updates from 2021.',
      status: 'pending'
    },
    {
      id: '3',
      type: 'deletion',
      section: 'Section 5.1 - Liability Cap',
      oldText: 'Liability limited to 2x annual contract value',
      summary: 'Removed liability cap limitation',
      legalOpinion: 'CRITICAL RISK: Removing liability cap exposes organization to unlimited damages. This creates significant financial exposure and should be strongly reconsidered.',
      precedence: 'Unlimited liability was rejected by Apple in 2023 and Tesla in 2024. Industry standard maintains 1-2x contract value cap. Only 3% of enterprise contracts accept unlimited liability.',
      policyViolations: 'MAJOR VIOLATION: Contradicts company risk management policy which mandates liability caps not exceed 3x annual contract value. Requires C-level approval.',
      status: 'pending'
    },
    {
      id: '4',
      type: 'addition',
      section: 'Section 9 - Data Protection',
      newText: 'GDPR and CCPA compliance requirements with annual audits',
      summary: 'Added comprehensive data protection compliance requirements',
      legalOpinion: 'Essential addition for data handling agreements. Ensures regulatory compliance and significantly reduces legal exposure in data processing activities.',
      precedence: 'Standard requirement accepted by all major tech companies since GDPR implementation in 2018. Microsoft, Google, and Amazon all include similar clauses.',
      policyViolations: 'No violations. Addition aligns with corporate data governance policy and regulatory compliance requirements.',
      status: 'pending'
    }
  ];

  // Auto-populate compare file if coming from review
  useEffect(() => {
    if (currentDocument && currentDocument.file && !compareFile) {
      setCompareFile(currentDocument.file);
    }
  }, [currentDocument, compareFile]);

  const handleFileUpload = (type: 'original' | 'compare') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'original') {
        setOriginalFile(file);
      } else {
        setCompareFile(file);
      }
    }
  };

  const handleCompareDocuments = () => {
    if (!originalFile || !compareFile) {
      alert('Please upload both documents to compare');
      return;
    }

    setIsComparing(true);
    
    // Simulate comparison analysis
    setTimeout(() => {
      setChanges(mockChanges);
      setIsComparing(false);
    }, 3000);
  };

  const handleApproveChange = (changeId: string) => {
    setChanges(prev => prev.map(change => 
      change.id === changeId 
        ? { ...change, status: 'approved' as const }
        : change
    ));
  };

  const handleReferChange = (changeId: string) => {
    const change = changes.find(c => c.id === changeId);
    if (change) {
      setRemarkModal({ isOpen: true, change });
    }
  };

  const handleSubmitRemarks = (remarks: string) => {
    if (remarkModal.change) {
      setChanges(prev => prev.map(change => 
        change.id === remarkModal.change!.id 
          ? { ...change, status: 'referred' as const, remarks }
          : change
      ));
    }
  };

  const handleSaveChanges = () => {
    const approvedChanges = changes.filter(c => c.status === 'approved');
    const referredChanges = changes.filter(c => c.status === 'referred');
    
    // Simulate document generation with changes
    const content = `
      DOCUMENT COMPARISON RESULTS
      ==========================
      
      APPROVED CHANGES (${approvedChanges.length}):
      ${approvedChanges.map(change => `
      - ${change.section}: ${change.summary}
      `).join('')}
      
      REFERRED CHANGES (${referredChanges.length}):
      ${referredChanges.map(change => `
      - ${change.section}: ${change.summary}
        Remarks: ${change.remarks}
      `).join('')}
    `;
    
    const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_comparison_${new Date().toISOString().split('T')[0]}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'addition':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'deletion':
        return <Minus className="w-4 h-4 text-red-600" />;
      case 'modification':
        return <ArrowRight className="w-4 h-4 text-blue-600" />;
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

  const renderTextComparison = (oldText?: string, newText?: string, type?: string) => {
    if (type === 'addition' && newText) {
      return (
        <div className="bg-white border border-gray-200 rounded p-3">
          <h5 className="text-sm font-medium text-gray-800 mb-2">Added Text</h5>
          <p className="text-sm">
            <span className="bg-green-100 text-green-800 px-1 rounded">{newText}</span>
          </p>
        </div>
      );
    }

    if (type === 'deletion' && oldText) {
      return (
        <div className="bg-white border border-gray-200 rounded p-3">
          <h5 className="text-sm font-medium text-gray-800 mb-2">Deleted Text</h5>
          <p className="text-sm">
            <span className="bg-red-100 text-red-800 line-through px-1 rounded">{oldText}</span>
          </p>
        </div>
      );
    }

    if (type === 'modification' && oldText && newText) {
      return (
        <div className="bg-white border border-gray-200 rounded p-3">
          <h5 className="text-sm font-medium text-gray-800 mb-2">Text Changes</h5>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-gray-600 text-xs block mb-1">Original:</span>
              <span className="bg-red-100 text-red-800 line-through px-1 rounded">{oldText}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600 text-xs block mb-1">Modified:</span>
              <span className="bg-green-100 text-green-800 px-1 rounded">{newText}</span>
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <GitCompare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compare Contracts</h1>
              <p className="text-gray-600">Compare document versions with AI-powered insights and approval workflow</p>
            </div>
          </div>

          {/* Show current document info if coming from review */}
          {currentDocument && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-800">Document from Review</span>
              </div>
              <p className="text-sm text-purple-700 mt-1">
                Ready to compare: {currentDocument.name} - Upload the original document to compare against
              </p>
            </div>
          )}

          {/* Upload Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 mb-2">Original Document</h3>
              <input
                type="file"
                accept=".doc,.docx,.pdf,.txt"
                onChange={handleFileUpload('original')}
                className="hidden"
                id="original-upload"
              />
              <label
                htmlFor="original-upload"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 cursor-pointer transition-colors text-sm"
              >
                Choose File
              </label>
              {originalFile && (
                <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="text-xs text-purple-800">{originalFile.name}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 mb-2">Compare Document</h3>
              <input
                type="file"
                accept=".doc,.docx,.pdf,.txt"
                onChange={handleFileUpload('compare')}
                className="hidden"
                id="compare-upload"
              />
              <label
                htmlFor="compare-upload"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 cursor-pointer transition-colors text-sm"
              >
                Choose File
              </label>
              {compareFile && (
                <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="text-xs text-purple-800">{compareFile.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleCompareDocuments}
            disabled={isComparing || !originalFile || !compareFile}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 mb-8"
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

          {/* Results Section */}
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
                {changes.map((change) => (
                  <div
                    key={change.id}
                    className="border border-gray-200 rounded-lg p-6 bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getChangeIcon(change.type)}
                        <div>
                          <h4 className="font-semibold text-gray-900">{change.section}</h4>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(change.status)}`}>
                            {change.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Text Comparison */}
                    <div className="mb-4">
                      {renderTextComparison(change.oldText, change.newText, change.type)}
                    </div>

                    {/* AI Insights */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h5 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
                        <Scale className="w-4 h-4" />
                        <span>AI Insights</span>
                      </h5>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Left Column - Summary & Legal Opinion */}
                        <div className="space-y-4">
                          <div>
                            <h6 className="text-sm font-medium text-gray-700 mb-2">Summary</h6>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded border">{change.summary}</p>
                          </div>
                          <div>
                            <h6 className="text-sm font-medium text-gray-700 mb-2">Legal Opinion</h6>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded border">{change.legalOpinion}</p>
                          </div>
                        </div>

                        {/* Right Column - Precedence & Policy Violations */}
                        <div className="space-y-4">
                          <div>
                            <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                              <FileText className="w-3 h-3" />
                              <span>Precedence</span>
                            </h6>
                            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">{change.precedence}</p>
                          </div>
                          <div>
                            <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                              <Shield className="w-3 h-3" />
                              <span>Policy Violations</span>
                            </h6>
                            <p className={`text-sm p-3 rounded border ${
                              change.policyViolations.includes('VIOLATION') || change.policyViolations.includes('MAJOR')
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                            }`}>
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
                ))}
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
  );
};

export default CompareContract;