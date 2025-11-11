"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticated = authenticated;
const auth_1 = require("../utils/auth");
const Errors_1 = require("../Errors");
function authenticated(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Errors_1.UnauthorizedError("Invalid Token");
    }
    const token = authHeader.split(" ")[1];
    const decoded = (0, auth_1.verifyToken)(token);
    req.user = decoded;
    next();
}
// export const authenticateAdmin: RequestHandler = (req, res, next) => {
//   const apiKey = req.headers['x-api-key'] as string;
//   if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
//     void res.status(401).json({
//       success: false,
//       message: 'Unauthorized: Invalid API key'
//     });
//     return; // مهم بعد void
//   }
//   next();
// };
