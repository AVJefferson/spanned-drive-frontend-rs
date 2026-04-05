import React from 'react';

export default function Privacy() {
  return (
    <div className="privacy-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Privacy Policy Sample (To be Updated)</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      
      <section style={{ marginTop: '2rem' }}>
        <h2>1. Information We Collect</h2>
        <p>
          We may collect personal information that you voluntarily provide to us when you express an interest in obtaining information about us or our products and Services.
        </p>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>2. How We Use Your Information</h2>
        <p>
          We use personal information collected via our application for a variety of business purposes, primarily to provide, maintain, and improve our services to you.
        </p>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>3. Will Your Information Be Shared?</h2>
        <p>
          We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
        </p>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>4. Data Retention</h2>
        <p>
          We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law.
        </p>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>5. Contact Us</h2>
        <p>
          If you have questions or comments about this notice, you may contact us using the provided contact information in the application.
        </p>
      </section>
    </div>
  );
}
