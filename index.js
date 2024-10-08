require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const dns = require("dns");
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Basic Configuration
const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, {dbName: "fcc-backend", })
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

const urlSchema = new mongoose.Schema({
  original_url: String,
})

urlSchema.plugin(AutoIncrement, {inc_field: 'short_url'})

const Url = mongoose.model('Urls', urlSchema)
// Your first API endpoint

app.post("/api/shorturl", (req, res) => {
  const isUrl = verifyUrl(req.body.url);
  if (!isUrl) {
    res.json({ error: "invalid url" });
    return;
  }
  const cleanedUrl = urlCleanup(req.body.url);
  dns.lookup(cleanedUrl, async (err, address) => {
    if (err) {
      res.json({ error: "invalid url" });
      return;
    }
    const url = new Url({original_url: req.body.url})
    await url.save()
    res.json({original_url: url.original_url, short_url: url.short_url})
  });
});

app.get("/api/shorturl/:id", async (req, res) => {
  const url = await Url.findOne({short_url: req.params.id})
  res.redirect(url.original_url)
});

const verifyUrl = (url) => {
  const regex = /^(http|https):\/\/(?:www\.)?[a-zA-Z0-9]+\.[a-z]{2,6}$/;
  return regex.test(url);
};

const urlCleanup = (url) => {
  let temp = url.split(/[\/.]/);
  if (temp.length >= 2) {
    temp = temp[temp.length - 2] + "." + temp[temp.length - 1];
  }
  return temp;
};

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
