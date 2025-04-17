"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileMessageHandlerFacade = void 0;
const events_1 = require("events");
const FileRequestMessageHandler_1 = require("./FileRequestMessageHandler");
const FileChunkMessageHandler_1 = require("./FileChunkMessageHandler");
const FileCompleteMessageHandler_1 = require("./FileCompleteMessageHandler");
/**
 * Facade for all file-related message handlers.
 * Coordinates the individual handlers and provides a unified event interface.
 */
class FileMessageHandlerFacade extends events_1.EventEmitter {
    /**
     * Creates a new FileMessageHandlerFacade.
     * @param logger The logger instance
     * @param messageHandler The message handler to register with
     */
    constructor(logger, messageHandler) {
        super();
        // Create the individual handlers
        this.requestHandler = new FileRequestMessageHandler_1.FileRequestMessageHandler(logger, messageHandler);
        this.chunkHandler = new FileChunkMessageHandler_1.FileChunkMessageHandler(logger, messageHandler);
        this.completeHandler = new FileCompleteMessageHandler_1.FileCompleteMessageHandler(logger, messageHandler);
        // Forward events from the individual handlers
        this.setupEventForwarding();
        logger.info('[FileMessageHandlerFacade] Initialized all file message handlers');
    }
    /**
     * Sets up event forwarding from the individual handlers to this facade.
     */
    setupEventForwarding() {
        // Forward file request events
        this.requestHandler.on('fileRequest', (connectionId, transferId, fileName, fileSize) => {
            this.emit('fileRequest', connectionId, transferId, fileName, fileSize);
        });
        // Forward file chunk events
        this.chunkHandler.on('fileChunk', (connectionId, transferId, chunkIndex, totalChunks, data) => {
            this.emit('fileChunk', connectionId, transferId, chunkIndex, totalChunks, data);
        });
        // Forward file complete events
        this.completeHandler.on('fileComplete', (connectionId, transferId) => {
            this.emit('fileComplete', connectionId, transferId);
        });
    }
}
exports.FileMessageHandlerFacade = FileMessageHandlerFacade;
//# sourceMappingURL=FileMessageHandlerFacade.js.map