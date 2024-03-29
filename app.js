const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const multer = require("multer");

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/medicalDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the user schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: String,
});

// Define document schema
const documentSchema = new mongoose.Schema({
  name: String,
  fileName: {
    type: String,
    required: true,
  },
  documentPath: {
    type: String,
    required: true,
  },
});

// Create the User model
const User = mongoose.model("User", userSchema);

// Create the Document model
const Document = mongoose.model("Document", documentSchema);

// Render the register page
app.get("/", (req, res) => {
  res.render("login.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/upload", (req, res) => {
  res.render("uploads.ejs");
});

app.get("/about", (req, res) => {
  res.render("about.ejs");
});

app.get("/home", (req, res) => {
  res.render("home.ejs");
});

app.get("/myfiles", (req, res) => {
  // Fetch the user's documents from the database using promises
  Document.find({})
    .then((documents) => {
      res.render("myFiles.ejs", { documents });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("An error occurred while fetching documents.");
    });
});

app.get("/download/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  const filePath = `./uploads/${fileName}`;

  res.download(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("An error occurred while downloading the file.");
    }
  });
});

// Handle user registration
app.post("/register", (req, res) => {
  // Hash the password using bcrypt
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    if (err) {
      console.error(err);
      res.status(500).send("An error occurred while registering.");
    } else {
      // Create a new user with the hashed password
      const newUser = new User({
        email: req.body.email,
        password: hash,
      });

      // Save the new user to the database
      newUser
        .save()
        .then(function () {
          res.render("home.ejs");
        })
        .catch(function (err) {
          console.log(err);
          res.status(500).send("An error occurred while registering.");
        });
    }
  });
});

app.post("/login", (req, res) => {
  const username = req.body.email;
  const password = req.body.password;

  User.findOne({ email: username })
    .then(function (foundUser) {
      if (foundUser) {
        bcrypt.compare(password, foundUser.password, function (err, result) {
          if (result === true) {
            res.render("home.ejs");
          } else {
            // Display a client-side alert
            res.send(
              "<script>alert('Incorrect password'); window.location='/login'</script>"
            );
          }
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/upload", upload.single("document"), (req, res) => {
  if (!req.file) {
    res.send(
      "<script>alert('No File Uploaded'); window.location='/upload'</script>"
    );
  }

  const newDocument = new Document({
    name: req.body.name,
    fileName: req.file.filename,
    documentPath: req.file.path,
  });

  newDocument.save();

  res.send(
    "<script>alert('File Uploaded Successfully'); window.location='/upload'</script>"
  );
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
