  module.exports = {
    presets: [
      // Itt mondjuk meg a Babel-nek, hogy a jelenlegi Node.js verzióhoz optimalizáljon.
      // Ez gyorsabb transzformációt és kevesebb felesleges kódot eredményez.
      ['@babel/preset-env', { targets: { node: 'current' } }],
      
      // A React preset szükséges a .tsx fájlokhoz.
      '@babel/preset-react',
      
      // A TypeScript preset elengedhetetlen.
      '@babel/preset-typescript'
    ]
  };