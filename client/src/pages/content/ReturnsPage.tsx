import LegalLayout, { LegalSection } from './LegalLayout'

export default function ReturnsPage() {
  return (
    <LegalLayout
      title="Returns & Refunds"
      updated="30 May 2026"
      intro="We want you to be fully satisfied with your purchase. If something isn't right, here's how returns and refunds work at ElectroKart."
    >
      <LegalSection heading="Return window">
        <p>
          Most products can be returned within 7 days of delivery. Items must be unused, in their
          original condition and packaging, with all accessories, manuals and tags intact.
        </p>
      </LegalSection>

      <LegalSection heading="Non-returnable items">
        <p>
          For safety and hygiene reasons, certain items cannot be returned once opened — including
          consumable components, soldered or modified parts, software licences and clearance-sale
          items. Such items are clearly marked on the product page.
        </p>
      </LegalSection>

      <LegalSection heading="How to request a return">
        <p>
          Go to the Orders section in your account, select the item and choose "Return". Alternatively,
          email support@electrokart.com with your order ID and reason. Our team will arrange a pickup or
          share return instructions.
        </p>
      </LegalSection>

      <LegalSection heading="Refunds">
        <p>
          Once we receive and inspect the returned item, your refund is initiated to the original
          payment method within 5–7 business days. For Cash on Delivery orders, refunds are issued to
          your bank account or UPI via a verified payout.
        </p>
      </LegalSection>

      <LegalSection heading="Replacements">
        <p>
          If you received a defective or wrong item, we'll arrange a free replacement subject to stock
          availability. Where a replacement isn't possible, you'll receive a full refund.
        </p>
      </LegalSection>

      <LegalSection heading="Need help?">
        <p>
          For any return or refund query, reach out to support@electrokart.com and we'll be glad to assist.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
