import OTP from "@/models/Otp.model";
import dbConnect from "@/lib/dbconnect";
import User from "@/models/User.model";

import nodemailer from 'nodemailer';

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Check if email is provided
    if (!email) {
      return NextResponse.json({
        status: 400,
        body: {
          message: "Email is required",
          success: false,
        },
      });
    }

    await dbConnect()

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({
        status: 400,
        body: {
          message: "User already exists",
          success: false,
        },
      });
    }

    // Generate OTP
    const oldOtp = await OTP.findOneAndDelete({ email });
    
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Save OTP to database
    const otpDocument = new OTP({
      email,
      otp,
    });
    await otpDocument.save();
    console.log("OTP saved successfully");

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const subject = "OTP Verification";
const html = `
  <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; max-width: 400px; margin: 20px auto;">
    <h2 style="color: #333;">OTP Verification</h2>
    <p style="font-size: 16px; color: #555;">Your OTP for email validation is:</p>
    <p style="font-size: 24px; font-weight: bold; color: #007bff; margin: 10px 0;">${otp}</p>
    <p style="font-size: 14px; color: #777;">This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
    <p style="font-size: 12px; color: #aaa;">If you did not request this OTP, please ignore this email.</p>
  </div>
`;

const mailOptions = {
  from: process.env.EMAIL_USERNAME,
  to: email,
  subject,
  html, // Use HTML for a better look
};

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      status: 200,
      body: {
        message: "OTP sent successfully",
        success: true,
      },
    });
  } catch (error) {
    console.error("Error in send email API:", error);
    return NextResponse.json({
      status: 500,
      body: {
        message: "Internal server error",
        success: false,
      },
    });
  }
}
