import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "./config";


// Extend Express Request object to include userId
declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const header = req.headers["authorization"];
        if (!header || !header.startsWith("Bearer ")) {
            res.status(403).json({
                message: "Authorization token missing or invalid format",
            });
            return
        }
        const token = header.split(" ")[1];

       
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        if (!decoded || !decoded.id) {
            res.status(403).json({
                message: "Invalid token structure",
            });
            return
        }
        req.userId = decoded.id;
        next();
    } catch (e) {
        res.status(403).json({
            message: "Invalid token",
            error: e,
        });
    }
};
