module.exports = function(Device) {
	
  Device.AddDatapoint = function(data,req,res,cb) {
   
    if(data.name){
    	if(!data.value && data.value !== 0){
    		return cb({message:"Value not sent",status:403}, null);
    	}
   		Device.findOne({where: {name: data.name}, limit: 1}, function(err, device) {
     		
     		if(device){
     			var newDataPoint = { value: data.value };

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
    //console.log(id,time);
    //
    var milliSecondsAgo = 0;
    if( time.toLowerCase() === "hour" ){
      milliSecondsAgo = 1*60*60*1000;
    }
    else if( time.toLowerCase() === "day" ){
      milliSecondsAgo = 24*60*60*1000;
    }
    else if( time.toLowerCase() === "week" ){
      milliSecondsAgo = 7*24*60*60*1000;
    }
    var date = new Date();
    var thedate =  new Date(date.getTime() - milliSecondsAgo);


    Device.findById(id, function(err, device) {
      device.datapoints(
          {
             fields: {value: true, datetime: true, gps: true,tonelaje: true,llp_ds:true},
             where: {
                datetime:{
                  gt:thedate
                }
             }
          }
        , function(err, datapoints) {
           cb(null, datapoints);
      });
     
    });

  }

  function procesarAlerta(cb){

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
};
