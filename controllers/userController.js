import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { v2 as cloudinary } from "cloudinary";
import { generateToken } from "../utils/jwtToken.js";


// Register 
export const register = catchAsyncErrors(async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new ErrorHandler("Profile Image Required.", 400));
    }

    const { profileImage } = req.files;

    const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedFormats.includes(profileImage.mimetype)) {
        return next(new ErrorHandler("File format not supported.", 400));
    }
    
    const {
        userName,
        email,
        password,
        phone,
        address,
        role,
        bankAccountNumber,
        bankAccountName,
        bankName,
        upiId,
        paypalEmail,
    } = req.body;

    if (!userName || !email || !phone || !password || !address || !role) {
        return next(new ErrorHandler("Please fill full form.", 400));
    }
    if (role === "Auctioneer") {
        if (!bankAccountName || !bankAccountNumber || !bankName) {
            return next(new ErrorHandler("Please provide your full bank details.", 400))
        }
        if (!upiId) {
            return next(new ErrorHandler("Please provide your UPI ID.", 400));
        }
        if (!paypalEmail) {
            return next(new ErrorHandler("Please Provide your paypal email.", 400));
        }
    }
    const isRegistered = await User.findOne({ email });
    if (isRegistered) {
        return next(new ErrorHandler("User Already Registered.", 400));
    }
    const cloudinaryResponse = await cloudinary.uploader.upload(profileImage.tempFilePath,
        {
            folder: "Auction_Platform_Backend_USERS",
        }
    );
    if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error("Cloudinary error:",
            cloudinaryResponse.error || "Unknown cloudinary error."
        );
        return next(
            new ErrorHandler("Failed to upload profile image to cloudinary.", 500)
        );
    }
    const user = await User.create({
        userName,
        email,
        password,
        phone,
        address,
        role,
        profileImage: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
        },
        paymentMethods: {
            bankTransfer: {
                bankAccountNumber,
                bankAccountName,
                bankName,
            },
            upi: {
                upiId,
            },
            paypal: {
                paypalEmail,
            },
        },
    });

    generateToken(user, "User Registered", 201, res);
});

//Login
export const login = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorHandler("Please Fill Full Form."));
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return next(new ErrorHandler("Invalid credentials.", 400));
    }
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid credentials", 400));
    }
    generateToken(user, "Login Successfully", 200, res);
});

//Get Profile
export const getProfile = catchAsyncErrors(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user,
    })
})

//Logout
export const logout = catchAsyncErrors(async (req, res, next) => {
    res.status(200).cookie("token", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
        secure: true,
        sameSite: "None"
    })
        .json({
            success: true,
            message: "Logout Successfully",
        });
});

//Fetch Leader board
export const fetchLeaderboard = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find({ moneySpent: { $gt: 0 } });
    const leaderboard = users.sort((a, b) => b.moneySpent - a.moneySpent);
    res.status(200).json({
        success: true,
        leaderboard,
    });
});

