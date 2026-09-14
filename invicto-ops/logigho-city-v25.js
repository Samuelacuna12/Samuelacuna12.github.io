/* INVICTO OPS v25 · resolución robusta de ciudades LogiGho para MASSIVE */
const OPS_UI_VERSION_V25='25.0';

const LOGIGHO_CITY_ALIASES_V25={
  'ARJONA B':'ARJONA',
  'MARIA LA BAJA B':'MARIA LA BAJA',
  'ARMENIA Q':'ARMENIA',
  'RIONEGRO ANT':'RIONEGRO',
  'EL CARMEN DE VIBORAL':'CARMEN DE VIBORAL'
};

function logighoDeptCompatibleV25(rowDept,inputDept){
  const a=normCityV17(rowDept),b=normCityV17(inputDept);
  if(!b)return true;
  if(a===b)return true;
  if(a&&b&&(a.includes(b)||b.includes(a)))return true;
  if(a.includes('SAN ANDRES')&&b.includes('SAN ANDRES'))return true;
  return false;
}

function logighoCityFormsV25(rawCity,rawDept){
  const city=normCityV17(rawCity),dept=normCityV17(rawDept),out=new Set();
  if(city)out.add(city);
  const aliased=LOGIGHO_CITY_ALIASES_V25[city];
  if(aliased)out.add(normCityV17(aliased));
  const noQualifier=city.replace(/\s+(ANT|Q|B)$/,'').trim();
  if(noQualifier)out.add(noQualifier);
  if(dept&&city.endsWith(' '+dept))out.add(city.slice(0,-dept.length).trim());
  if(city.startsWith('EL '))out.add(city.slice(3).trim());
  if(city.startsWith('LA '))out.add(city.slice(3).trim());
  return [...out].filter(Boolean);
}

window.resolveLogighoCityV17=function(s){
  const arr=logighoCitiesV17||[],city=normCityV17(s?.city),dept=normCityV17(s?.department);
  if(!city||city==='-')return null;

  const exactFull=`${city} ${dept}`.trim();
  let row=arr.find(x=>normCityV17(x.normalized_key)===exactFull);
  if(row)return row;

  const forms=logighoCityFormsV25(city,dept);
  for(const form of forms){
    const candidates=arr.filter(x=>normCityV17(x.city)===form&&logighoDeptCompatibleV25(x.department,dept));
    if(candidates.length===1)return candidates[0];
  }

  // Variantes como “EL DIFICIL” frente a “ARIGUANI EL DIFICIL”.
  for(const form of forms){
    const candidates=arr.filter(x=>{
      const c=normCityV17(x.city);
      return logighoDeptCompatibleV25(x.department,dept) && (c.endsWith(' '+form)||form.endsWith(' '+c));
    });
    if(candidates.length===1)return candidates[0];
  }

  // Si no llegó departamento, aceptar solo una coincidencia única de ciudad.
  if(!dept){
    for(const form of forms){
      const candidates=arr.filter(x=>normCityV17(x.city)===form);
      if(candidates.length===1)return candidates[0];
    }
  }
  return null;
};

window.previewLogighoCityV25=async function(city,department){
  await loadLogighoCitiesV17();
  return resolveLogighoCityV17({city,department});
};

console.info('INVICTO OPS v25 · LogiGho city resolver activo');
