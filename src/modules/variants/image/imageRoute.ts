import { Router } from "express";
import multer from "multer";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import fs from "fs";
import path from "path";
const domain = `${process.env.BASE_URL}`;

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 100, // Adjust the file size limit as needed
  },
});

const router = Router();

router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req?.file) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const file = req.file as Express.Multer.File;

    console.info({ url: `${domain}/uploads/${file.filename}` }, "file");
    try {
      const publicId = generatePublicId();
      const result = {
        url: `${domain}/uploads/${file.filename}`,
        publicId: publicId,
        fileName: file.originalname,
      };

      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      console.error(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "Error processing file",
      });
    }
  }
);

router.post(
  "/uploads",
  upload.array("files", 12),
  async (req: Request, res: Response) => {
    if (!req.files || !req.files.length) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "No files uploaded",
      });
    }

    const files = req.files as Express.Multer.File[];
    req.log.info(files, "files");

    try {
      const response = files.map((file) => {
        const publicId = generatePublicId();
        return {
          url: `${domain}/uploads/${file.filename}`,
          publicId: publicId,
          fileName: file.originalname,
        };
      });

      res.status(StatusCodes.OK).json(response);
    } catch (err) {
      console.error(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "Error processing files",
      });
    }
  }
);

// Add similar modifications for other routes...

// ...

//upload video
const videoUpload = multer({
  dest: "./uploads/videos/",
  limits: {
    fileSize: 1024 * 1024 * 500, // Adjust the file size limit for videos as needed
  },
});

router.post(
  "/upload-video",
  videoUpload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const file = req.file as Express.Multer.File;
    req.log.info(file, "file");

    try {
      const publicId = generatePublicId();
      const result = {
        url: `${domain}/uploads/videos/${file.filename}`,
        publicId: publicId,
        fileName: file.originalname,
      };

      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      console.error(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "Error processing video file",
      });
    }
  }
);

router.post(
  "/upload-document",
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const file = req.file as Express.Multer.File;
    req.log.info(file, "file");

    try {
      const publicId = generatePublicId();
      const result = {
        url: `${domain}/uploads/${file.filename}`,
        publicId: publicId,
        fileName: file.originalname,
      };

      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      console.error(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "Error processing file",
      });
    }
  }
);

router.post(
  "/upload-videos",
  videoUpload.array("files", 12),
  async (req: Request, res: Response) => {
    if (!req.files || !req.files.length) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "No files uploaded",
      });
    }

    const files = req.files as Express.Multer.File[];
    req.log.info(files, "files");

    try {
      const response = files.map((file) => {
        const publicId = generatePublicId();
        return {
          url: `${domain}/uploads/videos/${file.filename}`,
          publicId: publicId,
          fileName: file.originalname,
        };
      });

      res.status(StatusCodes.OK).json(response);
    } catch (err) {
      console.error(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "Error processing video files",
      });
    }
  }
);

// ...

router.delete(
  "/delete/images/:publicId",
  async (req: Request, res: Response) => {
    const { publicId } = req.params;

    try {
      // Implement your logic to delete the file with the given publicId
      // For example, you can use fs.unlinkSync to remove the file from the server
      const filePath = path.join(__dirname, `./uploads/${publicId}`);
      fs.unlinkSync(filePath);

      res.status(StatusCodes.OK).json({ result: "ok" });
    } catch (err) {
      console.error(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "Error deleting the file",
      });
    }
  }
);

router.delete(
  "/delete/videos/:publicId",
  async (req: Request, res: Response) => {
    const { publicId } = req.params;

    try {
      // Implement your logic to delete the video file with the given publicId
      // For example, you can use fs.unlinkSync to remove the video file from the server
      const filePath = path.join(__dirname, `./uploads/videos/${publicId}`);
      fs.unlinkSync(filePath);

      res.status(StatusCodes.OK).json({ result: "ok" });
    } catch (err) {
      console.error(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "Error deleting the video file",
      });
    }
  }
);

// ...

// ...

function generatePublicId() {
  // Implement your logic to generate unique public IDs here
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  return "public-id-" + uniqueSuffix;
}

export default router;
