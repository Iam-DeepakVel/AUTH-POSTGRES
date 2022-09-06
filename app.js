require("dotenv").config();
require("express-async-errors");

const express = require("express");
const app = express();

app.use(express.json());

const cookieParser = require('cookie-parser')
const authRouter = require("./routes/authRoutes");

app.use(cookieParser(process.env.SECRET_KEY))
app.use("/api/v1/auth", authRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is lisening on port ${PORT}`));
