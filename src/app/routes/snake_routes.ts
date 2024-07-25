import { Router } from "express"
import { moveHandler } from "../handlers/move_handler"

export const router = Router()

router.get('/', moveHandler)