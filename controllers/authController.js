const Pool = require("../db/db");
const { StatusCodes } = require("http-status-codes");
const bcrypt = require("bcryptjs");
const customErr = require("../errors");
const jwt = require("jsonwebtoken");


const register = async (req, res) => {
  const { username, password, email } = req.body;
  const finalEmail = email.toLowerCase();

  if (!username || !password || !email) {
    throw new customErr.BadRequestError(`Please provide details`);
  }
  const alreadyExists = await Pool.query(
    "Select email from users where email=$1",
    [finalEmail]
  );
  console.log(alreadyExists);
  if (alreadyExists.rows[0]) {
    throw new customErr.BadRequestError(`Email already Exists`);
  }

  //Hashing Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  const userExists = await Pool.query("Select * from users");
  const role = userExists.rowCount === 0 ? 'admin' : 'user'
  //creating user
  const user = await Pool.query(
    "INSERT INTO users (username,email,password,role) values ($1,$2,$3,$4) returning username,email",
    [username,finalEmail, hashedPassword,role]
  );
  res.status(StatusCodes.CREATED).json(user.rows[0]);
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const lowerEmail = email.toLowerCase()
  if (!email || !password) {
    throw new customErr.BadRequestError("Please provide you credentials");
  }

  const user = await Pool.query("select password from users where email = $1", [
    lowerEmail,
  ]);

  const userDetails = await Pool.query(
    "select id,username,role from users where email = $1",
    [lowerEmail]
  );

  const verifiedPassword = await bcrypt.compare(
    password,
    user.rows[0].password
  );
  if (!verifiedPassword) {
    throw new customErr.UnauthenticatedError(`Invalid Credentials`);
  }
  
  //Creating json web token and attaching to cookies
  const payload = {userId:userDetails.rows[0].id,name:userDetails.rows[0].username,role:userDetails.rows[0].role}
  const accessToken = await jwt.sign(payload,process.env.SECRET_KEY);
  res.cookie("accessToken",accessToken,{
    httpOnly:true,
    maxAge:1000*60*60*24,
    secure: process.env.NODE_ENV === 'production',
    signed:true
  })

  res.status(StatusCodes.OK).json(userDetails.rows[0]);
};

const logout = async (req, res) => {
  res.cookie("accessToken",'logout',{
    httpOnly:true,
    expires:new Date(Date.now())
  })
  
  res.status(StatusCodes.OK).json({msg:'User Logged Out'});
};

module.exports = {
  register,
  login,
  logout,
};
