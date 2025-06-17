import React from 'react';
import Link from 'next/link';
import { FileText, Scale, GitCompare, ArrowRight, CheckCircle } from 'lucide-react';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: FileText,
      title: 'Generate Contracts',
      description: 'Create professional legal documents from pre-built templates including MSA, NDA, and SLA agreements.',
      link: '/generate',
      color: 'bg-blue-500'
    },
    {
      icon: Scale,
      title: 'Evaluate Contracts',
      description: 'Upload and analyze contracts with AI-powered evaluation and comprehensive question-based assessment.',
      link: '/review',
      color: 'bg-teal-500'
    },
    {
      icon: GitCompare,
      title: 'Compare Contracts',
      description: 'Compare contract versions with detailed change tracking, AI insights, and approval workflows.',
      link: '/compare',
      color: 'bg-purple-500'
    }
  ];

  const benefits = [
    'Streamlined document generation process',
    'AI-powered contract analysis and insights',
    'Comprehensive change tracking and comparison',
    // 'Professional Word document exports',
    // 'Approval workflows with comment system',
    'Legal precedence and opinion analysis'
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
  <span className="relative group cursor-help">
    ARC™
    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
      AI as Research Collaborator
    </span>
  </span>
  <span className="ml-2">for Legal Documents</span>
</h1>

            <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed opacity-90">
            Generate, Evaluate, and Compare Contract Documents with ease.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/generate"
                className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {/* <Link
                href="/review"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
              >
                Explore Features
              </Link> */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Legal Document Tools
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage legal documents efficiently and professionally
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow group"
                >
                  <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <Link
                    href={feature.link}
                    className="text-blue-600 font-medium hover:text-blue-800 flex items-center space-x-2 group-hover:space-x-3 transition-all"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose ARC Documents?
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Built specifically for legal professionals who need efficient, 
                accurate, and intelligent document management solutions.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="text-center">
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Scale className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Ready to Get Started?
                </h3>
                {/* <p className="text-gray-600 mb-6">
                  Join thousands of legal professionals who trust ARC Documents 
                  for their document management needs.
                </p> */}
                <Link
                  href="/generate"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                >
                  <span>Start Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;