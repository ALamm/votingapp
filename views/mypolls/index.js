'use strict';

exports.init = function(req, res){

    // CONNECT TO DB
    var collection = req.app.db.collection("polls");

    collection.find({author:req.user.username},{ _id: 0, question:1, url:1}).toArray(function (err,docs) {
        
        var polls = {};
        var noPolls = true;
            
        if (err) {
            console.error('find error');
        }
        
        // create an object that looks like {"favorite color":"x2d9slk", "best movie":"x!d9DdsS"}
        // eg. {"question: random url created when the poll is created}
        for (var i = 0; i < docs.length; i++) {
            var index = docs[i].question;
            polls[index] = docs[i].url;
            noPolls = false;
        }
       
        res.render('mypolls/index', {polls:polls, noPolls: noPolls});  // send the object to the jade template     
    });
    

};
