var loopback = require('loopback');
module.exports = function(Client) {
	
	var app = require('../../server/server');

	Client.isAdmin = function isAdmin(id,req,res,cb) {
   
		Client.findById(id,function(err,client){
			if(!client) {
				return cb({message:"Client not found",status:404}, null)
			}
			app.models.Role.findOne({where:{name:'admin'}},function(err,adminrole){
				if(err || !adminrole)
				  return cb({message:"Admin role not found",status:401}, null)
				adminrole.principals({where:{principalId: client.id}},function(err,roles){     
  	  				if(roles && roles.length > 0){
  	  					return cb(null,true);
  	  				}
  	  				return cb(null,false);
  	  			});
			});
		});
	}

  Client.setAsAdmin = function setAsAdmin(id,req,res,cb) {
   
    Client.findById(id,function(err,client){
      if(!client) {
        return cb({message:"Client not found",status:404}, null)
      }
      app.models.Role.findOne({where:{name:'admin'}},function(err,adminrole){
          if(err || !adminrole)
            return cb({message:"Admin role not found",status:401}, null)
          adminrole.principals({where:{principalId: client.id}},function(err,roles){     
                if (err)  return cb(err,false);

                if(roles && roles.length > 0){
                  return cb(null,true);
                }

                adminrole.principals.create({
                  principalType: app.models.RoleMapping.USER,
                  principalId: client.id
                }, function(err, principal) {
                  if (err)  return cb(err,false);
                  return cb(null,true);
                });
          });
      });
    });
  }

  Client.unsetAsAdmin = function setAsAdmin(id,req,res,cb) {
    Client.findById(id,function(err,client){
      if(!client) {
        return cb({message:"Client not found",status:404}, null)
      }
      app.models.Role.findOne({where:{name:'admin'}},function(err,adminrole){
          if(err || !adminrole)
            return cb({message:"Admin role not found",status:401}, null)
          adminrole.principals({where:{principalId: client.id}},function(err,roles){     
               
                if (err)  return cb(err,false);

                if(roles && roles.length > 0){

                  roles[0].destroy().then(function(err,info){
                    return cb(null,false);
                  })
                  
                }
          });
      });
    });
  }

	Client.isDeviceAdmin = function isDeviceAdmin(id,deviceid,req,res,cb) {
		//return cb(null,false);

    Client.findById(id,function(err,client){
      if(!client) {
        return cb({message:"Client not found",status:404}, null)
      }

      app.models.Device.findById(deviceid,function(err,device){
        if(!device) {
          return cb({message:"Device not found",status:404}, null)
        }


        app.models.Role.findOne({where:{name:'device-admin',deviceId: device.id }},function(err,adminrole){
          //no one is admin

          if(err || !adminrole)
            return cb(null,false);
          adminrole.principals({where:{principalId: client.id}},function(err,roles){     
                if(roles && roles.length > 0){
                  return cb(null,true);
                }
                return cb(null,false);
              });
        });

      });
    });

	}
  Client.setDeviceAdmin = function setDeviceAdmin(id,deviceid,req,res,cb) {
    //return cb(null,false);

    Client.findById(id,function(err,client){
      if(!client) {
        return cb({message:"Client not found",status:404}, null)
      }

      app.models.Device.findById(deviceid,function(err,device){
        if(!device) {
          return cb({message:"Device not found",status:404}, null)
        }

        ///////
        app.models.Role.findOne({where:{name:'device-admin',deviceId: device.id }},function(err,adminrole){
          //no one is admin, and role is not created
          if (err)  return cb(err,false);
          if(!adminrole){
            app.models.Role.create({
              name: 'device-admin',
              deviceId: device.id
            }, function(err, adminrole) {
                adminrole.principals.create({
                  principalType: app.models.RoleMapping.USER,
                  principalId: client.id
                }, function(err, principal) {
                  if (err)  return cb(err,false);
                  return cb(null,true);
                });
            });
          }else{

            adminrole.principals({where:{principalId: client.id}},function(err,roles){     
                  if (err)  return cb(err,false);

                  if(roles && roles.length > 0){
                    return cb(null,true);
                  }

                  adminrole.principals.create({
                    principalType: app.models.RoleMapping.USER,
                    principalId: client.id
                  }, function(err, principal) {
                    if (err)  return cb(err,false);
                    return cb(null,true);
                  });
            });
          }

        ////////////
        });

      });
    });

  }



  Client.unsetDeviceAdmin = function unsetDeviceAdmin(id,deviceid,req,res,cb) {
    //return cb(null,false);

    Client.findById(id,function(err,client){
      if(!client) {
        return cb({message:"Client not found",status:404}, null)
      }

      app.models.Device.findById(deviceid,function(err,device){
        if(!device) {
          return cb({message:"Device not found",status:404}, null)
        }

        ///////
        app.models.Role.findOne({where:{name:'device-admin',deviceId: device.id }},function(err,adminrole){
          //no one is admin, and role is not created
          if (err)  return cb(err,false);
          if(!adminrole){
             return cb(null,false);
          }else{

            adminrole.principals({where:{principalId: client.id}},function(err,roles){     
                  
                  if (err)  return cb(err,false);

                  if(roles && roles.length > 0){
                   

                    roles[0].destroy().then(function(err,info){
                        
                        return cb(null,false);
                    })

                  }else{
                    return cb(null,false);
                  }

                  
            });
          }

        ////////////
        });

      });
    });

  }

	Client.remoteMethod (
        'isAdmin',
        {
          http: {path: '/:id/is/admin', verb: 'get'},
          accepts: [ 
              {arg: 'id', type: 'string',  http: { source: 'path' }},
              {arg: 'req',  type: 'object', 'http': {source: 'req'}},
              {arg: 'res',  type: 'object', 'http': {source: 'res'}}
          ],
          returns: {arg: 'is', type: 'boolean'}
        }
    );

  Client.remoteMethod (
        'setAsAdmin',
        {
          http: {path: '/:id/set/admin', verb: 'get'},
          accepts: [ 
              {arg: 'id', type: 'string',  http: { source: 'path' }},
              {arg: 'req',  type: 'object', 'http': {source: 'req'}},
              {arg: 'res',  type: 'object', 'http': {source: 'res'}}
          ],
          returns: {arg: 'is', type: 'boolean'}
        }
    );

  Client.remoteMethod (
        'unsetAsAdmin',
        {
          http: {path: '/:id/unset/admin', verb: 'get'},
          accepts: [ 
              {arg: 'id', type: 'string',  http: { source: 'path' }},
              {arg: 'req',  type: 'object', 'http': {source: 'req'}},
              {arg: 'res',  type: 'object', 'http': {source: 'res'}}
          ],
          returns: {arg: 'is', type: 'boolean'}
        }
    );

  Client.remoteMethod (
        'isDeviceAdmin',
        {
          http: {path: '/:id/is/Device/:deviceid/admin', verb: 'get'},
          accepts: [ 
              {arg: 'id', type: 'string',  http: { source: 'path' }},
              {arg: 'deviceid', type: 'string',  http: { source: 'path' }},
              {arg: 'req',  type: 'object', 'http': {source: 'req'}},
              {arg: 'res',  type: 'object', 'http': {source: 'res'}}
          ],
          returns: {arg: 'is', type: 'boolean'}
        }
    );

  Client.remoteMethod (
        'setDeviceAdmin',
        {
          http: {path: '/:id/set/Device/:deviceid/admin', verb: 'get'},
          accepts: [ 
              {arg: 'id', type: 'string',  http: { source: 'path' }},
              {arg: 'deviceid', type: 'string',  http: { source: 'path' }},
              {arg: 'req',  type: 'object', 'http': {source: 'req'}},
              {arg: 'res',  type: 'object', 'http': {source: 'res'}}
          ],
          returns: {arg: 'is', type: 'boolean'}
        }
    );

  Client.remoteMethod (
        'unsetDeviceAdmin',
        {
          http: {path: '/:id/unset/Device/:deviceid/admin', verb: 'get'},
          accepts: [ 
              {arg: 'id', type: 'string',  http: { source: 'path' }},
              {arg: 'deviceid', type: 'string',  http: { source: 'path' }},
              {arg: 'req',  type: 'object', 'http': {source: 'req'}},
              {arg: 'res',  type: 'object', 'http': {source: 'res'}}
          ],
          returns: {arg: 'is', type: 'boolean'}
        }
    );

};
