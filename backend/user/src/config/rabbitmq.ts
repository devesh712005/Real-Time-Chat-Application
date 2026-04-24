import amqp from "amqplib";
import dotenv from "dotenv";
dotenv.config();
let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
  while (true) {
    try {
      console.log("RABBIT CONFIG =>", {
        host: process.env.Rabbitmq_Host,
        user: process.env.Rabbitmq_Username,
        pass: process.env.Rabbitmq_Password,
      });

      console.log("Trying to connect to RabbitMQ...");

      const connection = await amqp.connect({
        protocol: "amqp",
        hostname: process.env.Rabbitmq_Host || "rabbitmq",
        port: 5672,
        username: process.env.Rabbitmq_Username || "guest",
        password: process.env.Rabbitmq_Password || "guest",
      });

      channel = await connection.createChannel();

      console.log("✅ Connected to RabbitMQ");

      break; // ✅ IMPORTANT: exit loop when connected
    } catch (error) {
      console.error("❌ Failed to connect, retrying in 5 sec...");
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
};
export const publishToQueue = async (queueName: string, message: any) => {
  if (!channel) {
    console.log("Rabbitmq channel is not initialized");
    return;
  }
  await channel.assertQueue(queueName, { durable: true });
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
};
