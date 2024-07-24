import { program } from "commander";
import { spawn, exec } from "node:child_process";
import pkg from "../package.json";

interface CommandOptions {
  // 必填
  input: string;
  output: string;
  // 时间范围
  beginTime?: string;
  endTime?: string;
  // 分辨率
  width?: number;
  height?: number;
  size?: string;
  scale?: number;
  // 帧率
  rate?: number;
  // 调色板
  palette?: boolean;
}

program
  .name("ffgif")
  .description("FFmpeg command wrapper, convert to GIF.")
  .version(pkg.version)
  .requiredOption("-i, --input <input>", "输入文件")
  .requiredOption("-o, --output <output>", "输出文件")
  .option("-b, --begin-time", "开始时间（hh:mm:ss.SSS）")
  .option("-e, --end-time", "结束时间（hh:mm:ss.SSS）")
  .option("-w, --width <width>", "宽度")
  .option("-h, --height <height>", "宽度")
  .option("-z, --size <size>", "尺寸")
  .option("-s, --scale <scale>", "缩放比")
  .option("-r, --rate <fps>", "帧率")
  .option("-p, --palette [palette]", "使用调色板")
  .action(action);

function action({
  input,
  output,
  beginTime,
  endTime,
  width,
  height,
  size,
  scale,
  rate,
  palette,
}: CommandOptions) {
  const args: string[] = [];

  if (beginTime !== undefined) {
    args.push("-ss", beginTime);
  }
  if (endTime !== undefined) {
    args.push("-to", endTime);
  }

  input = input.replaceAll("\\\\", "\\");
  args.push("-i", input);

  if (rate !== undefined) {
    args.push("-r", `${rate}`);
  }

  const videoFilters: string[] = [];
  if (width !== undefined || height !== undefined) {
    if (width !== undefined && height === undefined) {
      height = -1;
    }
    if (width === undefined && height !== undefined) {
      width = -1;
    }
    const filter = `scale=${width}:${height}`;
    videoFilters.push(filter);
  }
  if (palette === true) {
    const split = `split[s0][s1]`;
    const paletteGen = `[s0]palettegen[p]`;
    const paletteUse = `[s1][p]paletteuse`;
    const filter = [split, paletteGen, paletteUse].join(";");
    videoFilters.push(filter);
  }

  if (videoFilters.length > 0) {
    args.push("-vf", `${videoFilters.join(",")}`);
  }

  output = output.replaceAll("\\\\", "\\");
  args.push(output, "-y");

  const command = "ffmpeg";
  console.info(`转换命令如下：\n${command} ${args.join(" ")}`);

  const ffmpeg = spawn(command, args);

  ffmpeg.stderr.on("data", (data) => {
    console.error(`获取到错误输出：`, data.toString());
  });

  ffmpeg.stdout.on("data", (data) => {
    console.info(`获取到标准输出：`, data.toString());
  });

  ffmpeg.on("close", () => {
    console.info(`命令执行完成`);
  });
}

program.parse(process.argv);
