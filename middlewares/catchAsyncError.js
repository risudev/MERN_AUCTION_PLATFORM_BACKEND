//high order function used to wrap async router handlers and automatically catch errors 

export const catchAsyncErrors = (theFunction) => {
    return (req, res, next) => {
        Promise.resolve(theFunction(req, res, next)).catch(next);
    };
};