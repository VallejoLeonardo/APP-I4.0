import express, { RequestHandler } from "express";
import {
  getAllUsers,
  getTimeToken,
  login,
  saveUser,
  updateToken,
  updateUser,
  deleteUser,
  verifyToken,
} from "../controllers/auth.controller.js";

const routes = express.Router();
routes.post("/login", login as RequestHandler);
routes.get("/time-token", getTimeToken as RequestHandler);
routes.get("/verify-token", verifyToken as RequestHandler);
routes.patch("/update/:userId", updateToken as RequestHandler);
routes.get("/users", getAllUsers as RequestHandler);
routes.post("/create", saveUser as RequestHandler);
routes.put("/updateUser/:userId", updateUser as RequestHandler);
routes.delete("/deleteUser/:userId", deleteUser as RequestHandler);
export default routes;
