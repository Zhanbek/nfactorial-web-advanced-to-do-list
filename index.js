import mongoose from "mongoose";
import express from "express";

try {
    await mongoose.connect("mongodb://127.0.0.1:27017/TodoListProject");
  } catch (err) {
    console.log("Connection to DB refused");
    console.error(err);
    // gracefull shutdown
    process.on("SIGINT", async () => {
      await mongoose.disconnect();
      process.exit();
    });
  }

// Определение схемы-статуса
const actionStatusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
});

// Определение схемы-действия
const actionSchema = await mongoose.Schema({
  name: {
    type: Number,
    required: true
  },
  description: {
    type: Number,
    required: false
  },
  status: { type: mongoose.Schema.Types.ObjectId, ref: "actionStatusSchema" },
});
  
// Создание моделей на основе схем
const actionStatusModel = mongoose.model('ActionStatus', actionStatusSchema);
const actionModel       = mongoose.model('Action',       actionSchema);

/*
let newActionStatus = await new actionStatusModel({
    "name": "ToDo",
});
await newActionStatus.save();

newActionStatus = await new actionStatusModel({
  "name": "Done",
});
await newActionStatus.save();

newActionStatus = await new actionStatusModel({
  "name": "Trash",
});
await newActionStatus.save();

newActionStatus = await new actionStatusModel({
  "name": "Deleted",
});
await newActionStatus.save();
*/

const app = express();
app.use(express.json());


app.get("/actions/byStatus/:name", async (req, res) => {
  const actionName = req.params.name;

  const objectStatus = await actionStatusModel.find(
    {
      name: actionName
    }
  );

  console.log(objectStatus);

  const actionsByStatus = await actionModel.find(
    {
      status: objectStatus
    }
  );

  res.status(200).send(actionsByStatus);

});

// app.post('/create', async (req, res) => {
//   const {name, description} = req.body;

//   const ToDoStatus = await actionStatusModel.find(
//     {
//       name: "ToDo"
//     }
//   );

//   // Создание новой записи с использованием модели данных
  
//   const newAction = new actionModel({name, description, ToDoStatus});

//   // Сохранение записи в базе данных
//   newAction.save((err) => {
//     if (err) {
//       console.error(err);
//       res.status(500).json({ message: 'Ошибка сервера' });
//     } else {
//       res.status(201).json({ message: 'Запись успешно добавлена' });
//     }
//   });
  
//});

app.listen(9001, () => {
  console.log("app is listening on port 9001");
});
