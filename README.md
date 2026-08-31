Packages
express:	Web framework for Node.js
mongoose:	MongoDB object modeling
dotenv:	Load environment variables
morgan:	HTTP request logger
body-parser:	Parse JSON/URL-encoded requests


Models Folder (models)
Contains Mongoose schemas that define data structure:
user.js - User schema with fields: _id, name, email, password, role (Holder/Renter)


Routes Folder (routes)
Defines API endpoints:
products.js - Product CRUD operations
user.js - User authentication & management

s
Design Pattern
MVC-like structure - Models define schemas, Routes handle HTTP requests
CORS enabled - Allows cross-origin requests
Error handling - Global middleware catches undefined routes and errors
Environment config - Sensitive data stored in .env
