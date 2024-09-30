import express, {Request, Response} from "express";
import mysql from "mysql2/promise";
import { parse } from "path";
import { compileFunction } from "vm";

const app = express();

// Configura EJS como a engine de renderização de templates
app.set('view engine', 'ejs');
app.set('views', `${__dirname}/views`);

const connection = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "mudar123",
    database: "unicesumar"
});
// Middleware para permitir dados no formato JSON
app.use(express.json());
// Middleware para permitir dados no formato URLENCODED
app.use(express.urlencoded({ extended: true }));


app.get("/users", async function (req: Request, res: Response){
    const [users] = await connection.query("SELECT * FROM users");
    console.log(users);
    return res.render("users", {users:users});
});

app.get("/users/add", async function (req: Request, res: Response){
    let err="";
    return res.render("userform", {err:err});
});

app.post("/users", async function (req: Request, res: Response){
    const body=req.body;
    console.log(body);
    let err;
    if(body.name==""){
        err="Nome inválido!"
        return res.render("userform", {err:err});
    }
    if(body.email.indexOf("@")==-1){
        err="Email inválido!"
        return res.render("userform", {err:err});
    }
    if(body.password!=body.passwordConfirm){
        err="Senhas diferentes!"
        return res.render("userform", {err:err});
    }
    const insertQuery="INSERT INTO users(name, email, role, password, is_active) VALUES(?,?,?,?,?)";
    try{
        await connection.query(insertQuery, [body.name, body.email, body.role, body.password, body.is_active]);
    }
    catch{
        err="Email já em uso!"
        return res.render("userform", {err:err});
    }
    return res.redirect("/users");
});

app.post("/users/:id/delete",async function(req: Request, res: Response){
    const id=req.params.id;
    const deleteQuery="DELETE FROM users WHERE id=?"
    await connection.query(deleteQuery, [id]);
    return res.redirect("/users")
});

app.get("/login", async function(req: Request, res: Response){
    let err="";
    return res.render("login", {err:err});
});

app.post("/login",async function(req: Request, res: Response){
    const loginForm=req.body;
    const emails=await connection.query("SELECT email FROM users");
    const parseEmails=JSON.parse(JSON.stringify(emails[0]));
    let validEmail=false;
    let err="";
    parseEmails.forEach(function(email){
            if(email.email==req.body.email){
                validEmail=true;
            }
        });
        if(validEmail){
            const password=await connection.query("SELECT password FROM users WHERE email=?", req.body.email);
            const parsePassword=JSON.parse(JSON.stringify(password[0]));
            if(loginForm.password==parsePassword[0].password){
                return res.redirect("/users");
            }
            else{
                err="Senha inválida!"
                return res.render("login", {err:err});
            }
        }
        else{
            err="Email inválido";
            return res.render("login", {err:err});
        }
});

app.get("/", async function(req: Request, res: Response){
    return res.render("homepage");
});
app.listen('3000', () => console.log("Server is listening on port 3000"));