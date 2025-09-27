import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cloudinary from "cloudinary";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import connectDB from "./database/dbConfig.js";
import userRoute from "./router/userRoutes.js";
import { errorMiddleware } from "./middlewares/error.js";
import auctionItemRoutes from "./router/auctionItemRoutes.js";
import bidRouter from "./router/bidRoutes.js";
import commissionRoutes from "./router/commissionRoutes.js";
import superAdminRoutes from "./router/superAdminRoutes.js";
import { endedAuctionCron } from "./automation/endedAuctionCron.js"
import {verifyCommissionCron} from "./automation/verifyCommissionCron.js"



//cloudinary config
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

//express initialization
const app = express();

//load environment variables
// config({
//     path: "./config/config.env"
// });

dotenv.config({ path: ".env" });

endedAuctionCron();
verifyCommissionCron();

//Database connect
connectDB();



//Enable CORS
app.use(cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true,
}));

//parse cookies
app.use(cookieParser());

//parse body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//Handle file uploads
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
    })
);

//set up routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/auctionitem", auctionItemRoutes);
app.use("/api/v1/bid", bidRouter);
app.use("/api/v1/commission", commissionRoutes);
app.use("/api/v1/superadmin", superAdminRoutes);


//Error handler
app.use(errorMiddleware)




//port declaration
const port = process.env.PORT;

//default route
app.get("/", (req, res) => {
    res.status(200).send("Welcome to Auction Platform");
});

//server Starting
app.listen(port, () => {
    console.log(`Server Started and running on port ${port}`);
})

export default app;


