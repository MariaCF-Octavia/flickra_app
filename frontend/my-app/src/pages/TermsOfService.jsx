import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, FileText } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Navigation */}
      <nav className="bg-gray-900/80 backdrop-blur-lg border-b border-gray-800/50 py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">CF Studio</div>
            <div className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-600/20 text-indigo-300">BETA</div>
          </Link>
          <Link to="/" className="flex items-center text-gray-400 hover:text-indigo-400 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-gray-900/70 backdrop-blur-md rounded-xl p-8 border border-gray-800/50">
          <div className="flex items-center mb-4">
            <FileText className="w-8 h-8 text-indigo-400 mr-3" />
            <h1 className="text-3xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          {/* Terms of Service content */}
          <div className="prose prose-invert max-w-none space-y-6 text-gray-300 leading-relaxed">
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
              <p>Welcome to CF Studio ("we," "us," "our," or "Company"). These Terms of Service ("Terms") govern your use of our AI-powered advertising generation platform accessible at contentfactory.ai (the "Service") operated by CF Studio, a company located in Sweden.</p>
              <p>By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
              <p>CF Studio is an AI-powered platform that enables businesses, marketers, and creators to generate high-quality advertisements, including images, videos, and audio content. Our Service utilizes various third-party AI technologies to process your inputs and generate marketing materials.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts and Registration</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">3.1 Account Creation</h3>
              <p>To use our Service, you must:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Create an account by providing accurate and complete information</li>
                <li>Be at least 18 years old or have parental consent</li>
                <li>Have the legal capacity to enter into these Terms</li>
                <li>Maintain the security of your account credentials</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">3.2 Account Responsibility</h3>
              <p>You are responsible for:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>All activities that occur under your account</li>
                <li>Maintaining the confidentiality of your login credentials</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
                <li>Ensuring all information you provide is accurate and up-to-date</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Subscription Plans and Billing</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">4.1 Subscription Tiers</h3>
              <p>We offer the following subscription plans:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Basic Plan:</strong> €99/month - Up to 10 generations</li>
                <li><strong>Premium Plan:</strong> €179/month - Up to 40 generations</li>
                <li><strong>Enterprise Plan:</strong> €299/month - Unlimited generations</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">4.2 Payment Terms</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>All fees are charged in advance on a monthly basis</li>
                <li>Payments are processed securely through Stripe</li>
                <li>You authorize us to charge your chosen payment method</li>
                <li>Fees are non-refundable except as expressly stated in our Refund Policy</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">4.3 Auto-Renewal</h3>
              <p>Subscriptions automatically renew at the end of each billing cycle unless cancelled before the renewal date. You may cancel your subscription at any time through your account settings.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Refund Policy</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">5.1 Refund Eligibility</h3>
              <p>You may request a refund by contacting support@contentfactory.ai if:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>You have generated 3 or fewer items since your last payment</li>
                <li>You request the refund within 30 days of payment</li>
                <li>You have not violated these Terms</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">5.2 Refund Process</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Refund requests are reviewed on a case-by-case basis</li>
                <li>We will respond to refund requests within 5 business days</li>
                <li>Approved refunds will be processed within 10 business days</li>
                <li>Refunds are issued to the original payment method</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Acceptable Use Policy</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">6.1 Prohibited Uses</h3>
              <p>You may not use our Service to:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Generate content that is illegal, harmful, threatening, abusive, or discriminatory</li>
                <li>Create content that infringes on intellectual property rights of others</li>
                <li>Generate deepfakes or misleading content of real individuals without consent</li>
                <li>Create content promoting violence, terrorism, or illegal activities</li>
                <li>Generate sexually explicit content involving minors</li>
                <li>Attempt to reverse engineer or compromise our Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Third-Party Services and Data Processing</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">7.1 Third-Party AI Services</h3>
              <p>Our Service utilizes various third-party AI providers including:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>OpenAI API for text and content generation</li>
                <li>Runway API for video generation and editing</li>
                <li>Stability AI for image generation</li>
                <li>ElevenLabs for audio and voice generation</li>
                <li>Cloudinary for media processing and storage</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">7.2 Data Processing by Third Parties</h3>
              <p>When you use our Service, your content may be processed by these third-party providers:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>OpenAI:</strong> Retains data for up to 30 days for abuse monitoring, does not use API data for training</li>
                <li><strong>Runway:</strong> Stores user data and generated content, deletion requires separate request</li>
                <li><strong>Stability AI:</strong> Retains data for up to 1 year unless longer retention required by law</li>
                <li><strong>ElevenLabs:</strong> Retains data by default, offers deletion options and zero retention for enterprise</li>
                <li><strong>Cloudinary:</strong> Acts as processor, you control your content retention</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Data Usage and Retention</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">8.1 Your Data</h3>
              <p>We collect and store:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Account information (name, email, payment details)</li>
                <li>Usage analytics and generation history</li>
                <li>Generated content as stored in your account</li>
                <li>Communications with our support team</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">8.2 Data Deletion</h3>
              <p>You may request deletion of your data by:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Cancelling your subscription and deleting your account</li>
                <li>Contacting support@contentfactory.ai for specific deletion requests</li>
                <li>Note: Some data may be retained by third-party processors and require separate deletion requests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">9.1 Service Limitations</h3>
              <p>The Service is provided "as is" without warranties of any kind. We do not guarantee:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>The accuracy, quality, or suitability of generated content</li>
                <li>Uninterrupted or error-free service operation</li>
                <li>That the Service will meet your specific requirements</li>
                <li>The availability of third-party AI services we depend on</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">9.2 Liability Limitations</h3>
              <p>To the maximum extent permitted by law:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim</li>
                <li>We shall not be liable for indirect, incidental, consequential, or punitive damages</li>
                <li>We are not responsible for content generated using our Service or its consequences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Termination</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">10.1 Termination by You</h3>
              <p>You may terminate your account at any time by cancelling your subscription through account settings or contacting support@contentfactory.ai.</p>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">10.2 Termination by Us</h3>
              <p>We may terminate or suspend your account immediately if you violate these Terms of Service, engage in fraudulent activities, or fail to pay applicable fees.</p>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">10.3 Effect of Termination</h3>
              <p>Upon termination, your access to the Service will be discontinued and your account data will be deleted according to our data retention policy.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Governing Law</h2>
              <p>These Terms are governed by Swedish law without regard to conflict of law principles. Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the Swedish courts.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">12. Contact Information</h2>
              <p>If you have any questions about these Terms of Service, please contact us:</p>
              <div className="bg-gray-800/50 rounded-lg p-4 mt-3">
                <p><strong>CF Studio</strong></p>
                <p>Email: support@contentfactory.ai</p>
                <p>Website: contentfactory.ai</p>
              </div>
            </section>

          </div>

          {/* Contact Section */}
          <div className="mt-12 pt-8 border-t border-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Questions about these terms?</p>
                <a 
                  href="mailto:support@contentfactory.ai" 
                  className="text-indigo-400 hover:text-indigo-300 flex items-center mt-1"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  support@contentfactory.ai
                </a>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Last updated</p>
                <p className="text-sm text-gray-300">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 