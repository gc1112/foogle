//express setup
const express = require('express');
const app = express();
app.use(express.static('public/image'))
app.use(express.json());

//body parser setup
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Create MySQL connection
const mysql = require('mysql2');
const connection = mysql.createConnection({
    // host: 'localhost',
    // user: 'root',
    // password: '',
    // database: 'foogledb'
    host: 'db4free.net',
    user: 'foodbuser',
    password: 'foodbpass',
    database: 'foodbname'
});
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// multer setup
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

//view engine setup
app.set('view engine', 'ejs');
app.set('views', __dirname + '/view');
app.use(express.static('public'));






// actual paths

//sql query, send value as [x,y,...]
function qry(q, value) {
    return new Promise((resolve, reject) => {
        connection.query(q, [value], (error, result) => {
            if (error) {
                console.log(error);
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}


//search page
app.get('/', (req, res) => {
    res.render("search")
});

//search food
app.post('/search', (req, res) => {
    const { name } = req.body
    let q = 'SELECT id,name,description FROM recipe WHERE name LIKE ?'
    qry(q, `%${name}%`)
        .then(result => { res.render('search_result_pg', { data: result }) })
        .catch(error => { console.log(error); })
})

//search ingredients
app.get('/search/:id', (req, res) => {
    const recipe_id = parseInt(req.params.id);
    let q = 'SELECT recipe.name AS r_name,recipe.step,ingredient.id,ingredient.name AS i_name FROM recipe INNER JOIN r_has_i ON recipe.id=r_has_i.r_id INNER JOIN ingredient ON ingredient.id=r_has_i.i_id WHERE recipe.id=?'
    qry(q, recipe_id)
        .then(result => {
            let step_split = result[0].step.split("|")
            res.render('ingredient_pg', { step: step_split, data: result })
        })
        .catch(error => { console.log(error); })
})


//search market from ingredients
app.post('/search-adv', (req, res) => {
    const { ingredient, loc } = req.body;
    let ingredient_split = ingredient.split(',');
    let q = 'SELECT GROUP_CONCAT(ingredient.name SEPARATOR \',\') AS i_name ,SUM(price) AS price, market.name AS m_name,postal FROM ingredient INNER JOIN m_has_i ON ingredient.id=i_id INNER JOIN market ON market.id=m_id WHERE ingredient.name IN (?) GROUP BY market.name'
    qry(q, ingredient_split)
        .then(result => { res.render('market_pg', { data: result }) })
        .catch(error => { console.log(error); })
})




//market index page
app.get("/editmarket", (req, res) => {
    const m_id = req.params.id;
    let q = "SELECT ingredient.id AS i_id, market.id AS m_id, ingredient.name AS i_name, market.name AS m_name,market.postal,m_has_i.price AS price FROM ingredient  INNER JOIN m_has_i ON ingredient.id=i_id INNER JOIN market ON market.id=m_id";
    qry(q)
        .then(result => { res.render('market_index', { data: result }) })
        .catch(error => { console.log(error); })
})

//update
app.post("/ingredient_edit/:m_id/:i_id", (req, res) => {
    let { new_price } = req.body;
    const new_price_int = parseInt(new_price)
    const m_id = req.params.m_id;
    const i_id = req.params.i_id;
    let q = `UPDATE m_has_i SET m_has_i.price= ${new_price_int} WHERE i_id = ${i_id} AND m_id = ${m_id}`;
    qry(q)
        .then(result => { res.redirect('back') })
        .catch(error => { console.log(error); })
})
//del
app.post("/ingredient_del/:m_id/:i_id", (req, res) => {
    const m_id = req.params.m_id;
    const i_id = req.params.i_id;
    let q = `DELETE FROM m_has_i WHERE i_id=${i_id} AND m_id=${m_id}`;
    qry(q)
        .then(result => { res.redirect('back') })
        .catch(error => { console.log(error); })
})





//recipe add
app.get("/recipe_add", (req, res) => {
    res.render('recipe_add')
})
app.post("/recipe_add", (req, res) => {
    console.log(req.body);

    let { name, description, step } = req.body;
    let q = `INSERT INTO recipe (name, description, step) VALUES ("${name}", "${description}", "${step}");`;
    qry(q)
        .then(result => { res.redirect('back') })
        .catch(error => { console.log(error); })
})

//recipe edit
app.get("/recipe_index", (req, res) => {
    let q = "SELECT * FROM recipe";
    qry(q)
        .then(result => { res.render('recipe_index', { data: result }) })
        .catch(error => { console.log(error); })
})
app.get("/recipe_edit/:id", (req, res) => {
    const id = req.params.id;
    let q = "SELECT GROUP_CONCAT(ingredient.name SEPARATOR ',') AS i_name, recipe.name,recipe.id, recipe.description, recipe.step FROM ingredient INNER JOIN r_has_i ON ingredient.id=i_id INNER JOIN recipe ON recipe.id=r_id WHERE recipe.id = ? GROUP BY recipe.id";
    qry(q, [id])
        .then(result => { res.render('recipe_edit', { data: result }) })
        .catch(error => { console.log(error); })
})
app.post("/recipe_edit/:id", (req, res) => {
    let { name, description, step } = req.body;
    console.log(req.body);

    let q = `UPDATE recipe SET name= "${name}", description="${description}", step="${step} WHERE "`;
    qry(q)
        .then(result => { res.send(result) })
        //.then(result => { res.redirect('back') })
        .catch(error => { console.log(error); })
})


app.delete("/editrecipe/:id", (req, res) => {
    const id = req.params.id;
    let q = `DELETE FROM recipe WHERE id = ${id}`;
    qry(q)
        .then(result => { res.render('market_index', { data: result }) })
        .catch(error => { console.log(error); })
})


app.listen(3000, () => {
    console.log(`Server is running at http://localhost:3000`);
})