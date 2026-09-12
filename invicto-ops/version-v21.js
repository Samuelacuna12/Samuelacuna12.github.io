/* INVICTO OPS v21 · marcador de versión desplegada */
const renderShellBaseVersionV21=window.renderShell;
window.renderShell=function(){
  renderShellBaseVersionV21();
  const foot=document.querySelector('.sidebar-foot');
  if(foot)foot.innerHTML=foot.innerHTML.replace(/Versión\s+[^<]+/,'Versión 21.0');
};
