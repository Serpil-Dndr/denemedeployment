// Management Service
const express = require('express');// Express is a minimal Node.js framework for building web applications.
const amqp = require('amqplib'); // AMQP (Advanced Message Queuing Protocol) client library for RabbitMQ.
const cors = require('cors'); // CORS (Cross-Origin Resource Sharing) middleware for handling cross-origin requests.
require('dotenv').config();// Load environment variables from .env file in development

const app = express();
app.use(express.json());
app.use(cors());
 // Connect to RabbitMQ server
const RABBITMQ_CONNECTION_STRING = process.env.RABBITMQ_CONNECTION_STRING || 'amqp://localhost';
const PORT = process.env.PORT || 3000;

let orders = []; // An array to store orders

// Connection Rabbitmq and Message
async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(RABBITMQ_CONNECTION_STRING);
        const channel = await connection.createChannel();
        
        // Change durable property to false
        await channel.assertQueue('order_queue', { durable: false });

        // Take message from RabbitMQ
        channel.consume('order_queue', (message) => {
            if (message !== null) {
                const order = JSON.parse(message.content.toString());
                orders.push(order);
                console.log("Received order:", order);
                channel.ack(message); // Confirm Messsage
            }
        });
 // If an error occurs while creating a channel, send a 500 status and error message.
    } catch (error) {
        console.error("Error connecting to RabbitMQ:", error);
    }
}

// Get All orders
app.get('/orders', (req, res) => {
    res.json(orders);
});

// Start the server using the port from environment variables
connectRabbitMQ();
app.listen(PORT, () => {
    console.log(`Management Service running on http://localhost:${PORT}`);
});
