...# Developer Documentation: Bank Library API

## Overview
The Bank Library API is a RESTful service built with Node.js and Express, using PostgreSQL as the database. The API requires JWT authentication for access control.

## Setup and Installation
### Prerequisites
- Node.js (v16+ recommended)
- PostgreSQL database
- Environment variables stored in a .env file

### Environment Variables
Create a .env file and include the following:
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_secret_key
PORT=3000
### Installation Steps
1. Clone the repository:
   
sh
   git clone https://github.com/PattarapongS/bank-library-api.git
   cd bank-library-api
   
2. Install dependencies:
   
sh
   npm install
   
3. Start the server:
   
sh
   npm start
   
## API Endpoints

### Authentication
#### 1. Login
Endpoint: POST /login
Description: Generates a JWT token for authentication.
Request Body:
json
{
  "username": "admin",
  "password": "password"
}
Response:
json
{
  "token": "your_jwt_token"
}
### Books Management (Requires JWT Authentication)
#### 2. Add a Book
Endpoint: POST /books
Headers:
Authorization: Bearer your_jwt_token
Request Body:
json
{
  "title": "Book Title",
  "author": "Author Name",
  "isbn": "123",
  "published_year": 2023
}
Response:
json
{
  "id": 1,
  "title": "Book Title",
  "author": "Author Name",
  "isbn": "123",
  "published_year": 2023
}
#### 3. Update a Book
Endpoint: PUT /books/:id
Headers:
Authorization: Bearer your_jwt_token
Request Body: (Same as Add a Book)

#### 4. Delete a Book
Endpoint: DELETE /books/:id
Headers:
Authorization: Bearer your_jwt_token
Response: 204 No Content

#### 5. Search Books
Endpoint: GET /books
Headers:
Authorization: Bearer your_jwt_token
Query Parameters (Optional):
- title (string)
- author (string)
- isbn (string)

Response:
json
[
  {
    "id": 1,
    "title": "Book Title",
    "author": "Author Name",
    "isbn": "123456789",
    "published_year": 2023
  }
]
## Security
- JWT authentication for all endpoints except /login
- Environment variables for sensitive data
- PostgreSQL parameterized queries to prevent SQL injection

## Future Enhancements
- Implement user roles and permissions
- Add pagination to book search
- Improve error handling

## Contact
For issues or contributions, contact pattarapong@minteh.tech or create a GitHub issue.