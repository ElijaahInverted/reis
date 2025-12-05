/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // === Brand Colors ===
                brand: {
                    primary: '#79be15',      // Main green (Mendelu)
                    'primary-hover': '#6aab12',
                    accent: '#8DC843',       // Lighter green accent
                    'accent-hover': '#7db83a',
                    dark: '#444444',
                },

                // === Legacy Mendelu Colors (backwards compat) ===
                mendelu: {
                    green: '#79be15',
                    light: '#A0D25A',
                    dark: '#444444',
                },

                // === Event Type Colors ===
                exam: {
                    border: '#dc2626',
                    bg: '#FEF2F2',
                    text: '#991b1b',
                },
                lecture: {
                    border: '#00548f',
                    bg: '#F0F7FF',
                    text: '#1e3a8a',
                },
                seminar: {
                    border: '#79be15',
                    bg: '#F3FAEA',
                    text: '#365314',
                },

                // === UI State Colors ===
                state: {
                    success: '#22c55e',
                    'success-bg': '#f0fdf4',
                    warning: '#f59e0b',
                    'warning-bg': '#fffbeb',
                    error: '#ef4444',
                    'error-bg': '#fef2f2',
                    info: '#3b82f6',
                    'info-bg': '#eff6ff',
                },

                // === Surface Colors ===
                surface: {
                    primary: '#ffffff',
                    secondary: '#f9fafb',    // gray-50
                    tertiary: '#f3f4f6',     // gray-100
                    muted: '#e5e7eb',        // gray-200
                },

                // === Text Colors ===
                content: {
                    primary: '#111827',      // gray-900
                    secondary: '#4b5563',    // gray-600
                    muted: '#9ca3af',        // gray-400
                    inverse: '#ffffff',
                },

                // Convenience alias
                primary: '#79be15',
            },

            // === Spacing Scale ===
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '100': '25rem',
                '120': '30rem',
                '150': '37.5rem',
                '180': '45rem',
            },

            // === Typography ===
            fontFamily: {
                dm: ['DM Sans', 'sans-serif'],
            },

            fontSize: {
                '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
            },

            // === Shadows ===
            boxShadow: {
                'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                'popup': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                'drawer': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            },

            // === Border Radius ===
            borderRadius: {
                'card': '0.75rem',
                'button': '0.5rem',
            },

            // === Transitions ===
            transitionDuration: {
                '250': '250ms',
            },
        },
    },
    plugins: [],
}
