import LegalLayout, { LegalSection } from './LegalLayout'

export default function ShippingPage() {
  return (
    <LegalLayout
      title="Shipping Policy"
      updated="30 May 2026"
      intro="Here's everything you need to know about how and when your Short Circuit order reaches you."
    >
      <LegalSection heading="Order processing">
        <p>
          In-stock orders are processed and dispatched within 1 business day. Orders placed on
          weekends or public holidays are processed on the next working day. You'll receive a
          confirmation email once your order is on its way.
        </p>
      </LegalSection>

      <LegalSection heading="Delivery time">
        <p>
          Standard delivery takes 2–5 business days for metro cities and 4–7 business days for other
          locations across India. Delivery timelines are estimates and may vary due to weather,
          courier delays or remote serviceability.
        </p>
      </LegalSection>

      <LegalSection heading="Shipping charges">
        <p>
          We offer free standard shipping on orders above ₹499. A nominal flat shipping fee applies to
          orders below this value, which is shown clearly at checkout before you pay.
        </p>
      </LegalSection>

      <LegalSection heading="Tracking your order">
        <p>
          Once shipped, you'll receive a tracking ID via email and SMS. You can also track your order
          anytime from the Orders section of your account.
        </p>
      </LegalSection>

      <LegalSection heading="Serviceable areas">
        <p>
          We ship across India to most pincodes. If your location is not serviceable, you'll be
          notified at checkout. Some heavy or restricted items may have limited delivery coverage.
        </p>
      </LegalSection>

      <LegalSection heading="Damaged or missing items">
        <p>
          If your package arrives damaged or an item is missing, please contact us at
          support@electrokart.com within 48 hours of delivery with photos so we can resolve it quickly.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
