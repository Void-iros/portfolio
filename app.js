//jshint esversion:9

if (process.env.NODE__ENV !== "production") {
    require("dotenv").config();
}


const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const catchAsync = require("./utils/catchAsync");
const ejs = require("ejs");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const session = require("express-session");
const User = require("./models/users");
const project = require("./routes/projects");
const home = require("./routes/home");
const admin = require("./routes/admin");
const ExpressError = require("./utils/ExpressError");
const bodyParser = require("body-parser");
const dbUrl = process.env.dataBase;
const MongoStore = require("connect-mongo")



mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});



const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
    console.log("database connected");
});


app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));



app.use(methodOverride("_method"));

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
console.log(secret)

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret:secret
    }
});


const sessionConfig = {
    store:store,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        secret:secret,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    
    res.locals.currentUser = req.user;
    next();
});

app.use("/projects", project);
app.use("/", home);
app.use("/admin", admin);







app.all("*", (req, res, next) => {
    next(new ExpressError("page not found", "404"));
});

app.use((err, req, res, next) => {
    const { status = 500, } = err;
    if (!err.message) err.message = "something went wrong";
    res.status(status).render("error", { err });
});


const port = process.env.Port||3000;
app.listen(process.env.PORT || 3000);