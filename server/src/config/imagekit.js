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

    // Generate thumbnail URL with ImageKit transformations
    // tr:w-400,h-400,c-at_least,cm-extract,fo-auto,q-80
    // c-at_least: ensures image is at least 400x400 (no padding)
    // cm-extract: crops to exact dimensions
    // fo-auto: smart focus area detection
    const thumbnailUrl = result.url.includes("?")
      ? result.url.replace(
          "?",
          "?tr=w-400,h-400,c-at_least,cm-extract,fo-auto,q-80&",
        )
      : `${result.url}?tr=w-400,h-400,c-at_least,cm-extract,fo-auto,q-80`;

    return {
      imageUrl: result.url,
      thumbnailUrl: thumbnailUrl,
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
