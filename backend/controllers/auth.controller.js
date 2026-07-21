const jwt = require("jsonwebtoken");
const User = require("../models/User");

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success:false,
                message:"Invalid email or password"
            });
        }
        if (!user.isActive) {
            return res.status(403).json({
                success:false,
                message:"Account is disabled"
            });
        }
        user.lastLogin = new Date();
        await user.save();
        const token = jwt.sign({
            id:user._id,
            role:user.role,
            venueId:user.venueId
        },
        process.env.JWT_SECRET,
        {
            expiresIn:"7d"
        });
        return res.status(200).json({
            success:true,
            message:"Login successful",
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                phone:user.phone,
                role:user.role,
                venueId:user.venueId,
                avatar:user.avatar,
                isActive:user.isActive
            }
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({

            success:false,
            message:"Server Error"
        });
    }
};

const getMe = async (req,res)=>{
    try{
        const user=await User.findById(req.user.id)
        .select("-password");
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            });
        }
        res.json({
            success:true,
            user
        });
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:"Server Error"
        });
    }
};

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      venueId
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || "admin", // default role
      venueId: venueId || null,
      isActive: true
    });

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        venueId: user.venueId
      },
      process.env.JWT_SECRET,
      {
        // expiresIn: process.env.JWT_EXPIRES_IN
        expiresIn: "7d"
      }
    );

    res.status(201).json({
      success:true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        venueId: user.venueId
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Server error'
    });
  }
};

module.exports = { login, getMe, register };
