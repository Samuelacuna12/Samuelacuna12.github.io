/* INVICTO OPS v33.1 · un MASSIVE solo sale con reserva completa y cantidades coherentes */
const preflightSaleBaseV331=window.preflightSaleV33;
window.preflightSaleV33=function(s,warehouse,maxLines){
  const reason=preflightSaleBaseV331(s,warehouse,maxLines);if(reason)return reason;
  const units=exactUnitsV17(s),declared=Number(s.qty||0),reserved=Number(s.stockReservationQty||0);
  if(declared>0&&declared!==units.length)return `Cantidad de venta ${declared} no coincide con ${units.length} unidades surtidas`;
  if(!s.stockReservationActive||reserved!==units.length)return `Reserva de stock incompleta: ${reserved}/${units.length}`;
  return '';
};
console.info('INVICTO OPS v33.1 · guard de reservas MASSIVE activo');
