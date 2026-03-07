import ImageKit from "imagekit";

// Initialize ImageKit
export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Helper function to upload image
export async function uploadMealImage(fileBuffer, fileName) {
  try {
    const result = await imagekit.upload({
      file: fileBuffer,
      fileName: `meal_${Date.now()}_${fileName}`,
      folder: "/meals",
      useUniqueFileName: true,
      tags: ["meal", "food"],
    });

    return {
      imageUrl: result.url,
      thumbnailUrl: result.thumbnailUrl,
      imageId: result.fileId,
    };
  } catch (error) {
    console.error("ImageKit Upload Error:", error);
    throw error;
  }
}

// Helper function to delete image
export async function deleteMealImage(imageId) {
  try {
    await imagekit.deleteFile(imageId);
    return true;
  } catch (error) {
    console.error("ImageKit Delete Error:", error);
    throw error;
  }
}

export default imagekit;
