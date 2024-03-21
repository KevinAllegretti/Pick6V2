"use strict";
// src/routes/poolRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const poolController_1 = require("../Controllers/poolController");
const router = express_1.default.Router();
// Route to create a new pool
router.post('/create', poolController_1.createPool);
// Route to handle join pool requests
router.post('/join', poolController_1.joinPool);
// Route for admins to manage join requests
router.post('/manage-join', poolController_1.manageJoinRequest);
exports.default = router;
