import { Router } from "express";
import corridas from "./corridas.routes.js";
import motoristas from "./motoristas.routes.js";
import usuarios from "./usuarios.routes.js";

const router = Router();
router.use("/usuarios", usuarios);
router.use("/motoristas", motoristas);
router.use("/corridas", corridas);

export default router;
