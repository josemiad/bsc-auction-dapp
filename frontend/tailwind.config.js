/** @type {import('tailwindcss').Config} */
const token = (name) => `oklch(var(--${name}) / <alpha-value>)`;

export default {
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                paper: token('paper'),
                surface: token('surface'),
                raised: token('raised'),
                line: token('line'),
                ink: token('ink'),
                muted: token('muted'),
                accent: token('accent'),
                'accent-ink': token('accent-ink'),
                ok: token('ok'),
                danger: token('danger'),
            },
            fontFamily: {
                sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
            },
            transitionTimingFunction: {
                brand: 'var(--ease-out)',
            },
        },
    },
    plugins: [],
}
