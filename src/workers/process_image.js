const { parentPort, workerData } = require("worker_threads");
const sharp = require("sharp");

async function processImage(imageBuffer) {
  try {
    // Resize and convert image to PNG
    const processedImage = await sharp(imageBuffer)
      .resize({ width: 300 }) // Resize width to 300px
      .png() // Convert to PNG
      .toBuffer();

    parentPort.postMessage(processedImage); // Send processed image back
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
}

processImage(workerData);

// USE IN REQUEST SERVICE
// const { Worker } = require("worker_threads");

// const worker = new Worker(path.join(PROJECT_ROOT_PATH, "workers/process_image.js"), {
//   workerData: req.file.buffer, // Pass image buffer to worker
// });

// // Receive processed image from worker
// worker.on("message", (processedImage) => {
//   res.setHeader("Content-Type", "image/png");
//   res.send(processedImage);
// });

// worker.on("error", (err) => {
//   res.status(500).json({ error: err.message });
// });

// worker.on("exit", (code) => {
//   console.log(`Worker exited with code ${code}`);
// });
