// Private workbook. Only this web app writes to it; the public route can only append.
const ORIGIN = 'https://samuelacuna12.github.io';
const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const HEADERS = ['ID', 'Fecha (Colombia)', 'Nombre', 'WhatsApp', 'Negocio y producto', 'Decisión de inversión', 'Canal principal', 'Pedidos cobrados al mes', 'Facturación mensual (USD)', 'Margen por pedido', 'Dependencia del dueño', 'Principal freno', 'Intentos y resultados', 'Etapa de decisión', 'Meta a 90 días', 'Presupuesto disponible (USD)', 'Plazo para comenzar', 'Responsable de ejecución', 'Autorización de contacto'];
const FILE_NAME = 'Solicitudes de asesoría ecommerce — Samuel Acuña.xlsx';

function xml_(value) {
  return String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function row_(n, values) {
  return '<row r="'+n+'">'+values.map(function(v,i) {
    return '<c r="'+String.fromCharCode(65+i)+n+'" t="inlineStr"><is><t xml:space="preserve">'+xml_(v)+'</t></is></c>';
  }).join('')+'</row>';
}
function xmlFile_(name,body) { return Utilities.newBlob(body,'application/xml',name); }
function pack_(parts) { return Utilities.zip(parts,FILE_NAME).setContentType(MIME); }
function workbook_(rows) {
  const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const pkg = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const sheets = '<worksheet xmlns="'+ns+'"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="38" hidden="1" customWidth="1"/><col min="2" max="19" width="32" customWidth="1"/></cols><sheetData>'+rows.map((cells,i)=>row_(i+1,cells)).join('')+'</sheetData><autoFilter ref="A1:S'+rows.length+'"/></worksheet>';
  const parts = [
    xmlFile_('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'),
    xmlFile_('_rels/.rels','<Relationships xmlns="'+pkg+'"><Relationship Id="rId1" Type="'+rel+'/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
    xmlFile_('xl/workbook.xml','<workbook xmlns="'+ns+'" xmlns:r="'+rel+'"><sheets><sheet name="Solicitudes" sheetId="1" r:id="rId1"/></sheets></workbook>'),
    xmlFile_('xl/_rels/workbook.xml.rels','<Relationships xmlns="'+pkg+'"><Relationship Id="rId1" Type="'+rel+'/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
    xmlFile_('xl/worksheets/sheet1.xml',sheets)
  ];
  return pack_(parts);
}
function setupExcel() {
  const props=PropertiesService.getScriptProperties();
  if (!props.getProperty('REGISTER')) {
    const ss=Sheets.Spreadsheets.create({properties:{title:'Registro interno de asesorías — Samuel Acuña'},sheets:[{properties:{title:'Solicitudes'}}]});
    Sheets.Spreadsheets.Values.update({values:[HEADERS]},ss.spreadsheetId,'Solicitudes!A1:S1',{valueInputOption:'RAW'});
    props.setProperty('REGISTER',ss.spreadsheetId);
  }
  if (!props.getProperty('WORKBOOK')) {
    const file=Drive.Files.create({name:FILE_NAME,mimeType:MIME},workbook_([HEADERS]),{fields:'id,webViewLink'});
    props.setProperty('WORKBOOK',file.id);
    console.log(file.webViewLink);
  }
}
function append_(id,values) {
  const lock=LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const props=PropertiesService.getScriptProperties();
    const db=props.getProperty('REGISTER'), file=props.getProperty('WORKBOOK');
    if (!db || !file) throw Error('Not configured');
    const range='Solicitudes!A:S';
    const rows=Sheets.Spreadsheets.Values.get(db,range).values;
    if (!rows.some(row=>row[0]===id)) {
      const date=Utilities.formatDate(new Date(),'America/Bogota','yyyy-MM-dd HH:mm:ss');
      const row=[id,date].concat(values);
      Sheets.Spreadsheets.Values.append({values:[row]},db,range,{valueInputOption:'RAW',insertDataOption:'INSERT_ROWS'});
      rows.push(row);
    }
    // Refresh the same private XLSX, including on a retry after a failed export.
    Drive.Files.update({},file,workbook_(rows),{fields:'id'});
  } finally {lock.releaseLock();}
}
function doPost(e) {
  const params=e.parameter||{};
  const id=String(params.id||'');
  let ok=false;
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || params.website || String(params.answers||'').length>9000) throw Error('Invalid request');
    const v=JSON.parse(params.answers);
    if (!Array.isArray(v)||v.length!==17||v.some(x=>typeof x!=='string'||!x.trim()||x.length>600)||!/^\+?[\d\s().-]{7,25}$/.test(v[1])||v[1].replace(/\D/g,'').length<7||v[1].replace(/\D/g,'').length>15||v[16]!=='Sí, autorizo el contacto sobre mi solicitud.') throw Error('Invalid fields');
    append_(id,v.map(s=>s.trim()));
    ok=true;
  } catch(err) {console.warn('Intake could not be saved: '+err.name);}
  const content=JSON.stringify({type:'asesoria-receipt',id:/^[0-9a-f-]{36}$/i.test(id)?id:'',ok:ok});
  return HtmlService.createHtmlOutput('<script>window.top.postMessage('+content+',"'+ORIGIN+'");</script>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
