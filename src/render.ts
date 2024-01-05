import { createCanvas, loadImage, CanvasRenderingContext2D, Image } from 'canvas';
import * as fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

const imgbbApiKey = 'c74b895dad6cddc72f521f1131092f6a';

async function uploadToImgbb(imagePath: string): Promise<string> {
  try {
    // Read the image file as a buffer
    const imageBuffer = fs.readFileSync(imagePath);

    // Create a FormData object and append the image buffer
    const formData = new FormData();
    formData.append('key', imgbbApiKey);
    formData.append('image', imageBuffer, { filename: 'image.png' });

    // Make a POST request to Imgbb API
    const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    // Check if the request was successful
    if (response.status === 200 && response.data && response.data.data && response.data.data.url) {
      const imageUrl = response.data.data.url;
      return imageUrl;
    } else {
      console.error('Error uploading image to Imgbb:', response.statusText);
      throw new Error('Failed to upload image to Imgbb');
    }
  } catch (error) {
    console.error('Error uploading image to Imgbb:', error.message);
    throw error;
  }
}

// Function to splice 5 images horizontally
export async function getUrlFromImages(images: string[], outputPath: string): Promise<string> {
  const canvasWidth = 500;  // number of images
  const canvasHeight = 150; // 1 row

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d');

  let xOffset = 0;

  for (const imagePath of images) {
    const image: Image = await loadImage('src/assets/' + imagePath);
    ctx.drawImage(image, xOffset, 0, image.width, image.height);
    xOffset += image.width;
  }

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);

  let image: string;
  await uploadToImgbb(outputPath)
    .then((imageUrl) => {
      console.log('Image URL:', imageUrl);
      image = imageUrl;
    })
    .catch((error) => console.error('Error:', error));

    return image;
}

/*
// Example usage
const inputImages = ['image1.png', 'image2.png', 'image3.png', 'image4.png', 'image5.png'];
const outputImagePath = 'output.png';

spliceImages(inputImages, outputImagePath)
  .then(() => console.log('Images spliced successfully'))
  .catch((error) => console.error('Error splicing images:', error));
  */