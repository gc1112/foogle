//express setup
const express = require('express');
const app = express();
app.use(express.static('public/image'))
app.use(express.json());


//body parser  (for forms)
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


//view engine setup
app.set('view engine', 'ejs');
app.set('views', __dirname + '\\view');//path = .\view
app.use(express.static('public'));


// Create MySQL connection
const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',//default
    user: 'root',
    password: '',
    database: 'foogledb'//choose name of DB
});
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});


// multer setup, ability to send images
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/image');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})
const upload = multer({ storage: storage })


