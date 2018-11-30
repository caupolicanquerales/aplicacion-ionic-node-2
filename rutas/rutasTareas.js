var conexion=require('./conexionDB');
var jwt= require('jsonwebtoken'); // MIDDLEWARE requerido para generar el TOKEN

var nombreTabla;
var resultado;
var pasoToken=false;
var tokenFinal;
var arregloResultado=[];
var totalFactura;

exports.funcionParaConsultaImagenes= function(req,res,next){

     //Forma de plantear SQL query para el conector de POSTGRES
     nombreTabla='items';
     const query={
        text:`SELECT * FROM ${nombreTabla}`
    }
    conexion.cliente.query(query,(err,result)=>{
        if(err){
            console.log('Problemas con la respuesta');
            return res.json({status:403});
        }else{
            resultado=result.rows;
            return res.json({status:200,resultado:resultado});
        }
    });
}

exports.funcionParaConsultaPorCategoria= function(req,res,next){
    
    nombreTabla='items';
    const query={
        text:`SELECT (id_item,imagen,nombre,precio,descripcion) FROM ${nombreTabla} WHERE id_menu=${req.params.categoria};`
    }
    conexion.cliente.query(query,(err,result)=>{
        if(err){
            console.log('Problemas con la respuesta');
            return res.json({status:403});
        }else{
            let i=0;
            arregloResultado=[];
            resultado=result.rows;
            resultado.forEach(elemento => { 
                let corte= elemento.row.slice(1,elemento.row.length-1).split(',');
                arregloResultado[i]={
                    id_item:corte[0],
                    imagen:corte[1],
                    nombre:corte[2],
                    precio:corte[3],
                    descripcion:corte[4]
                };
                i++; 
            });
            return res.json({status:200,resultado:arregloResultado});
        }
    });
}


exports.funcionParaGenerarOrden= function(req,res,next)
{
    var consulta=function(){
        validacionToken(req,res,next).then(function(){
            if(!pasoToken){
                nombreTabla='ordenes';
                const query={
                    text:`INSERT INTO ${nombreTabla} (id_usuario,abrir_orden,token_momento) VALUES ('${req.body.id_usuario}',current_timestamp,'${tokenFinal[1]}');`
                }
                conexion.cliente.query(query,(err,result)=>{
                    if(err){
                        console.log('Problemas con la respuesta de INSERT');
                        return res.json({status:403});
                    }else{
                        
                        const query={
                            text:`SELECT (id_orden) FROM ${nombreTabla} WHERE token_momento='${tokenFinal[1]}';`
                        }
                        conexion.cliente.query(query,(err,result)=>{
                            if(err){
                                console.log('Problemas con la respuesta de SELECT');
                                return res.json({status:403});
                            }else{
                                arregloResultado=result.rows;
                                return res.json({status:200,resultado:arregloResultado});
                            }
                        });                
                    }});                           

            }else{
                pasoToken=false;
            }
        });
    
    
    }
    consulta();
    
}


exports.funcionParaGenerarOrdenPorItem= function(req,res,next){
    
    var consulta=function(){
        validacionToken(req,res,next).then(function(){
            if(!pasoToken){
                nombreTabla='items_orden';
                const query={
                    text: `INSERT INTO ${nombreTabla} (id_orden,id_item) VALUES ($1,$2);`,
                    values:[req.body.id_orden,req.body.id_item]
                }
                conexion.cliente.query(query,(err,result)=>{
                    if(err){
                        return res.json({status:403});
                    }else{
                        return res.json({status:200,mensaje:'todo un exito'});
                    }
                });
                            

            }else{
                pasoToken=false;
            }
        });
    }
    consulta();
    
}

exports.funcionParaEjecutarFacturacion=function(req,res,next){
    
    console.log('NUMERO DE ORDEN',req.body.id_orden);

    var consulta=function(){
        validacionToken(req,res,next).then(function(){
            if(!pasoToken){
            
                nombreTabla='items_orden';
                var query={
                    text: `SELECT (id_items,id_item) FROM ${nombreTabla} WHERE id_orden=${req.body.id_orden};`
                }
                arregloResultado=[];
                totalFactura=0;
                let iva=0;
                let totalGeneral=0;
                let i=0;                         

                conexion.cliente.query(query,(err,result)=>{
                    if(err){
                        return res.json({status:403});
                    }else{
                        nombreTabla='items';
                        resultado=result.rows;
                        resultado.forEach(elemento=>{
                             
                            let corte= elemento.row.slice(1,elemento.row.length-1).split(',');
                            query={
                                text: `SELECT (nombre,precio) FROM ${nombreTabla} WHERE id_item=${corte[1]};`
                            }
                            
                            conexion.cliente.query(query,(err,result)=>{
                                if(err){
                                    return res.json({status:403});
                                }else{
                                    let valores= result.rows[0].row.slice(1,result.rows[0].row.length-1).split(',');
                                    arregloResultado[i]={
                                        nombre:valores[0],
                                        precio:valores[1],
                                        id_items:corte[0]
                                    };
                                    totalFactura+=Number(valores[1]);//calcula sumarotoria
                                    iva=(totalFactura*0.14).toFixed(2);//impuesto facturado
                                    totalGeneral=(totalFactura*1.14).toFixed(2);//costo general a pagar
                                    i++;
                                }
                                if(resultado.length===i){
                                    let facturaGeneral={
                                        totalSinImpuesto:totalFactura,
                                        impuesto:iva,
                                        totalFacturado:totalGeneral
                                    };
                                    
                                    return res.json({status:200,mensaje:'todo un exito',itemFacturados:arregloResultado,costoFacturado:facturaGeneral});
                                }     
                            });
                            
                        }); 
                    }
                });
            }else{
                pasoToken=false;
            }
        });
    }
    consulta();
}

exports.funcionParaBorrarItemsListaDeOrdenes=function(req,res,next){

    //Secuencia para extraer valor de ID_ITEMS---> "element.item.id_items"
    let i=0;
    req.body.itemsBorrar.forEach(element=>{
        nombreTabla='items_orden';
        var query={
            text: `DELETE FROM ${nombreTabla} WHERE id_items=${element.item.id_items};`
        }
        conexion.cliente.query(query,(err,result)=>{
            if(err){
                return res.json({status:403});
            }else{
                i++;
                if(req.body.itemsBorrar.length===i){
                    return res.json({status:200});
                }
            }
        });
    });
    
}


exports.funcionParaCancelarOrden= function(req,res,next){
    nombreTabla='items_orden';
    var query={
        text: `DELETE FROM ${nombreTabla} WHERE id_orden=${req.body.id_orden};`
    }
    conexion.cliente.query(query,(err,result)=>{
        if(err){
            return res.json({status:403});
        }else{
            nombreTabla='ordenes';
            query={
                text: `DELETE FROM ${nombreTabla} WHERE id_orden=${req.body.id_orden};`
            }
            conexion.cliente.query(query,(err,result)=>{
                if(err){
                    return res.json({status:403});
                }else{
                    return res.json({status:200});
                }
            });
        }
    });
}

exports.funcionParaCerrarOrden= function(req,res,next){
    nombreTabla='ordenes';
    var query={
        text: `UPDATE ${nombreTabla} set cerrar_orden=current_timestamp WHERE id_orden=${req.body.id_orden};`
    }
    conexion.cliente.query(query,(err,result)=>{
        if(err){
            return res.json({status:403});
        }else{
            return res.json({status:200});
        }
    });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/* Funcion para determinar la validez del TOKEN */
function validacionToken(req,res,next){
    const comprobar= new Promise(
        (resolve,reject)=>{
            var token=req.body.token || req.headers.authorization;//comprueba si el token proviene del BODY o HEADERS
            tokenFinal= token.split(' ');
            if(tokenFinal[1]){
                jwt.verify(tokenFinal[1],'caposecreto',function(err,decoded){
                    if(err){
                        reject(new Error('Problemas con la autorizacion'));        
                    }else{
                        req.decoded=decoded;//extrae el TOKEN y lo vuelve a colocar en "REQ" para continuar con la utilizacion del TOKEN
                        resolve();
                    }
                });
            }else{
                reject(new Error('Problemas con la autorizacion'));
            }
        }
    ).catch((err)=>{
        pasoToken=true;
        return res.json({"status":403});
    });

    return comprobar;
}