'use strict';

exports.init = function(req, res){

    // CONNECT TO DB
    var collection = req.app.db.collection("polls");
    
    // set the chart background color
    var chartBackground = '#431c5d';
    
    // Get the unique URL parameter from end of path
    var dest = req.url;
    dest = dest.substr(dest.lastIndexOf('/') + 1);  // strip the path - get only the searchterm from the last '/' onwards
    
    var vistedYet = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    collection.find({url:dest},{ _id: 0, question:1, url:1, answer:1,votes:1,ip:1, voterList:1}).toArray(function (err,docs) {
        
        if (err) { console.error('find error'); } 
        
        //check if the requested url is valid and in DB
        if (docs[0]) {

            // build the variables for charting and updating document
            var question = docs[0].question;
            var answer = docs[0].answer;
            var votes = docs[0].votes;
            var url = docs[0].url;
            
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
            var ip, voterList;

            // check if user has already voted using their current IP address.
            if (docs[0].ip) {
                ip = docs[0].ip;
            }
            
            // check if the user is in the VoterList (registered users)
            if (docs[0].voterList) {
                voterList = docs[0].voterList;
            }
            
            // Check if the user is logged in and has already voted (tracked by 'voterList')
            if (req.isAuthenticated()) {
                // if user has voted already
                if (voterList.indexOf(req.user.username) !== -1) {
                    res.render('polls/display',{votedAlready:true, question:question, url:url, data: chart.data});
                    res.end();
                }
                // if user is logged in, but hasn't voted
                else {
                    res.render('polls/display', {question:question, answer:answer, votes:votes, url:url, data: chart.data});
                }
            }
            // if user isn't logged in, check if they have voted already
            else if (ip.indexOf(vistedYet) !== -1) {
                res.render('polls/display',{ipVotedAlready:true, question:question, url:url, data: chart.data});
                res.end();
            }
            // not logged in, and hasn't voted yet
            else {
                res.render('polls/display', {question:question, answer:answer, votes:votes, url:url, data: chart.data});
            }
        }
        else {
            // console.log("Error: no docs")
            res.redirect('/');
        }
    });  
};