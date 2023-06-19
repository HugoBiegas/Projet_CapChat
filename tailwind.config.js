/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
  content: ['./views/*.html'], // ajustez ce chemin pour qu'il corresponde à l'endroit où se trouvent vos fichiers HTML
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    extend: {
      spacing: {
        '30rem': '30rem', // définition de la largeur personnalisée
      },
      fontSize: {
        '4xl': '2rem', // définition de la taille de police personnalisée
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}

