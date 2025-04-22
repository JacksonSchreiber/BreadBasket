import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-container">
      <div className="privacy-content">
        <div className="privacy-header">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: April 22, 2025</p>
        </div>

        <div className="privacy-intro">
          <p>This Privacy Policy describes how BreadBasket ("we", "us", or "our") collects, uses, shares, and protects your personal information when you use our application, website, services, and other products (collectively, the "Service").</p>
          <p>By accessing or using BreadBasket, you agree to this Privacy Policy and consent to the practices described herein. If you do not agree with this policy, please do not use our services.</p>
        </div>

        <div className="privacy-section">
          <h2>1. Information We Collect</h2>
          <h3>1.1 Information You Provide to Us</h3>
          <ul>
            <li><strong>Account Information:</strong> When you create an account, we collect your email address, username, and password.</li>
            <li><strong>Profile Information:</strong> You may optionally provide demographic information such as age, gender, or ZIP code.</li>
            <li><strong>Communications:</strong> If you contact us directly (e.g., via email or chat), we may keep a record of your message, name, and contact information.</li>
          </ul>

          <h3>1.2 Information We Collect Automatically</h3>
          <ul>
            <li><strong>Device Information:</strong> Includes hardware model, operating system version, unique device identifiers, IP address, and mobile network.</li>
            <li><strong>Usage Information:</strong> Includes your activity on the app such as page views, search queries, items viewed, and app interaction events.</li>
            <li><strong>Cookies and Similar Technologies:</strong> We use cookies and related technologies for analytics, performance tracking, and user preferences.</li>
          </ul>

          <h3>1.3 Information from Third Parties</h3>
          <ul>
            <li><strong>APIs and Integrations:</strong> When using third-party APIs (e.g., grocery store data), we may receive product, price, and location data relevant to your requests.</li>
            <li><strong>Authentication Services:</strong> If you sign in using Google, Apple, or Facebook, we receive basic profile information as permitted by their APIs.</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li>To provide, operate, and maintain BreadBasket and its features.</li>
            <li>To personalize your experience based on location, preferences, or saved searches.</li>
            <li>To analyze usage trends and optimize app performance.</li>
            <li>To communicate with you, including sending service updates or promotional materials (with consent).</li>
            <li>To enforce our Terms of Service and prevent misuse or fraud.</li>
            <li>To comply with legal obligations and regulatory requirements.</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>3. How We Share Your Information</h2>
          <p>We do not sell your personal data. We may share information in the following cases:</p>

          <h3>3.1 With Service Providers</h3>
          <p>We may share your information with trusted third-party vendors to perform services on our behalf, such as hosting, data analytics, or customer support.</p>

          <h3>3.2 With Third-Party Retailers</h3>
          <p>When you request product data, we may interact with external retailer APIs. Your ZIP code or selected items may be transmitted to generate relevant results, but personally identifiable data is not shared.</p>

          <h3>3.3 Business Transfers</h3>
          <p>If BreadBasket is involved in a merger, acquisition, financing, or sale of assets, your information may be transferred as part of that transaction.</p>

          <h3>3.4 Legal Requirements</h3>
          <p>We may disclose your information where required by law, regulation, or subpoena, or if we believe disclosure is necessary to protect the rights, property, or safety of BreadBasket, users, or the public.</p>
        </div>

        <div className="privacy-section">
          <h2>4. Your Privacy Rights</h2>
          <p>Depending on your jurisdiction, you may have the following rights:</p>

          <h3>4.1 Access and Portability</h3>
          <p>You may request a copy of your data in a machine-readable format.</p>

          <h3>4.2 Correction and Deletion</h3>
          <p>You may update your account information or request deletion of your data by contacting us.</p>

          <h3>4.3 Opt-Out</h3>
          <p>You may opt out of marketing communications at any time by clicking the "unsubscribe" link in any promotional email or contacting us directly.</p>

          <h3>4.4 California Privacy Rights (CCPA)</h3>
          <p>If you are a California resident, you may request:</p>
          <ul>
            <li>Disclosure of the categories and specific pieces of personal information we have collected about you.</li>
            <li>Deletion of your personal information.</li>
            <li>Information about how your data is used and shared.</li>
          </ul>

          <h3>4.5 EU/EEA Users (GDPR)</h3>
          <p>If you are located in the European Economic Area, you have additional rights under the General Data Protection Regulation (GDPR), including:</p>
          <ul>
            <li>Right to restrict processing</li>
            <li>Right to object to automated processing</li>
            <li>Right to lodge a complaint with a data protection authority</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>5. Data Retention</h2>
          <p>We retain your personal data only as long as necessary to fulfill the purposes outlined in this Privacy Policy. Account and usage data may be retained for legal, security, or operational reasons. Upon request or account deletion, we will securely erase or anonymize your data unless we are required to retain it by law.</p>
        </div>

        <div className="privacy-section">
          <h2>6. Data Security</h2>
          <p>We implement a range of security measures to protect your data:</p>
          <ul>
            <li>Encrypted connections via HTTPS</li>
            <li>Password hashing using industry standards</li>
            <li>Regular vulnerability assessments and access audits</li>
          </ul>
          <p>However, no method of transmission or storage is completely secure. Use the service at your own risk.</p>
        </div>

        <div className="privacy-section">
          <h2>7. Children's Privacy</h2>
          <p>BreadBasket does not knowingly collect personal information from children under the age of 13. If we learn that a child has provided us with personal data, we will delete such information as quickly as possible.</p>
        </div>

        <div className="privacy-section">
          <h2>8. International Users</h2>
          <p>BreadBasket is operated in the United States. If you access the Service from outside the U.S., you consent to the transfer of your information to the U.S. and its processing under this Privacy Policy.</p>
        </div>

        <div className="privacy-section">
          <h2>9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. The latest version will always be available on our website and include the "Last Updated" date.</p>
          <p>If material changes are made, we will notify you by email or in-app notification.</p>
        </div>

        <div className="privacy-section">
          <h2>10. Contact Us</h2>
          <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us at:</p>
          <p>
            📧 Email: privacy@breadbasketapp.com<br />
            📍 Address: BreadBasket Legal, 123 Startup Lane, Gainesville, FL 32601<br />
            📂 GitHub Repository: BreadBasket on GitHub
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 