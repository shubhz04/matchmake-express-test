const express = require('express')
const app = express();
const server_port = 5000;

// minimum interval time after which the queue is processed again
const PROCESS_QUEUE_INTERVAL = 500;


// RESPONSE_CODES

const STATUS_OK = 200;
const STATUS_INTERNAL_SERVER_ERROR = 600;
const STATUS_BAD_REQUEST = 400;


//#region GLOBAL_DATA

const player_list = [];             // this contains the player_ids
const player_data = new Map();      // this maps player ids to their data
const active_rooms = new Map();     // this maps room id to a room object

//#endregion

//#region CLASS_DEFINITIONS
class Player {

    constructor(_name, _level, _id, _ip) {
        // -- public data --
        this.name = _name;             // optional but works later
        this.level = _level;
        this.id = _id;
        this.ip = _ip;

        // -- internal --
        this.is_matched = false;        // checks after intervals
        this.room_id = 0;               // if matched
        this.room_auth_token = 0;       // if matched

        // --management---
        this.last_heartbeat_time = 0;
    }
}
//#endregion

// default landing page
app.get('/', (req, res) => { res.status(200).send("Welcome to the server. ") });

// join-queue command
app.get('/get-status', (req, res) => {

    const player_id = req.headers['player_id'];
    // check if player exists
    if (!player_data.has(player_id)) {
        res.status(STATUS_OK).send("Player not found please join the queue first or exit previous room");
        return;
    }

    res.status(STATUS_OK).send("CURRENT MATCHED STATUS " + player_data.get(player_id).is_matched);
});

app.post('/join-queue', (req, res) => {

    // create a new player model based on the request
    let player_name = req.headers['player_name'];
    let player_level = req.headers['player_level'];
    let player_id = req.headers['player_id'];

    // [PRODUCTION ONLY] ==> // const player_model = new Player(player_name, player_level, player_id, req.ip);
    // [DEBUG]
    const player_model = new Player(player_name, player_level, player_id, req.headers['con_ip']);

    // check if already exists
    if (player_data.has(player_id)) {
        res.status(STATUS_OK).send("Sorry but you are already in the queue");
        return;
    }

    // append to data containers
    player_list.push(player_id);
    player_data.set(player_id, player_model);

    res.status(STATUS_OK).send(JSON.stringify(player_model));
});

//#region UTILITY_FUNCTINOS
function getRandomIndex(array) { return Math.floor(Math.random() * array.length); };
//#endregion

//#region  MATCHMAKE AREA
async function OnProcessQueue() {

    // skip if not enough players
    if (player_list.length < 2) {
        console.log("[PROCESS QUEUE EVENT] : SKIP : Not enough players to continue.");
        return;
    }

    let p1_id, p2_id;
    let p1_index, p2_index;

    p1_index = getRandomIndex(player_list);
    p1_id = player_list[p1_index];
    player_list.splice(p1_index, 1);

    p2_index = getRandomIndex(player_list);
    p2_id = player_list[p2_index];
    player_list.splice(p2_index);

    const p1 = player_data.get(p1_id);
    const p2 = player_data.get(p2_id);

    console.log(`[MATCHMAKE EVENT] PAIRED : ${p1.id}  ::  ${p2.id}`);

    p1.is_matched = true;
    p2.is_matched = true;

};
//#endregion













// ------- DEBUG REGION -------------
app.get('/debug-player-list', (req, res) => {

    let outputData = "";
    player_list.forEach((player) => {
        outputData += "\n " + player;
    });

    res.status(200).send(outputData);

});
app.get('/debug-player-data', (req, res) => {

    let outputData = "";
    player_data.forEach((_data, _id) => {
        outputData += "\n " + JSON.stringify(_data);
    });

    res.status(200).send(outputData);
});





setInterval(OnProcessQueue, PROCESS_QUEUE_INTERVAL);
app.listen(server_port, () => { console.log("Server Started !!! ") });