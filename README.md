# RESTful API Application

This project is a RESTful API application designed to meet the following requirements:

- All functionality is exposed through REST API endpoints.
- No frontend is required; interactions with the application are done solely via API calls using tools like Postman, Insomnia, or cURL.
- Users must be authenticated to access the endpoints, and they can only access and modify data they own. Authorization rules are enforced to restrict access to other users' data.
- The data model represents a customizable entity, such as users, pineapples, cars, or any other relevant entity.

## Features

- **Authentication**: Users can register and log in to access the API endpoints securely.
- **Authorization**: Endpoints are protected to ensure that users can only access and modify their own data.
- **CRUD Operations**: API endpoints support Create, Read, Update, and Delete operations on the chosen data model.
- **Testing**: Thoroughly tested API endpoints to ensure reliability and correctness.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have the following software installed on your machine:

- Node.js
- npm (Node Package Manager)

### Installation

1. Clone the repository to your local machine:

   ```bash
   git clone https://github.com/frankoprifti/simple-api`

   ```

2. Navigate to the project directory:

   `cd simple-api`

3. Install dependencies:

   `yarn install`

### Running the Application

To start the application in dev mode, run the following command:

`yarn dev`

To start the application in production mode, run the following commands:

`yarn build`
then
`yarn start`

By default, the server will run on port 3000. You can specify a different port by setting the `PORT` environment variable.

### Testing

To test the API endpoints, use tools like Postman or Insomnia. Ensure to test various scenarios, including successful requests, error cases, and edge cases.

## Built With

- [Express.js](https://expressjs.com/) - Web framework for Node.js
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) - JSON Web Token implementation for authentication
- [bcrypt](https://www.npmjs.com/package/bcrypt) - Password hashing library

## Authors

- Franko Prifti [Portfolio](https://frankoprifti.github.io)
