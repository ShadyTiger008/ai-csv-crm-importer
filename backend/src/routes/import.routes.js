import { Router } from "express";
import { handleImport } from "../controllers/import.controller.js";

const router = Router();

// Route delegating POST requests to the controller
router.post("/import", handleImport);

export default router;
