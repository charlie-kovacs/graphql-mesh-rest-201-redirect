const express = require('express');
const app = express();
app.use(express.json());

let todos = [];

app.post("/todos", (request, response) => {
  const newToDo = request.body;

  const createdToDo = {
    id: newToDo.id,
    title: newToDo.title,
    completed: newToDo.completed
  };

  todos.push(createdToDo);
  response.set("Location", `/todos/${createdToDo.id}`);
  response.status(201).json(createdToDo);
});

app.get("/todos", (request, response) => {
  response.json(todos);
});

app.delete("/todos/:id", (request, response) => {
  const idToDelete = parseInt(request.params.id, 10);
  const index = todos.findIndex((todo) => todo.id === idToDelete);
  if (index !== -1) {
    todos.splice(index, 1);
    response.status(204).send();
  } else {
    response.status(404).json({"error": "ToDo not found"});
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server listening on port", port);
});