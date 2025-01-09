// Import dependencies
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");

// Initialize app
dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());


let db;
MongoClient.connect(process.env.MONGO_URI, { useUnifiedTopology: true })
  .then((client) => {
    db = client.db("hospitalFoodManager");
    console.log("MongoDB Connected");
  })
  .catch((err) => console.error(err));

// Routes
// 1. Patient Management
app.post("/patients", async (req, res) => {
  try {
    const result = await db.collection("patients").insertOne(req.body);
    res.status(201).json(result.ops[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/patients", async (req, res) => {
  try {
    const patients = await db.collection("patients").find().toArray();
    res.json(patients);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. Food Chart Management
app.post("/food-charts", async (req, res) => {
  try {
    const result = await db.collection("foodCharts").insertOne(req.body);
    res.status(201).json(result.ops[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/food-charts", async (req, res) => {
  try {
    const foodCharts = await db
      .collection("foodCharts")
      .aggregate([
        {
          $lookup: {
            from: "patients",
            localField: "patientId",
            foreignField: "_id",
            as: "patientInfo",
          },
        },
      ])
      .toArray();
    res.json(foodCharts);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Pantry Management
app.post("/pantry", async (req, res) => {
  try {
    const result = await db.collection("pantry").insertOne(req.body);
    res.status(201).json(result.ops[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/pantry", async (req, res) => {
  try {
    const pantryStaff = await db
      .collection("pantry")
      .aggregate([
        {
          $lookup: {
            from: "foodCharts",
            localField: "assignedTasks",
            foreignField: "_id",
            as: "tasks",
          },
        },
      ])
      .toArray();
    res.json(pantryStaff);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Delivery Management
app.post("/deliveries", async (req, res) => {
  try {
    const result = await db.collection("deliveries").insertOne(req.body);
    res.status(201).json(result.ops[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/deliveries", async (req, res) => {
  try {
    const deliveries = await db
      .collection("deliveries")
      .aggregate([
        {
          $lookup: {
            from: "foodCharts",
            localField: "mealBoxId",
            foreignField: "_id",
            as: "mealBoxInfo",
          },
        },
        {
          $lookup: {
            from: "patients",
            localField: "patientInfo",
            foreignField: "_id",
            as: "patientDetails",
          },
        },
      ])
      .toArray();
    res.json(deliveries);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/deliveries/:id", async (req, res) => {
  try {
    const result = await db
      .collection("deliveries")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body },
        { returnDocument: "after" }
      );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
