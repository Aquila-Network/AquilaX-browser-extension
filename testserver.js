var express = require('express')
var cors = require('cors')
var bodyParser = require('body-parser')
var read = require('node-readability')

var app = express()
app.use(cors())
app.use(bodyParser.json({limit: '50mb'}))
var port = 5005

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req, res) {
  res.sendStatus(200)
})

// POST method route
app.post('/index', function (req, res) {
    try {
        read(req.body.html, readablePage)
        res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(400)
    }
})



function readablePage(err, article, meta) {
    // Main Article
    lines = article.content.split("\n");
    lines.forEach((line) => {
        // if (line.length > 10) {
            console.log("\n"+line);
        // }
    });

    console.log("===============================================")

    // Title
    console.log(article.title);

    // HTML Source Code
    // console.log(article.html);
    // DOM
    // console.log(article.document);

    // Response Object from Request Lib
    // console.log(meta);

    // Close article to clean up jsdom and prevent leaks
    article.close();
};

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})