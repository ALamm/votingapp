'use strict';

exports.delete = function(req, res){
    
    // CONNECT TO collection 'polls' in DB
    var collection = req.app.db.collection("polls");
    var val = Object.keys(req.body)[0];  // get the 'data' passed from index.jade's ajax call

    //console.log("collection: ", collection);
    console.log("val: ", val);
    
    collection.remove( { url : val }, function (err,result) {  // remove one document
        if (err) {
            console.error('remove err');  
        }
        else {
            res.send('{"success" : "Updated Successfully", "status" : 200}');            
        }
    });
    
    // res.redirect('/mypolls/');        
};