module.exports = function(app) { 
  app.models.Role.findOne({where:{name:'admin'}},function(err,adminRole){
  
  	if(!adminRole){
	  	app.models.Role.create({
	      name: 'admin'
	    }, function(err, adminRole) {
	    	assignAdminsToSpecialPeople(adminRole);
	    }); 
  	}else{
  		assignAdminsToSpecialPeople(adminRole);
  	}
  });

  function assignAdminsToSpecialPeople(adminRole){
  	
  	app.models.Client.findOne({where:{email:'yayolius@gmail.com'}}, function(err,baseadmin){
  	  	if(baseadmin){
  	  		adminRole.principals({principalId: baseadmin.id},function(err,roles){
  	  			if(roles && roles.length == 0){
  	  				adminRole.principals.create({
				    	principalType: app.models.RoleMapping.USER,
				    	principalId: baseadmin.id
				    }, function(err, principal) {
				    	if (err) return console.log(err);
				    	
				    });
  	  			}
  	  		});
  	  	}
  	});
  }
}; 