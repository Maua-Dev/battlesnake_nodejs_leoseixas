import { config } from 'dotenv';
config()
import express, { Request, Response } from 'express';
import ServerlessHttp from 'serverless-http';
import { STAGE } from './enums/stage_enum';

const app = express();

app.get('/', (req: Request, res: Response) => {
    res.json({
        apiversion: "1",
        author: "leozao",
        color: "#8B0000",
        head: "all-seeing",
        tail: "hook",
        version: "1.0.0"
    })
});

app.post('/start', (req: Request, res: Response) => {
    const game = req.body.game;
    console.log(game);
    res.send("ok");
});

app.post('/move', (req: Request, res: Response) => {
    console.log(req.body);
    const directions = ["up", "down", "left", "right"];
    const i = Math.floor(Math.random() * directions.length);
    const response = {
        move: "up",
        shout: `I'm moving up!`
    };
    res.json(response);
});

app.post('/end', (req: Request, res: Response) => {
    res.send("ok");
});

console.log('process.env.STAGE: ' + process.env.STAGE)

if (process.env.STAGE === STAGE.TEST) {
    app.listen(3000, () => {console.log('Server up and running on: http://localhost:3000 🚀')})
} else {
    module.exports.handler = ServerlessHttp(app)
}


