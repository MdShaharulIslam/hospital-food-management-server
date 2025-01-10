const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lcvsatz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri);

app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173',
    
  ],
  credentials: true
}));

const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    const database = client.db("Hostel");
    const patientsCollection = database.collection("patients");
    const foodChartsCollection = database.collection("food_charts");
    const pantryStaffCollection = database.collection("pantry_staff");
    const deliveryPersonnelCollection = database.collection("delivery_personnel");
    const mealsCollection = database.collection("meals");

    app.post('/patients', async (req, res) => {
      const patient = req.body;
      const result = await patientsCollection.insertOne(patient);
      res.send(result);
    });

    
    app.get('/patients/:id', async (req, res) => {
      const id = req.params.id;
      const patient = await patientsCollection.findOne({ _id: new ObjectId(id) });
      res.send(patient);
    });

   
    app.patch('/patients/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await patientsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });


    app.post('/food-charts', async (req, res) => {
      const foodChart = req.body;
      const result = await foodChartsCollection.insertOne(foodChart);
      res.send(result);
    });

    app.get('/food-charts/:patientId', async (req, res) => {
      const patientId = req.params.patientId;
      const foodChart = await foodChartsCollection.findOne({ patientId: new ObjectId(patientId) });
      res.send(foodChart);
    });

  
    app.post('/pantry-staff', async (req, res) => {
      const staff = req.body;
      const result = await pantryStaffCollection.insertOne(staff);
      res.send(result);
    });


    app.get('/pantry-staff', async (req, res) => {
      const result = await pantryStaffCollection.find().toArray();
      res.send(result);
    });


    app.patch('/pantry-staff/:id', async (req, res) => {
      const id = req.params.id;
      const taskDetails = req.body;
      const result = await pantryStaffCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: taskDetails }
      );
      res.send(result);
    });


    app.post('/delivery-personnel', async (req, res) => {
      const personnel = req.body;
      const result = await deliveryPersonnelCollection.insertOne(personnel);
      res.send(result);
    });


    app.get('/delivery-personnel', async (req, res) => {
      const result = await deliveryPersonnelCollection.find().toArray();
      res.send(result);
    });


    app.patch('/delivery-personnel/:id', async (req, res) => {
      const id = req.params.id;
      const deliveryDetails = req.body;
      const result = await deliveryPersonnelCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: deliveryDetails }
      );
      res.send(result);
    });

  
    app.post('/meals', async (req, res) => {
      const meal = req.body;
      const result = await mealsCollection.insertOne(meal);
      res.send(result);
    });

    app.patch('/meals/:id', async (req, res) => {
      const id = req.params.id;
      const statusUpdate = req.body;
      const result = await mealsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: statusUpdate }
      );
      res.send(result);
    });

  
    app.get('/meals/status', async (req, res) => {
      try {
        const status = req.query.status || ''; 
        const query = status ? { status } : {};
        const meals = await mealsCollection.find(query).toArray();
        res.send(meals);
      } catch (error) {
        console.error("Error fetching meals status:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    
    app.get('/pantry-staff/tasks', async (req, res) => {
      try {
        const pantryStaffWithTasks = await pantryStaffCollection.aggregate([
          { $lookup: {
            from: "meals", 
            localField: "_id", 
            foreignField: "assignedPantryStaff", 
            as: "assignedMeals"
          }},
          { $project: {
            name: 1,
            assignedMeals: 1,
          }}
        ]).toArray();
        res.send(pantryStaffWithTasks);
      } catch (error) {
        console.error("Error fetching pantry staff tasks:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    
    app.get('/delivery-personnel/tasks', async (req, res) => {
      try {
        const deliveryPersonnelWithTasks = await deliveryPersonnelCollection.aggregate([
          { $lookup: {
            from: "meals", 
            localField: "_id", 
            foreignField: "assignedDeliveryPersonnel", 
            as: "assignedMeals"
          }},
          { $project: {
            name: 1,
            assignedMeals: 1,
          }}
        ]).toArray();
        res.send(deliveryPersonnelWithTasks);
      } catch (error) {
        console.error("Error fetching delivery personnel tasks:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

  
    app.get('/food-charts', async (req, res) => {
      try {
        const foodCharts = await foodChartsCollection.aggregate([
          { $lookup: {
            from: "patients", 
            localField: "patientId", 
            foreignField: "_id", 
            as: "patientDetails"
          }}
        ]).toArray();
        res.send(foodCharts);
      } catch (error) {
        console.error("Error fetching food charts:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

  
    app.get('/dashboard/status', async (req, res) => {
      try {
        const mealsStatus = await mealsCollection.find().toArray();
        const pantryStaffTasks = await pantryStaffCollection.find().toArray();
        const deliveryTasks = await deliveryPersonnelCollection.find().toArray();

        res.send({
          mealsStatus,
          pantryStaffTasks,
          deliveryTasks
        });
      } catch (error) {
        console.error("Error fetching dashboard status:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

  
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

  } catch (error) {
    console.error("Error: ", error);
  }
}

run();
