'use strict';

exports.init = function(req, res){
// THE USER AND SESSION will populate on the first request AFTER login
// The BODY will only show up when logged in.
  // console.log('req.body: ', req.body);
  // console.log('req.user: ', req.user);
  // console.log('req.session.passport: ', req.session.passport);

    // CONNECT TO DB
    var collection = req.app.db.collection("polls");

    // set the chart background color
    var chartBackground = '#431c5d';  
  

    collection.find({author:'featured',question:'Which is your favorite Coding School?'},{ _id: 0, question:1, url:1, answer:1,votes:1}).toArray(function (err,docs) {
        if (err) {
            console.log('find error');
        } 
        
        //check if the requested url is valid and in DB
        if (docs[0]) {

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

            res.render('index', {question:question, answer:answer, votes:votes, data:chart.data});
            
        }
        else {
          res.end();
        }
    });
};