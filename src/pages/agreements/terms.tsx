import React from "react";

export default function Terms() {
  return (
    <div
      className="terms-container"
      style={{
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Terms of Service Sample (To be Updated)</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <section style={{ marginTop: "2rem" }}>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using this application, you accept and agree to be
          bound by the terms and provision of this agreement.
        </p>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>2. Use License</h2>
        <p>
          Permission is granted to temporarily use this application for
          personal, non-commercial transitory viewing only.
        </p>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>3. Disclaimer</h2>
        <p>
          The materials within this application are provided on an 'as is'
          basis. We make no warranties, expressed or implied, and hereby
          disclaim and negate all other warranties including, without
          limitation, implied warranties or conditions of merchantability,
          fitness for a particular purpose, or non-infringement of intellectual
          property or other violation of rights.
        </p>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>4. Limitations</h2>
        <p>
          In no event shall we or our suppliers be liable for any damages
          (including, without limitation, damages for loss of data or profit, or
          due to business interruption) arising out of the use or inability to
          use the materials on this application.
        </p>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>5. Modifications</h2>
        <p>
          We may revise these terms of service for its application at any time
          without notice. By using this application you are agreeing to be bound
          by the then current version of these terms of service.
        </p>
      </section>
    </div>
  );
}
