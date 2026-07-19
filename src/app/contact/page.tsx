import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import Icon from '@/components/ui/AppIcon';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
    title: 'Contact Us | Charm Avenue by Nandini',
    description: 'Get in touch with Charm Avenue by Nandini — questions about orders, products or partnerships.',
};

const contactMethods = [
    { icon: 'EnvelopeIcon', label: 'Email', value: 'hello@charmavenue.in' },
    { icon: 'ChatBubbleLeftRightIcon', label: 'WhatsApp', value: '+91 98765 43210' },
    { icon: 'ClockIcon', label: 'Support Hours', value: 'Mon–Sat, 10am – 7pm IST' },
];

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-[#FFF0F7] overflow-x-hidden">
            <Header variant="solid" />
            <PageHero
                eyebrow="💌 Get in Touch"
                title={
                    <>
                        We&apos;d love to <span className="shimmer-text">hear from you</span>
                    </>
                }
                subtitle="Questions about an order, a product, or just want to say hi? Drop us a message and we'll get back within 24 hours."
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
            />

            <section className="w-full px-4 md:px-10 py-14">
                <div className="max-w-screen-xl mx-auto grid md:grid-cols-5 gap-8">
                    <div className="md:col-span-2 flex flex-col gap-4">
                        {contactMethods.map((m) => (
                            <div key={m.label} className="flex items-center gap-4 bg-white rounded-3xl p-5 card-bubble">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FFE4F4' }}>
                                    <Icon name={m.icon} size={20} className="text-[#E91E8C]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[#9B4070] font-semibold uppercase tracking-wide">{m.label}</p>
                                    <p className="text-[#3D0030] font-bold">{m.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="md:col-span-3">
                        <ContactForm />
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
