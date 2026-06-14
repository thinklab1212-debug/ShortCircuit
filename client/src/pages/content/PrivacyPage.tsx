import LegalLayout, { LegalSection } from './LegalLayout'

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated="30 May 2026"
      intro="This Privacy Policy explains how Short Circuit collects, uses and protects your personal information when you use our website and services."
    >
      <LegalSection heading="Information we collect">
        <p>
          We collect information you provide directly — such as your name, email address, phone
          number, shipping address and payment details — when you create an account, place an order
          or contact our support team. We also collect limited technical data like your device type,
          browser and pages visited to improve our services.
        </p>
      </LegalSection>

      <LegalSection heading="How we use your information">
        <p>
          Your information is used to process and deliver orders, provide customer support, send
          order updates, prevent fraud and, where you have opted in, share offers and product news.
          We never sell your personal data to third parties.
        </p>
      </LegalSection>

      <LegalSection heading="Payments">
        <p>
          Payments are processed securely through trusted gateways such as Razorpay. We do not store
          your full card details on our servers. All transactions are encrypted in transit.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>
          We use cookies and similar technologies to keep you signed in, remember your cart and
          understand how the site is used. You can control cookies through your browser settings,
          though disabling them may affect site functionality.
        </p>
      </LegalSection>

      <LegalSection heading="Data security">
        <p>
          We apply reasonable technical and organisational measures to protect your data against
          unauthorised access, loss or misuse. However, no method of transmission over the internet
          is completely secure.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          You may access, update or request deletion of your personal information at any time by
          contacting us at sales.shortcircuit@gmail.com. We will respond in line with applicable Indian
          data-protection laws.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          For any privacy-related questions, write to us at sales.shortcircuit@gmail.com.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
