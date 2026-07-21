const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },

    email:{
        type:String,
        unique:true,
        required:true,
        lowercase:true
    },

    password:{
        type:String,
        required:true
    },

    phone:{
        type:String,
        default:""
    },

    avatar:{
        type:String,
        default:""
    },

    role:{
        type:String,
        enum:[
            "super-admin",
            "super_admin",
            "admin",
            "manager",
            "staff"
        ],
        default:"admin"
    },

    venueId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Venue",
        default:null
    },

    isActive:{
        type:Boolean,
        default:true
    },

    lastLogin:{
        type:Date
    }

},{
    timestamps:true
});

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword=async function(password){

    return await bcrypt.compare(password,this.password);

};

const User = mongoose.model("User", userSchema);

module.exports = User;