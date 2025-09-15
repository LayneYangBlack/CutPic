// 使用 ES module 导入
import ort from './ort.mjs';

// 告诉 ONNX Runtime WASM 文件在哪里
ort.env.wasm.wasmPaths = './';

const config = {
  session: null,
  running: false,
  init: async (modelPath) => {
    const session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
    });
    config.session = session;
  },
};

self.onmessage = async (e) => {
  const { image, mask, width, height } = e.data;

  if (config.running) {
    console.log("Inference is already running.");
    return;
  }
  config.running = true;

  try {
    if (!config.session) {
      await config.init("./inpaint.onnx");
    }

    const imageTensor = new ort.Tensor("uint8", image, [1, 3, height, width]);
    const maskTensor = new ort.Tensor("uint8", mask, [1, 1, height, width]);

    const feeds = {
      image: imageTensor,
      mask: maskTensor,
    };

    const results = await config.session.run(feeds);
    console.log("Model results:", results); // 打印模型输出结果

    const outputName = config.session.outputNames[0];
    const output = results[outputName];
    const outputImage = output.data;

    self.postMessage({
      output: outputImage,
      width: width,
      height: height,
    }, [outputImage.buffer]);
  } catch (error) {
    console.error("Error in worker:", error);
    self.postMessage({ error: error.message });
  } finally {
    config.running = false;
  }
};