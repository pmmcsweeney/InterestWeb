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
    interests: []
}

client.connect(err => {
    const collection = client.db("InterestWeb").collection("interests");

    var interests = collection.find()
    interests.toArray(function(err, docs) {
        docs.forEach(function(doc) {
            console.log(doc);
            database.interests.push(doc);
        });
    });
});

function subscribeUserToInterest(data, interestIndex) {
    var filter = { name: data.value };
    var newData = { $push: { "subscribedUsers": data.username }};
    const collection = client.db("InterestWeb").collection("interests");
    
    collection.updateOne(filter, newData, function(err) {
        if (err) {
            console.log(err);
            return;
        }

        database.interests[interestIndex].subscribedUsers.push(data.username);
        io.emit('data update', database);
    });
}

function removeUserFromInterest(data, interestIndex) {
    var filter = { name: data.value };
    var removeData = { $pull: {subscribedUsers: data.username }};
    const collection = client.db("InterestWeb").collection("interests");

    collection.updateOne(filter, removeData, function(err) {
        if (err) {
            console.log(err);
            return;
        }

        var usernameIndex = database.interests[interestIndex].subscribedUsers.indexOf(data.username);
        if (usernameIndex > -1)
            database.interests[interestIndex].subscribedUsers.splice(usernameIndex, 1);
        
        if (database.interests[interestIndex].subscribedUsers.length == 0)
            removeEmptyInterest(data.value);
        else
            io.emit('data update', database);
    })
}

function removeEmptyInterest(interest) {
    console.log('deleting interest ' + interest);

    const collection = client.db('InterestWeb').collection('interests');
    var query = { name: interest };

    collection.deleteOne(query, function(err, obj) {
        if (err) console.log(err);
        
        database.interests = database.interests.filter(x => x.name != interest);
        io.emit('data update', database);
    })
}

function createInterestWithUser(data) {
    var newInterest = {
        name: data.value,
        subscribedUsers: [data.username]
    }
    const collection = client.db("InterestWeb").collection("interests");

    collection.insertOne(newInterest, function(err) {
        if (err) {
            console.log(err)
            return;
        }
        
        database.interests.push({
            name: data.value,
            subscribedUsers: [data.username]    
        });
        io.emit('data update', database);
    });
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log("user connected");
    io.to(socket.id).emit('data update', database);

    socket.on('submit interest', data => {
        console.log('Interest Submitted: ' + data.value);
        var foundInterest = false;
        for (var i = 0; i < database.interests.length; i++) {
            if (database.interests[i].name.localeCompare(data.value) == 0)
            {
                if (!database.interests[i].subscribedUsers.includes(data.username)) {
                    subscribeUserToInterest(data, i);
                } else {
                    console.log("Interest already noted");
                    return;
                }
                foundInterest = true;
            }
        }
        if (!foundInterest) {
            console.log('New Interest!');
            createInterestWithUser(data);
        }
    });

    socket.on('revoke interest', data => {
        console.log("Revoking interest " + data.value + " from user " + data.username);
        
        var foundInterest = false;
        for (var i = 0; i < database.interests.length; i++) {
            if (database.interests[i].name.localeCompare(data.value) == 0)
            {
                if (!database.interests[i].subscribedUsers.includes(data.username)) {
                    console.log("User not subscribed to this interest");
                } else {
                    removeUserFromInterest(data, i);
                    return;
                }
                foundInterest = true;
            }
        }
        if (!foundInterest) {
            console.log('Interest not found');
            return;
        }
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

app.use(express.static(path.join(__dirname, 'public')));

server.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});