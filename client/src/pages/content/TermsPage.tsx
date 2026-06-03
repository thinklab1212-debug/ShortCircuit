import LegalLayout, { LegalSection } from './LegalLayout'

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      updated="30 May 2026"
      intro="Please read these Terms & Conditions carefully before using Short Circuit. By accessing or using our website, you agree to be bound by these terms."
    >
      <LegalSection heading="Use of the site">
        <p>
          You agree to use Short Circuit only for lawful purposes and in a way that does not infringe
          the rights of others. You are responsible for keeping your account credentials confidential
          and for all activity under your account.
        </p>
      </LegalSection>

      <LegalSection heading="Products and pricing">
        <p>
          We strive to display accurate product information, images and prices. However, errors may
          occasionally occur. If a product is listed at an incorrect price, we reserve the right to
          cancel the order and refund any amount paid. All prices are in Indian Rupees and inclusive
          of applicable taxes unless stated otherwise.
        </p>
      </LegalSection>

      <LegalSection heading="Orders">
        <p>
          Placing an order constitutes an offer to purchase. We may accept or decline any order at
          our discretion, including where stock is unavailable or where we suspect fraudulent
          activity. Order confirmation will be sent to your registered email.
        </p>
      </LegalSection>

      <LegalSection heading="Intellectual property">
        <p>
          All content on this site, including logos, text, graphics and software, is the property of
          Short Circuit or its licensors and is protected by applicable intellectual-property laws. You
          may not reproduce or redistribute it without permission.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        <p>
          Short Circuit is not liable for any indirect or consequential loss arising from the use of our
          products or services, to the maximum extent permitted by law. Products are intended for the
          purposes described and should be used in line with the manufacturer's guidelines.
        </p>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>
          These terms are governed by the laws of India. Any disputes shall be subject to the
          exclusive jurisdiction of the courts of Bengaluru, Karnataka.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
