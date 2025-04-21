import React from 'react';
import './Legal.css';

function TermsOfService() {
  return (
    <div className="legal-container">
      <div className="legal-content">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last Updated: March 19, 2024</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using BreadBasket ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>BreadBasket is an AI-powered shopping assistant that helps users compare prices across different stores and manage their shopping lists. The Service includes features such as:</p>
          <ul>
            <li>Price comparison across multiple stores</li>
            <li>AI-powered shopping recommendations</li>
            <li>Shopping list management</li>
            <li>Store location services</li>
          </ul>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <p>To use certain features of the Service, you must register for an account. You agree to:</p>
          <ul>
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Promptly update any changes to your information</li>
            <li>Accept responsibility for all activities under your account</li>
          </ul>
        </section>

        <section>
          <h2>4. User Responsibilities</h2>
          <p>When using the Service, you agree not to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Submit false or misleading information</li>
            <li>Attempt to gain unauthorized access to the Service</li>
            <li>Interfere with the proper functioning of the Service</li>
          </ul>
        </section>

        <section>
          <h2>5. Data Usage and Privacy</h2>
          <p>Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection and use of information as detailed in our Privacy Policy.</p>
        </section>

        <section>
          <h2>6. Service Modifications</h2>
          <p>We reserve the right to modify or discontinue the Service at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.</p>
        </section>

        <section>
          <h2>7. Intellectual Property</h2>
          <p>All content, features, and functionality of the Service are owned by BreadBasket and are protected by international copyright, trademark, and other intellectual property laws.</p>
        </section>

        <section>
          <h2>8. Limitation of Liability</h2>
          <p>BreadBasket shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.</p>
        </section>

        <section>
          <h2>9. Termination</h2>
          <p>We reserve the right to terminate or suspend your account and access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.</p>
        </section>

        <section>
          <h2>10. Changes to Terms</h2>
          <p>We reserve the right to update these Terms of Service at any time. We will notify users of any material changes by posting the new Terms of Service on this page and updating the "Last Updated" date.</p>
        </section>

        <section>
          <h2>11. Contact Information</h2>
          <p>If you have any questions about these Terms of Service, please contact us at:</p>
          <p className="contact-info">support@breadbasket.com</p>
        </section>
      </div>
    </div>
  );
}

export default TermsOfService; 