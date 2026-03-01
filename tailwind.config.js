/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-blue': '#1e40af',
                'brand-light': '#f8fafc',
                'brand-border': '#e2e8f0',
            }
        },
    },
    plugins: [],
}
