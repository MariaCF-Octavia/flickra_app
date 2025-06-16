 import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Shield } from 'lucide-react';

const PrivacyPolicy = () => {
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
            <Shield className="w-8 h-8 text-indigo-400 mr-3" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          {/* Privacy Policy content */}
          <div className="prose prose-invert max-w-none space-y-6 text-gray-300 leading-relaxed">
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
              <p>CF Studio ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, process, and safeguard your personal information when you use our AI-powered advertising generation platform accessible at contentfactory.ai (the "Service").</p>
              <p>This Privacy Policy applies to all users of our Service, including businesses, marketers, and creators who use our platform to generate advertising content.</p>
              <div className="bg-gray-800/50 rounded-lg p-4 mt-3">
                <p><strong>Contact Information:</strong></p>
                <p>CF Studio<br />Email: support@contentfactory.ai<br />Website: contentfactory.ai<br />Location: Sweden</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">2.1 Information You Provide Directly</h3>
              <p><strong>Account Information:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Name and email address</li>
                <li>Password (encrypted)</li>
                <li>Company name (optional)</li>
                <li>Billing address and payment information (processed by Stripe)</li>
              </ul>
              
              <p className="mt-4"><strong>Content and Usage Data:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Text prompts and inputs you provide for content generation</li>
                <li>Images, videos, and other media files you upload</li>
                <li>Generated advertising content (images, videos, audio)</li>
                <li>Feedback and communications with our support team</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-6">2.2 Information Automatically Collected</h3>
              <p><strong>Technical Information:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>IP address and device identifiers</li>
                <li>Browser type, version, and operating system</li>
                <li>Usage analytics and interaction data</li>
                <li>Generation history and platform usage statistics</li>
                <li>Error logs and performance data</li>
              </ul>
              
              <p className="mt-4"><strong>Cookies and Tracking Technologies:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Session cookies for authentication</li>
                <li>Analytics cookies for service improvement</li>
                <li>Preference cookies for user settings</li>
                <li>Third-party cookies from integrated services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">3.1 Service Provision</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Creating and managing your account</li>
                <li>Processing your content generation requests</li>
                <li>Providing customer support and technical assistance</li>
                <li>Managing subscriptions and billing</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">3.2 Service Improvement</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Analyzing usage patterns to improve our platform</li>
                <li>Developing new features and capabilities</li>
                <li>Conducting research and analytics</li>
                <li>Optimizing performance and user experience</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">3.3 Legal and Security</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Complying with legal obligations</li>
                <li>Protecting against fraud and abuse</li>
                <li>Enforcing our Terms of Service</li>
                <li>Maintaining security and safety of our platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Data Processing</h2>
              <p>Our Service relies on several third-party AI and infrastructure providers. When you use our Service, your data may be processed by:</p>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">4.1 AI Service Providers</h3>
              
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <p><strong>OpenAI API:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Data Processed:</strong> Text prompts, generated content</li>
                  <li><strong>Retention:</strong> Up to 30 days for abuse monitoring</li>
                  <li><strong>Use:</strong> Does not use API data for training models</li>
                  <li><strong>Privacy Policy:</strong> <a href="https://openai.com/privacy" className="text-indigo-400 hover:text-indigo-300">https://openai.com/privacy</a></li>
                </ul>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <p><strong>Runway API:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Data Processed:</strong> Video generation inputs and outputs</li>
                  <li><strong>Retention:</strong> Stores user data and generated content</li>
                  <li><strong>Deletion:</strong> Requires separate deletion request</li>
                  <li><strong>Privacy Policy:</strong> Available on Runway's website</li>
                </ul>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <p><strong>Stability AI (SDXL):</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Data Processed:</strong> Image generation prompts and outputs</li>
                  <li><strong>Retention:</strong> Up to 1 year unless longer retention required by law</li>
                  <li><strong>Privacy Policy:</strong> <a href="https://stability.ai/privacy-policy" className="text-indigo-400 hover:text-indigo-300">https://stability.ai/privacy-policy</a></li>
                </ul>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <p><strong>ElevenLabs API:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Data Processed:</strong> Audio generation inputs and voice content</li>
                  <li><strong>Retention:</strong> Default retention with deletion options available</li>
                  <li><strong>Zero Retention:</strong> Available for enterprise customers</li>
                  <li><strong>Privacy Policy:</strong> <a href="https://elevenlabs.io/privacy-policy" className="text-indigo-400 hover:text-indigo-300">https://elevenlabs.io/privacy-policy</a></li>
                </ul>
              </div>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-6">4.2 Infrastructure Providers</h3>
              
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <p><strong>Cloudinary:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Data Processed:</strong> Media files and transformations</li>
                  <li><strong>Role:</strong> Acts as data processor on our behalf</li>
                  <li><strong>Control:</strong> You control content retention and deletion</li>
                  <li><strong>Privacy Policy:</strong> <a href="https://cloudinary.com/privacy" className="text-indigo-400 hover:text-indigo-300">https://cloudinary.com/privacy</a></li>
                </ul>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <p><strong>Supabase:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Data Processed:</strong> Account data, usage analytics, generated content</li>
                  <li><strong>Role:</strong> Database and backend services</li>
                  <li><strong>Control:</strong> We control data retention policies</li>
                  <li><strong>Privacy Policy:</strong> <a href="https://supabase.com/privacy" className="text-indigo-400 hover:text-indigo-300">https://supabase.com/privacy</a></li>
                </ul>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <p><strong>Stripe:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Data Processed:</strong> Payment information and transaction data</li>
                  <li><strong>Retention:</strong> As required by financial and anti-money laundering regulations</li>
                  <li><strong>Role:</strong> Payment processor with own data controller responsibilities</li>
                  <li><strong>Privacy Policy:</strong> <a href="https://stripe.com/privacy" className="text-indigo-400 hover:text-indigo-300">https://stripe.com/privacy</a></li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Data Sharing and Disclosure</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">5.1 We Do Not Sell Your Data</h3>
              <p>We do not sell, rent, or trade your personal information to third parties for their marketing purposes.</p>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">5.2 Permitted Sharing</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Service Providers:</strong> We share data with third-party service providers who assist in operating our Service</li>
                <li><strong>Legal Requirements:</strong> We may disclose information when required by law, court order, or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, your information may be transferred</li>
                <li><strong>Consent:</strong> We may share information with your explicit consent for specific purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">6.1 Our Retention Policies</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Account Data:</strong> Retained while your account is active plus any legally required retention period</li>
                <li><strong>Generated Content:</strong> Stored until you delete it or terminate your account</li>
                <li><strong>Usage Analytics:</strong> Retained for 2 years for service improvement and legal compliance</li>
                <li><strong>Payment Data:</strong> Retained by Stripe as required by financial regulations</li>
                <li><strong>Support Communications:</strong> Retained for 3 years for quality assurance and legal compliance</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">6.2 Third-Party Retention</h3>
              <p><strong>Note:</strong> Third-party AI services may retain your data according to their own policies:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>OpenAI: 30 days for abuse monitoring</li>
                <li>Stability AI: Up to 1 year</li>
                <li>ElevenLabs: Variable retention with deletion options</li>
                <li>Runway: Stores data indefinitely unless deletion requested</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">6.3 Deletion After Account Termination</h3>
              <p>Upon account termination, we delete your data from our systems within 30 days, except where longer retention is required by law or legitimate business interests.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Your Privacy Rights</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">7.1 Rights Under GDPR (EU Users)</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Restriction:</strong> Limit how we process your personal data</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for processing based on consent</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">7.2 Rights Under CCPA (California Users)</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Know:</strong> Right to know what personal information is collected and how it's used</li>
                <li><strong>Delete:</strong> Right to delete personal information</li>
                <li><strong>Opt-Out:</strong> Right to opt-out of sale of personal information (we don't sell data)</li>
                <li><strong>Non-Discrimination:</strong> Right not to be discriminated against for exercising privacy rights</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">7.3 Exercising Your Rights</h3>
              <p>To exercise your privacy rights:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Email us at support@contentfactory.ai</li>
                <li>Include sufficient information to verify your identity</li>
                <li>Specify which rights you wish to exercise</li>
                <li>We will respond within 30 days (or as required by applicable law)</li>
              </ul>
              <p className="mt-2"><strong>Note:</strong> For data held by third-party processors, you may need to contact them directly or we can assist in forwarding your requests.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Data Security</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">8.1 Security Measures</h3>
              <p><strong>Technical Safeguards:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Encryption of data in transit (TLS) and at rest (AES-256)</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security assessments and monitoring</li>
                <li>Secure cloud infrastructure with reputable providers</li>
              </ul>
              
              <p className="mt-4"><strong>Organizational Safeguards:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Staff training on data protection</li>
                <li>Access controls and need-to-know principles</li>
                <li>Incident response procedures</li>
                <li>Regular policy reviews and updates</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">8.2 Security Limitations</h3>
              <p>While we implement robust security measures, no system is completely secure. We cannot guarantee absolute security of your information.</p>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">8.3 Data Breach Notification</h3>
              <p>In the event of a data breach affecting your personal information, we will notify you and relevant authorities as required by applicable law, typically within 72 hours of becoming aware of the breach.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. International Data Transfers</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">9.1 Cross-Border Transfers</h3>
              <p>As our Service uses global infrastructure and third-party providers, your data may be transferred to and processed in countries outside your residence, including the United States.</p>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">9.2 Transfer Safeguards</h3>
              <p>For transfers outside the EU/EEA, we ensure adequate protection through:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>EU-US Data Privacy Framework (where applicable)</li>
                <li>Standard Contractual Clauses</li>
                <li>Adequacy decisions by the European Commission</li>
                <li>Other appropriate safeguards as required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Children's Privacy</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">10.1 Age Requirements</h3>
              <p>While users under 18 can use our Service, we recommend parental guidance for users under 16. We do not knowingly collect personal information from children under 13 without parental consent.</p>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">10.2 Parental Rights</h3>
              <p>Parents can review, modify, or delete their child's personal information by contacting support@contentfactory.ai.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Changes to This Privacy Policy</h2>
              <h3 className="text-lg font-medium text-indigo-400 mb-2">11.1 Policy Updates</h3>
              <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements.</p>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">11.2 Notification of Changes</h3>
              <p>We will notify you of material changes by:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Email notification to registered users</li>
                <li>Notice on our website</li>
                <li>In-app notifications</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">11.3 Continued Use</h3>
              <p>Continued use of our Service after notification of changes constitutes acceptance of the updated Privacy Policy.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">12. Contact Information</h2>
              <p>If you have any questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:</p>
              <div className="bg-gray-800/50 rounded-lg p-4 mt-3">
                <p><strong>Data Controller:</strong> CF Studio</p>
                <p><strong>Email:</strong> support@contentfactory.ai</p>
                <p><strong>Subject Line:</strong> "Privacy Policy Inquiry"</p>
                <p><strong>Response Time:</strong> We aim to respond to privacy-related inquiries within 30 days.</p>
              </div>
            </section>

          </div>

          {/* Contact Section */}
          <div className="mt-12 pt-8 border-t border-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Privacy concerns?</p>
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

export default PrivacyPolicy;