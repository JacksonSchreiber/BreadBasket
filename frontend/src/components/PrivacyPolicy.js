import React from 'react';
import './Legal.css';

function PrivacyPolicy() {
  return (
    <div className="legal-container">
      <div className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: March 19, 2024</p>

        <section>
          <h2>1. Introduction</h2>
          <p>BreadBasket ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.</p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <h3>2.1 Personal Information</h3>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li>Name and contact information</li>
            <li>Account credentials</li>
            <li>Location data (with your permission)</li>
            <li>Shopping preferences and history</li>
            <li>Communication preferences</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <p>When you use our Service, we automatically collect:</p>
          <ul>
            <li>Device information</li>
            <li>Usage data</li>
            <li>Location data (if enabled)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information for:</p>
          <ul>
            <li>Providing and improving our services</li>
            <li>Personalizing your shopping experience</li>
            <li>Processing your transactions</li>
            <li>Communicating with you about our services</li>
            <li>Analyzing usage patterns and trends</li>
            <li>Protecting against fraudulent or unauthorized activity</li>
          </ul>
        </section>

        <section>
          <h2>4. Information Sharing</h2>
          <p>We may share your information with:</p>
          <ul>
            <li>Service providers and partners</li>
            <li>Affiliated stores and retailers</li>
            <li>Legal authorities when required by law</li>
            <li>Other parties with your consent</li>
          </ul>
        </section>

        <section>
          <h2>5. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal information, including:</p>
          <ul>
            <li>Encryption of sensitive data</li>
            <li>Regular security assessments</li>
            <li>Access controls and authentication</li>
            <li>Secure data storage and transmission</li>
          </ul>
        </section>

        <section>
          <h2>6. Your Rights and Choices</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Control location tracking and cookies</li>
          </ul>
        </section>

        <section>
          <h2>7. Children's Privacy</h2>
          <p>Our Service is not intended for children under 13 years of age. We do not knowingly collect or maintain information from children under 13.</p>
        </section>

        <section>
          <h2>8. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
        </section>

        <section>
          <h2>9. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <p className="contact-info">privacy@breadbasket.com</p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPolicy; 