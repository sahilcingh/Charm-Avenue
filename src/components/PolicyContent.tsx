import React from 'react';

interface Section {
    heading: string;
    body: React.ReactNode;
}

interface PolicyContentProps {
    sections: Section[];
    updatedAt: string;
}

export default function PolicyContent({ sections, updatedAt }: PolicyContentProps) {
    return (
        <section className="w-full px-4 md:px-10 py-14">
            <div className="max-w-screen-md mx-auto">
                <p className="text-[#9B4070] text-sm font-medium mb-10">Last updated: {updatedAt}</p>
                {sections.map((s) => (
                    <div key={s.heading} className="mb-8">
                        <h2 className="font-display font-black text-[#3D0030] text-xl md:text-2xl tracking-tight mb-3">
                            {s.heading}
                        </h2>
                        <div className="text-[#3D0030]/80 text-base leading-relaxed space-y-3">{s.body}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}
