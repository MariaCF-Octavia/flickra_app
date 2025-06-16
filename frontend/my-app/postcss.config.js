// postcss.config.js
// postcss.config.js
// postcss.config.js
// postcss.config.js
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import postcssImport from 'postcss-import'
import postcssNesting from 'postcss-nesting'

const config = {
  plugins: [
    postcssImport(),
    postcssNesting(),
    tailwindcss(),
    autoprefixer()
  ]
}

export default config


