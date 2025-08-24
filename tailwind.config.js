/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'bug-primary': '#f97316', // orange-500
        'bug-primary-hover': '#ea580c', // orange-600
      },
      zIndex: {
        'bug-reporter': '9999',
        'bug-reporter-overlay': '10000'
      }
    }
  },
  plugins: [],
  prefix: 'br-', // Prefix to avoid conflicts
  important: true, // Ensure styles override app styles
  corePlugins: {
    preflight: false // Don't reset styles globally
  }
};