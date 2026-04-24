import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const startSendOtpConsumer = async () => {
  while (true) {
    try {
      console.log("Trying to connect to RabbitMQ (MAIL SERVICE)...");

      const connection = await amqp.connect({
        protocol: "amqp",
        hostname: process.env.Rabbitmq_Host || "rabbitmq",
        port: 5672,
        username: process.env.Rabbitmq_Username || "guest",
        password: process.env.Rabbitmq_Password || "guest",
      });

      const channel = await connection.createChannel();
      const queueName = "send-otp";

      await channel.assertQueue(queueName, { durable: true });

      console.log("✅ Mail service consumer started");

      channel.consume(queueName, async (msg) => {
        if (msg) {
          try {
            const { to, subject, body } = JSON.parse(msg.content.toString());

            const transporter = nodemailer.createTransport({
              service: "gmail", // cleaner
              auth: {
                user: process.env.USER,
                pass: process.env.PASSWORD,
              },
            });

            await transporter.sendMail({
              from: "Chat App",
              to,
              subject,
              text: body,
            });

            console.log(`📩 OTP mail sent to ${to}`);
            channel.ack(msg);
          } catch (error) {
            console.log("❌ Failed to send otp", error);
          }
        }
      });

      break; // ✅ exit loop after success
    } catch (error) {
      console.error("❌ RabbitMQ not ready (MAIL), retrying in 5 sec...");
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
};
