import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { Link } from 'react-router'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'
import { fadeInUp } from '@/config/animations'

interface Faq {
  question: string
  answer: string
}

const FAQS: Faq[] = [
  {
    question: 'How long does shipping take?',
    answer:
      'In-stock orders are dispatched the same or next business day. Delivery typically takes 2–5 business days depending on your location in India. Metro cities are usually faster than remote areas.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'You can return most unused items in their original packaging within 7 days of delivery. Once we receive and inspect the item, your refund is processed to the original payment method within 5–7 business days.',
  },
  {
    question: 'Which payment methods do you accept?',
    answer:
      'We accept UPI, all major credit and debit cards, net banking and Razorpay wallets. Cash on Delivery is also available on eligible orders.',
  },
  {
    question: 'Do products come with a warranty?',
    answer:
      'Yes. All branded products carry the standard manufacturer warranty. Warranty terms and duration are listed on each product page, and you can use your Short Circuit invoice as proof of purchase for claims.',
  },
  {
    question: 'Is Cash on Delivery (COD) available?',
    answer:
      'COD is available on most orders up to a certain value and for serviceable pincodes. You can check COD eligibility for your address at checkout before placing the order.',
  },
  {
    question: 'How do I track my order?',
    answer:
      'Once your order ships, you will receive a tracking ID by email and SMS. You can also view live status anytime under Orders in your account.',
  },
  {
    question: 'Do I need an account to place an order?',
    answer:
      'Creating a free account lets you track orders, save addresses, manage your wishlist and check out faster. We recommend signing up, though some flows support guest browsing.',
  },
  {
    question: 'Do you offer bulk or institutional orders?',
    answer:
      'Yes. We support bulk orders for colleges, labs and businesses, often with special pricing. Write to support@electrokart.com with your requirements and our team will prepare a quote.',
  },
]

function FaqItem({ faq, isOpen, onToggle }: { faq: Faq; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/40"
      >
        <span className="text-base font-medium text-foreground">{faq.question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <p className="px-5 pb-5 text-body-md leading-relaxed text-muted-foreground">{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="container py-6 lg:py-8">
      <Breadcrumb items={[{ label: 'FAQ' }]} className="mb-6" />

      <motion.div variants={fadeInUp} initial="initial" animate="animate" className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HelpCircle className="h-7 w-7" />
          </div>
          <h1 className="text-display-xs font-heading text-foreground sm:text-display-sm">
            Frequently asked questions
          </h1>
          <p className="mt-3 text-body-md text-muted-foreground">
            Everything you need to know about ordering, shipping, returns and support.
          </p>
        </header>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <FaqItem
              key={faq.question}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-muted/40 p-6 text-center">
          <p className="text-body-md text-muted-foreground">
            Still have questions?{' '}
            <Link to="/contact" className="font-medium text-primary hover:underline">
              Contact our support team
            </Link>
            .
          </p>
        </div>
      </motion.div>
    </div>
  )
}
