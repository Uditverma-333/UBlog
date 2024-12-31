const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary");
const multer = require("multer");
require("dotenv").config();

const { UserModel } = require("../models/User.model");
var jwt = require("jsonwebtoken");
const { authenticateToken } = require("../middleware/authenticateToken");

const UserRouter = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const tempDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, path.join(__dirname, '../tmp/')); // Using a guaranteed path
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2048 * 2048 },
});

UserRouter.post("/register", upload.single("avatar_url"), async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if email is already registered
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ message: "Email already exists" });
    }

    // Validate file
    if (!req.file || !req.file.path) {
      return res.status(400).send({ message: "File upload failed" });
    }
    const filePath = req.file.path;

    // Upload file to Cloudinary
    cloudinary.v2.uploader.upload(filePath, async (error, result) => {
      // Handle upload error
      if (error) {
        return res.status(500).send({ message: "Image upload failed", error });
      }

      // Delete temp file after upload
      fs.unlink(filePath, (err) => {
        if (err) console.log("Failed to delete temp file", err);
      });

      // Hash password and save user
      bcrypt.hash(password, 3, async (err, hash) => {
        if (err) {
          return res.status(500).send({ message: "Password hashing failed", error: err });
        }

        const user_to_add = new UserModel({
          name,
          avatar_url: result.secure_url,
          email,
          password: hash,
        });

        try {
          await user_to_add.save();
          res.status(201).send({ message: "Account created" });
        } catch (saveError) {
          res.status(400).send({ message: "Email already exists" });
        }
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Something went wrong", error });
  }
});



// LOGIN
UserRouter.post("/login", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await UserModel.find({ email });
    if (user.length > 0) {
      bcrypt.compare(password, user[0].password, (err, result) => {
        if (result) {
          // CREATING TOKEN
          const token = jwt.sign(
            { userID: user[0]._id },
            process.env.JWT_SECRET_KEY
          );
          res.send({
            _id: user[0]._id,
            name: user[0].name,
            avatar_url: user[0].avatar_url,
            email: user[0].email,
            token: token,
            saved_posts: user[0].saved_posts,
          });
        } else {
          res.status(400).send({ message: "Wrong Credntials" });
        }
      });
    } else {
      res.status(400).send({ message: "Email id not registered" });
    }
  } catch (error) {
    res.status(400).send({ message: "Something went wrong" });
    console.log(error);
  }
});

// LOGIN
UserRouter.post("/logout", async (req, res) => {
  try {
    res.send({ message: "Logged Out" });
  } catch (error) {
    res.status(400).send({ error: error });
  }
});

// ADD POST TO SAVED
UserRouter.patch("/saved/add", authenticateToken, async (req, res) => {
  const userID = req.body.author;
  const postID = req.body.post_id;
  try {
    let doc = await UserModel.findByIdAndUpdate(
      { _id: userID },
      { $push: { saved_posts: postID } },
      { new: true }
    );
    res.send(doc.saved_posts);
  } catch (error) {
    res.status(400).send({ error: error });
  }
});

// REMOVE POST FROM SAVED
UserRouter.patch("/saved/remove", authenticateToken, async (req, res) => {
  const userID = req.body.author;
  const postID = req.body.post_id;
  try {
    let doc = await UserModel.findByIdAndUpdate(
      { _id: userID },
      { $pull: { saved_posts: postID } },
      { new: true }
    );
    res.send(doc.saved_posts);
  } catch (error) {
    res.status(400).send({ error: error });
  }
});

module.exports = { UserRouter };
