const Markov = require('markov-strings').default

const fetch = require('node-fetch')

//edit options here

var subreddit = 'AskReddit'
var time = 'all' //post timeframe (hour, day, week, month, year, all)
var limit = 100 //the amount of posts that come in each request. max is 100
var requests = 8 //the amount of requests it makes to reddit
var timeBetween = 100 //the time in between each request. (milliseconds)
var maxTries = 100 //the amount of tries markov-strings will attempt. change this to a higher number if it can't make a string with your amount of attemps
var minRefs = 2 //the minimum amount of refrences that have have to be there for the string to be generated. (this prevents it from using one refrence and being very boring)
var stateSize = 2 //1 is nonsense, 2 is normal, 3 could be really good

//^^ edit these


var titles = []

function getTitle(soFar, last){

    if(soFar == requests){
        //this was the last one
        markovIt(titles)
    } else {
        fetch('https://www.reddit.com/r/'+subreddit+'/top/.json?t='+time+'&limit='+limit+'&after='+last)
        .then(response => response.json())
        .then(data => {
            data.data.children.forEach(i => {
                titles.push(i.data.title)
                console.log('\x1b[33mtraining data title: \x1b[0m'+i.data.title)
            });
            //console.log(data.data.children[99].data.name)
            if(data.data.children[limit-1]){
                setTimeout(function(){ getTitle(soFar+1, data.data.children[limit-1].data.name) /* markov comment*/; }, timeBetween);
            } else {
                console.log('\x1b[31m','\nERROR: no more posts after '+soFar +' and '+last+'\n \x1b[0m')
                markovIt(titles)
            }

        });
    }
}

function markovIt(titles){
    const data = titles
    const markov = new Markov(data, { stateSize: stateSize })
    markov.buildCorpus()
    
    const options = {
    maxTries: maxTries, // Give up if I don't have a sentence after 20 tries (default is 10)
    prng: Math.random, // An external Pseudo Random Number Generator if you want to get seeded results    
    filter: (result) => {
        if(result.refs.length > minRefs){
            return true
        } else {
            return false
        }
        //todo add filter so it doesnt generate something identical to one of the refs
      }
    }
    
    // Generate a sentence
    const result = markov.generate(options)
    console.log('\x1b[94m \n')
    console.log(result.string)
    console.log('\x1b[0m')
    console.log('\x1b[33m%s\x1b[0m',"\ntraining data: \x1b[0m" + 'top ' +data.length + ' titles from r/'+subreddit+'.')
    console.log('\x1b[33m%s\x1b[0m',"\nused training data:")
    result.refs.forEach(i=>{
        console.log(i.string+'\n')
    })
}

getTitle(0, '')