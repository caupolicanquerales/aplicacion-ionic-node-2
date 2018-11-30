/** Archivo para establecer las rutas hacia el SERVIDOR */
var router= require('express').Router();
var cors=require('cors');
var rutasLogin= require('./rutasLoginRegistro');
var rutasTareas= require('./rutasTareas');


router.post('/papas/registro',cors(),rutasLogin.funcionParaRegistrar);

router.post('/papas/login',cors(),rutasLogin.funcionParaLogin);

router.get('/papas/items',cors(),rutasTareas.funcionParaConsultaImagenes);

router.get('/papas/items/:categoria',cors(),rutasTareas.funcionParaConsultaPorCategoria);

router.post('/papas/orden/generar',cors(),rutasTareas.funcionParaGenerarOrden);

router.post('/papas/orden',cors(),rutasTareas.funcionParaGenerarOrdenPorItem);

router.post('/papas/orden/factura',cors(),rutasTareas.funcionParaEjecutarFacturacion);

router.post('/papas/orden/actualizar',cors(),rutasTareas.funcionParaBorrarItemsListaDeOrdenes);

router.post('/papas/orden/cancelar',cors(),rutasTareas.funcionParaCancelarOrden);

router.post('/papas/orden/pagar',cors(),rutasTareas.funcionParaCerrarOrden);

module.exports=router;

