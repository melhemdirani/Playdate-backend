"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const http_status_codes_1 = require("http-status-codes");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const domain = `${process.env.BASE_URL}`;
const storage = multer_1.default.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 100, // Adjust the file size limit as needed
    },
});
const router = (0, express_1.Router)();
router.post("/upload", upload.single("file"), async (req, res) => {
    if (!(req === null || req === void 0 ? void 0 : req.file)) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            status: "error",
            message: "No file uploaded",
        });
    }
    const file = req.file;
    console.info({ url: `${domain}/uploads/${file.filename}` }, "file");
    try {
        const publicId = generatePublicId();
        const result = {
            url: `${domain}/uploads/${file.filename}`,
            publicId: publicId,
            fileName: file.originalname,
        };
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (err) {
        console.error(err);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "error",
            message: "Error processing file",
        });
    }
});
router.post("/uploads", upload.array("files", 12), async (req, res) => {
    if (!req.files || !req.files.length) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            status: "error",
            message: "No files uploaded",
        });
    }
    const files = req.files;
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
        res.status(http_status_codes_1.StatusCodes.OK).json(response);
    }
    catch (err) {
        console.error(err);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "error",
            message: "Error processing files",
        });
    }
});
// Add similar modifications for other routes...
// ...
//upload video
const videoUpload = (0, multer_1.default)({
    dest: "./uploads/videos/",
    limits: {
        fileSize: 1024 * 1024 * 500, // Adjust the file size limit for videos as needed
    },
});
router.post("/upload-video", videoUpload.single("file"), async (req, res) => {
    if (!req.file) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            status: "error",
            message: "No file uploaded",
        });
    }
    const file = req.file;
    req.log.info(file, "file");
    try {
        const publicId = generatePublicId();
        const result = {
            url: `${domain}/uploads/videos/${file.filename}`,
            publicId: publicId,
            fileName: file.originalname,
        };
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (err) {
        console.error(err);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "error",
            message: "Error processing video file",
        });
    }
});
router.post("/upload-document", upload.single("file"), async (req, res) => {
    if (!req.file) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            status: "error",
            message: "No file uploaded",
        });
    }
    const file = req.file;
    req.log.info(file, "file");
    try {
        const publicId = generatePublicId();
        const result = {
            url: `${domain}/uploads/${file.filename}`,
            publicId: publicId,
            fileName: file.originalname,
        };
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (err) {
        console.error(err);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "error",
            message: "Error processing file",
        });
    }
});
router.post("/upload-videos", videoUpload.array("files", 12), async (req, res) => {
    if (!req.files || !req.files.length) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            status: "error",
            message: "No files uploaded",
        });
    }
    const files = req.files;
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
        res.status(http_status_codes_1.StatusCodes.OK).json(response);
    }
    catch (err) {
        console.error(err);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "error",
            message: "Error processing video files",
        });
    }
});
// ...
router.delete("/delete/images/:publicId", async (req, res) => {
    const { publicId } = req.params;
    try {
        // Implement your logic to delete the file with the given publicId
        // For example, you can use fs.unlinkSync to remove the file from the server
        const filePath = path_1.default.join(__dirname, `./uploads/${publicId}`);
        fs_1.default.unlinkSync(filePath);
        res.status(http_status_codes_1.StatusCodes.OK).json({ result: "ok" });
    }
    catch (err) {
        console.error(err);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "error",
            message: "Error deleting the file",
        });
    }
});
router.delete("/delete/videos/:publicId", async (req, res) => {
    const { publicId } = req.params;
    try {
        // Implement your logic to delete the video file with the given publicId
        // For example, you can use fs.unlinkSync to remove the video file from the server
        const filePath = path_1.default.join(__dirname, `./uploads/videos/${publicId}`);
        fs_1.default.unlinkSync(filePath);
        res.status(http_status_codes_1.StatusCodes.OK).json({ result: "ok" });
    }
    catch (err) {
        console.error(err);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "error",
            message: "Error deleting the video file",
        });
    }
});
// ...
// ...
function generatePublicId() {
    // Implement your logic to generate unique public IDs here
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    return "public-id-" + uniqueSuffix;
}
exports.default = router;
