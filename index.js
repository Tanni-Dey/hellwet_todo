const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//verfiy token
function verifyJwt(req, res, next) {
  const autheader = req.headers.authorization;
  if (!autheader) {
    return res.status(401).send({ message: "Unauthoried access" });
  }
  const userToken = autheader.split(" ")[1];
  jwt.verify(
    userToken,
    process.env.ACCESS_TOKEN_SECRET,
    function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      req.decoded = decoded;
      next();
    }
  );
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1tyqf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    //all colletction
    const todoCollection = client.db("hellwettask").collection("todos");

    //Jwt
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = await jwt.sign(
        user,
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "2d",
        }
      );
      res.send({ accessToken });
    });

    // all todo list
    app.get("/todos", verifyJwt, async (req, res) => {
      const query = {};
      const cursor = todoCollection.find(query);
      const allTodo = await cursor.toArray(cursor);
      res.send(allTodo);
    });

    //post todo
    app.post("/todos", async (req, res) => {
      const newTodo = req.body;
      const addTodo = await todoCollection.insertOne(newTodo);
      res.send(addTodo);
    });

    //load single todo with id
    app.get("/todo/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const oneTodo = await todoCollection.findOne(query);
      res.send(oneTodo);
    });

    //update todo
    app.put("/todo/:id", async (req, res) => {
      const id = req.params.id;
      const upTodo = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateTodo = {
        $set: upTodo,
      };
      const todo = await todoCollection.updateOne(filter, updateTodo, options);
      res.send(todo);
    });

    //todo data delete
    app.delete("/todo/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const deleteTodo = await todoCollection.deleteOne(query);
      res.send(deleteTodo);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hellwet Task");
});

app.listen(port, () => {
  console.log("Hellwet Task Connected", port);
});
