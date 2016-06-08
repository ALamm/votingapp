'use strict';

exports.init = function(req, res){
    
    var flag = false;
    
    var optionChosen = req.body.optionChosen; // get the answer chosen from req.body
    var otherAnswer = req.body.otherAnswer;  // if they created a custom answer - get the value
    
    console.log('optionChosen: ', optionChosen);
    console.log('otherAnswer: ', otherAnswer);
    
    // CONNECT TO collection 'polls' in DB
    var collection = req.app.db.collection("polls");
    
    // set the chart background color
    var chartBackground = '#431c5d';    
    
    // get the request url   e.g. 'http://whatever.com/polls/w2332kc'
    var dest = req.url;
    dest = dest.substr(dest.lastIndexOf('/') + 1);  // strip the path - get only the searchterm from the last '/' onwards

    // Get the IP address of the visitor
    var vistedYet = req.headers['x-forwarded-for'] || req.connection.remoteAddress; 

    // INVALID VOTE CHECK - e.g. refreshed page after voting
    collection.find({url:dest},{ _id: 0, question:1, url:1, answer:1,votes:1,ip:1,voterList:1}).toArray(function (err,docs) {
        
        if (err) { console.error('find error'); }
        
        // make sure that docs isn't undefined
        if (docs[0]) {
            
            var question = docs[0].question;
            var answer = docs[0].answer;
            var votes = docs[0].votes;   
            
            // charting variables
            var labels = [];
                for (var i = 0; i < answer.length; i++) {
                    labels.push(answer[i]);
                }
            var chart = {
                data: {
                    labels: labels,
                    datasets: [{
                        label: '# of Votes',
                        data: votes,
                        backgroundColor: chartBackground,
                        borderColor: [],
                        borderWidth: 1
                    }]
                }
            };    
            
            // FOR A REGISTERED USER
            // if the user has visited AND is logged in then don't allow to vote again.
            if (req.isAuthenticated()) {

                // Check that this isn't the first valid vote. Returns 'undefined' if docs.voterList is empty
                if (docs[0].voterList[0]) {
                    
                    // get a list of users that have voted. 
                    var voterList = docs[0].voterList;
                    
                    // check if user has voted already
                    if (voterList.indexOf(req.user.username) !== -1) {
                        flag = true;
                        res.render('polls/display',{votedAlready:true, question:question, data: chart.data});
                        res.end();
                    } 
                }
            }
            // FOR A NON-REGISTERED USER
            // Check that this isn't the first valid vote. Returns 'undefined' if docs.ip is empty
            else if (docs[0].ip[0] && !req.isAuthenticated()) {
                
                // get a list of IP addresses that have voted. 
                var ip = docs[0].ip;
        
                // if the user has visited then don't allow to vote again. 
                if (ip.indexOf(vistedYet) !== -1) {
                    flag = true;
                    res.render('polls/display',{votedAlready:true, question:question, data: chart.data});
                    res.end();
                }
            }
            
            // VALID VOTE Procedure
            if (flag === false) {

                collection.find({url:dest},{ _id: 0, question:1, url:1, answer:1,votes:1,ip:1, voterList:1}).toArray(function (err,docs) {
                    
                    if (err) {console.error('find error'); }
                    
                    var answer = docs[0].answer;
                    var votes = docs[0].votes;
                    var ip = docs[0].ip;
                    var voterList = docs[0].voterList;
                    
                    // update the variables that store IP address and logged in users who have voted for this poll
                    if (req.isAuthenticated()) {
                        voterList.push(req.user.username);
                    }
                    else {
                        ip.push(vistedYet);
                    }            
        
                    // check if the answer is a CUSTOM answer and ISN'T already in the DB
                    var check = 0;
                    if (optionChosen == null) {  // user chose to create new answer
                        check = answer.indexOf(otherAnswer) ;  // check if new answer is already in the DB.  "-1" means not in the DB
                        if (check > 0) {
                            console.log('user typed own answer, but its already in the DB');
                            optionChosen = otherAnswer;  // answer already in DB.  set the optionChosen to be the duplicate answer they typed as this is the variable name used for all cacluclation from here on
                        }
                    }
                    
                    // NEW answer but already in DB  - OR user selected existing answer.  Go ahead and update document
                    if (check >= 0) {
            
                        var index = answer.indexOf(optionChosen);  // get the location of the answer in the array
                        // NOTE:  the answer and votes array need to line up  
                        // e.g. the answers array ['cat', 'dog', 'gerbil'] needs to align with the vote array ['23', '2', '1'] 
                        // to make sure the answer and number of votes for that answer line up
                        
                        // INCREASE the vote count for the vote array
                        var val = votes[index] + 1;
                        
                        // replace 1 element from votes array - from the 'index' position - with value 'val'
                        votes.splice(index, 1, val);   
                        
                            // UPDATE THE DOCUMENT
                            collection.update({ url: dest },{$set: {votes: votes, ip: ip,voterList:voterList}}, function (err, docs) {
                                
                                if (err) {console.error('find error'); }  
                                
                                // FIND THE DOCUMENT AGAIN - WITH UPDATED RECORD
                                collection.find({url:dest},{ _id: 0, question:1, url:1, answer:1,votes:1}).toArray(function (err,docs) {
                                    if (err) { console.error('find error'); } 
                                    // build the variables for charting and updating document
                                    var question = docs[0].question;
                                    var answer = docs[0].answer;
                                    var votes = docs[0].votes;
                                    var labels = [];
                                        for (var i = 0; i < answer.length; i++) {
                                            labels.push(answer[i]);
                                        }
                                    var chart = {
                                        data: {
                                            labels: labels,
                                            datasets: [{
                                                label: '# of Votes',
                                                data: votes,
                                                backgroundColor: chartBackground,
                                                borderColor: [],
                                                borderWidth: 1
                                            }]
                                        }
                                    };
                                    // SEND THE UPDATED INFO TO THE JADE PAGE FOR RENDERING
                                    res.render('polls/display', {question:question, answer:answer, votes:votes, youVoted:true, optionChosen:optionChosen, data:chart.data});
                                
                                });
                            });
                    }
                    
                    // This is a NEW ANSWER - must add the new answer possibility to the array and add a vote of '1' to the votes array
                    else {
                        
                        var newAnswer = answer;
                        newAnswer.push(otherAnswer);
                        var newVote = votes;
                        newVote.push(1);
        
            
                        // UPDATE THE DOCUMENT
                        collection.update({ url: dest },{$set: {answer:newAnswer, votes: newVote, ip: ip,voterList:voterList}}, function (err, docs) {
                            if (err) { console.error('find error'); }  
                            
                            // FIND THE DOCUMENT AGAIN - WITH UPDATED RECORD
                            collection.find({url:dest},{ _id: 0, question:1, url:1, answer:1,votes:1}).toArray(function (err,docs) {
                                if (err) { console.error('find error'); } 
                        
                                // build the variables for charting and updating document
                                var question = docs[0].question;
                                var answer = docs[0].answer;
                                var votes = docs[0].votes;
                                var labels = [];
                                    for (var i = 0; i < answer.length; i++) {
                                        labels.push(answer[i]);
                                    }
                                var chart = {
                                    data: {
                                        labels: labels,
                                        datasets: [{
                                            label: '# of Votes',
                                            data: votes,
                                            backgroundColor: chartBackground,
                                            borderColor: [],
                                            borderWidth: 1
                                        }]
                                    }
                                };
                                // SEND THE UPDATED INFO TO THE JADE PAGE FOR RENDERING
                                res.render('polls/display', {question:question, answer:answer, votes:votes, youVoted:true, optionChosen:otherAnswer, data:chart.data});
                            
                            });
                        });   
                    }
                });        
            }
        }
        // docs is undefined
        else {
            res.redirect('/');
        }        
    });
};