import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import PolicyContent from '@/components/PolicyContent';

export const metadata: Metadata = {
  title: 'Privacy Policy | Charm Avenue by Nandini',
  description: 'How Charm Avenue by Nandini collects, uses and protects your information.',
};

const sections = [
  {
    heading: 'Information We Collect',
    body: (
      <p>
        We collect information you provide directly — such as your name, email, phone number and
        shipping address when you place an order or sign up for updates — along with basic usage
        data like pages visited.
      </p>
    ),
  },
  {
    heading: 'How We Use Your Information',
    body: (
      <ul className="list-disc list-inside space-y-1.5">
        <li>To process and deliver your orders</li>
        <li>To send order updates, offers and newsletters (you can unsubscribe anytime)</li>
        <li>To improve our products and website experience</li>
      </ul>
    ),
  },
  {
    heading: 'Cookies',
    body: (
      <p>
        We use cookies to keep the site working smoothly and to understand how visitors use Charm
        Avenue. You can disable cookies in your browser settings, though some features may not work
        as expected.
      </p>
    ),
  },
  {
    heading: 'Third-Party Services',
    body: (
      <p>
        We may use trusted third-party services for payments, analytics and shipping. These partners
        only receive the information needed to perform their service and are not permitted to use it
        for any other purpose.
      </p>
    ),
  },
  {
    heading: 'Your Rights',
    body: (
      <p>
        You can request access to, correction of, or deletion of your personal data at any time by
        reaching out through our Contact page.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
      <Header />
      <PageHero
        eyebrow="🔒 Privacy"
        title="Privacy Policy"
        subtitle="How we collect, use and protect your information."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy' }]}
      />
      <PolicyContent sections={sections} updatedAt="19 July 2026" />
      <Footer />
    </main>
  );
}
