import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 10; // Set max duration to 10 seconds
export const dynamic = "force-dynamic";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      console.error("No file received or invalid file type");
      return NextResponse.json(
        { error: "No file received or invalid file type" },
        { status: 400 }
      );
    }

    console.log("Processing upload for user:", session.user.id);
    console.log("File details:", {
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)}KB`,
    });

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      console.error("Invalid file type:", file.type);
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPG, PNG, or GIF file." },
        { status: 400 }
      );
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error("File too large:", file.size);
      return NextResponse.json(
        { error: "File too large. Please upload an image less than 2MB." },
        { status: 400 }
      );
    }

    try {
      // Store image in AWS S3 or fall back to base64
      let imageUrl = "";

      // Check if AWS is configured
      const awsConfigured =
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_BUCKET_NAME;

      // Default to base64 approach for now
      let useBase64 = !awsConfigured;

      if (awsConfigured && !useBase64) {
        try {
          // Generate a unique filename with proper extension
          const fileExtension = file.type.split("/")[1] || "jpg";
          const filename = `profile-images/${
            session.user.id
          }-${uuidv4()}.${fileExtension}`;

          // Convert blob to buffer
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Upload to S3
          const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: filename,
            Body: buffer,
            ContentType: file.type,
          };

          // Add ACL if it's enabled for the bucket
          const useAcl = process.env.S3_ACL_ENABLED === "true";
          if (useAcl) {
            Object.assign(uploadParams, { ACL: "public-read" });
          }

          // Attempt S3 upload
          await s3Client.send(new PutObjectCommand(uploadParams));

          // Construct the public URL for the image
          imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
          console.log("S3 upload successful");
        } catch (s3Error) {
          // Log S3 error and fall back to base64
          console.error("S3 upload failed, falling back to base64:", s3Error);
          useBase64 = true;
        }
      }

      // Fall back to base64 if AWS S3 upload failed or not configured
      if (useBase64) {
        console.log("Using base64 encoding for image");
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        imageUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
      }

      console.log("Image URL generated:", imageUrl.substring(0, 50) + "...");

      // Update user's profile image in database
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { image: imageUrl },
      });

      if (!updatedUser) {
        throw new Error("Failed to update user profile");
      }

      return NextResponse.json({ image: imageUrl });
    } catch (error) {
      console.error("Error processing image:", error);
      return NextResponse.json(
        { error: "Failed to process image" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing profile image:", error);
    return NextResponse.json(
      { error: "Failed to remove profile image" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false, // Required for handling FormData
    responseLimit: "4mb", // Increase the response size limit
  },
};
