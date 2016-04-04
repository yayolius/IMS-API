var json2csv = require('json2csv');
var _ = require('lodash');

module.exports = function(Device) {
	
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
                value:{
                  gt:0
                }
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

          json2csv({del:";",quotes:'',doubleQuotes:null, data: datapoints, fields: ["value","value_baseline","datetime", "gps","tonelaje"] }, function(err, csv) {
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
             fields: {id:true,value_baseline: true, datetime: true },
             where: {
                datetime:{
                  gt:thedate
                },
                value_baseline:{
                  gt:0
                }
             }
          }
        ,function(err, datapoints) {
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

              var tenPercent = Math.floor(ngroup.length*0.1);
              ngroup = _.drop(ngroup, tenPercent);
              ngroup = _.dropRight(ngroup,tenPercent);
              
              response.push({
                from: mindate,
                to:maxdate,
                count: ngroup.length,
                baseline: _.meanBy(ngroup, 'value_baseline')
              });
              
          });

          cb(null, response);
      });
     
    });

  }

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
};
