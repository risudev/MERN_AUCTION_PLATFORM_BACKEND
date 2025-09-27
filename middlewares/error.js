//✅ What it does:
//Creates a custom error object with a message and statusCode.

class ErrorHandler extends Error{
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const errorMiddleware = (err, req, res, next) => {
    err.message = err.message || "Internal server error.";
    err.statusCode = err.statusCode || 500;

    if (err.name === "JsonWebTokenError") {
        const message = "Json web token is invalid, Try again.";
        err = new ErrorHandler(message, 400);
    }
    if (err.name === "TokenExpiredError") {
        const message = "Json web token is expired, Try again.";
        err = new ErrorHandler(message, 400);
    }

    const errorMessage = err.errors
        ? Object.values(err.errors) // Ternary Operator using
            .map((error) => error.message).join(" ") : err.message;
    
    return res.status(err.statusCode).json({
        success: false,
        message: errorMessage,
    });
};

export default ErrorHandler;