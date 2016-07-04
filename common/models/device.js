var json2csv = require('json2csv');
var _ = require('lodash');

module.exports = function(Device) {
	var app = require('../../server/server');

  Device.getDeviceConfig = function(field,name,req,res,cb){   
    
    if(['dosificacion','tonelaje','llp_ds'].indexOf(field) === -1){
      return cb({message:"Invalid field",status:403}, null);
    }
    Device.findOne({where: {name: name}, limit: 1}, function(err, device) {
      
      if(device){
        return cb(null,device[field]);
      }else{
        return cb({message:"Device not found",status:404}, null);
      }
     
     return null;

    });
  }
  Device.setDeviceConfig = function(field,name,value,req,res,cb){
    if(['dosificacion','tonelaje','llp_ds'].indexOf(field) === -1){
      return cb({message:"Invalid field",status:403}, null);
    }
    Device.findOne({where: {name: name}, limit: 1}, function(err, device) {
      
      if(device){          
        if(field == 'dosificacion' && ['bajo','medio','alto'].indexOf(value) < 0 ){
          return cb({message:"Invalid field value",status:403}, null);
        }
        device[field] =  value;
        device.save(function(res){
             return cb(null,device[field]);
        });
      }else{
        return cb({message:"Device not found",status:404}, null);
      }
     
     return null;

    });
  }

  Device.AddDatapoint = function(data,req,res,cb) {
    
    if(data.name){
    	if(!data.value && data.value !== 0){
    		return cb({message:"Value not sent",status:403}, null);
    	}
      
   		Device.findOne({where: {name: data.name}, limit: 1}, function(err, device) {
     		
     		if(device){

     			var newDataPoint = {};
          if(device.mode == 'linea-base') {
            newDataPoint = { value_baseline: data.value };
          }
          else {
            newDataPoint = { value: data.value };
          }

     			if(data.llp_ds && data.llp_ds !== 0){ newDataPoint.llp_ds = data.llp_ds; }
     			else if(device.llp_ds && device.llp_ds !== 0){ newDataPoint.llp_ds = device.llp_ds; }

     			if(data.tonelaje && data.tonelaje !== 0){ newDataPoint.tonelaje = data.tonelaje; }
     			else if(device.tonelaje && device.tonelaje !== 0){ newDataPoint.tonelaje = device.tonelaje; }

     			if(data.alert_treadshot && data.alert_treadshot !== 0){ newDataPoint.alert_treadshot = data.alert_treadshot; }
     			else if(device.alert_treadshot && device.alert_treadshot !== 0){ newDataPoint.alert_treadshot = device.alert_treadshot; }

     			if(data.datetime){ newDataPoint.datetime = data.datetime; }
     			else{ newDataPoint.datetime = new Date(); }

     			if(data.gps && data.gps.lat && data.gps.lng ){ newDataPoint.gps = data.gps; }
     			else if( device.gps && device.gps.lat && device.gps.lng ){ newDataPoint.gps = device.gps }
     			

          //console.log(newDataPoint);


     			device.datapoints.create(newDataPoint, function(err, dpoint) {



            if(device.alert_treadshot && device.alert_treadshot > dpoint.value){
              device.alerts.create(
                  {
                    datetime: new Date(),
                    message:"El valor "+dpoint.value+" ha superado  ha superado el margen establecido de " + device.alert_treadshot 
                  }, function(err,alert){
                    

                    cb(null, "ok");

                  });
            }
            else{
              cb(null, "ok");
            }
  					
				});

     		}else{
     			cb({message:"Device not found",status:401}, null);
     		}
     	 
     	 return null;


   		});
  	}else{
  		
  		cb({message:"Name param not provided",status:403}, null);
  	}
  }

  Device.getDatapointsValues = function(id,time,req,res,cb) {
    
    var milliSecondsAgo = 0;
    if( time.toLowerCase() === "hour" ){
      milliSecondsAgo = 1*60*60*1000;
    }
    else if( time.toLowerCase() === "3hours" ){
      milliSecondsAgo = 3*60*60*1000;
    }
    else if( time.toLowerCase() === "day" ){
      milliSecondsAgo = 24*60*60*1000;
    }
    else if( time.toLowerCase() === "week" ){
      milliSecondsAgo = 7*24*60*60*1000;
    }
    else if( time.toLowerCase() === "month" ){
      milliSecondsAgo = 30*24*60*60*1000;
    }
    else if( time.toLowerCase() === "all" ){
      milliSecondsAgo = (new Date()).getTime() ;
    }
    var date = new Date();
    var thedate =  new Date(date.getTime() - milliSecondsAgo);


    Device.findById(id, function(err, device) {
      device.datapoints(
          {
             fields: {value: true, datetime: true, gps: true,tonelaje: true,llp_ds:true, value_baseline: true },
             where: {
                datetime:{
                  gt:thedate
                },
                or:[
                  {
                    value:{
                      gt:0
                    }
                  },
                  {
                    value_baseline:{
                      gt:0
                    }
                  }
                ]
             }
          }
        , function(err, datapoints) {
          
           cb(null, datapoints);
      });
     
    });

  }

  Device.getDatapointsValuesSince = function(id,datetime,req,res,cb) {

    var dt = new Date(datetime);

    Device.findById(id, function(err, device) {
      device.datapoints(
          {
             fields: {value: true, value_baseline:true, datetime: true, gps: true,tonelaje: true,llp_ds:true, value_baseline: true },
             where: {
                datetime:{
                  gt:dt
                }
               
             }
          }
        , function(err, datapoints) {
           cb(null, datapoints);
      });
     
    });

  }

   Device.exportDatapointsValues = function(id,time,req,res,cb) {
    
   if( time.toLowerCase() === "hour" ){
      milliSecondsAgo = 1*60*60*1000;
    }
    else if( time.toLowerCase() === "day" ){
      milliSecondsAgo = 24*60*60*1000;
    }
    else if( time.toLowerCase() === "week" ){
      milliSecondsAgo = 7*24*60*60*1000;
    }
    else if( time.toLowerCase() === "month" ){
      milliSecondsAgo = 30*24*60*60*1000;
    }
    else if( time.toLowerCase() === "all" ){
      milliSecondsAgo = (new Date()).getTime() ;
    }
    var date = new Date();
    var thedate =  new Date(date.getTime() - milliSecondsAgo);


    Device.findById(id, function(err, device) {
      device.datapoints(
          {
             fields: {value: true, value_baseline:true, datetime: true, gps: true,tonelaje: true},
             where: {
                datetime:{
                  gt:thedate
                }
             }
          }
        , function(err, datapoints) {

          json2csv({del:";",quotes:'',doubleQuotes:null, data: datapoints, fields: ["value","value_baseline",{
                      label: 'fecha', // Supports duplicate labels (required, else your column will be labeled [function])
                      value: function(row) {
                        return row.datetime.toLocaleString("es");
                      },
                      default: '' // default if value fn returns falsy
                    }, "gps","tonelaje"] }, function(err, csv) {
            if (err) console.log(err);
            
            //AQUI HAY QUE CAMBIAR LA CABECERA DE LA RESPUESTA PARA FORZAR LA DESCARGA
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', 'attachment; filename="export-' + device.name +'-'+ time + '-' + ( new Date() ).getSeconds()+"."+( new Date() ).getMilliseconds() +'.csv"');
            res.send(csv).end();


          });
           
      });
     
    });



  }

  
  function procesarAlerta(cb){

  }




  Device.getBaselines = function(id,time,req,res,cb) {

     function getPercentile(data, percentile) {
        var p;
        /**
        * Converts percentile to decimal if necessary
        **/
        if (0 < percentile && percentile < 1) {
            p = percentile;
        } else if (0 < percentile && percentile <= 100) {
            p = percentile * 0.01;
        } else {
            return false;
        }
     
        var numItems = data.length;
        var allIndex = (numItems-1)*p;
        var intIndex = parseInt(allIndex);
        var floatVal = allIndex - intIndex;
        var sortedData = data.sort(function(a, b) {
            return a - b;
        });
        var cutOff = 0;
        if(floatVal % 1 === 0) {
            cutOff = sortedData[intIndex];
        } else {
            if (numItems > intIndex+1) {
                cutOff = floatVal*(sortedData[intIndex+1] - sortedData[intIndex]) + sortedData[intIndex];
            } else {
                cutOff = sortedData[intIndex];
            }
        }
        return cutOff;
    }

    function processBaselineDataPoints(datapoints,percentileFrom,percentileTo){

        var groups = [];
          var lastDate = null;
          var lastPoint = datapoints[0];
          var group = [datapoints[0]];
          datapoints.forEach(function(point){
            if(point.id === lastPoint.id ) return;

            //console.log(Math.abs( (new Date(point.datetime)).getTime() - (new Date(lastPoint.datetime)).getTime() )/1000);

            if( Math.abs( (new Date(point.datetime)).getTime() - (new Date(lastPoint.datetime)).getTime() ) > 5*60*1000){
              groups.push(group);
              group = [point];
            
            }else{
            
              group.push(point);
            
            }



            lastPoint = point;
          
          });

          if(group.length > 1){
            groups.push(group);
          }

          groups = _.filter(groups,function(group){ return group.length >= 3})
          var neogroups = [];
          groups.forEach(function(group){
            neogroups.push( _.sortBy(group,"value_baseline") );
          });

          var response = [];
          neogroups.forEach(function(ngroup){
              
              var mindate = new Date(2100,1,1);
              var maxdate = new Date(1970,0,0);
             
              ngroup.forEach(function(dpoint){
                  if( (new Date(dpoint.datetime)).getTime() < mindate.getTime() ){
                    mindate = new Date(dpoint.datetime);
                  }
                  if( (new Date(dpoint.datetime)).getTime() > maxdate.getTime() ){
                    maxdate = new Date(dpoint.datetime);
                  }
              });


              var data = _.map(ngroup, 'value_baseline');
              data = data.sort(function(a, b){return a-b; });

              var percentil10 = Math.round(getPercentile(data,10)*100)/100; 
              if(percentileFrom){
                percentil10 = Math.round(getPercentile(data,percentileFrom)*100)/100; 
              }
              var percentil90 = Math.round(getPercentile(data,90)*100)/100;
              if(percentileTo){
                percentil90 = Math.round(getPercentile(data,percentileTo)*100)/100; 
              }

              var filtered = [];            
              for(index in data){
                var s = data[index];
                if(s >= percentil10 && s < percentil90){
                   filtered.push(s);
                } 
              }


              var sum = 0;
              filtered.forEach(function(item){
                sum = item + sum;
              });
              console.log(percentil10,percentil90,filtered.length,sum,sum/filtered.length);

              var averageValue = sum/filtered.length;
              
              response.push({
                from: mindate,
                to:maxdate,
                count: data.length,
                baseline: Math.round(averageValue*1000)/1000,
                allvalues: ngroup
              });


              
          });

          cb(null, response);
    }
    
    var milliSecondsAgo = 0;
    if( time.toLowerCase() === "hour" ){
      milliSecondsAgo = 1*60*60*1000;
    }
    else if( time.toLowerCase() === "3hours" ){
      milliSecondsAgo = 3*60*60*1000;
    }
    else if( time.toLowerCase() === "day" ){
      milliSecondsAgo = 24*60*60*1000;
    }
    else if( time.toLowerCase() === "week" ){
      milliSecondsAgo = 7*24*60*60*1000;
    }
    else if( time.toLowerCase() === "month" ){
      milliSecondsAgo = 30*24*60*60*1000;
    }
    else if( time.toLowerCase() === "all" ){
      milliSecondsAgo = (new Date()).getTime() ;
    }
    var date = new Date();
    var thedate =  new Date(date.getTime() - milliSecondsAgo);


    Device.findById(id, function(err, device) {
      var fields = {id:true,value_baseline: true, datetime: true };
      var where = {
                datetime:{
                  gt:thedate
                },
                value_baseline:{
                  gt:0
                }
             };
      device.datapoints({  fields: fields, where: where}
        ,function(err, datapoints) {
          if(datapoints.length === 0){
            //intentemos 1 mes

            where.datetime.gt = new Date(date.getTime() - 30*24*60*60*1000); //1month
            device.datapoints({  fields: fields, where: where}
              ,function(err, datapoints) {
                if(datapoints.length === 0){
                  //sino todos no mas
                  where.datetime.gt = new Date(date.getTime() - date.getTime()); //all
                device.datapoints({  fields: fields, where: where}
                  ,function(err, datapoints) {
                   
                   processBaselineDataPoints(datapoints,device.percentil_inferior,device.percentil_superior);
                     
                });

                }else{
                  processBaselineDataPoints(datapoints,device.percentil_inferior,device.percentil_superior);
                  return null;
                }
            });



          }else{
            processBaselineDataPoints(datapoints,device.percentil_inferior,device.percentil_superior);
            return null;
          }
      });
     
    });

  }
  
    /**
     * @autor ahenriquez
     */
    Device.lastBaseLines = function(id) {
        return Device.findOne({
            include: {
                relation: 'datapoints',
                scope: {
                    limit: 20,
                    where: {
                        value_baseline: {
                            gte: 0
                        }
                    },
                    order: 'datetime DESC'
                }
            },
            where: {
                id: id
            }
        });
    };


    /**
     * @autor ahenriquez
     */
    Device.firstBaseLine = function(id) {
        return Device.findOne({
            include: {
                relation: 'datapoints',
                scope: {
                    limit: 1,
                    where: {
                        value_baseline: {
                            gte: 0
                        }
                    },
                    order: 'datetime ASC'
                }
            },
            where: {
                id: id
            }
        });
    };


  Device.DeleteBaselines = function (id,req,res,cb){

    console.log();

    Device.findById(id, function(err, device) {
      if(device){
        var baselines = req.body.baselines;
        
        baselines.forEach(function(bline){
          bline.deviceId = device.id;
        });
        
        app.models.Datapoint.destroyAll( { or: baselines },function(err,info){          
          return cb(null,{status:"ok"});
        })
        /*device.datapoints.destroyAll({ where: { or: req.body.baselines }},function(err,info){
          console.log(err,info);
          return cb(null,{});
        });*/
       
      }else{
        return cb({message:"Device not found",status:401}, null);
      }
    });
  }


  Device.ExportBaselines = function (id,req,res,cb){


    Device.findById(id, function(err, device) {
      if(device){
        var baselines = req.body.baselines;
        
        baselines.forEach(function(bline){
          bline.deviceId = device.id;
        });
        
        app.models.Datapoint.find( { 
          
            fields: { value: true, value_baseline:true, datetime: true, gps: true,tonelaje: true },
            where : { or: baselines } 

          },function(err,datapoints){          
          
          json2csv({del:";",quotes:'',doubleQuotes:null, data: datapoints, fields: ["value","value_baseline",{
                      label: 'fecha', // Supports duplicate labels (required, else your column will be labeled [function])
                      value: function(row) {
                        return row.datetime.toLocaleString("es");
                      },
                      default: '' // default if value fn returns falsy
                    }, "gps","tonelaje"] }, function(err, csv) {
            if (err) console.log(err);
            
            //AQUI HAY QUE CAMBIAR LA CABECERA DE LA RESPUESTA PARA FORZAR LA DESCARGA
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', 'attachment; filename="export-baseline' + device.name +'-' + ( new Date() ).getSeconds()+"."+( new Date() ).getMilliseconds() +'.csv"');
            res.send(csv).end();
          });

        });
      }else{
        return cb({message:"Device not found",status:401}, null);
      }
    });
  }


  Device.remoteMethod (
        'getDeviceConfig',
        {
          http: {path: '/config/:field', verb: 'get'},
          accepts: [ 
              {arg: 'field', type: 'string',  http: { source: 'path' } } ,
              {arg: 'name', type: 'string',  http: { source: 'query' } } ,
              {arg: 'req',  type: 'object', 'http': {source: 'req'}},
              {arg: 'res',  type: 'object', 'http': {source: 'res'}}
          ],
          returns: {arg: 'value', type: 'string'}
        }
    );

  Device.remoteMethod (
        'setDeviceConfig',
        {
          http: {path: '/config/:field', verb: 'post'},
          accepts: [ 
              {arg: 'field', type: 'string',  http: { source: 'path' } } ,
              {arg: 'name', type: 'string',  http: { source: 'query' } } ,
              {arg: 'value', type: 'string',  http: { source: 'query' } } ,
              {arg: 'req',  type: 'object', 'http': {source: 'req'}},
              {arg: 'res',  type: 'object', 'http': {source: 'res'}}
          ],
          returns: {arg: 'value', type: 'string'}
        }
    );



  Device.remoteMethod (
        'AddDatapoint',
        {
          http: {path: '/add-datapoint', verb: 'post'},
          accepts: [ 
          		{ arg: 'data', type: Device.Datapoint, http: { source: 'body' } } ,
           		{arg: 'req', type: 'object', 'http': {source: 'req'}},
 				      {arg: 'res', type: 'object', 'http': {source: 'res'}}
          ],
          returns: {arg: 'status', type: 'string'}
        }
    );

  Device.remoteMethod (
        'getDatapointsValues',
        {
          http: {path: '/:id/Datapoints/:time', verb: 'get'},
          accepts: [ 

              {arg: 'id',    type: 'string',  http: { source: 'path' } } ,
              {arg: 'time', type: 'string',  http: { source: 'path' } } ,
              {arg: 'req',  type: 'object', 'http': {source: 'req'}},
              {arg: 'res',  type: 'object', 'http': {source: 'res'}}
          ],
          returns: {type: 'array', root: true}
        }
    );

  Device.remoteMethod (
      'getBaselines',
      {
        http: {path: '/:id/Datapoints/:time/baselines', verb: 'get'},
        accepts: [ 

            {arg: 'id',    type: 'string',  http: { source: 'path' } } ,
            {arg: 'time', type: 'string',  http: { source: 'path' } } ,
            {arg: 'req',  type: 'object', 'http': {source: 'req'}},
            {arg: 'res',  type: 'object', 'http': {source: 'res'}}
        ],
        returns: {type: 'array', root: true}
      }
  );

  Device.remoteMethod (
        'getDatapointsValuesSince',
        {
          http: {path: '/:id/Datapoints/since', verb: 'get'},
          accepts: [ 

              {arg: 'id',    type: 'string',  http: { source: 'path' } } ,
              {arg: 'datetime', type: 'string',  http: { source: 'query' } } ,
              {arg: 'req',  type: 'object', 'http': {source: 'req'}},
              {arg: 'res',  type: 'object', 'http': {source: 'res'}}
          ],
          returns: {type: 'array', root: true}
        }
    );

  Device.remoteMethod (
        'exportDatapointsValues',
        {
          http: {path: '/:id/Datapoints/:time/export', verb: 'get'},
          accepts: [ 

              {arg: 'id',    type: 'string',  http: { source: 'path' } } ,
              {arg: 'time', type: 'string',  http: { source: 'path' } } ,
              {arg: 'req',  type: 'object', 'http': {source: 'req'}},
              {arg: 'res',  type: 'object', 'http': {source: 'res'}}
          ],
          returns:  {"type": "object", root:true}
        }
    );

  Device.remoteMethod (
        'DeleteBaselines',
        {
          http: {path: '/:id/Datapoints/baselines/delete', verb: 'post'},
          accepts: [ 

              {arg: 'id',    type: 'string',  http: { source: 'path' } } ,
              {arg: 'req',  type: 'object', 'http': {source: 'req'}},
              {arg: 'res',  type: 'object', 'http': {source: 'res'}}
          ],
          returns:  {"type": "object", root:true}
        }
    );

  Device.remoteMethod (
        'ExportBaselines',
        {
          http: {path: '/:id/Datapoints/baselines/export', verb: 'post'},
          accepts: [ 

              {arg: 'id',    type: 'string',  http: { source: 'path' } } ,
              {arg: 'req',  type: 'object', 'http': {source: 'req'}},
              {arg: 'res',  type: 'object', 'http': {source: 'res'}}
          ],
          returns:  {"type": "object", root:true}
        }
    );

};
