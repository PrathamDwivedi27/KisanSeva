import userModel from "../model/userModel.js";
import validator from 'validator'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { JWT_SECRET } from "../config/server-config.js";
import nodemailer from 'nodemailer'
import { APP_PASS } from "../config/server-config.js";

const loginUser=async (req,res)=>{
    const {email,password}=req.body;
    try {
        const user=await userModel.findOne({email});
        if(!user){
            return res.status(404).json({
                message:"User not found",
                success:false
            })
        }

        const isMatch=await bcrypt.compare(password,user.password);

        if(!isMatch){
            return res.status(401).json({
                message:"Invalid user or password",
                success:false
            })
        }

        const token=createToken(user._id);
        res.json({
            success:true,
            token:token,
            data:user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

const createToken=(id)=>{
    return jwt.sign({id},JWT_SECRET,{expiresIn:'1h'});
}

const registerUser=async(req,res)=>{
    const {name,email,password,phone,address,gender}=req.body;
    try {
        const exists=await userModel.findOne({email});
        if(exists){
            return res.status(200).json({
                message:"User already exists",
                data:exists,
                success:true
            })
        }

        if(!validator.isEmail(email)){
            return res.status(402).json({
                message:"Write a valid email",
                success:false
            })
        }

        //hashing
        const SALT=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,SALT);

        const newUser=new userModel({
            name:name,
            email:email,
            password:hashedPassword,
            phone:phone,
            address:address,
            gender:gender
        })

        const user=await newUser.save();
        const token=createToken(user._id);
        res.status(202).json({
            message:"Verified token",
            success:true,
            token:token
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Not verified token"
        })
    }
}

const forget=async (req,res)=>{
    const {email}=req.body;
    try {
        const generateOtp=Math.floor(100000 + Math.random() * 900000);      //6 digit otp
        console.log(generateOtp);
        const transporter = nodemailer.createTransport({
            service:'gmail',
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // Use `true` for port 465, `false` for all other ports
            auth: {
              user: "krishiseva27@gmail.com",
              pass: APP_PASS,
            },
          });

          const info = await transporter.sendMail({
            from: "krishiseva@gmail.com", 
            to: email, // list of receivers
            subject: "New Otp generated", // Subject line
            html: `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Email</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #1b7a43; /* Dark Green */
      color: #ffffff;
      padding: 20px;
      text-align: center;
      font-size: 28px;
      font-weight: bold;
    }
    .content {
      padding: 20px;
    }
    .otp {
      font-size: 24px;
      font-weight: bold;
      color: #1b7a43; /* Dark Green */
      background-color: #eaf5ea; /* Light Green Background */
      padding: 10px;
      border-radius: 5px;
      display: inline-block;
    }
    .footer {
      background-color: #f1f1f1;
      padding: 10px;
      text-align: center;
      font-size: 12px;
      color: #666666;
    }
    .footer a {
      color: #1b7a43; /* Dark Green */
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      Krishi Seva
    </div>
    <div class="content">
      <p>Dear User,</p>
      <p>Below is your One-Time Password (OTP) which you can use to complete the sign-up or sign-in process:</p>
      <p class="otp">${generateOtp}</p>
      <p>Please use this OTP promptly to access your account. For your security, do not share this OTP with anyone else. If you did not request this OTP, please disregard this email.</p>
      <p>For any queries or assistance, feel free to contact our support team. We are here to help you.</p>
      <p>Thank you for choosing Krishi Seva. We look forward to serving you.</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 Krishi Seva. All rights reserved.</p>
      <p><a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
    </div>
  </div>
</body>`, // html body
          });

          if(info.messageId){
            let user=await userModel.findOneAndUpdate(
                {email},
                {otp:generateOtp},
                {new:true}
            );

            if(!user){
                return res.status(404).json({
                    message:"User not found",
                    success:false
                })
            }
          }
          return res.status(202).json({
            message:"Otp sent successfully",
            success:true,
            data:info
          })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message:"Internal Server error",
            success:false,
        })
    }
}

const verify=async (req,res)=>{
    const {otp,password}=req.body;

    try {
        let user=await userModel.findOne({otp});
        if(!user){
            return res.status(404).json({
                message:"User not found",
                success:false
            })
        }

        const SALT=await bcrypt.genSalt(10);
        const securePassword=await bcrypt.hash(password,SALT);

        user=await userModel.findOneAndUpdate(
            {otp},
            {password:securePassword,otp:0},
            {new:true}
        );

        return res.status(202).json({
            message:"Password changed successfully",
            success:true,
            data:user
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message:"Internal Server error",
            success:false,
        })
    }
}


export {
    loginUser,
    registerUser,
    forget,
    verify
}
