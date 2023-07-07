import mongoose from "mongoose";
import express from "express";

const app = express();
app.use(express.json());

(async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/TodoListProject");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log("Connection to DB refused");
    console.error(err);
    process.exit(1); // Принудительное завершение приложения в случае ошибки подключения
  }

  // Определение схемы-статуса
  const actionStatusSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: true
    }
  });

  // Определение схемы-действия
  const actionSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    status: { type: mongoose.Schema.Types.ObjectId, ref: "ActionStatus" }
  });

  // Создание моделей на основе схем
  const ActionStatusModel = mongoose.model("ActionStatus", actionStatusSchema);
  const ActionModel = mongoose.model("Action", actionSchema);

  app.get("/actions", async (req, res) => {
    const actions = await ActionModel.find();
    res.status(200).json(actions);
  });

  app.get("/actions/byStatus/:name", async (req, res) => {
    const actionName = req.params.name;

    try {
      const objectStatus = await ActionStatusModel.findOne({
        name: actionName
      });

      if (!objectStatus) {
        return res.status(404).json({ message: "Status '" + actionName + "' was not found in ActionStatuses collection" });
      }

      const actionsByStatus = await ActionModel.find({
        status: objectStatus._id
      });

      res.status(200).json(actionsByStatus);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/actions/create", async (req, res) => {
    const { name, description } = req.body;

    try {
      const toDoStatus = await ActionStatusModel.findOne({ name: "ToDo" });

      if (!toDoStatus) {
        return res.status(404).json({ message: "Status not found" });
      }

      const newAction = new ActionModel({
        name,
        description,
        status: toDoStatus._id
      });

      const savedAction = await newAction.save();
      res.status(201).json(savedAction);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch('/actions/SetAsDone/:id', async (req, res) => {
    
    try {
  
      const actionId = req.params.id;

      const newStatusObject = await ActionStatusModel.findOne({
        name: "Done"
      });

      const toDoStatusObject = await ActionStatusModel.findOne({
        name: "ToDo"
      });

      const actionObject = await ActionModel.findById({
        _id:  new mongoose.Types.ObjectId(actionId)   
      });
      
      if (!actionObject) {
        return res.status(404).json({ message: 'Запись действия не найдена' });
      }

      const currentStatusObject = await ActionStatusModel.findById({
        _id: actionObject.status
      });

      if (currentStatusObject.name === toDoStatusObject.name) {
        // Обновить поле статуса
        actionObject.status = newStatusObject;

        console.log('newStatusObject = ' + newStatusObject);
        console.log('actionObject.status = ' + actionObject.status);     

        // Сохранить изменения
        await actionObject.save();

        res.status(200).json({ message: 'Действие переведово в состояние Done' });    
      } else {
        res.status(404).json({ message: 'Пометить как выполненное можно только действие, которое находится в статусе ToDo' });
      }

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }

  });
  

  app.listen(9001, () => {
    console.log("app is listening on port 9001");
  });
})();
