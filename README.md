# PCCleaner-API

Secure Node.js API using Express.js.
Allows you to manage cleaning actions on a PC.

---

## Installation

1. **Install the dependencies**

```bash
npm install
```


2. **Create an .env file from the template**

```bash
cp .env.example .env
```


3. **Configure your .env**

```env
PORT=3000
BEARER_TOKEN=your_bearer_token_here
```


---

## Launch the API

- In development :
```bash
npm run dev
```

- In production :
```bash
npm start
```


---

## Authentication

Protected routes use a Bearer Token.
It needs to be integrated into the query if necessary.
```makefile
Authorization: Bearer {token}
```
The expected token is defined in .env (BEARER_TOKEN).

## Available routes

1. /health :
    Method : GET
    Authentication required : No
    Description : Check if the API is online

2. /clean/temp :
    Method : DELETE
    Authentication required : Yes
    Description : Deletes the contents of the Windows temporary folder

3. /clean/bin :
    Method : DELETE
    Authentication required : Yes
    Description : Delete the contents of the recycle bin

4. /clean/clipboard :
    Method : DELETE
    Authentication required : Yes
    Description : Deletes clipboard history

5. Specific files :
    1. /clean/specific-files/config
    Method : GET
    Authentication required : Yes
    Description : Get the contents of the configuration file (config.json)

    2. /clean/specific-files/config/target_path=
    Method : PATCH
    Authentication required : Yes
    Description : Modify the contents of the configuration file (config.json)
    Parameters :
        - target_path_=C%3A%5CUsers | Define the path to a target folder: Required | Format (only the query) : https://pastebin.com/7rATQKxX
        - &prefix=NIORT        | Define the filename prefix             | Not mandatory |
        - &extension=.pdf,.jpg | Define one or more target extension(s) | Not mandatory | Format : .pdf OR .pdf,.bat,.txt
        - &older_than=30d      | Define a date "older than"             | Not mandatory | Format : d, h, y...
        - &date_depth=5d       | Depth of the date                      | Not mandatory | Format : d, h, y...

    3. /clean/specific-files :
    Method : DELETE
    Authentication required : Yes
    Description : Delete specific files based on the config.json file

---

## Technologies used

- Node.js
- Express
- dotenv
- helmet
- morgan
- nodemon

---

## Scripts

Script | Command               | Description

start  | node src/server.js    | Start in production mode
dev    | nodemon src/server.js | Start in development mode

## Author
Rudy Poirier
