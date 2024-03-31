const express = require("express");
//const http = require('http');
const cors = require("cors");
const mysql = require("mysql2");
const dotenv = require("dotenv");
//var bodyParser = require("body-parser");
const app = express();
const WebSocket = require('ws');
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });
app.use(cors());
app.use(express.json());
dotenv.config();

// MySQL connection
const connection = mysql.createConnection({
  
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,

  });
  
  connection.connect();

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
  
    // Send initial queue data
    sendQueueData(ws);
  
    // Listen for messages from client (not used in this example)
    ws.on('message', (message) => {
      console.log(`Received message from client: ${message}`);
    });
  });
  
  // Function to send queue data to a WebSocket client
  function sendQueueData(ws) {
    connection.query(
      `
      SELECT s.order, s.station_id, st.station_description AS station_name, status, Token 
        FROM steps AS s
        INNER JOIN queues AS q ON s.queue_id = q.queue_id 
        LEFT JOIN stations AS st ON s.station_id = st.station_id 
        WHERE status = "processing"
        ORDER BY s.order, s.station_id ;
      `,
      (err, rows) => {
        if (err) {
          console.error('Error querying database:', err);
          return;
        }
  
        //const queueData = rows.map(row => row.Token);
        const queueData = rows.map(row => ({
          order: row.order,
          station_id: row.station_id,
          station_name: row.station_name,
          status: row.status,
          Token: row.Token
        }));
        //console.log(queueData);
        ws.send(JSON.stringify(queueData));
        /*
        if(queueData.length > 0) {
          console.log(queueData);
          ws.send(JSON.stringify(queueData));
        }
        */
      }
    );
  }
  
  // Update queue data every 5 seconds
  setInterval(() => {
    wss.clients.forEach(client => {
      sendQueueData(client);
    });
  }, 5000);
  
//ข้อมูลรถทั้งหมด
app.get("/allcars", function (req, res) {
    connection.query(
      ` 
        SELECT * 
        FROM cars AS c
        LEFT JOIN cars_type AS ct ON ct.car_type_id = c.car_type_id;
      `, 
    function (err, results) {
      if (err) {
        console.log("Error cars = ", err);
        return;
      }
      res.json(results);
    })
  });

let PORT = process.env.PORT || 5000;

/*
const port = PORT;
app.listen(port, function () {
    console.log(`CORS-enabled web server listening on port ${port}`);
});
*/

// Start server
const port = PORT;
server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
