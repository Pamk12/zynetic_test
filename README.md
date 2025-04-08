# Project Setup

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd zynetic
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- POST `/api/auth/signup` - Register a new user
  ```bash
  curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d '{"email":"user@example.com","password":"yourpassword"}'
  ```

- POST `/api/auth/login` - Login with email and password
  ```bash
  curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"user@example.com","password":"yourpassword"}'
  ```

### Books

- GET `/api/books` - Get all books
  ```bash
  curl -X GET http://localhost:3000/api/books -H "Authorization: Bearer YOUR_TOKEN_HERE"
  ```

- POST `/api/books` - Create a new book
  ```bash
  curl -X POST http://localhost:3000/api/books -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -d '{"title":"My Book","author":"Me","category":"Fiction","rating":5}'
  ```

- GET `/api/books/my-books` - Get books created by the authenticated user

- GET `/api/books/:id` - Get a specific book by ID

- PUT `/api/books/:id` - Update a specific book

- DELETE `/api/books/:id` - Delete a specific book

### Filtering & Search

You can filter books by author, category, and rating using query parameters:

- GET `/api/books?author=AuthorName` - Filter books by author

- GET `/api/books?category=CategoryName` - Filter books by category

- GET `/api/books?rating=5` - Filter books by rating

You can also search books by title with partial matches:

- GET `/api/books?title=PartialTitle` - Search books by title

Combine these parameters for more refined searches, e.g., `/api/books?author=AuthorName&category=CategoryName&rating=5&title=PartialTitle`.

## Assumptions and Enhancements

- All API endpoints are prefixed with `/api`. Make sure to include this prefix in your requests.
- The application assumes a running local server on `localhost:3000`.
- Enhancements include filtering and searching capabilities for books.
