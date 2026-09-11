/* INVICTO OPS v5 · maestro de colores aprobado */
const INVICTO_COLOR_ALIASES = {
  'VINO':'VINOTINTO',
  'VINOTINTO':'VINOTINTO',
  'VERDE BOTELLA':'VERDE OSCURO',
  'VERDE CROSS':'VERDE OSCURO',
  'VERDE OSCURO':'VERDE OSCURO',
  'MARFIL CRUDO':'MARFIL',
  'MARFILT':'MARFIL',
  'MARFIL':'MARFIL',
  'CLARO GRIS':'GRIS CLARO',
  'GRIS CLARO':'GRIS CLARO',
  'AMARILLO DICIEMBRE':'AMARILLO',
  'AMARILLO':'AMARILLO',
  'AZUL PETRÓLEO':'AZUL PETROLEO',
  'AZUL PETROLEO':'AZUL PETROLEO',
  'VERDE PETRÓLEO':'VERDE PETROLEO',
  'VERDE PETROLEO':'VERDE PETROLEO'
};

// Colores válidos conocidos actualmente en Invicto. No agrega colores inexistentes al catálogo.
const INVICTO_MASTER_COLORS = [
  'NEGRO','BLANCO','ROJO','VINOTINTO','GRIS','GRIS CLARO','GRIS OSCURO',
  'AZUL','AZUL CLARO','AZUL OSCURO','AZUL PETROLEO',
  'VERDE','VERDE CLARO','VERDE OSCURO','VERDE PETROLEO',
  'MARFIL','AMARILLO'
];

function normalizeColor(v=''){
  let c=cleanText(v)
    .replace(/^\d+\s+/,'')
    .replace(/\bT-?(S|M|L|XL|2XL|3XL|4XL)\b/g,'')
    .replace(/^[\s\-|]+|[\s\-|]+$/g,'');
  return INVICTO_COLOR_ALIASES[c] || c;
}

function isKnownInvictoColor(v=''){
  return INVICTO_MASTER_COLORS.includes(normalizeColor(v));
}
