/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-dark': '#0f172a',
                'brand-sidebar': '#1e293b',
                'brand-primary': '#3b82f6',
            }
        },
    },
    plugins: [],
}
