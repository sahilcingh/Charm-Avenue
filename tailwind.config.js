/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    darkMode: 'class',
    theme: {
        container: { center: true, padding: '1rem' },
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                },
                secondary: {
                    DEFAULT: 'var(--secondary)',
                    foreground: 'var(--secondary-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                },
                muted: {
                    DEFAULT: 'var(--muted)',
                    foreground: 'var(--muted-foreground)',
                },
                card: {
                    DEFAULT: 'var(--card)',
                    foreground: 'var(--card-foreground)',
                },
                border: 'var(--border)',
                input: 'var(--input)',
                ring: 'var(--ring)',
                lavender: 'var(--lavender)',
                'lavender-light': 'var(--lavender-light)',
                mint: 'var(--mint)',
                'mint-light': 'var(--mint-light)',
                'pink-light': 'var(--pink-light)',
                yellow: 'var(--yellow)',
                vanilla: 'var(--vanilla)',
                'deep-plum': 'var(--deep-plum)',
            },
            borderRadius: {
                DEFAULT: 'var(--radius)',
                sm: 'calc(var(--radius) - 0.5rem)',
                lg: 'calc(var(--radius) + 0.5rem)',
                xl: 'calc(var(--radius) + 1rem)',
                '2xl': 'calc(var(--radius) + 1.5rem)',
                '3xl': '2rem',
                '4xl': '2.5rem',
            },
            fontFamily: {
                sans: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
                display: ['var(--font-syne)', 'sans-serif'],
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
};