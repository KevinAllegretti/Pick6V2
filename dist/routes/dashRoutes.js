"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dashController_1 = require("../Controllers/dashController");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/fetchMLBData', dashController_1.fetchMLBData);
router.post('/saveWeeklyPicks', dashController_1.saveWeeklyPicks);
exports.default = router;
