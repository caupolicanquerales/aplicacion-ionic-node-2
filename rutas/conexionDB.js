/* Archivo para establecer la conexion a la BASE de DATOS POSTGRES */

const { Pool ,Client } = require('pg');
var informacion= require('./datosConexionDB');

var client = new Client(informacion.postgres); //carga informacion de conexion
client.connect((err)=>{
    if(err){
        return console.error('Error en la conexion',err.stack);
    }else{
        console.log('Se establecio conexion segundo archivo');
    }
});
 
exports.cliente=client;