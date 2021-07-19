const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const config = require('./config.json');
const uri = config.DBAccess;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const DEBUG = true;

var database = {
    interests: [],
    snacks: []
}

client.connect(err => {
    const interestCollection = client.db("InterestWeb").collection("interests");

    var interests = interestCollection.find()
    interests.toArray(function(err, docs) {
        docs.forEach(function(doc) {
            console.log(doc);
            database.interests.push(doc);
        });
    });

    const snackCollection = client.db("InterestWeb").collection("snacks");

    var snacks = snackCollection.find();
    snacks.toArray(function(err, docs) {
        docs.forEach(function(doc) {
            console.log(doc);
            database.snacks.push(doc);
        });
    });

});

function subscribeUserToDataType(dataType, dataArray, data, interestIndex) {
    var filter = { name: data.value };
    var newData = { $push: { "subscribedUsers": data.username }};

    const collection = getCollection(dataType) 
    
    collection.updateOne(filter, newData, function(err) {
        if (err) {
            console.log(err);
            return;
        }

        dataArray[interestIndex].subscribedUsers.push(data.username);
        io.emit('data update', database);
    });
}

function getCollection(dataType) {
    switch(dataType) {
        case 'interests':
            return client.db("InterestWeb").collection("interests");
        case 'snacks':
            return client.db("InterestWeb").collection("snacks");
        default:
            return 'invalid';
    }
}

function removeUserFromDataType(dataType, dataArray, data, interestIndex) {
    var filter = { name: data.value };
    var removeData = { $pull: {subscribedUsers: data.username }};
    const collection = getCollection(dataType);

    collection.updateOne(filter, removeData, function(err) {
        if (err) {
            console.log(err);
            return;
        }

        var usernameIndex = dataArray[interestIndex].subscribedUsers.indexOf(data.username);
        if (usernameIndex > -1)
            dataArray[interestIndex].subscribedUsers.splice(usernameIndex, 1);
        
        if (dataArray[interestIndex].subscribedUsers.length == 0)
            removeEmptyDataType(dataType, dataArray, data.value);
        else
            io.emit('data update', database);
    })
}

function removeEmptyDataType(dataType, dataArray, datum) {
    console.log('deleting datum ' + datum);

    const collection = getCollection(dataType);
    var query = { name: datum };

    collection.deleteOne(query, function(err, obj) {
        if (err) console.log(err);
        
        database[dataType] = dataArray.filter(x => x.name != datum);
        io.emit('data update', database);
    })
}

function createDataTypeWithUser(dataType, dataArray, data) {
    var newInterest = {
        name: data.value,
        subscribedUsers: [data.username]
    }
    const collection = getCollection(dataType);

    collection.insertOne(newInterest, function(err) {
        if (err) {
            console.log(err)
            return;
        }
        
        dataArray.push({
            name: data.value,
            subscribedUsers: [data.username]    
        });
        io.emit('data update', database);
    });
}


function submitData(dataType, data) {
    console.log('Type Submitted: ' + dataType);
    var foundInterest = false;
    var dataArray = getData(dataType);
    for (var i = 0; i < dataArray.length; i++) {
        if (dataArray[i].name.localeCompare(data.value) == 0)
        {
            if (!dataArray[i].subscribedUsers.includes(data.username)) {
                subscribeUserToDataType(dataType, dataArray, data, i);
            } else {
                console.log("Data submission already exists");
                return;
            }
            foundInterest = true;
        }
    }
    if (!foundInterest) {
        console.log('New datum!');
        createDataTypeWithUser(dataType, dataArray, data);
    }
}

function getData(dataType) {
    switch(dataType) {
        case 'interests':
            return database.interests;
        case 'snacks':
            return database.snacks;
        default:
            return 'invalid';
    }
}

function removeData(dataType, data) {
    console.log("Removing interest " + data.value + " from user " + data.username);
    
    var foundInterest = false;
    var dataArray = getData(dataType);
    for (var i = 0; i < dataArray.length; i++) {
        if (dataArray[i].name.localeCompare(data.value) == 0)
        {
            if (!dataArray[i].subscribedUsers.includes(data.username)) {
                console.log("User not subscribed to this interest");
            } else {
                removeUserFromDataType(dataType, dataArray, data, i);
                return;
            }
            foundInterest = true;
        }
    }
    if (!foundInterest) {
        console.log('Interest not found');
        return;
    }
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log("user connected");
    io.to(socket.id).emit('data update', database);

    socket.on('submit interest', data => {
        console.log('Interest Submitted: ' + data.value);
        submitData('interests', data);
    });

    socket.on('remove interest', data => {
        console.log("Removing interest " + data.value + " from user " + data.username);
        removeData('interests', data);
    })

    socket.on('submit snack', data => {

    })

    socket.on('remove snack', data => {

    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

app.use(express.static(path.join(__dirname, 'public')));

server.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});