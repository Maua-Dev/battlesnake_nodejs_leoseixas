import { Request, Response } from "express"

export function moveHandler(req: Request, res: Response) {
  try {
    res.json({
      apiversion: "1",
      author: "leozao",
      color: "#8B0000",
      head: "all-seeing-eye",
      tail: "hook",
      version: "1.0.0"
    })

  } catch (error: any) {
    console.error(error)
    res.status(500).send("Internal Server Error: " + error.message)
  }
}