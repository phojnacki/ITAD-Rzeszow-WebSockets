
import * as http from 'http';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as compression from 'compression';
import * as routes from './routes';
import * as socketio from 'socket.io';


import { Init } from './db/redis';

var _clientDir = '../client';
var app = express();
var allBubbles :any[] = [];
var allPoints: any[]= [];
var bigscreenSocket;
var pointsCalculatorId;
var hallOfFameSender;


class IMap {
  [key: string]: number;
}

export function init(port: number, mode: string) {

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(bodyParser.text());
  app.use(compression());

  // DB Init
  Init();

  /**
   * Dev Mode.
   * @note Dev server will only give for you middleware.
   */
  if (mode == 'dev') {
    app.all('/*', function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'X-Requested-With');
      next();
    });

    routes.init(app);

    let root = path.resolve(process.cwd());
    let clientRoot = path.resolve(process.cwd(), './dist/dev/client');
    app.use(express.static(root));
    app.use(express.static(clientRoot));


    var renderIndex = (req: express.Request, res: express.Response) => {
      res.sendFile(path.resolve(__dirname, _clientDir + '/index.html'));
    };
    app.get('/*', renderIndex);

    /**
     * Api Routes for `Development`.
     */
  }
  else {
    /**
     * Prod Mode.
     * @note Prod mod will give you static + middleware.
     */

    /**
     * Api Routes for `Production`.
     */
    routes.init(app);
    /**
     * Static.
     */
    app.use('/js', express.static(path.resolve(__dirname, _clientDir + '/js')));
    app.use('/css', express.static(path.resolve(__dirname, _clientDir + '/css')));
    app.use('/assets', express.static(path.resolve(__dirname, _clientDir + '/assets')));

    /**
     * Spa Res Sender.
     * @param req {any}
     * @param res {any}
     */
    var renderIndex = function (req: express.Request, res: express.Response) {
      res.sendFile(path.resolve(__dirname, _clientDir + '/index.html'));
    };

    /**
     * Prevent server routing and use @ng2-router.
     */
    app.get('/*', renderIndex);
  }



  /**
   * Server with gzip compression.
   */
  return new Promise<http.Server>((resolve, reject) => {
    let server = app.listen(port, () => {
      var port = server.address().port;
      console.log('App is listening on port:' + port);
      resolve(server);
      var io=socketio.listen(server);
      io.sockets.on('connection', (socket) => {
        console.log('User connected ' + socket.request.connection.remoteAddress);

        if (socket.request.connection.remoteAddress.includes('192.168.0.100')) {
            bigscreenSocket = socket;
        }

        socket.on('disconnect', function(){
          console.log('user disconnected');
        });

        socket.on('stopGame', function(){
          if (pointsCalculatorId) {
            clearInterval(pointsCalculatorId);
            clearInterval(hallOfFameSender);
          }
          socket.removeAllListeners('bubble');
          bigscreenSocket.emit('hallOfFame', allPoints.sort((a,b) => {return b.points - a.points}));
        });

        socket.on('thx', function(){
          io.emit('thx');
        });


        socket.on('bubble', (message) => {
          var id = message.nick + '.' + socket.handshake.address.split(".")[3];

          var bubbleById = allBubbles.find(b => b.id == id);
          if (bubbleById) {
            message.id = id;
            message.color = bubbleById.color;
            bubbleById.x = message.x;
            bubbleById.y = message.y;
            if (bigscreenSocket) {
              bigscreenSocket.emit('update', message);
            }
          } else {// first connection
            console.log('New bubble ' + JSON.stringify(allPoints));
            allPoints.push({id: id, points: 0});
            var newColor = Math.floor((Math.random() * 7) + 1);
            allBubbles.push({id: id, color: newColor, x: message.x, y: message.y, socket: socket});
            socket.emit('credentials', {id: id, color: newColor});
          }
        });

        socket.on('startGame', () => {
          console.log('Game started');
          pointsCalculatorId = setInterval(() => {
            for (var bubble in allBubbles) {
              var distance = Math.sqrt( (allBubbles[bubble].x-0.5)*(allBubbles[bubble].x-0.5) + (allBubbles[bubble].y-0.5)*(allBubbles[bubble].y-0.5) );
              if (distance < 0.3) {
                allPoints.forEach((obj) => {
                  if (obj.id == allBubbles[bubble].id) {
                    obj.points = obj.points + 1;
                    console.log(JSON.stringify(obj));
                    allBubbles[bubble].socket.emit('points', obj.points);
                  }
                });

              }
            }
          }, 1000);

          hallOfFameSender = setInterval(()=>{
            if (allPoints && allPoints.length > 0) {
              if (allPoints.length < 3) {
                bigscreenSocket.emit('currentLeaders', allPoints.sort((a,b) => {return b.points - a.points}).slice(0, allPoints.length));
              } else {
                bigscreenSocket.emit('currentLeaders', allPoints.sort((a,b) => {return b.points - a.points}).slice(0, 3));
              }
            }
          }, 2000);
        });

      });
    });
  });
};
