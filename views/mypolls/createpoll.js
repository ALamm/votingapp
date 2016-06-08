'use strict';

exports.create = function(req, res){

    var random = require('random-js')();
    
    //create random 8 digit alphanumberic string for url
    var val = random.string(8);
    
    var fieldsToSet = {
        url: val,  // random string from above
        author:req.user.username,
        question: req.body.question,
        answer: [],
        votes:[],
        ip:[],
        voterList:[]
    }; 
    
    //loop through the req.body object and get key/value pairs - push to array
    var arr=[];
    Object.keys(req.body).forEach(function(key) {
        arr.push(req.body[key]);
    });
    // trim first three values ('_csrf', 'count' and 'question')
    arr=arr.splice(3); 
    
    // add the answers in the array to fieldsToSet.answer
    // add '0' to each vote to start
    for (var i = 0; i < arr.length; i++) {
        fieldsToSet.answer[i] = arr[i];
        fieldsToSet.votes[i] = 0;
    }

    // CONNECT TO collection 'polls' in DB
    var collection = req.app.db.collection("polls");
    
    collection.insertOne(fieldsToSet, function(err, user) {
        if (err) {
          console.text('error submitting new question to db');
        }
        console.log("inserted: ", fieldsToSet);
    
        collection.find({author:req.user.username},{ _id: 0, question:1, url:1}).toArray(function (err,docs) {
        
            var polls = {};
                
            if (err) {
                console.error('find error');
            }
            
            // create an object that looks like {"favorite color":"x2d9slk", "best movie":"x!d9DdsS"}
            // eg. {"question: random url created when the poll is created}
            for (var i = 0; i < docs.length; i++) {
                var index = docs[i].question;
                polls[index] = docs[i].url;
            }
           
            res.render('mypolls/index', {polls:polls, havePoll:true});  // send the object to the jade template     
        });        
    });
};