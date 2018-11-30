var jwt= require('jsonwebtoken'); // MIDDLEWARE requerido para generar el TOKEN
var conexion=require('./conexionDB');

const nombreTabla='usuarios';
const emailRequerido='Email invalido';
const passwordRequerido='Password invalido';
var resultado;
var paso=false;
var pasoToken=false;
var mensaje;
var tokenJWT;


//////////////////////////////////////////////////////////////////////////////////////////////

exports.funcionParaRegistrar=function(req,res,next){

    var dale= function(){
        promesa(req,res).then(function(resultado){
            return new Promise((resolve,reject)=>{
                    if(paso==false){
                        var query= `SELECT * FROM ${nombreTabla};`;
                        
                        conexion.cliente.query(query,(err,result)=>{
                            if(err){
                                console.log('Problemas con la respuesta');
                    
                            }else{
                                resultado=result.rows;//regresa la respuesta de la consulta
                                resultado.forEach(element => {
                                    if(req.body.email===element.email)
                                    {
                                        paso=true;
                                        mensaje="Direccion de email no disponible";
                                        reject(new Error('se ejecuto la accion de REJECT'));
                                    }
                                });
                                if(paso==false){
                                    if(req.body.password===req.body.password2){
                                        
                                        query={
                                            text: `INSERT INTO ${nombreTabla} (email,contrasena) VALUES ($1,$2);`,
                                            values:[req.body.email,req.body.password]
                                        }
                                        conexion.cliente.query(query,(err)=>{ 
                                            if(err){
                                                console.log(err.stack);
                                            }
                                        });
                                        mensaje='Informacion registrada';   
                                        resolve();
                                    }else{
                                        paso=true;
                                        mensaje="Password no coinciden";
                                        reject(new Error('se ejecuto la accion de REJECT'));
                                    }
                                }
                            }
                        });                    
                    }
                }).then(()=>{
                return resultado;
            });

        }).then(function(resultado){
            return res.json({"status":200,msg:mensaje});
        }).catch((err)=>{
            return res.json({"status":403,msg:mensaje});
        });
    }
    dale();
}


exports.funcionParaLogin= function(req,res,next){
    var dale= function(){
        promesa(req,res).then(function(resultado){
            return new Promise((resolve,reject)=>{
                console.log(paso);
                    if(paso==false){
                        var query=`SELECT * FROM ${nombreTabla};`;
                        conexion.cliente.query(query,(err,result)=>{
                            if(err){
                                console.log('Problemas con la respuesta');
                    
                            }else{
                                resultado=result.rows;//regresa la respuesta de la consulta
                                resultado.forEach(element => {
                                    if(req.body.email===element.email && req.body.password===element.contrasena)
                                    {
                                        paso=true;
                                        const payload={
                                            user:req.body.email
                                        };
                                        
                                        jwt.sign(payload,'caposecreto',{expiresIn:'4h'},(err,token)=>{
                                            //objeto para ser enviado como respuesta una vez creado el TOKEN
                                            tokenJWT=token;
                                            mensaje={
                                                success:true,
                                                msg:'Session Iniciada',
                                                token:tokenJWT,
                                                status:200,
                                                id_usuario:element.id
                                            };
                                        });//crea el TOKEN
                                        
                                        resolve();
                                    }
                                });
                                if(paso==false){
                                    mensaje='Problemas con el Email o Password';
                                    reject(new Error('se ejecuto la accion de REJECT'));
                                }
                            }
                        });                    
                    }
                }).then(()=>{
                return resultado;
            });

        }).then(function(resultado){

            return res.header('authorization',tokenJWT).json(mensaje);//forma de enviar el TOKEN en el HEADER y el cuerpo del mensaje
        }).catch((err)=>{
            console.log('No hay coincidencia');
            return res.json({"status":403,msg:mensaje});
        });
    }
    dale();

}



///////////////////////////////////////////////////////////////////////////////////////////////////////////
/* Forma de REUSAR una PROMISE, este se crea en una FUNCION y se regresa el objeto de la PROMISE */

function promesa(req,res){
    const valid= new Promise(
        (resolve,reject)=>{
            req.check('email',emailRequerido).isEmail();//para validar si el EMAIL cumple con la estructura general
            req.check('password',passwordRequerido).isLength({min:5});//para verificar la longitud minima que debe tener el PASSWORD
            const errors= req.validationErrors();//extrae los errores si el MIDDLEWARE los encontro
            if(errors){
                
                reject(new Error('se ejecuto la accion de REJECT'));
                return res.json({"errors":errors}); //retorna el tipo de error que se encontro
            }else{
                paso=false;
                resolve();
            }   
        }
    ).catch(errors=>{
        paso=true;
    });
    return valid;
}