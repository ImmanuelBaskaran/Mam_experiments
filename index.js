let prompt = require('prompt');
let request = require('superagent');

let seed = 'R9KHI9CPATPTVAWQYCLFE9ZTCEYKTIHRNHEZDQIGFSWAHTQBKZIOEISUGJVHSWPV9FYSYOAJAID9LQDBE';
let Mam = require("mam.client.js");
let IOTA = require("iota.lib.js");
let iotajs = new IOTA({ provider: "http://nodes.iota.fm:80"});
let state = Mam.init(iotajs, seed);

//
// Start the prompt
//
prompt.start();

//
// Get two properties from the user: username and email
//
prompt.get(['number of iterations', 'length of data','mam mode', 'send specs?'], function (err, result) {


    let len = result['length of data'];
    let randomstring = require("randomstring");
    let data = randomstring.generate(Number(len));
    let itterations = result['number of iterations'];
    let specs = result['send specs?'];
    let mode = result['mam mode'];
    broadcast(data,Number(itterations),specs,mode);
});

async function broadcast(data,iterations,specs,mode){
    let start = new Date().getTime();
    state = Mam.changeMode(state,mode);
    let cmTime = new Date().getTime();
    for (let i = 0; i < iterations; i++) {
        console.warn("Start");
        let tsTime = new Date().getTime();
        let trytes = iotajs.utils.toTrytes(data);
        let tfTime = new Date().getTime();
        let message = await Mam.create(state, trytes);
        let crTime = new Date().getTime();
        state = message.state;
        let root = await Mam.attach(message.payload, message.address);
        let stop = new Date().getTime();
        let payload = {start:start, cmTime:cmTime, tsTime:tsTime, tfTime:tfTime, crTime:crTime
            , stop:stop, data:data, length:data.length, trytes:trytes, tryte_length:trytes.length,
            seed:seed, message:message, root:root};
        if(specs === "yes"){
            let os = require("os");
            payload.cpus = os.cpus();
        }
        request
            .post('https://mam-experiments-bridge.herokuapp.com/ ')
            .send({"data":payload}) // sends a JSON post body
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Accept', 'text/plain')
            .end(function(err, res) {
            console.log(err);
    });
        console.log(i);
    }
}