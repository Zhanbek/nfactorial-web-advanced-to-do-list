import mongoose from "mongoose";
import express from "express";

const app = express();
app.use(express.json());

//(async () => {
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
      required: true,
      unique: true
    },
    description: {
      type: String,
      required: false
    },
    status: { type: mongoose.Schema.Types.ObjectId, ref: "ActionStatus" }
  });

  // Создание моделей на основе схем
  const actionStatusModel = mongoose.model("ActionStatus", actionStatusSchema);
  const actionModel = mongoose.model("Action", actionSchema);

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

  // Получить все действия
  app.get("/actions", async (req, res) => {
    const actions = await ActionModel.find();
    res.status(200).json(actions);
  });

  // Получить действия по имени статуса
  app.get("/actions/getByStatusName/:name", async (req, res) => {
    const actionName = req.params.name;

    try {
      const objectStatus = await actionStatusModel.findOne({
        name: actionName
      });

      if (!objectStatus) {
        return res.status(404).json({ message: "Status '" + actionName + "' was not found in ActionStatuses collection" });
      }

      const actionsByStatus = await actionModel.find({
        status: objectStatus._id
      });

      res.status(200).json(actionsByStatus);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `${error}` });
    }
  });

  // Создать запланированное действие (со статусом "ToDo")
  app.post("/actions/create", async (req, res) => {
    const { name, description } = req.body;

    try {
      const toDoStatus = await actionStatusModel.findOne({ name: "ToDo" });

      if (!toDoStatus) {
        return res.status(404).json({ message: "Status not found" });
      }

      const newAction = new actionModel({
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

  // Пометить действие как выполненное
  app.patch('/actions/SetAsDone/:id', async (req, res) => {
    
    try {
  
      const actionId = req.params.id;

      const newStatusObject = await actionStatusModel.findOne({
        name: "Done"
      });

      const toDoStatusObject = await actionStatusModel.findOne({
        name: "ToDo"
      });

      const actionObject = await actionModel.findById({
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

        res.status(200).json({ message: `Действие c _id [${actionId}] переведено в состояние Done` });    
      } else {
        res.status(404).json({ message: 'Пометить как выполненное можно только действие, которое находится в статусе ToDo' });
      }

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
  });
  
  // Переместить в Корзину
  app.patch('/actions/MoveToTrash/:id', async (req, res) => {
    
    try {
  
      const actionId = req.params.id;

      const newStatusObject = await actionStatusModel.findOne({
        name: "Trash"
      });

      const toDoStatusObject = await actionStatusModel.findOne({
        name: "ToDo"
      });

      const DoneStatusObject = await actionStatusModel.findOne({
        name: "Done"
      });

      const actionObject = await actionModel.findById({
        _id:  new mongoose.Types.ObjectId(actionId)   
      });
      
      if (!actionObject) {
        return res.status(404).json({ message: 'Запись действия не найдена' });
      }

      const currentStatusObject = await actionStatusModel.findById({
        _id: actionObject.status
      });

      if (currentStatusObject.name === toDoStatusObject.name || currentStatusObject.name === DoneStatusObject.name) {
        // Обновить поле статуса
        actionObject.status = newStatusObject;

        console.log('newStatusObject = ' + newStatusObject);
        console.log('actionObject.status = ' + actionObject.status);     

        // Сохранить изменения
        await actionObject.save();

        res.status(200).json({ message: `Действие c _id [${actionId}] перемещено в корзину` });    
      } else {
        res.status(404).json({ message: 'Переместить в корзину можно только действие, которое находится в статусе ToDo или Done' });
      }

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
  });

  // Удалить действие из корзины
  app.patch('/actions/MarkAsDelete/:id', async (req, res) => {
    
    try {
  
      const actionId = req.params.id;

      const newStatusObject = await actionStatusModel.findOne({
        name: "Deleted"
      });

      const trashStatusObject = await actionStatusModel.findOne({
        name: "Trash"
      });

      const actionObject = await actionModel.findById({
        _id:  new mongoose.Types.ObjectId(actionId)   
      });
      
      if (!actionObject) {
        return res.status(404).json({ message: 'Запись действия не найдена' });
      }

      const currentStatusObject = await actionStatusModel.findById({
        _id: actionObject.status
      });

      if (currentStatusObject.name === trashStatusObject.name) {
        // Обновить поле статуса
        actionObject.status = newStatusObject;

        console.log('newStatusObject = ' + newStatusObject);
        console.log('actionObject.status = ' + actionObject.status);     

        // Сохранить изменения
        await actionObject.save();

        res.status(200).json({ message: `Действие c _id [${actionId}] удалено из Корзины` });    
      } else {
        res.status(404).json({ message: 'Удалить можно только действие, находящееся в Корзине' });
      }

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
  });

  // Восстановить действие из корзины
  app.patch('/actions/restore/:id', async (req, res) => {
  
      try {    
        const actionId = req.params.id;
  
        const newStatusObject = await actionStatusModel.findOne({
          name: "ToDo"
        });
  
        const trashStatusObject = await actionStatusModel.findOne({
          name: "Trash"
        });
  
        const actionObject = await actionModel.findById({
          _id:  new mongoose.Types.ObjectId(actionId)   
        });
        
        if (!actionObject) {
          return res.status(404).json({ message: 'Запись действия не найдена' });
        }
  
        const currentStatusObject = await actionStatusModel.findById({
          _id: actionObject.status
        });
  
        if (currentStatusObject.name === trashStatusObject.name) {
          // Обновить поле статуса
          actionObject.status = newStatusObject;
  
          console.log('newStatusObject = ' + newStatusObject);
          console.log('actionObject.status = ' + actionObject.status);     
  
          // Сохранить изменения
          await actionObject.save();
  
          res.status(200).json({ message: `Действие c _id [${actionId}] восстановлено из Корзины` });    
        } else {
          res.status(404).json({ message: 'Восстанавливать можно только действие, находящееся в Корзине' });
        }
  
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
      }
  });

  // Очистить всю корзину
  app.patch('/actions/MarkAllTrashAsDelete', async (req, res) => {
    try {

      const trashStatusObject = await actionStatusModel.findOne({
        name: "Trash"
      });

      if (!trashStatusObject) {
        return res.status(404).json({ message: 'Cтатус "Trash" не найден в коллекции ActionStatuses' });
      }

      // Найти все записи с текущим статусом "Trash"
      const trashActions = await actionModel.find({ status: trashStatusObject });
  
      if (trashActions.length === 0) {
        return res.status(404).json({ message: 'Нет записей в статусе "Trash"' });
      }
  
      const newStatusObject = await actionStatusModel.findOne({
        name: "Deleted"
      });

      if (!newStatusObject) {
        return res.status(404).json({ message: 'Новый статус "Deleted" для действий не найден в коллекции ActionStatuses' });
      }

      // Обновить статус каждой записи на "Deleted"
      for (const action of trashActions) {
        action.status = newStatusObject;
        await action.save();
      }
  
      res.status(200).json({ message: 'Корзина очищена' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
  });
   
  app.listen(9001, () => {
    console.log("app is listening on port 9001");
  });
//})();
