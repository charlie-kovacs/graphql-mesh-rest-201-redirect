# GraphQL Mesh - fetch 201 redirects
Issue and solution example for unwanted redirects upon 201 responses in GraphQL Mesh calls to REST services

## Issue Description
- A GraphQL Mesh service is configured to send requests to an underlying REST API
- That REST API has a POST path that returns a 201 Created response with a Location header
- The Hive Gateway implemenation of the fetch API seems to attempt to redirect to the path in the Location header.
- A Locaton header in a 201 response should not be redirected to.
- The difference between the two Mesh projects is one uses the Hive Gateway fetch implementation and sees an unwanted redirect and the other overrides for standard fetch implementation and does not do the redirect.

## Repository Components
*Each directory is a separate a Node.js project.*
The idea is to run the Express-based REST API and then run each of the two versions of the GraphQL Mesh projects to observe both conditons where the error does and does not occur.
- `todo-api-express`: Simple REST API service built with Express.js
- `mesh-redirect-issue`: GraphQL Mesh project that exhibits the error when calling POST path in underlying REST service
- `mesh-redirect-fix`: GraphQL Mesh project that behaves without error (The Hive Gateway fetch implementation is overridden)

## Reproduce the issue
### 1. Start ToDo API (Express.js)
- Change to the `todo-api-express` directory
- Run `npm install` to restore packages
- Run `node app.js` to start the service
- If successful, the service will start listening at http://localhost:3000


The API has three endpoints:

`POST /todos`: Create a new todo item with the following request body:
```json
{
    "id": 1,
    "title": "Buy groceries",
    "completed": false
}
```

`GET /todos`: Retrieve all todo items

`DELETE /todos/{id}`: Delete a todo item by its ID

### 2. Run the GraphQL Mesh Issue project
- Use a second terminal to run this parallel with the Todo API service
- Change to the `mesh-redirect-issue` directory
- Run `npm install` to restore packages
- Run `npm run start` to build and launch the Mesh service
- The service should start listening at localhost:4000/graphql

Observe the error by issuing the following mutation:
```graphql
mutation Post_todos {
    post_todos(input: { id: 1, title: "buy groceries", completed: false }) {
        id
        title
        completed
    }
}
```

This will result in a `404 Not Found` error:
```json
{
    "errors": [
        {
            "message": "Upstream HTTP Error: 404, Could not invoke operation POST /todos",
            "path": [
                "post_todos"
            ],
            "extensions": {
                "code": "DOWNSTREAM_SERVICE_ERROR",
                "request": {
                    "url": "http://localhost:3000/todos",
                    "method": "POST"
                },
                "response": {
                    "status": 404,
                    "statusText": "Not Found",
                    "headers": {
                        "x-powered-by": "Express",
                        "content-security-policy": "default-src 'none'",
                        "x-content-type-options": "nosniff",
                        "content-type": "text/html; charset=utf-8",
                        "content-length": "147",
                        "date": "Wed, 12 Feb 2025 21:03:49 GMT",
                        "connection": "keep-alive",
                        "keep-alive": "timeout=5"
                    },
                    "body": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot POST /todos/1</pre>\n</body>\n</html>\n"
                }
            }
        }
    ],
    "data": {
        "post_todos": null
    }
}
```
The DEBUG=1 output contains the following:
```
[timestamp=2025-02-12T21:03:49.339Z] [level=DEBUG] fetch [requestId=e403cd54-7468-4749-840f-f154db0d173f] [fetch]  request {
  fetchId: '406c5bec-804a-4d01-88fc-61350fec9178',
  url: 'http://localhost:3000/todos',
  method: 'POST',
  headers: '{\n' +
    '  "content-type": "application/json",\n' +
    '  "accept": "application/json",\n' +
    '  "x-request-id": "e403cd54-7468-4749-840f-f154db0d173f"\n' +
    '}',
  body: '"{\\"id\\":1,\\"title\\":\\"buy groceries\\",\\"completed\\":false}"'
}
[timestamp=2025-02-12T21:03:49.403Z] [level=DEBUG] fetch [requestId=e403cd54-7468-4749-840f-f154db0d173f] [fetch]  response {
  fetchId: '406c5bec-804a-4d01-88fc-61350fec9178',
  status: 404,
  headers: `{"x-powered-by":"Express","content-security-policy":"default-src 'none'","x-content-type-options":"nosniff","content-type":"text/html; charset=utf-8","content-length":"147","date":"Wed, 12 Feb 2025 21:03:49 GMT","connection":"keep-alive","keep-alive":"timeout=5"}`,
  duration: 63.96719999999914
}
```

In an ASP.NET REST API, a `405 Method Not Allowed` is received instead of the 404 in this Express API example.

Run the following GraphQL query and observe the todo item was still created:
```graphql
query Todos {
    todos {
        id
        title
        completed
    }
}
```

The response shows:
```json
{
    "data": {
        "todos": [
            {
                "id": 1,
                "title": "buy groceries",
                "completed": false
            }
        ]
    }
}
```

### 3. Run the GraphQL Mesh Fix project
- Stop and restart the Todo API service to get a fresh start
- Probably stop the other GraphQL Mesh project
- In a second terminal, change to the `mesh-redirect-fix` directory
- Run `npm install` to restore packages
- Run `npm run start` to build and start the GraphQL Mesh project

Issue the same mutation as before to create a todo item:
```graphql
mutation Post_todos {
    post_todos(input: { id: 1, title: "buy groceries", completed: false }) {
        id
        title
        completed
    }
}
```

A response is successfully returned:
```json
{
    "data": {
        "post_todos": {
            "id": 1,
            "title": "buy groceries",
            "completed": false
        }
    }
}
```

The DEBUG=1 output contains the following successful log info:
```
[timestamp=2025-02-12T21:11:05.835Z] [level=DEBUG] fetch [requestId=182fb674-5808-4c16-ac34-45d8571dc731] [fetch]  request {
  fetchId: 'b53c5328-1852-4dec-b09a-e65db8a02da7',
  url: 'http://localhost:3000/todos',
  method: 'POST',
  headers: '{\n' +
    '  "content-type": "application/json",\n' +
    '  "accept": "application/json",\n' +
    '  "x-request-id": "182fb674-5808-4c16-ac34-45d8571dc731"\n' +
    '}',
  body: '"{\\"id\\":1,\\"title\\":\\"buy groceries\\",\\"completed\\":false}"'
}
[timestamp=2025-02-12T21:11:05.907Z] [level=DEBUG] fetch [requestId=182fb674-5808-4c16-ac34-45d8571dc731] [fetch]  response {
  fetchId: 'b53c5328-1852-4dec-b09a-e65db8a02da7',
  status: 201,
  headers: '{"connection":"keep-alive","content-length":"50","content-type":"application/json; charset=utf-8","date":"Wed, 12 Feb 2025 21:11:05 GMT","etag":"W/\\"32-0Wtu/8I6h5XgJtUv6gAXUQpgYQ0\\"","keep-alive":"timeout=5","location":"/todos/1","x-powered-by":"Express"}',
  duration: 70.75559999999678
}
```
