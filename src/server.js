import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();

const withDB = async operations => {
  const client = await MongoClient.connect("mongodb://localhost:27017", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  const db = client.db("my-blargh");
  await operations(db);
  client.close();
};

app.use(express.static(path.join(__dirname, "/build")));
app.use(bodyParser.json());

// handle getting article information
app.get("/api/articles/:name", async (req, res) => {
  try {
    await withDB(async db => {
      const articleName = req.params.name;

      const articleInfo = await db
        .collection("articles")
        .findOne({ name: articleName });

      res.status(200).json(articleInfo);
    });
  } catch (err) {
    res.status(500).json({ message: "error connecting to db", error: err });
  }
});

// handling user upvotes
app.post("/api/articles/:name/upvote", async (req, res) => {
  try {
    await withDB(async db => {
      const articleName = req.params.name;

      const articleInfo = await db
        .collection("articles")
        .findOne({ name: articleName });
      await db.collection("articles").updateOne(
        { name: articleName },
        {
          $set: {
            upvotes: articleInfo.upvotes + 1
          }
        }
      );
      const updatedArticleInfo = await db
        .collection("articles")
        .findOne({ name: articleName });
      res.status(200).json(updatedArticleInfo);
    });
  } catch (error) {
    res.status(500).json({ message: "Error connecting to db", error });
  }
});

app.post("/api/articles/:name/add-comment", async (req, res) => {
  try {
    const { username, text } = req.body;
    const articleName = req.params.name;

    withDB(async db => {
      const articleInfo = await db
        .collection("articles")
        .findOne({ name: articleName });
      await db.collection("articles").updateOne(
        { name: articleName },
        {
          $set: {
            comments: articleInfo.comments.concat({ username, text })
          }
        }
      );
      const updatedArticleInfo = await db
        .collection("articles")
        .findOne({ name: articleName });
      res.status(200).json(updatedArticleInfo);
    });
  } catch (error) {
    res.status(500).json({ message: "Error connecting to db", error });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(8000, () => console.log("Listening on port 8000"));
