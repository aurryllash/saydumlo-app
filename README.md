## My Node.js Project

## Description
This is a Node.js project that uses Express and MongoDB for building a basic user management and product listing application. Users can register, login, and view products. Admins have additional capabilities such as managing user roles, adding products, and deleting products. For file uploading, the project utilizes Multer and GridFsStorage.

## Features
- User registration and login
- Product viewing for authenticated users
- Admin functionalities:
  - Assigning admin roles to users
  - Adding new products
  - Deleting existing products
- File upload functionality using Multer and GridFsStorage

## Installation

### Prerequisites
- Node.js
- MongoDB

### Steps
1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Set up environment variables:
    Create a `.env` file in the root directory and add the following:
    ```env
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/your-db-name
    JWT_SECRET=your_jwt_secret
    ```

4. Run the application:
    ```bash
    nodemone server
    ```

## Contributing
Feel free to fork this repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## Contact
If you have any questions, feel free to reach out at lashatsiklauri77@gmail.com.
