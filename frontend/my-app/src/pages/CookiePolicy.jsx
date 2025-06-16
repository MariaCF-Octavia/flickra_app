import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Cookie } from 'lucide-react';

const CookiePolicy = () => {
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
            <Cookie className="w-8 h-8 text-indigo-400 mr-3" />
            <h1 className="text-3xl font-bold">Cookie Policy</h1>
          </div>
          <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          {/* Cookie Policy content */}
          <div className="prose prose-invert max-w-none space-y-6 text-gray-300 leading-relaxed">
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
              <p>This Cookie Policy explains how CF Studio ("we," "us," "our," or "Company") uses cookies and similar tracking technologies when you visit our website at contentfactory.ai and use our AI-powered advertising generation platform (the "Service").</p>
              <p>This policy should be read alongside our Privacy Policy and Terms of Service, which provide additional information about how we collect and use your personal information.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. What Are Cookies</h2>
              <p>Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work more efficiently and to provide a better, more personalized user experience.</p>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">2.1 Types of Cookies</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Session Cookies:</strong> Temporary cookies that are deleted when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Cookies that remain on your device for a predetermined period or until you delete them</li>
                <li><strong>First-Party Cookies:</strong> Set directly by our website</li>
                <li><strong>Third-Party Cookies:</strong> Set by third-party services integrated into our website</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Cookies</h2>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2">3.1 Essential Cookies</h3>
              <p>These cookies are necessary for our Service to function properly and cannot be disabled.</p>
              
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 text-indigo-400">Cookie Name</th>
                        <th className="text-left py-2 text-indigo-400">Purpose</th>
                        <th className="text-left py-2 text-indigo-400">Duration</th>
                        <th className="text-left py-2 text-indigo-400">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="py-2">session_token</td>
                        <td className="py-2">User authentication and login status</td>
                        <td className="py-2">Session</td>
                        <td className="py-2">First-party</td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-2">csrf_token</td>
                        <td className="py-2">Security protection against cross-site request forgery</td>
                        <td className="py-2">Session</td>
                        <td className="py-2">First-party</td>
                      </tr>
                      <tr>
                        <td className="py-2">user_preferences</td>
                        <td className="py-2">Remember your account settings and preferences</td>
                        <td className="py-2">1 year</td>
                        <td className="py-2">First-party</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-6">3.2 Analytics Cookies</h3>
              <p>We use these cookies to understand how visitors interact with our Service.</p>
              
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 text-indigo-400">Cookie Name</th>
                        <th className="text-left py-2 text-indigo-400">Purpose</th>
                        <th className="text-left py-2 text-indigo-400">Duration</th>
                        <th className="text-left py-2 text-indigo-400">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="py-2">_ga</td>
                        <td className="py-2">Google Analytics - distinguish users</td>
                        <td className="py-2">2 years</td>
                        <td className="py-2">Third-party</td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-2">_ga_*</td>
                        <td className="py-2">Google Analytics - persist session state</td>
                        <td className="py-2">2 years</td>
                        <td className="py-2">Third-party</td>
                      </tr>
                      <tr>
                        <td className="py-2">supabase_analytics</td>
                        <td className="py-2">Track usage patterns and feature adoption</td>
                        <td className="py-2">1 year</td>
                        <td className="py-2">First-party</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-6">3.3 Performance Cookies</h3>
              <p>These cookies help us optimize our Service performance.</p>
              
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 text-indigo-400">Cookie Name</th>
                        <th className="text-left py-2 text-indigo-400">Purpose</th>
                        <th className="text-left py-2 text-indigo-400">Duration</th>
                        <th className="text-left py-2 text-indigo-400">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="py-2">performance_metrics</td>
                        <td className="py-2">Monitor page load times and errors</td>
                        <td className="py-2">30 days</td>
                        <td className="py-2">First-party</td>
                      </tr>
                      <tr>
                        <td className="py-2">feature_flags</td>
                        <td className="py-2">Enable/disable features for testing</td>
                        <td className="py-2">Session</td>
                        <td className="py-2">First-party</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-6">3.4 Functional Cookies</h3>
              <p>These cookies enhance your user experience.</p>
              
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 text-indigo-400">Cookie Name</th>
                        <th className="text-left py-2 text-indigo-400">Purpose</th>
                        <th className="text-left py-2 text-indigo-400">Duration</th>
                        <th className="text-left py-2 text-indigo-400">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="py-2">ui_theme</td>
                        <td className="py-2">Remember your preferred dark/light mode</td>
                        <td className="py-2">1 year</td>
                        <td className="py-2">First-party</td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-2">language_preference</td>
                        <td className="py-2">Store your language selection</td>
                        <td className="py-2">1 year</td>
                        <td className="py-2">First-party</td>
                      </tr>
                      <tr>
                        <td className="py-2">generation_history</td>
                        <td className="py-2">Quick access to recent generations</td>
                        <td className="py-2">30 days</td>
                        <td className="py-2">First-party</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Cookies</h2>
              <p>Our Service integrates with several third-party services that may set their own cookies:</p>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">4.1 Stripe (Payment Processing)</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Purpose:</strong> Fraud prevention and payment processing</li>
                <li><strong>Cookies:</strong> Various Stripe-specific cookies</li>
                <li><strong>Privacy Policy:</strong> <a href="https://stripe.com/privacy" className="text-indigo-400 hover:text-indigo-300">https://stripe.com/privacy</a></li>
                <li><strong>Cookie Policy:</strong> <a href="https://stripe.com/cookie-policy" className="text-indigo-400 hover:text-indigo-300">https://stripe.com/cookie-policy</a></li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">4.2 Google Analytics (if implemented)</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Purpose:</strong> Website analytics and usage statistics</li>
                <li><strong>Cookies:</strong> _ga, _gid, _ga_*</li>
                <li><strong>Privacy Policy:</strong> <a href="https://policies.google.com/privacy" className="text-indigo-400 hover:text-indigo-300">https://policies.google.com/privacy</a></li>
                <li><strong>Opt-out:</strong> <a href="https://tools.google.com/dlpage/gaoptout" className="text-indigo-400 hover:text-indigo-300">https://tools.google.com/dlpage/gaoptout</a></li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">4.3 Cloudinary (Media Processing)</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Purpose:</strong> Media optimization and delivery</li>
                <li><strong>Cookies:</strong> Performance and optimization cookies</li>
                <li><strong>Privacy Policy:</strong> <a href="https://cloudinary.com/privacy" className="text-indigo-400 hover:text-indigo-300">https://cloudinary.com/privacy</a></li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">4.4 Supabase (Backend Services)</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Purpose:</strong> Authentication and database functionality</li>
                <li><strong>Cookies:</strong> Session management and performance</li>
                <li><strong>Privacy Policy:</strong> <a href="https://supabase.com/privacy" className="text-indigo-400 hover:text-indigo-300">https://supabase.com/privacy</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Cookie Consent and Management</h2>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2">5.1 Your Cookie Choices</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Essential Cookies:</strong> Cannot be disabled as they are necessary for Service functionality</li>
                <li><strong>Non-Essential Cookies:</strong> You can choose to accept or decline these cookies</li>
                <li><strong>Granular Control:</strong> You can manage specific categories of cookies through our cookie banner</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">5.2 Cookie Banner</h3>
              <p>When you first visit our Service, you will see a cookie banner that allows you to:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Accept all cookies</li>
                <li>Reject non-essential cookies</li>
                <li>Customize your cookie preferences</li>
                <li>Access this Cookie Policy</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">5.3 Managing Cookies Through Your Browser</h3>
              <p>You can control cookies through your browser settings:</p>
              
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <p><strong>Chrome:</strong></p>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>Settings - Privacy and security - Cookies and other site data</li>
                  <li>Choose your preferred cookie settings</li>
                </ol>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <p><strong>Firefox:</strong></p>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>Settings - Privacy & Security - Cookies and Site Data</li>
                  <li>Manage your cookie preferences</li>
                </ol>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <p><strong>Safari:</strong></p>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>Preferences - Privacy - Cookies and website data</li>
                  <li>Configure cookie settings</li>
                </ol>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <p><strong>Edge:</strong></p>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>Settings - Site permissions - Cookies and site data</li>
                  <li>Manage cookie permissions</li>
                </ol>
              </div>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">5.4 Disabling Cookies</h3>
              <p className="bg-amber-900/20 border border-amber-500/50 rounded-lg p-4">
                <strong>Important:</strong> Disabling certain cookies may affect the functionality of our Service. Essential cookies cannot be disabled without impacting core features.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Data Protection and Cookies</h2>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2">6.1 Personal Data in Cookies</h3>
              <p>Some cookies may contain personal information such as:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>User identifiers</li>
                <li>Preference settings</li>
                <li>Usage patterns</li>
                <li>Session information</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">6.2 Security Measures</h3>
              <p>We protect cookie data through:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Encryption of sensitive cookie content</li>
                <li>Secure transmission (HTTPS only)</li>
                <li>Regular security assessments</li>
                <li>Limited data retention periods</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. International Considerations</h2>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2">7.1 GDPR Compliance (EU Users)</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>We obtain explicit consent for non-essential cookies</li>
                <li>You can withdraw consent at any time</li>
                <li>We provide granular control over cookie categories</li>
                <li>Cookie data is subject to your GDPR rights</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">7.2 CCPA Compliance (California Users)</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Cookie data is considered personal information under CCPA</li>
                <li>You have rights regarding this information</li>
                <li>We do not sell cookie data to third parties</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">7.3 ePrivacy Regulations</h3>
              <p>We comply with applicable ePrivacy laws regarding cookie consent and user choice.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Updates to This Cookie Policy</h2>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2">8.1 Policy Changes</h3>
              <p>We may update this Cookie Policy to reflect:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Changes in our cookie practices</li>
                <li>New features or services</li>
                <li>Legal or regulatory requirements</li>
                <li>Best practice developments</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">8.2 Notification of Changes</h3>
              <p>We will notify you of significant changes through:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Updated cookie banner on next visit</li>
                <li>Email notification (for registered users)</li>
                <li>Notice on our website</li>
              </ul>
              
              <h3 className="text-lg font-medium text-indigo-400 mb-2 mt-4">8.3 Continued Use</h3>
              <p>By continuing to use our Service after changes are made, you accept the updated Cookie Policy.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Contact Information</h2>
              <p>If you have questions about our use of cookies or this Cookie Policy:</p>
              
              <div className="bg-gray-800/50 rounded-lg p-4 mt-3">
                <p><strong>Email:</strong> support@contentfactory.ai</p>
                <p><strong>Subject Line:</strong> "Cookie Policy Inquiry"</p>
                <p><strong>Website:</strong> contentfactory.ai</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Useful Links</h2>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><Link to="/privacy-policy" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="text-indigo-400 hover:text-indigo-300">Terms of Service</Link></li>
                <li><a href="https://tools.google.com/dlpage/gaoptout" className="text-indigo-400 hover:text-indigo-300">Google Analytics Opt-out</a></li>
                <li><a href="https://www.aboutcookies.org/" className="text-indigo-400 hover:text-indigo-300">About Cookies (External Resource)</a></li>
              </ul>
            </section>

          </div>

          {/* Contact Section */}
          <div className="mt-12 pt-8 border-t border-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Questions about cookies?</p>
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

export default CookiePolicy; 